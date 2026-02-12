'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { createClient } from '@/lib/supabase';

import { useOnOpenDepositModal, triggerBonusUpdate } from '@/lib/depositEvents';

type DepositStep = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS = ['Network', 'Wallet', 'Amount', 'Approve', 'Deposit'];

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
  const [step, setStep] = useState<DepositStep>(1);
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'tron' | null>(null);
  const [selectedToken, setSelectedToken] = useState<string>('USDT');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bonusCredited, setBonusCredited] = useState<{ credited: boolean; amount: number }>({ credited: false, amount: 0 });
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [walletConflict, setWalletConflict] = useState<{ email: string } | null>(null);
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);
  // Track if we're waiting for WalletConnect to complete (QR modal is open)
  const [isWaitingForWalletConnect, setIsWaitingForWalletConnect] = useState(false);
  // Grace period: after WalletConnect connects, the WC modal takes time to unmount.
  // During this window external pointer/focus events can trigger Radix onOpenChange(false).
  const walletConnectGraceRef = useRef(false);
  const prevWagmiStatusRef = useRef<string | null>(null);
  const prevConnectedRef = useRef(false);
  // Global timeout to prevent WalletConnect from waiting forever
  const walletConnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const WALLET_CONNECT_MAX_WAIT_MS = 30_000; // 30 seconds max
  // Refs for latest handler functions (avoids stale closures in setTimeout)
  const handleDepositRef = useRef<(() => Promise<void>) | null>(null);
  const handleApprovalRef = useRef<(() => Promise<void>) | null>(null);

  // Auth & wallet state
  const { 
    isConnected: isEvmConnected, 
    isTronConnected, 
    activeAddress,
    registerWalletAddress,
    checkWalletOwnership
  } = useAuth();
  
  // Direct wagmi account hook for more reliable connection detection
  const { isConnected: wagmiIsConnected, isConnecting: wagmiIsConnecting, status: wagmiStatus } = useAccount();
  
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
  const { signTerms, approveUnlimited, deposit, depositSuccess } = useDeposit();

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

  // Token balance and allowance
  const { balance, refetch: refetchBalance, isLoading: balanceLoading } = useTokenBalance(
    tokenAddress || '0x0000000000000000000000000000000000000000',
    selectedNetwork || 'ethereum'
  );
  const { allowance: evmAllowance, refetch: refetchEvmAllowance } = useTokenAllowance(tokenAddress);
  const { allowance: tronAllowance, refetch: refetchTronAllowance } = useTronTokenAllowance(
    selectedNetwork === 'tron' ? tokenAddress : undefined
  );

  // Parse amount
  const parsedAmount = amount && token ? parseUnits(amount, token.decimals) : BigInt(0);
  const hasSufficientBalance = balance !== undefined && balance >= parsedAmount;

  // Check unlimited approval based on network
  const hasUnlimitedApproval = selectedNetwork === 'tron'
    ? (tronAllowance !== undefined && tronAllowance >= maxUint256 / BigInt(2))
    : (evmAllowance !== undefined && evmAllowance >= maxUint256 / BigInt(2));

  // Connection state based on selected network
  const isConnectedToSelectedNetwork = selectedNetwork === 'tron' ? isTronConnected : isEvmConnected;

  // Check for wrong EVM network
  const activeChain = getActiveChain();
  const isWrongNetwork = selectedNetwork === 'ethereum' && isEvmConnected && chainId !== activeChain.id;

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
    walletConnectGraceRef.current = false;
    if (walletConnectTimeoutRef.current) {
      clearTimeout(walletConnectTimeoutRef.current);
      walletConnectTimeoutRef.current = null;
    }
  }, []);

  // Start a global timeout when WalletConnect flow starts — prevents infinite wait
  const startWalletConnectTimeout = useCallback(() => {
    // Clear any existing timeout
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
    if (!open && !isSuccess && (isWaitingForWalletConnect || walletConnectGraceRef.current)) {
      console.log('[DepositModal] Preventing modal close while waiting for WalletConnect / grace period');
      return;
    }
    
    if (!open) {
      setStep(1);
      setSelectedNetwork(null);
      setSelectedToken('USDT');
      setAmount('');
      setIsProcessing(false);
      setIsSuccess(false);
      setBonusCredited({ credited: false, amount: 0 });
      setConnectingId(null);
      setWalletConflict(null);
      setIsCheckingWallet(false);
      clearWalletConnectWaiting();
    }
    setIsOpen(open);
  };

  // Prevent outside interactions (pointer-down / focus) from closing the dialog
  // while a WalletConnect flow is active. The WC QR modal sits outside the Radix
  // Dialog portal so its open/close lifecycle fires outside-interaction events.
  // EXCEPTION: If isSuccess is true, we want to allow the user to close the modal.
  const preventOutsideDismiss = useCallback((e: Event) => {
    if (isSuccess) return;
    
    if (isWaitingForWalletConnect || walletConnectGraceRef.current || connectingId) {
      e.preventDefault();
    }
  }, [isWaitingForWalletConnect, connectingId, isSuccess]);

  // Auto-advance when wallet connects - robust detection for WalletConnect
  useEffect(() => {
    const wasConnected = prevConnectedRef.current;
    const isNowConnected = isConnectedToSelectedNetwork && !isWrongNetwork;
    
    // Log connection state changes for debugging
    if (wasConnected !== isNowConnected) {
      console.log('[DepositModal] Connection state changed:', { 
        wasConnected, 
        isNowConnected, 
        step,
        selectedNetwork,
        isEvmConnected,
        isTronConnected,
        wagmiStatus,
        isWaitingForWalletConnect
      });
    }
    
    prevConnectedRef.current = isNowConnected;
    
    // Advance to step 3 when wallet connects while on step 2
    if (step === 2 && isNowConnected) {
      console.log('[DepositModal] Wallet connected, advancing to step 3 (amount)');
      clearWalletConnectWaiting();
      setStep(3);
    }
  }, [step, isConnectedToSelectedNetwork, isWrongNetwork, selectedNetwork, isEvmConnected, isTronConnected, wagmiStatus, isWaitingForWalletConnect, clearWalletConnectWaiting]);

  // Additional watcher for wagmi connection status - catches WalletConnect completions
  useEffect(() => {
    // When wagmi status changes to 'connected' and we were waiting for WalletConnect
    if (wagmiStatus === 'connected' && isWaitingForWalletConnect && selectedNetwork === 'ethereum') {
      console.log('[DepositModal] WalletConnect connection detected via wagmi status');
      // Start grace period — the WC modal is closing and may trigger outside-click
      walletConnectGraceRef.current = true;
      const graceTimer = setTimeout(() => {
        walletConnectGraceRef.current = false;
        console.log('[DepositModal] EVM WalletConnect grace period ended');
      }, 3000); // 3s grace for slow mobile connections
      // Let the main effect handle the step transition
      return () => clearTimeout(graceTimer);
    }

    // Handle explicit disconnection while waiting — user closed QR modal or rejected
    // Only trigger if wagmi was previously in a connecting state (to avoid false positives
    // when the QR modal first opens and wagmi is already 'disconnected')
    if (wagmiStatus === 'disconnected' && isWaitingForWalletConnect && selectedNetwork === 'ethereum' 
        && prevWagmiStatusRef.current && (prevWagmiStatusRef.current === 'connecting' || prevWagmiStatusRef.current === 'reconnecting')) {
      console.log('[DepositModal] WalletConnect disconnected after connecting attempt — user likely dismissed QR');
      clearWalletConnectWaiting();
      toast.error('Wallet connection was cancelled. Please try again.', { duration: 4000 });
    }
    
    // Track previous wagmi status for transition detection
    prevWagmiStatusRef.current = wagmiStatus;
    
    // Clear connecting state when wagmi is no longer connecting
    if (wagmiStatus !== 'connecting' && wagmiStatus !== 'reconnecting' && connectingId && selectedNetwork === 'ethereum') {
      // Small delay to let the connection state settle
      const timeout = setTimeout(() => {
        if (!isConnectedToSelectedNetwork) {
          console.log('[DepositModal] Connection attempt ended without success');
          clearWalletConnectWaiting();
          // Only show error if we were actively waiting (not a normal state transition)
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
      // Don't clear isWaitingForWalletConnect immediately!
      // The WalletConnect QR modal is still unmounting and will trigger outside-click
      // events on the Radix Dialog. Use a grace period to prevent the deposit modal
      // from closing abruptly.
      walletConnectGraceRef.current = true;
      setConnectingId(null);
      // Clear global timeout since we connected successfully
      if (walletConnectTimeoutRef.current) {
        clearTimeout(walletConnectTimeoutRef.current);
        walletConnectTimeoutRef.current = null;
      }
      // The main connection effect will handle step transition.
      // Clear the flag after a generous delay to let WC modal fully unmount.
      const timer = setTimeout(() => {
        setIsWaitingForWalletConnect(false);
        walletConnectGraceRef.current = false;
        console.log('[DepositModal] Tron WalletConnect grace period ended');
      }, 3000); // 3s grace for slow mobile connections
      return () => clearTimeout(timer);
    }
  }, [isTronConnected, isWaitingForWalletConnect, selectedNetwork]);

  // Check wallet ownership when entering Amount step (step 3)
  useEffect(() => {
    const checkOwnership = async () => {
      console.log('[DepositModal] Ownership check triggered. Step:', step, 'Address:', activeAddress, 'Network:', selectedNetwork);
      
      // Only check when on step 3 with a connected wallet
      if (step === 3 && activeAddress && selectedNetwork) {
        console.log('[DepositModal] Conditions met, starting wallet check...');
        toast.info(`Checking wallet ${activeAddress.slice(0, 8)}...`);
        
        setIsCheckingWallet(true);
        setWalletConflict(null);
        
        try {
          const result = await checkWalletOwnership(activeAddress, selectedNetwork);
          console.log('[DepositModal] Wallet check result:', result);
          
          if (result.isOwnedByOther && result.ownerEmail) {
            console.log('[DepositModal] Setting wallet conflict with email:', result.ownerEmail);
            toast.error(`Wallet already linked to: ${result.ownerEmail}`);
            setWalletConflict({ email: result.ownerEmail });
          } else {
            toast.success('Wallet check passed');
          }
        } catch (err) {
          console.error('[DepositModal] Error during wallet check:', err);
          toast.error('Error checking wallet');
        }
        
        setIsCheckingWallet(false);
      }
    };
    
    checkOwnership();
  }, [step, activeAddress, selectedNetwork, checkWalletOwnership]);

  // Reset token when network changes
  useEffect(() => {
    if (!activeTokens[selectedToken as keyof typeof activeTokens]) {
      setSelectedToken(Object.keys(activeTokens)[0]);
    }
  }, [selectedNetwork, activeTokens, selectedToken]);

  // Handle network selection
  const handleNetworkSelect = async (network: 'ethereum' | 'tron') => {
    setSelectedNetwork(network);
    if (network === 'tron') setIncludeTronWalletConnect(true);

    // If switching to Tron but EVM is connected, disconnect EVM first
    if (network === 'tron' && isEvmConnected) {
      try {
        await disconnectEvmWallet();
      } catch (e) {
        console.warn('Failed to disconnect EVM wallet:', e);
      }
    }
    
    // If switching to Ethereum but Tron is connected, disconnect Tron first
    if (network === 'ethereum' && isTronConnected) {
      try {
        await disconnectTronWallet();
      } catch (e) {
        console.warn('Failed to disconnect Tron wallet:', e);
      }
    }
    
    // Check if already connected to the selected network
    const alreadyConnected = network === 'tron' ? isTronConnected : isEvmConnected;
    const wrongNet = network === 'ethereum' && isEvmConnected && chainId !== activeChain.id;
    
    if (alreadyConnected && !wrongNet) {
      setStep(3);
    } else {
      setStep(2);
    }
  };

  // Proceed from Amount step - automatically handle approval and deposit
  const handleAmountNext = async () => {
    if (!amount || parsedAmount <= BigInt(0)) {
      toast.error('Please enter an amount');
      return;
    }
    if (!hasSufficientBalance) {
      toast.error('Insufficient balance');
      return;
    }
    if (!selectedNetwork) return;

    // If already approved, go directly to deposit step and auto-trigger deposit
    if (hasUnlimitedApproval) {
      setStep(5);
      // Auto-trigger the deposit after a brief delay to let UI update
      // Use ref to get the latest handleDeposit (avoids stale closure)
      setTimeout(() => {
        handleDepositRef.current?.();
      }, 100);
    } else {
      // Need approval first - show approval step and auto-trigger approval
      setStep(4);
      // Auto-trigger the approval popup after a brief delay
      // Use ref to get the latest handleApproval (avoids stale closure)
      setTimeout(() => {
        handleApprovalRef.current?.();
      }, 100);
    }
  };

  // Handle approval - automatically triggers deposit after success
  const handleApproval = useCallback(async () => {
    if (!selectedNetwork) return;
    
    setIsProcessing(true);
    try {
      toast.info('Please approve token spending in your wallet...');
      const approvalResult = await approveUnlimited(tokenAddress, selectedNetwork);
      
      if (!approvalResult) {
        toast.error('Approval was rejected or failed');
        setIsProcessing(false);
        return;
      }

      // For EVM: wait for the approval tx to be confirmed on-chain before proceeding.
      // This prevents "Nonce too low" errors when the deposit tx is submitted immediately
      // after the approval tx, especially with WalletConnect / mobile wallets.
      if (selectedNetwork === 'ethereum' && typeof approvalResult === 'string' && publicClient) {
        toast.info('Waiting for approval confirmation on-chain...');
        try {
          await publicClient.waitForTransactionReceipt({
            hash: approvalResult as `0x${string}`,
            confirmations: 1,
          });
        } catch (receiptError: any) {
          console.error('Approval confirmation failed:', receiptError);
          toast.error('Approval transaction failed on-chain. Please try again.');
          setIsProcessing(false);
          return;
        }
      } else {
        // Tron: wait a bit for propagation
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Refetch allowance after confirmation
      if (selectedNetwork === 'tron') {
        await refetchTronAllowance();
      } else {
        await refetchEvmAllowance();
      }

      // Register wallet address AFTER successful approval
      // This links the wallet to the user for webhook deposit matching
      if (activeAddress) {
        await registerWalletAddress(activeAddress, selectedNetwork);
      }
      
      toast.success('Approval successful! Proceeding to deposit...');
      setStep(5);
      setIsProcessing(false);
      
      // Auto-trigger the deposit popup after approval completes
      // Use ref to get the latest handleDeposit (avoids stale closure)
      setTimeout(() => {
        handleDepositRef.current?.();
      }, 100);
    } catch (error: any) {
      console.error('Approval error:', error);
      const msg = error?.message || 'Approval failed';
      // Show user-friendly message for common errors
      if (msg.includes('rejected') || msg.includes('cancelled') || msg.includes('denied')) {
        toast.error('Approval was cancelled. Please try again.');
      } else {
        toast.error(msg);
      }
      setIsProcessing(false);
    }
  }, [selectedNetwork, tokenAddress, approveUnlimited, refetchTronAllowance, refetchEvmAllowance, activeAddress, registerWalletAddress, publicClient]);

  // State for Tron tx progress
  const [tronTxStatus, setTronTxStatus] = useState<string>('');

  // Handle deposit — wrapped in useCallback to avoid stale closures
  const handleDeposit = useCallback(async () => {
    if (!selectedNetwork) return;
    
    setIsProcessing(true);
    setTronTxStatus('');
    
    try {
      toast.info('Please confirm the deposit in your wallet...');
      const depositResult = await deposit(tokenAddress, parsedAmount, selectedNetwork);

      // Handle Tron deposit
      if (depositResult && selectedNetwork === 'tron') {
        const tronTxId = typeof depositResult === 'string' ? depositResult : null;
        if (tronTxId) {
          console.log(`Tron deposit submitted: ${tronTxId}. Verifying on-chain...`);
          setTronTxStatus('Transaction submitted. Waiting for confirmation...');
          
          // Show dismissible toast for progress
          const toastId = toast.loading('Confirming transaction on Tron network...', {
            duration: 120000, // Long duration, we'll dismiss it manually
          });
          
          // Verify on-chain status with progress callback
          const txResult = await waitForTronTransaction(
            tronTxId,
            (status, attempt) => {
              if (status === 'pending') {
                setTronTxStatus('Broadcasting transaction...');
              } else if (status === 'confirming') {
                setTronTxStatus(`Waiting for block confirmation... (${attempt})`);
              }
            },
            90000 // 90 second timeout
          );
          
          // Dismiss progress toast
          toast.dismiss(toastId);
          
          if (txResult.status === 'success') {
            console.log('Tron TX confirmed on-chain. Notifying server...');
            setTronTxStatus('Transaction confirmed! Updating balance...');
            
            try {
              const supabase = createClient();
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.access_token) {
                const depositAmount = amount ? parseFloat(amount) : 0;
                const res = await fetch('/api/wallet/deposit', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                  },
                  body: JSON.stringify({
                    txHash: tronTxId,
                    amount: depositAmount,
                    tokenAddress: tokenAddress,
                    network: 'tron',
                  }),
                });
                console.log('Tron deposit API response status:', res.status);
                const data = await res.json();
                console.log('Tron deposit API response data:', data);
                if (res.ok && data?.success) {
                  triggerBalanceRefresh();
                  
                  // Check if welcome bonus was credited
                  if (data.bonusCredited && data.bonusAmount) {
                    setBonusCredited({ credited: true, amount: data.bonusAmount });
                    toast.success(`🎉 Deposit confirmed! +$${data.bonusAmount} Welcome Bonus credited!`, {
                      duration: 6000,
                    });
                  } else {
                    toast.success('Deposit confirmed and credited!');
                  }
                } else {
                   // Fallback to webhook if API fails but TX was good
                   toast.success('Deposit confirmed! Balance updating shortly.');
                }
              }
            } catch (err) {
              console.warn('Manual notification failed, webhook will process:', err);
              toast.success('Deposit confirmed! Balance updating shortly.');
            }
            
            
            setIsSuccess(true);
            // Clear any lingering connection states that might block closing
            setConnectingId(null);
            setIsWaitingForWalletConnect(false);
            walletConnectGraceRef.current = false;
          } else if (txResult.status === 'failed') {
            console.error('Tron TX failed on-chain');
            toast.error('Transaction failed on blockchain. Please try again.', { duration: 6000 });
            setTronTxStatus('');
            setIsProcessing(false);
            return;
          } else if (txResult.status === 'timeout') {
            console.warn('Tron TX verification timed out');
            // Don't fail immediately - tx might still confirm
            toast.warning('Verification timed out, but your transaction may still confirm. Check your wallet.', {
              duration: 10000,
            });
            setTronTxStatus('');
            setIsProcessing(false);
            return;
          }
        }
      } else if (depositResult) {
        // EVM deposit — uses webhook-based approach. The webhook adds balance
        // when the on-chain event is detected. We still try to call the API
        // to record the tx hash and trigger welcome bonus if applicable.
        const evmTxHash = typeof depositResult === 'string' ? depositResult : (depositResult as any)?.hash;
        
        if (evmTxHash) {
          console.log('EVM deposit submitted:', evmTxHash);
          
          try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            console.log('[DepositModal] Session:', session ? 'Active' : 'Missing', 'User:', session?.user?.id);
            
            if (session?.access_token) {
              const depositAmount = amount ? parseFloat(amount) : 0;
              const res = await fetch('/api/wallet/deposit', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  txHash: evmTxHash,
                  amount: depositAmount,
                  tokenAddress: tokenAddress,
                  network: 'ethereum',
                }),
              });
              
              console.log('EVM deposit API response status:', res.status);
              const data = await res.json();
              console.log('EVM deposit API response data:', data);
              
              if (res.ok && data?.success) {
                triggerBalanceRefresh();
                refetchBalance();
                
                // Check if welcome bonus was credited
                if (data.bonusCredited && data.bonusAmount) {
                  setBonusCredited({ credited: true, amount: data.bonusAmount });
                  toast.success(`🎉 Deposit successful! +$${data.bonusAmount} Welcome Bonus credited!`, {
                    duration: 6000,
                  });
                } else {
                  toast.success('Deposit confirmed and credited!');
                }
              } else {
                // Fallback - tx was submitted, webhook will process
                toast.success('Deposit submitted! Balance will update after blockchain confirmation.');
                triggerBalanceRefresh();
              }
            } else {
              toast.success('Deposit submitted! Balance will update after blockchain confirmation.');
              triggerBalanceRefresh();
            }
          } catch (err) {
            console.error('[DepositModal] Deposit API call failed:', err);
            toast.success('Deposit submitted! Balance will update after blockchain confirmation.');
            triggerBalanceRefresh();
          }
        } else {
          // deposit() returned true but no hash string — just show success
          // The webhook will handle the balance update
          toast.success('Deposit submitted! Balance will update after blockchain confirmation.');
          triggerBalanceRefresh();
        }
        
        triggerBonusUpdate();
        setIsSuccess(true);
      } else {
        // deposit() returned false — rejected or failed
        toast.error('Deposit was cancelled or failed. Please try again.', { duration: 5000 });
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      const msg = error?.message || 'Deposit failed';
      if (msg.includes('rejected') || msg.includes('cancelled') || msg.includes('denied')) {
        toast.error('Deposit was cancelled. Please try again.', { duration: 4000 });
      } else {
        toast.error(msg, { duration: 5000 });
      }
      setTronTxStatus('');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedNetwork, tokenAddress, parsedAmount, amount, deposit, refetchBalance]);

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
        const isSkipped = (stepNum === 2 && step > 2) || (stepNum === 4 && hasUnlimitedApproval && step === 5);
        
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

  // Success screen
  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>

        <DialogContent
        className="sm:max-w-[420px] bg-[#0f1115] text-white border-white/10"
        onPointerDownOutside={preventOutsideDismiss}
        onInteractOutside={preventOutsideDismiss}
      >
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
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">Choose your blockchain network</p>
              <NetworkSelector
                value={selectedNetwork}
                onChange={handleNetworkSelect}
              />
            </div>
          )}

          {/* Step 2: Wallet Connection */}
          {step === 2 && selectedNetwork && (
            <div className="space-y-4">
              {/* Back button */}
              <button
                onClick={() => { setStep(1); setSelectedNetwork(null); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to network selection
              </button>

              {/* Wrong network warning */}
              {isWrongNetwork && (
                <div className="flex flex-col items-center gap-4 py-4">
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
                </div>
              )}

              {/* Ethereum Wallets */}
              {selectedNetwork === 'ethereum' && !isWrongNetwork && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground text-center">Connect your wallet</p>
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
                            
                            // connect() returns when QR modal opens (WalletConnect) or when connected (others)
                            await connect({ connector });
                            
                            console.log(`[DepositModal] connect() resolved for ${connector.name}`);
                            // Note: For WalletConnect, this resolves when modal opens, not when connected
                            // The useEffect watching wagmiStatus will handle the actual connection
                            
                            // For non-WalletConnect connectors, clear state immediately if connected
                            if (!isWalletConnect) {
                              // Small delay to let state settle
                              setTimeout(() => {
                                if (wagmiIsConnected) {
                                  setConnectingId(null);
                                }
                              }, 100);
                            }
                          } catch (err: any) {
                            console.error('[DepositModal] Connection failed:', err);
                            clearWalletConnectWaiting();
                            
                            // Show user-friendly error messages
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
                </div>
              )}

              {/* Tron Wallets */}
              {selectedNetwork === 'tron' && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground text-center">Connect your Tron wallet</p>
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
                            
                            // For WalletConnect, set flag before connect()
                            if (isWalletConnect) {
                              setIsWaitingForWalletConnect(true);
                              startWalletConnectTimeout(); // Prevent infinite wait
                              console.log('[DepositModal] Tron WalletConnect selected, waiting for QR scan...');
                            }
                            
                            if (wallet.adapter.name !== currentTronWallet?.adapter.name) {
                              selectTronWallet(wallet.adapter.name);
                            }
                            await connectTronWallet();
                            
                            console.log(`[DepositModal] Tron connect() resolved for ${wallet.adapter.name}`);
                            
                            // For non-WalletConnect, clear state after connection
                            if (!isWalletConnect) {
                              setTimeout(() => {
                                if (isTronConnected) {
                                  setConnectingId(null);
                                }
                              }, 100);
                            }
                          } catch (e: any) {
                            console.error('[DepositModal] Tron connection error:', e);
                            clearWalletConnectWaiting();
                            
                            // Show user-friendly error messages
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
            </div>
          )}

          {/* Step 3: Amount Selection */}
          {step === 3 && selectedNetwork && (
            <div className="space-y-4">
              {/* Back button */}
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Change network
              </button>

              {/* Network Badge */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                  Network: <span className={selectedNetwork === 'tron' ? "text-red-500" : "text-indigo-400"}>
                    {selectedNetwork === 'tron' ? 'TRON (TRC20)' : 'ETHEREUM (ERC20)'}
                  </span>
                </span>
                {activeAddress && (
                  <span className="text-xs font-mono text-muted-foreground">
                    {`${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`}
                  </span>
                )}
              </div>

              {/* Wallet Conflict Warning */}
              {isCheckingWallet && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                  <span className="text-sm text-yellow-400">Checking wallet ownership...</span>
                </div>
              )}
              
              {walletConflict && !isCheckingWallet && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-red-400">Wallet Already Linked</span>
                  </div>
                  <p className="text-sm text-red-300/80">
                    This wallet is already linked to another account:
                  </p>
                  <p className="text-sm font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded break-all">
                    {walletConflict.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please connect a different wallet or login with the account above.
                  </p>
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
                      <>{balance ? parseFloat(formatUnits(balance, token?.decimals || 18)).toFixed(4) : '0.0000'} {token?.symbol}</>
                    )}
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
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
                        if (val === 'MAX' && balance) {
                          setAmount(formatUnits(balance, token?.decimals || 18));
                        } else {
                          setAmount(val);
                        }
                      }}
                      disabled={isProcessing}
                    >
                      {val === 'MAX' ? 'Max' : `$${val}`}
                    </Button>
                  ))}
                </div>
              </div>

              {amount && !hasSufficientBalance && (
                <p className="text-red-500 text-sm">Insufficient balance</p>
              )}

              {/* Next Button */}
              <Button 
                onClick={handleAmountNext}
                className="w-full h-12 bg-casino-brand hover:bg-casino-brand/90 text-black font-bold"
                disabled={!amount || !hasSufficientBalance || !!walletConflict || isCheckingWallet}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 4: Approval */}
          {step === 4 && selectedNetwork && (
            <div className="space-y-4">
              {/* Back button */}
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors"
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
          {step === 5 && selectedNetwork && (
            <div className="space-y-4">
              {/* Back button */}
              <button
                onClick={() => setStep(hasUnlimitedApproval ? 3 : 4)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors"
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

              {/* Tron Transaction Status */}
              {isProcessing && selectedNetwork === 'tron' && tronTxStatus && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-400 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{tronTxStatus}</span>
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
