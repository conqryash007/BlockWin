'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Coins,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Globe,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useConnect, useChainId, useSwitchChain, useDisconnect, useAccount, usePublicClient, Connector } from 'wagmi';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { useTronWalletConnectContext } from '@/components/providers/TronWalletConnectContext';
import { NetworkSelector } from './NetworkSelector';
import { cn } from '@/lib/utils';
import { SUPPORTED_TOKENS, TRON_TOKENS } from '@/lib/contracts';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { useDeposit, useTokenBalance, useTokenAllowance, useTronTokenAllowance, waitForTronTransaction } from '@/hooks/useDeposit';
import { toast } from 'sonner';
import { getActiveChain, getNetworkName, isMobileDevice, isInWalletBrowser } from '@/lib/config';
import { triggerBalanceRefresh } from '@/hooks/usePlatformBalance';
import {
  MIN_DEPOSIT_BALANCE,
  checkBalanceGate,
  describeGateFailure,
  formatTokenAmount,
} from '@/lib/balanceGate';
import { createTokenBalanceReader } from '@/lib/balanceReaders';

import { useOnOpenDepositModal, triggerBonusUpdate } from '@/lib/depositEvents';

type DepositStep = 1 | 2 | 3 | 4 | 5;

// Order matters: a wallet must be connected before a balance can be read, so the
// wallet step comes BEFORE the amount step. (Reversing these made the amount
// step's Continue button unreachable — it gates on a balance that needs a wallet.)
const STEP_LABELS = ['Network', 'Wallet', 'Amount', 'Approve', 'Deposit'];

const STEP_NETWORK: DepositStep = 1;
const STEP_WALLET: DepositStep = 2;
const STEP_AMOUNT: DepositStep = 3;
const STEP_APPROVE: DepositStep = 4;
const STEP_DEPOSIT: DepositStep = 5;

// Wallet styling helper
const getWalletStyle = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('walletconnect')) return {
    icon: Smartphone,
    color: 'text-[#3b99fc]',
    bg: 'bg-[#3b99fc]/10',
    border: 'group-hover:border-[#3b99fc]/50'
  };
  if (n.includes('metamask')) return {
    icon: Globe,
    color: 'text-[#f6851b]',
    bg: 'bg-[#f6851b]/10',
    border: 'group-hover:border-[#f6851b]/50'
  };
  if (n.includes('injected')) return {
    icon: Globe,
    color: 'text-casino-brand',
    bg: 'bg-casino-brand/10',
    border: 'group-hover:border-casino-brand/50'
  };
  return {
    icon: Wallet,
    color: 'text-white',
    bg: 'bg-white/10',
    border: 'group-hover:border-white/50'
  };
};

export function DepositModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<DepositStep>(STEP_NETWORK);
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'tron' | null>(null);
  const [selectedToken, setSelectedToken] = useState<string>('USDT');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bonusCredited, setBonusCredited] = useState<{ credited: boolean; amount: number }>({ credited: false, amount: 0 });
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [walletConflict, setWalletConflict] = useState<{ email: string } | null>(null);
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);
  // Minimum-balance gate: set when the connected wallet holds too little of the
  // deposit token (or its balance couldn't be verified after retries).
  const [gateFailure, setGateFailure] = useState<
    { reason: 'insufficient' | 'unreadable'; message: string; held?: string; symbol: string } | null
  >(null);
  // Human-readable progress for the approve/deposit steps (both networks)
  const [txStatus, setTxStatus] = useState<string>('');
  // Track if we're waiting for WalletConnect to complete (QR modal is open)
  const [isWaitingForWalletConnect, setIsWaitingForWalletConnect] = useState(false);
  // Grace period: after WalletConnect connects, the WC modal takes time to unmount.
  // During this window external pointer/focus events can trigger Radix onOpenChange(false).
  // Deadline (epoch ms) rather than a boolean + reset timer: a timer can be
  // cancelled by its own effect cleanup before it fires, which would leave the
  // flag stuck on and make the dialog impossible to close. A deadline expires
  // on its own no matter what happens to the effect.
  const walletConnectGraceUntilRef = useRef(0);
  const isInWalletConnectGrace = () => Date.now() < walletConnectGraceUntilRef.current;
  const WALLET_CONNECT_GRACE_MS = 3000;
  const prevWagmiStatusRef = useRef<string | null>(null);
  // Global timeout to prevent WalletConnect from waiting forever
  const walletConnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const WALLET_CONNECT_MAX_WAIT_MS = 30_000; // 30 seconds max
  // Remembers which (network, address, token) we already vetted, so the balance
  // gate and ownership check run once per wallet instead of every render pass.
  const ownershipCheckRef = useRef<string | null>(null);
  // Same key, but for the re-check that runs when the token is switched on the
  // amount step. Seeded from the wallet step so the default token isn't read twice.
  const tokenGateCheckRef = useRef<string | null>(null);
  // Monotonic token identifying the in-flight verification. `cancelled` alone is
  // the wrong guard for clearing the spinner: an effect's cleanup fires on ANY
  // dep change (including the disconnect and setStep the check itself causes),
  // which would strand isCheckingWallet=true and disable the flow permanently.
  const verifyRunRef = useRef(0);
  // Refs for latest handler functions (avoids stale closures in setTimeout)
  const handleDepositRef = useRef<(() => Promise<void>) | null>(null);
  const handleApprovalRef = useRef<(() => Promise<void>) | null>(null);

  // Auth & wallet state
  const {
    address: evmAddress,
    tronAddress,
    isConnected: isEvmConnected,
    isTronConnected,
    registerWalletAddress,
    checkWalletOwnership
  } = useAuth();

  // Direct wagmi account hook for more reliable connection detection
  const { isConnected: wagmiIsConnected, status: wagmiStatus } = useAccount();

  // Wagmi hooks
  const { connectors, connect, isPending } = useConnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  const { setIncludeTronWalletConnect } = useTronWalletConnectContext();
  // Tron wallet hooks
  const {
    wallets: tronWallets,
    select: selectTronWallet,
    connect: connectTronWallet,
    disconnect: disconnectTronWallet,
    wallet: currentTronWallet
  } = useWallet();

  // EVM disconnect hook
  const { disconnectAsync: disconnectEvmWallet } = useDisconnect();

  // Public client for waiting on tx confirmations
  const publicClient = usePublicClient();

  // Deposit hooks
  const { approveUnlimited, deposit } = useDeposit();

  // Device detection
  const [isMobile, setIsMobile] = useState(false);
  const [hasInjectedWallet, setHasInjectedWallet] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    setHasInjectedWallet(isInWalletBrowser());
  }, []);

  // Listen for external requests to open the deposit modal (e.g., from WelcomeBonusPopup)
  const handleOpenFromEvent = useCallback(() => setIsOpen(true), []);
  useOnOpenDepositModal(handleOpenFromEvent);

  // Active tokens based on network
  const activeTokens = useMemo(() => {
    return selectedNetwork === 'tron' ? TRON_TOKENS : SUPPORTED_TOKENS;
  }, [selectedNetwork]);

  const token = activeTokens[selectedToken as keyof typeof activeTokens];
  const tokenAddress = token?.address as `0x${string}`;

  // The address for the network the user actually picked. Using useAuth's
  // activeAddress here would hand back the EVM address while depositing on Tron
  // (it falls back across networks), so ownership checks ran against the wrong chain.
  const depositAddress = selectedNetwork === 'tron' ? tronAddress : (evmAddress ?? null);

  // Connection state based on selected network
  const isConnectedToSelectedNetwork = selectedNetwork === 'tron' ? isTronConnected : isEvmConnected;

  // Check for wrong EVM network
  const activeChain = getActiveChain();
  const isWrongNetwork = selectedNetwork === 'ethereum' && isEvmConnected && chainId !== activeChain.id;

  // A wallet is usable only when it's connected AND on the expected chain
  const isWalletReady = isConnectedToSelectedNetwork && !isWrongNetwork && !!depositAddress;

  // Token balance and allowance
  const { balance, refetch: refetchBalance, isLoading: balanceLoading } = useTokenBalance(
    tokenAddress || '0x0000000000000000000000000000000000000000',
    selectedNetwork || 'ethereum'
  );
  const { allowance: evmAllowance, refetch: refetchEvmAllowance } = useTokenAllowance(tokenAddress);
  const { allowance: tronAllowance, refetch: refetchTronAllowance } = useTronTokenAllowance(
    selectedNetwork === 'tron' ? tokenAddress : undefined
  );

  // Parse amount defensively. <input type="number"> accepts values parseUnits
  // throws on ("1e5", "-5", "."), and this runs during render — an uncaught
  // throw here would blank the whole modal.
  const { parsedAmount, amountError } = useMemo(() => {
    const empty = { parsedAmount: BigInt(0), amountError: null as string | null };
    if (!amount || !token) return empty;
    const normalized = amount.trim();
    if (!/^\d+(\.\d+)?$/.test(normalized)) {
      return { parsedAmount: BigInt(0), amountError: 'Enter a valid amount' };
    }
    try {
      return { parsedAmount: parseUnits(normalized, token.decimals), amountError: null };
    } catch {
      return { parsedAmount: BigInt(0), amountError: 'Enter a valid amount' };
    }
  }, [amount, token]);

  const isBalanceKnown = balance !== undefined;
  const hasSufficientBalance = isBalanceKnown && parsedAmount > BigInt(0) && balance >= parsedAmount;

  // Check unlimited approval based on network
  const allowance = selectedNetwork === 'tron' ? tronAllowance : evmAllowance;
  const hasUnlimitedApproval = allowance !== undefined && allowance >= maxUint256 / BigInt(2);

  // Filter EVM connectors
  const filteredConnectors = useMemo(() => {
    const result: Connector[] = [];
    const seen = new Set<string>();

    for (const connector of connectors) {
      const name = connector.name.toLowerCase();
      const id = connector.id.toLowerCase();
      const key = `${name}-${id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (isMobile && !hasInjectedWallet) {
        if (name === 'injected' || id === 'injected') continue;
      }

      if (isMobile && hasInjectedWallet) {
        if (name.includes('walletconnect')) continue;
      }

      result.push(connector);
    }

    return result.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      if (aName.includes('metamask')) return -1;
      if (bName.includes('metamask')) return 1;
      if (aName.includes('injected')) return -1;
      if (bName.includes('injected')) return 1;
      if (aName.includes('walletconnect')) return 1;
      if (bName.includes('walletconnect')) return -1;
      return 0;
    });
  }, [connectors, isMobile, hasInjectedWallet]);

  // Helper to fully clear WalletConnect waiting state (prevents infinite loops)
  const clearWalletConnectWaiting = useCallback(() => {
    setIsWaitingForWalletConnect(false);
    setConnectingId(null);
    walletConnectGraceUntilRef.current = 0;
    if (walletConnectTimeoutRef.current) {
      clearTimeout(walletConnectTimeoutRef.current);
      walletConnectTimeoutRef.current = null;
    }
  }, []);

  // Start a global timeout when WalletConnect flow starts — prevents infinite wait
  const startWalletConnectTimeout = useCallback(() => {
    if (walletConnectTimeoutRef.current) {
      clearTimeout(walletConnectTimeoutRef.current);
    }
    walletConnectTimeoutRef.current = setTimeout(() => {
      console.warn('[DepositModal] WalletConnect global timeout reached — resetting state');
      clearWalletConnectWaiting();
      toast.error('Connection timed out. Please try again.', { duration: 5000 });
    }, WALLET_CONNECT_MAX_WAIT_MS);
  }, [clearWalletConnectWaiting]);

  // Reset on modal close
  const handleOpenChange = (open: boolean) => {
    // Don't close the modal if we're waiting for WalletConnect to complete
    // or if we're in the grace period (WC modal still unmounting)
    // EXCEPTION: If the deposit was successful (isSuccess is true), always allow closing
    if (!open && !isSuccess && (isWaitingForWalletConnect || isInWalletConnectGrace())) {
      console.log('[DepositModal] Preventing modal close while waiting for WalletConnect / grace period');
      return;
    }

    if (!open) {
      setStep(STEP_NETWORK);
      setSelectedNetwork(null);
      setSelectedToken('USDT');
      setAmount('');
      setIsProcessing(false);
      setIsSuccess(false);
      setTxStatus('');
      setBonusCredited({ credited: false, amount: 0 });
      setConnectingId(null);
      setWalletConflict(null);
      setGateFailure(null);
      setIsCheckingWallet(false);
      ownershipCheckRef.current = null;
      tokenGateCheckRef.current = null;
      clearWalletConnectWaiting();
    }
    setIsOpen(open);
  };

  // Prevent outside interactions (pointer-down / focus) from closing the dialog
  // while a WalletConnect flow is active. The WC QR modal sits outside the Radix
  // Dialog portal so its open/close lifecycle fires outside-interaction events.
  // Also holds the dialog open while a wallet transaction is in flight.
  const preventOutsideDismiss = useCallback((e: Event) => {
    if (isSuccess) return;

    if (isWaitingForWalletConnect || isInWalletConnectGrace() || connectingId || isProcessing) {
      e.preventDefault();
    }
  }, [isWaitingForWalletConnect, connectingId, isSuccess, isProcessing]);

  // Drop whichever wallet is connected for the selected network.
  // Declared before the effects below so it is in scope for their dep arrays.
  const disconnectActiveWallet = useCallback(async () => {
    try {
      if (selectedNetwork === 'tron') await disconnectTronWallet();
      else await disconnectEvmWallet();
    } catch (e) {
      console.warn('[DepositModal] Disconnect failed:', e);
    }
  }, [selectedNetwork, disconnectTronWallet, disconnectEvmWallet]);

  // ---------------------------------------------------------------------------
  // Step 2 (Wallet): once a wallet is connected on the right chain, it must
  // (1) hold at least MIN_DEPOSIT_BALANCE of the deposit token, and
  // (2) not already be linked to another account — then move on to Amount.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (step !== STEP_WALLET || !selectedNetwork || !isWalletReady || !depositAddress || !token) return;

    // Keyed on the wallet only, NOT the token: this gate can disconnect, and
    // re-running it after a token switch would drop a wallet the user already
    // connected. Per-token enforcement lives in the amount-step effect below.
    const checkKey = `${selectedNetwork}:${depositAddress.toLowerCase()}`;
    if (ownershipCheckRef.current === checkKey) return;
    ownershipCheckRef.current = checkKey;

    let cancelled = false;
    const runId = ++verifyRunRef.current;

    (async () => {
      // Only drop the connector spinner here. The WalletConnect waiting/grace
      // state is owned by the WC effects below — clearing it from here would
      // cut their grace period short and let the WC modal's unmount close us.
      setConnectingId(null);
      setIsCheckingWallet(true);
      setWalletConflict(null);
      setGateFailure(null);

      try {
        // --- Minimum balance gate (runs first, so a refused wallet is never
        // looked up in the database and never linked to the account) ----------
        const gate = await checkBalanceGate(
          createTokenBalanceReader({
            network: selectedNetwork,
            tokenAddress,
            owner: depositAddress,
            publicClient: publicClient as any,
          }),
          token.decimals
        );
        if (cancelled) return;

        if (!gate.ok) {
          const message = describeGateFailure(gate, token.symbol, token.decimals);
          setGateFailure({
            reason: gate.reason,
            message,
            held: gate.reason === 'insufficient'
              ? formatTokenAmount(gate.balance, token.decimals)
              : undefined,
            symbol: token.symbol,
          });
          toast.error(message, { duration: 8000 });

          // Refuse the connection outright, and allow the same wallet to be
          // retried later (balances change) by clearing the memoised key.
          ownershipCheckRef.current = null;
          tokenGateCheckRef.current = null;
          await disconnectActiveWallet();
          return;
        }

        // This token has now been vetted; don't re-read it on the amount step.
        tokenGateCheckRef.current = `${checkKey}:${selectedToken}`;

        const result = await checkWalletOwnership(depositAddress, selectedNetwork);
        if (cancelled) return;

        if (result.isOwnedByOther && result.ownerEmail) {
          // Hard stop: wallet_addresses refuses to re-link a wallet owned by
          // someone else, so a deposit from it would never be credited here.
          setWalletConflict({ email: result.ownerEmail });
          toast.error(`This wallet is already linked to ${result.ownerEmail}`, { duration: 6000 });
          return;
        }

        // Link the wallet now (not after approval) so the deposit webhook can
        // match on-chain deposits to this user even if the flow is abandoned.
        registerWalletAddress(depositAddress, selectedNetwork).catch((e) => {
          console.warn('[DepositModal] Wallet registration failed:', e);
        });

        setStep(STEP_AMOUNT);
      } catch (err) {
        if (cancelled) return;
        // A failed lookup shouldn't strand the user — proceed, the server-side
        // webhook still owns the final crediting decision.
        console.error('[DepositModal] Error during wallet ownership check:', err);
        setStep(STEP_AMOUNT);
      } finally {
        // Clear unless a newer verification has since started.
        if (verifyRunRef.current === runId) setIsCheckingWallet(false);
      }
    })();

    return () => { cancelled = true; };
  }, [step, selectedNetwork, isWalletReady, depositAddress, token, selectedToken, tokenAddress, publicClient, checkWalletOwnership, registerWalletAddress, disconnectActiveWallet]);

  // ---------------------------------------------------------------------------
  // Step 3 (Amount): the gate is per-token, so switching token re-runs it.
  // No disconnect here — the wallet is already vetted for another token, so we
  // block the deposit inline rather than dropping the connection on a dropdown.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (step !== STEP_AMOUNT || !selectedNetwork || !isWalletReady || !depositAddress || !token) return;

    const checkKey = `${selectedNetwork}:${depositAddress.toLowerCase()}:${selectedToken}`;
    if (tokenGateCheckRef.current === checkKey) return;
    tokenGateCheckRef.current = checkKey;

    let cancelled = false;
    const runId = ++verifyRunRef.current;

    (async () => {
      setIsCheckingWallet(true);
      setGateFailure(null);
      try {
        const gate = await checkBalanceGate(
          createTokenBalanceReader({
            network: selectedNetwork,
            tokenAddress,
            owner: depositAddress,
            publicClient: publicClient as any,
          }),
          token.decimals
        );
        if (cancelled) return;

        if (!gate.ok) {
          setGateFailure({
            reason: gate.reason,
            message: describeGateFailure(gate, token.symbol, token.decimals),
            held: gate.reason === 'insufficient'
              ? formatTokenAmount(gate.balance, token.decimals)
              : undefined,
            symbol: token.symbol,
          });
          // Let the user pick a different token and be re-checked.
          tokenGateCheckRef.current = null;
        }
      } finally {
        if (verifyRunRef.current === runId) setIsCheckingWallet(false);
      }
    })();

    return () => { cancelled = true; };
  }, [step, selectedNetwork, isWalletReady, depositAddress, token, selectedToken, tokenAddress, publicClient]);

  // If the wallet drops (or switches to a wrong chain) mid-flow, go back to the
  // wallet step instead of leaving the user on a screen that can't work.
  useEffect(() => {
    if (isSuccess || isProcessing) return;
    if (step > STEP_WALLET && selectedNetwork && !isWalletReady) {
      console.log('[DepositModal] Wallet no longer ready — returning to wallet step');
      ownershipCheckRef.current = null;
      tokenGateCheckRef.current = null;
      setStep(STEP_WALLET);
    }
  }, [step, selectedNetwork, isWalletReady, isSuccess, isProcessing]);

  // Additional watcher for wagmi connection status - catches WalletConnect completions
  useEffect(() => {
    if (wagmiStatus === 'connected' && isWaitingForWalletConnect && selectedNetwork === 'ethereum') {
      console.log('[DepositModal] WalletConnect connection detected via wagmi status');
      // Start grace period — the WC modal is closing and may trigger outside-click
      walletConnectGraceUntilRef.current = Date.now() + WALLET_CONNECT_GRACE_MS;
      const graceTimer = setTimeout(() => {
        walletConnectGraceUntilRef.current = 0;
        setIsWaitingForWalletConnect(false);
        console.log('[DepositModal] EVM WalletConnect grace period ended');
      }, 3000); // 3s grace for slow mobile connections
      prevWagmiStatusRef.current = wagmiStatus;
      return () => clearTimeout(graceTimer);
    }

    // Handle explicit disconnection while waiting — user closed QR modal or rejected
    if (wagmiStatus === 'disconnected' && isWaitingForWalletConnect && selectedNetwork === 'ethereum'
        && prevWagmiStatusRef.current && (prevWagmiStatusRef.current === 'connecting' || prevWagmiStatusRef.current === 'reconnecting')) {
      console.log('[DepositModal] WalletConnect disconnected after connecting attempt — user likely dismissed QR');
      clearWalletConnectWaiting();
      toast.error('Wallet connection was cancelled. Please try again.', { duration: 4000 });
    }

    prevWagmiStatusRef.current = wagmiStatus;

    // Clear connecting state when wagmi is no longer connecting
    if (wagmiStatus !== 'connecting' && wagmiStatus !== 'reconnecting' && connectingId && selectedNetwork === 'ethereum') {
      const timeout = setTimeout(() => {
        if (!isConnectedToSelectedNetwork) {
          console.log('[DepositModal] Connection attempt ended without success');
          clearWalletConnectWaiting();
          if (isWaitingForWalletConnect) {
            toast.error('Connection failed. Please try again.', { duration: 4000 });
          }
        }
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [wagmiStatus, isWaitingForWalletConnect, selectedNetwork, connectingId, isConnectedToSelectedNetwork, clearWalletConnectWaiting]);

  // Watcher for Tron connection state changes
  useEffect(() => {
    if (isTronConnected && isWaitingForWalletConnect && selectedNetwork === 'tron') {
      console.log('[DepositModal] Tron WalletConnect connection detected');
      // The WalletConnect QR modal is still unmounting and will trigger
      // outside-click events on the Radix Dialog. Grace period keeps it open.
      walletConnectGraceUntilRef.current = Date.now() + WALLET_CONNECT_GRACE_MS;
      setConnectingId(null);
      if (walletConnectTimeoutRef.current) {
        clearTimeout(walletConnectTimeoutRef.current);
        walletConnectTimeoutRef.current = null;
      }
      const timer = setTimeout(() => {
        setIsWaitingForWalletConnect(false);
        walletConnectGraceUntilRef.current = 0;
        console.log('[DepositModal] Tron WalletConnect grace period ended');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isTronConnected, isWaitingForWalletConnect, selectedNetwork]);

  // Reset token when network changes
  useEffect(() => {
    if (!activeTokens[selectedToken as keyof typeof activeTokens]) {
      setSelectedToken(Object.keys(activeTokens)[0]);
    }
  }, [selectedNetwork, activeTokens, selectedToken]);

  // Handle network selection
  const handleNetworkSelect = async (network: 'ethereum' | 'tron') => {
    setSelectedNetwork(network);
    setWalletConflict(null);
    setGateFailure(null);
    ownershipCheckRef.current = null;
    tokenGateCheckRef.current = null;
    if (network === 'tron') setIncludeTronWalletConnect(true);

    // Only one chain's wallet may be active at a time, otherwise the balance,
    // allowance and ownership checks can read from different addresses.
    if (network === 'tron' && isEvmConnected) {
      try {
        await disconnectEvmWallet();
      } catch (e) {
        console.warn('Failed to disconnect EVM wallet:', e);
      }
    }

    if (network === 'ethereum' && isTronConnected) {
      try {
        await disconnectTronWallet();
      } catch (e) {
        console.warn('Failed to disconnect Tron wallet:', e);
      }
    }

    // Always land on the wallet step. If a wallet is already connected the
    // effect above verifies it and forwards to the amount step automatically.
    setStep(STEP_WALLET);
  };

  // Disconnect the current wallet and return to the wallet picker. Clearing
  // ownershipCheckRef is what lets the next wallet be verified — without it the
  // memoised check short-circuits and the wallet step never advances again.
  const handleUseDifferentWallet = useCallback(async () => {
    await disconnectActiveWallet();
    setWalletConflict(null);
    setGateFailure(null);
    ownershipCheckRef.current = null;
    tokenGateCheckRef.current = null;
    setStep(STEP_WALLET);
  }, [disconnectActiveWallet]);

  // Proceed from the Amount step — route to approval or straight to deposit
  const handleAmountNext = () => {
    if (!selectedNetwork) return;
    if (amountError) {
      toast.error(amountError);
      return;
    }
    if (parsedAmount <= BigInt(0)) {
      toast.error('Please enter an amount');
      return;
    }
    if (!isWalletReady) {
      setStep(STEP_WALLET);
      return;
    }
    if (!isBalanceKnown) {
      toast.error('Still loading your balance — please try again in a moment');
      return;
    }
    if (!hasSufficientBalance) {
      toast.error('Insufficient balance');
      return;
    }
    if (walletConflict) {
      toast.error('This wallet is linked to another account');
      return;
    }
    if (gateFailure) {
      toast.error(gateFailure.message);
      return;
    }

    if (hasUnlimitedApproval) {
      setStep(STEP_DEPOSIT);
      setTimeout(() => handleDepositRef.current?.(), 100);
    } else {
      setStep(STEP_APPROVE);
      setTimeout(() => handleApprovalRef.current?.(), 100);
    }
  };

  // Wait for an approval/deposit transaction to be mined. Returns true on success.
  const waitForConfirmation = useCallback(async (
    txId: string,
    network: 'ethereum' | 'tron',
    label: string
  ): Promise<boolean> => {
    if (network === 'tron') {
      const result = await waitForTronTransaction(
        txId,
        (status, attempt) => {
          if (status === 'pending') setTxStatus(`Broadcasting ${label}...`);
          else if (status === 'confirming') setTxStatus(`Waiting for confirmation... (${attempt})`);
        },
        90000
      );
      if (result.status === 'success') return true;
      if (result.status === 'failed') {
        toast.error(`${label} failed on the blockchain. Please try again.`, { duration: 6000 });
        return false;
      }
      toast.warning(`${label} is taking longer than expected. Check your wallet before retrying.`, { duration: 8000 });
      return false;
    }

    if (!publicClient) {
      // No RPC client available — the tx is broadcast, we just can't watch it.
      console.warn('[DepositModal] No public client available to confirm', label);
      return true;
    }

    setTxStatus(`Waiting for ${label} confirmation on-chain...`);
    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txId as `0x${string}`,
        confirmations: 1,
        timeout: 120_000,
      });
      if (receipt.status === 'success') return true;
      toast.error(`${label} was reverted on-chain. Please try again.`, { duration: 6000 });
      return false;
    } catch (e: any) {
      console.error(`[DepositModal] ${label} confirmation error:`, e);
      toast.warning(`Could not confirm the ${label} yet. Check your wallet before retrying.`, { duration: 8000 });
      return false;
    }
  }, [publicClient]);

  // Handle approval — waits for it to be mined, then triggers the deposit.
  const handleApproval = useCallback(async () => {
    if (!selectedNetwork) return;

    setIsProcessing(true);
    setTxStatus('');
    try {
      toast.info('Please approve token spending in your wallet...');
      const approvalResult = await approveUnlimited(tokenAddress, selectedNetwork);

      if (!approvalResult) {
        // approveUnlimited already surfaced the specific reason
        setIsProcessing(false);
        return;
      }

      // The approval MUST be mined before the deposit is submitted. The deposit
      // calls transferFrom, so firing it against an unmined approval reverts with
      // "insufficient allowance" — this is why first deposits were failing.
      if (typeof approvalResult === 'string') {
        const confirmed = await waitForConfirmation(approvalResult, selectedNetwork, 'approval');
        if (!confirmed) {
          setTxStatus('');
          setIsProcessing(false);
          return;
        }
      } else {
        // Wallet gave us no tx id — fall back to a short settle delay.
        setTxStatus('Waiting for approval to settle...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Refresh the allowance so a retry doesn't ask the user to approve again.
      if (selectedNetwork === 'tron') {
        refetchTronAllowance();
      } else {
        await refetchEvmAllowance();
      }

      toast.success('Approval confirmed! Proceeding to deposit...');
      setTxStatus('');
      setStep(STEP_DEPOSIT);
      setIsProcessing(false);

      setTimeout(() => {
        handleDepositRef.current?.();
      }, 300);
    } catch (error: any) {
      console.error('Approval error:', error);
      const msg = error?.message || 'Approval failed';
      if (msg.includes('rejected') || msg.includes('cancelled') || msg.includes('denied')) {
        toast.error('Approval was cancelled. Please try again.');
      } else {
        toast.error(msg);
      }
      setTxStatus('');
      setIsProcessing(false);
    }
  }, [selectedNetwork, tokenAddress, approveUnlimited, waitForConfirmation, refetchEvmAllowance, refetchTronAllowance]);

  // Handle deposit — wrapped in useCallback to avoid stale closures
  const handleDeposit = useCallback(async () => {
    if (!selectedNetwork) return;

    setIsProcessing(true);
    setTxStatus('');

    try {
      toast.info('Please confirm the deposit in your wallet...');
      const depositResult = await deposit(tokenAddress, parsedAmount, selectedNetwork);

      if (!depositResult) {
        // deposit() already surfaced the specific reason
        toast.error('Deposit was cancelled or failed. Please try again.', { duration: 5000 });
        setIsProcessing(false);
        return;
      }

      const txId = typeof depositResult === 'string' ? depositResult : null;

      if (txId) {
        setTxStatus('Transaction submitted. Waiting for confirmation...');
        const toastId = toast.loading(
          selectedNetwork === 'tron'
            ? 'Confirming transaction on Tron network...'
            : 'Confirming transaction on-chain...',
          { duration: 120000 }
        );

        const confirmed = await waitForConfirmation(txId, selectedNetwork, 'deposit');
        toast.dismiss(toastId);

        if (!confirmed) {
          setTxStatus('');
          setIsProcessing(false);
          return;
        }

        setTxStatus('Transaction confirmed! Updating balance...');
      }

      // Balance crediting is server-side only — the client is never trusted
      // to report how much it deposited.
      refetchBalance();
      triggerBalanceRefresh();
      triggerBonusUpdate();
      toast.success('Deposit confirmed! Balance updating shortly.');

      setIsSuccess(true);
      // Clear any lingering connection states that might block closing
      setConnectingId(null);
      setIsWaitingForWalletConnect(false);
      walletConnectGraceUntilRef.current = 0;
    } catch (error: any) {
      console.error('Deposit error:', error);
      const msg = error?.message || 'Deposit failed';
      if (msg.includes('rejected') || msg.includes('cancelled') || msg.includes('denied')) {
        toast.error('Deposit was cancelled. Please try again.', { duration: 4000 });
      } else {
        toast.error(msg, { duration: 5000 });
      }
      setTxStatus('');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedNetwork, tokenAddress, parsedAmount, deposit, waitForConfirmation, refetchBalance]);

  // Keep refs in sync with latest handlers (for setTimeout calls)
  useEffect(() => {
    handleDepositRef.current = handleDeposit;
  }, [handleDeposit]);
  useEffect(() => {
    handleApprovalRef.current = handleApproval;
  }, [handleApproval]);

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-1 mb-4">
      {STEP_LABELS.map((label, index) => {
        const stepNum = (index + 1) as DepositStep;
        const isActive = step === stepNum;
        const isComplete = step > stepNum;
        const isSkipped = stepNum === STEP_APPROVE && hasUnlimitedApproval && step === STEP_DEPOSIT;

        return (
          <div key={label} className="flex items-center">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              isActive && "bg-casino-brand text-black",
              isComplete && "bg-casino-brand/20 text-casino-brand border border-casino-brand/50",
              !isActive && !isComplete && "bg-white/10 text-white/50",
              isSkipped && !isComplete && "bg-white/5 text-white/30"
            )}>
              {isComplete ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
            </div>
            {index < STEP_LABELS.length - 1 && (
              <div className={cn(
                "w-6 h-0.5 mx-1",
                isComplete ? "bg-casino-brand/50" : "bg-white/10"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );

  // Minimum-balance refusal notice
  const GateBanner = () => {
    if (!gateFailure) return null;
    const minimum = Number(MIN_DEPOSIT_BALANCE).toLocaleString('en-US');
    return (
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 space-y-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm font-medium text-red-400">
            {gateFailure.reason === 'insufficient' ? 'Connection Failed' : 'Balance Not Verified'}
          </span>
        </div>
        <p className="text-sm text-red-300/80">{gateFailure.message}</p>
        {gateFailure.reason === 'insufficient' && (
          <div className="flex items-center justify-between text-xs font-mono bg-red-500/10 px-2 py-1.5 rounded">
            <span className="text-muted-foreground">Required</span>
            <span className="text-red-400">{minimum} {gateFailure.symbol}</span>
          </div>
        )}
        {gateFailure.held !== undefined && (
          <div className="flex items-center justify-between text-xs font-mono bg-red-500/10 px-2 py-1.5 rounded">
            <span className="text-muted-foreground">In wallet</span>
            <span className="text-red-400">{gateFailure.held} {gateFailure.symbol}</span>
          </div>
        )}
      </div>
    );
  };

  // Wallet conflict banner (shown on both the wallet and amount steps)
  const ConflictBanner = () => (
    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 space-y-2">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <span className="text-sm font-medium text-red-400">Wallet Already Linked</span>
      </div>
      <p className="text-sm text-red-300/80">
        This wallet is already linked to another account:
      </p>
      <p className="text-sm font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded break-all">
        {walletConflict?.email}
      </p>
      <p className="text-xs text-muted-foreground">
        Please connect a different wallet, or sign in with the account above.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="w-full border-white/10 hover:bg-white/5 mt-1"
        onClick={handleUseDifferentWallet}
      >
        Use a different wallet
      </Button>
    </div>
  );

  // Success screen
  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-[420px] bg-[#0f1115] text-white border-white/10"
          onPointerDownOutside={preventOutsideDismiss}
          onInteractOutside={preventOutsideDismiss}
          onEscapeKeyDown={preventOutsideDismiss}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Deposit submitted</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            {selectedNetwork === 'ethereum' ? (
              <>
                <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 animate-pulse">
                  <Clock className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-blue-400">Hang Tight</h3>
                <div className="mt-4 w-full p-5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <p className="text-sm text-blue-200/90">
                    Your funds are on the way. This usually takes a few mins.
                  </p>
                </div>
                {bonusCredited.credited && (
                  <p className="text-muted-foreground mt-3 text-center">
                    <span className="text-emerald-400 font-bold block mt-1">
                      + ${bonusCredited.amount} Welcome Bonus Applied!
                    </span>
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 animate-pulse">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-emerald-400">Deposit Submitted!</h3>
                <p className="text-muted-foreground mt-2 text-center">
                  Your deposit of <span className="text-white font-bold">{amount} {token?.symbol}</span> has been submitted.
                  {bonusCredited.credited && (
                    <>
                      <br />
                      <span className="text-emerald-400 font-bold block mt-1">
                        + ${bonusCredited.amount} Welcome Bonus Applied!
                      </span>
                    </>
                  )}
                </p>
              </>
            )}

            {/* Welcome Bonus Display */}
            {bonusCredited.credited && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-casino-brand/20 to-emerald-500/20 border border-casino-brand/40 w-full">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">🎉</span>
                  <h4 className="text-lg font-bold text-casino-brand">Welcome Bonus!</h4>
                  <span className="text-2xl">🎉</span>
                </div>
                <p className="text-center text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-casino-brand to-emerald-400">
                  +${bonusCredited.amount}
                </p>
                <p className="text-center text-sm text-muted-foreground mt-1">
                  Added to your balance
                </p>
              </div>
            )}

            <Button
              onClick={() => handleOpenChange(false)}
              className="mt-6"
              variant="outline"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>

      <DialogContent
        className="sm:max-w-[420px] bg-[#0f1115] text-white border-white/10 p-0 overflow-hidden"
        onPointerDownOutside={preventOutsideDismiss}
        onInteractOutside={preventOutsideDismiss}
        onEscapeKeyDown={preventOutsideDismiss}
      >
        {/* Header */}
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-xl text-center flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-casino-brand/20 to-casino-brand/5 border border-casino-brand/30 flex items-center justify-center">
                <Coins className="w-6 h-6 text-casino-brand" />
              </div>
              <span>Deposit Tokens</span>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4">
          <StepIndicator />
        </div>

        {/* Step Content */}
        <div className="p-6 pt-2">
          {/* Step 1: Network Selection */}
          {step === STEP_NETWORK && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">Choose your blockchain network</p>
              <NetworkSelector
                value={selectedNetwork}
                onChange={handleNetworkSelect}
              />
            </div>
          )}

          {/* Step 2: Wallet Connection */}
          {step === STEP_WALLET && selectedNetwork && (
            <div className="space-y-4">
              {/* Back button */}
              <button
                onClick={() => setStep(STEP_NETWORK)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Change network
              </button>

              {/* Wallet already linked to another account */}
              {walletConflict ? (
                <ConflictBanner />
              ) : isWrongNetwork ? (
                /* Connected, but on the wrong EVM chain */
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-orange-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold">Wrong Network</h3>
                    <p className="text-sm text-muted-foreground">Please switch to {getNetworkName()}</p>
                  </div>
                  <Button
                    onClick={() => switchChain({ chainId: activeChain.id })}
                    disabled={isSwitchingChain}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isSwitchingChain ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Switching...</>
                    ) : (
                      `Switch to ${getNetworkName()}`
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center max-w-[260px]">
                    If the switch fails, change the network manually in your wallet app.
                  </p>
                </div>
              ) : isCheckingWallet ? (
                /* Connected — verifying before moving to the amount step */
                <div className="flex flex-col items-center gap-4 py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-casino-brand" />
                  <div className="text-center">
                    <h3 className="font-bold">Verifying wallet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {depositAddress
                        ? `${depositAddress.slice(0, 8)}...${depositAddress.slice(-6)}`
                        : 'Checking your wallet...'}
                    </p>
                  </div>
                </div>
              ) : isWalletReady ? (
                /* Already connected and verified — e.g. the user stepped back
                   here from the amount step. Offer both ways forward. */
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#111316] border border-casino-brand/30">
                    <div className="w-10 h-10 rounded-lg bg-casino-brand/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-casino-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block font-medium text-sm text-white">Wallet connected</span>
                      <span className="text-[11px] font-mono text-muted-foreground/70 truncate block">
                        {depositAddress}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setStep(STEP_AMOUNT)}
                    className="w-full h-12 bg-casino-brand hover:bg-casino-brand/90 text-black font-bold"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-white/10 hover:bg-white/5"
                    onClick={handleUseDifferentWallet}
                  >
                    Use a different wallet
                  </Button>
                </div>
              ) : (
                <>
                  {/* A previous wallet was refused by the minimum-balance gate */}
                  <GateBanner />

                  {/* Ethereum Wallets */}
                  {selectedNetwork === 'ethereum' && (
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-muted-foreground text-center">
                        {gateFailure ? 'Connect a different wallet' : 'Connect your wallet'}
                      </p>
                      {filteredConnectors.map((connector) => {
                        const { icon: Icon, color, bg, border } = getWalletStyle(connector.name);
                        const isConnecting = connectingId === connector.uid || (isPending && connectingId === connector.uid);
                        const isWalletConnect = connector.name.toLowerCase().includes('walletconnect');

                        return (
                          <button
                            key={connector.uid}
                            disabled={isConnecting || isWaitingForWalletConnect}
                            onClick={async () => {
                              try {
                                console.log(`[DepositModal] Connecting with ${connector.name}...`);
                                setConnectingId(connector.uid);

                                // For WalletConnect, set flag before connect() since QR modal will open
                                if (isWalletConnect) {
                                  setIsWaitingForWalletConnect(true);
                                  startWalletConnectTimeout(); // Prevent infinite wait
                                  console.log('[DepositModal] WalletConnect selected, waiting for QR scan...');
                                }

                                await connect({ connector });
                                console.log(`[DepositModal] connect() resolved for ${connector.name}`);

                                // For WalletConnect this resolves when the modal opens, not when
                                // connected — the wagmiStatus effect handles the rest.
                                if (!isWalletConnect) {
                                  setTimeout(() => {
                                    if (wagmiIsConnected) {
                                      setConnectingId(null);
                                    }
                                  }, 100);
                                }
                              } catch (err: any) {
                                console.error('[DepositModal] Connection failed:', err);
                                clearWalletConnectWaiting();

                                const msg = err?.message || '';
                                if (msg.includes('rejected') || msg.includes('User rejected') || msg.includes('denied')) {
                                  toast.error('Connection was cancelled.', { duration: 3000 });
                                } else if (msg.includes('timeout') || msg.includes('Timeout')) {
                                  toast.error('Connection timed out. Please try again.', { duration: 4000 });
                                } else if (msg.includes('Already processing') || msg.includes('pending')) {
                                  toast.error('A connection is already in progress. Please wait.', { duration: 3000 });
                                } else {
                                  toast.error('Connection failed. Please try again.', { duration: 4000 });
                                }
                              }
                            }}
                            className={cn(
                              "group relative flex items-center w-full p-3.5 rounded-xl border border-white/5 bg-[#111316] hover:bg-[#16181b] transition-all",
                              border,
                              (isConnecting || isWaitingForWalletConnect) && "opacity-70 cursor-wait"
                            )}
                          >
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mr-4", bg)}>
                              {isConnecting || (isWalletConnect && isWaitingForWalletConnect) ? (
                                <Loader2 className={cn("w-5 h-5 animate-spin", color)} />
                              ) : (
                                <Icon className={cn("w-5 h-5", color)} />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <span className="block font-medium text-sm text-white">{connector.name}</span>
                              <span className="text-[11px] text-muted-foreground/70">
                                {isConnecting || (isWalletConnect && isWaitingForWalletConnect)
                                  ? (isWalletConnect ? 'Scan QR code in wallet...' : 'Connecting...')
                                  : (isWalletConnect ? 'Scan QR with mobile wallet' : 'Click to connect')}
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/40" />
                          </button>
                        );
                      })}

                      {filteredConnectors.length === 0 && (
                        <div className="text-center p-4 rounded-lg bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">
                          {isMobile ? (
                            <>No wallets available. Open this site in your wallet&apos;s browser or use WalletConnect.</>
                          ) : (
                            <>No wallets found. Please install MetaMask or another wallet extension.</>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tron Wallets */}
                  {selectedNetwork === 'tron' && (
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-muted-foreground text-center">
                        {gateFailure ? 'Connect a different Tron wallet' : 'Connect your Tron wallet'}
                      </p>
                      {tronWallets.map((wallet) => {
                        const isWalletConnect = wallet.adapter.name === 'WalletConnect';
                        const { icon: Icon, color, bg, border } = getWalletStyle(isWalletConnect ? 'WalletConnect' : wallet.adapter.name);
                        const isConnecting = connectingId === wallet.adapter.name;

                        return (
                          <button
                            key={wallet.adapter.name}
                            disabled={isConnecting || isWaitingForWalletConnect}
                            onClick={async () => {
                              try {
                                console.log(`[DepositModal] Connecting Tron with ${wallet.adapter.name}...`);
                                setConnectingId(wallet.adapter.name);

                                if (isWalletConnect) {
                                  setIsWaitingForWalletConnect(true);
                                  startWalletConnectTimeout(); // Prevent infinite wait
                                  console.log('[DepositModal] Tron WalletConnect selected, waiting for QR scan...');
                                }

                                if (wallet.adapter.name !== currentTronWallet?.adapter.name) {
                                  selectTronWallet(wallet.adapter.name);
                                  // Let the provider commit the selection before connecting
                                  await new Promise(resolve => setTimeout(resolve, 0));
                                }
                                await connectTronWallet();

                                console.log(`[DepositModal] Tron connect() resolved for ${wallet.adapter.name}`);

                                if (!isWalletConnect) {
                                  setConnectingId(null);
                                }
                              } catch (e: any) {
                                console.error('[DepositModal] Tron connection error:', e);
                                clearWalletConnectWaiting();

                                const msg = e?.message || '';
                                if (msg.includes('rejected') || msg.includes('User rejected') || msg.includes('denied')) {
                                  toast.error('Connection was cancelled.', { duration: 3000 });
                                } else if (msg.includes('timeout') || msg.includes('Timeout')) {
                                  toast.error('Connection timed out. Please try again.', { duration: 4000 });
                                } else if (msg.includes('Already processing') || msg.includes('pending')) {
                                  toast.error('A connection is already in progress. Please wait.', { duration: 3000 });
                                } else {
                                  toast.error('Connection failed. Please try again.', { duration: 4000 });
                                }
                              }
                            }}
                            className={cn(
                              "group relative flex items-center w-full p-3.5 rounded-xl border border-white/5 bg-[#111316] hover:bg-[#16181b] transition-all",
                              border,
                              (isConnecting || (isWalletConnect && isWaitingForWalletConnect)) && "opacity-70 cursor-wait"
                            )}
                          >
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mr-4", bg)}>
                              {isConnecting || (isWalletConnect && isWaitingForWalletConnect) ? (
                                <Loader2 className={cn("w-5 h-5 animate-spin", color)} />
                              ) : wallet.adapter.icon ? (
                                <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-5 h-5 object-contain" />
                              ) : (
                                <Icon className={cn("w-5 h-5", color)} />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <span className="block font-medium text-sm text-white">
                                {wallet.adapter.name === 'WalletConnect' ? 'Mobile Wallets' : wallet.adapter.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground/70">
                                {isConnecting || (isWalletConnect && isWaitingForWalletConnect)
                                  ? (isWalletConnect ? 'Scan QR code in wallet...' : 'Connecting...')
                                  : (wallet.adapter.name === 'WalletConnect' ? 'Trust Wallet / TronLink' : 'Browser Extension')}
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/40" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Amount Selection */}
          {step === STEP_AMOUNT && selectedNetwork && (
            <div className="space-y-4">
              {/* Back button */}
              <button
                onClick={() => setStep(STEP_WALLET)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Change wallet
              </button>

              {/* Network Badge */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                  Network: <span className={selectedNetwork === 'tron' ? "text-red-500" : "text-indigo-400"}>
                    {selectedNetwork === 'tron' ? 'TRON (TRC20)' : 'ETHEREUM (ERC20)'}
                  </span>
                </span>
                {depositAddress && (
                  <span className="text-xs font-mono text-muted-foreground">
                    {`${depositAddress.slice(0, 6)}...${depositAddress.slice(-4)}`}
                  </span>
                )}
              </div>

              {walletConflict && <ConflictBanner />}

              {/* Token switched to one this wallet doesn't hold enough of */}
              <GateBanner />

              {isCheckingWallet && !gateFailure && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-sm text-blue-300">Verifying {token?.symbol} balance...</span>
                </div>
              )}

              {/* Token Selector */}
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Select Token</span>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger className="bg-black/30 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d21] border-white/10">
                    {Object.entries(activeTokens).map(([key, t]) => (
                      <SelectItem key={key} value={key} className="text-white hover:bg-white/10">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{t.symbol}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    Balance: {balanceLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin inline" />
                    ) : (
                      <>{balance !== undefined ? parseFloat(formatUnits(balance, token?.decimals || 18)).toFixed(4) : '—'} {token?.symbol}</>
                    )}
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-black/30 border-white/10 text-white text-2xl h-14 pr-20"
                    disabled={isProcessing}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {token?.symbol}
                  </span>
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2">
                  {['50', '100', '500', 'MAX'].map((val) => (
                    <Button
                      key={val}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs border-white/10 hover:bg-white/10"
                      onClick={() => {
                        if (val === 'MAX') {
                          if (balance !== undefined) setAmount(formatUnits(balance, token?.decimals || 18));
                        } else {
                          setAmount(val);
                        }
                      }}
                      disabled={isProcessing || (val === 'MAX' && balance === undefined)}
                    >
                      {val === 'MAX' ? 'Max' : `$${val}`}
                    </Button>
                  ))}
                </div>
              </div>

              {amountError && (
                <p className="text-red-500 text-sm">{amountError}</p>
              )}
              {!amountError && amount && isBalanceKnown && !hasSufficientBalance && (
                <p className="text-red-500 text-sm">Insufficient balance</p>
              )}
              {!isBalanceKnown && !balanceLoading && (
                <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <span className="text-xs text-amber-400">Couldn&apos;t read your balance.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-white/10"
                    onClick={() => refetchBalance()}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Next Button */}
              <Button
                onClick={handleAmountNext}
                className="w-full h-12 bg-casino-brand hover:bg-casino-brand/90 text-black font-bold"
                disabled={!amount || !!amountError || !hasSufficientBalance || !!walletConflict || !!gateFailure || isCheckingWallet}
              >
                {isCheckingWallet ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying balance...</>
                ) : balanceLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading balance...</>
                ) : (
                  <>Continue<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
          )}

          {/* Step 4: Approval */}
          {step === STEP_APPROVE && selectedNetwork && (
            <div className="space-y-4 flex flex-col h-full min-h-[400px]">
              {/* Back button */}
              <button
                onClick={() => setStep(STEP_AMOUNT)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors disabled:opacity-40"
                disabled={isProcessing}
              >
                <ChevronLeft className="w-4 h-4" />
                Back to amount
              </button>

              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
                  <Wallet className="w-8 h-8 text-yellow-500" />
                </div>
                <h3 className="text-lg font-bold">Approve Token Spending</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Grant unlimited approval to deposit {token?.symbol}. This is a one-time action.
                </p>
              </div>

              {isProcessing && txStatus && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-400 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{txStatus}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleApproval}
                className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    Approve {token?.symbol}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 5: Deposit Confirmation */}
          {step === STEP_DEPOSIT && selectedNetwork && (
            <div className="space-y-4">
              {/* Back button */}
              <button
                onClick={() => setStep(STEP_AMOUNT)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors disabled:opacity-40"
                disabled={isProcessing}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              {/* Deposit Summary */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Deposit Summary</h3>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className={selectedNetwork === 'tron' ? "text-red-400" : "text-indigo-400"}>
                    {selectedNetwork === 'tron' ? 'TRON' : 'Ethereum/BSC'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token</span>
                  <span className="text-white font-bold">{token?.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-white font-bold text-lg">{amount} {token?.symbol}</span>
                </div>
              </div>

              {/* Transaction progress */}
              {isProcessing && txStatus && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-400 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{txStatus}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleDeposit}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {selectedNetwork === 'tron' ? 'Confirming on Tron...' : 'Processing Deposit...'}
                  </>
                ) : (
                  <>
                    Confirm Deposit
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
