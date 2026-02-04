'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useConnect, useChainId, useSwitchChain, useDisconnect, Connector } from 'wagmi';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { NetworkSelector } from './NetworkSelector';
import { cn } from '@/lib/utils';
import { SUPPORTED_TOKENS, TRON_TOKENS } from '@/lib/contracts';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { useDeposit, useTokenBalance, useTokenAllowance, useTronTokenAllowance, waitForTronTransaction } from '@/hooks/useDeposit';
import { toast } from 'sonner';
import { getActiveChain, getNetworkName, isMobileDevice, isInWalletBrowser } from '@/lib/config';
import { triggerBalanceRefresh } from '@/hooks/usePlatformBalance';
import { createClient } from '@/lib/supabase';

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
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Auth & wallet state
  const { 
    isConnected: isEvmConnected, 
    isTronConnected, 
    activeAddress,
    registerWalletAddress
  } = useAuth();
  
  // Wagmi hooks
  const { connectors, connect, isPending } = useConnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  
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

  // Deposit hooks
  const { signTerms, approveUnlimited, deposit, depositSuccess } = useDeposit();

  // Device detection
  const [isMobile, setIsMobile] = useState(false);
  const [hasInjectedWallet, setHasInjectedWallet] = useState(false);
  
  useEffect(() => {
    setIsMobile(isMobileDevice());
    setHasInjectedWallet(isInWalletBrowser());
  }, []);

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

  // Reset on modal close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep(1);
      setSelectedNetwork(null);
      setSelectedToken('USDT');
      setAmount('');
      setIsProcessing(false);
      setIsSuccess(false);
      setConnectingId(null);
    }
    setIsOpen(open);
  };

  // Auto-advance when wallet connects
  useEffect(() => {
    if (step === 2 && isConnectedToSelectedNetwork && !isWrongNetwork) {
      setStep(3);
    }
  }, [step, isConnectedToSelectedNetwork, isWrongNetwork]);

  // Reset token when network changes
  useEffect(() => {
    if (!activeTokens[selectedToken as keyof typeof activeTokens]) {
      setSelectedToken(Object.keys(activeTokens)[0]);
    }
  }, [selectedNetwork, activeTokens, selectedToken]);

  // Handle network selection
  const handleNetworkSelect = async (network: 'ethereum' | 'tron') => {
    setSelectedNetwork(network);
    
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

  // Proceed from Amount step
  const handleAmountNext = () => {
    if (!amount || parsedAmount <= BigInt(0)) {
      toast.error('Please enter an amount');
      return;
    }
    if (!hasSufficientBalance) {
      toast.error('Insufficient balance');
      return;
    }
    // Skip approval step if already approved
    if (hasUnlimitedApproval) {
      setStep(5);
    } else {
      setStep(4);
    }
  };

  // Handle approval
  const handleApproval = async () => {
    if (!selectedNetwork) return;
    
    setIsProcessing(true);
    try {
      toast.info('Please approve token spending in your wallet...');
      const approved = await approveUnlimited(tokenAddress, selectedNetwork);
      
      if (!approved) {
        toast.error('Approval was rejected or failed');
        setIsProcessing(false);
        return;
      }

      // Wait and refetch allowance
      await new Promise(resolve => setTimeout(resolve, 2000));
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
      
      toast.success('Approval successful!');
      setStep(5);
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(error?.message || 'Approval failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // State for Tron tx progress
  const [tronTxStatus, setTronTxStatus] = useState<string>('');

  // Handle deposit
  const handleDeposit = async () => {
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
                const data = await res.json();
                if (res.ok && data?.success) {
                  triggerBalanceRefresh();
                  toast.success('Deposit confirmed and credited!');
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
          } else if (txResult.status === 'failed') {
            console.error('Tron TX failed on-chain');
            toast.error('Transaction failed on blockchain. Please try again.');
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
        // EVM or other networks
        setIsSuccess(true);
        refetchBalance();
        toast.success('Deposit successful!');
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error?.message || 'Deposit failed');
      setTronTxStatus('');
    } finally {
      setIsProcessing(false);
    }
  };

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
        <DialogTrigger asChild>
          <Button className="w-full h-12 bg-casino-brand text-black font-bold hover:bg-casino-brand/90 hover:shadow-neon transition-all">
            <Coins className="w-4 h-4 mr-2" />
            Deposit
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[420px] bg-[#0f1115] text-white border-white/10">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-emerald-400">Deposit Successful!</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Your deposit of <span className="text-white font-bold">{amount} {token?.symbol}</span> has been submitted.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Balance will update after blockchain confirmation.
            </p>
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
      <DialogTrigger asChild>
        <Button className="w-full h-12 bg-casino-brand text-black font-bold hover:bg-casino-brand/90 hover:shadow-neon transition-all">
          <Coins className="w-4 h-4 mr-2" />
          Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] bg-[#0f1115] text-white border-white/10 p-0 overflow-hidden">
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
                    
                    return (
                      <button 
                        key={connector.uid}
                        disabled={isConnecting}
                        onClick={async () => {
                          try {
                            setConnectingId(connector.uid);
                            await connect({ connector });
                          } catch (err) {
                            console.error('Connection failed:', err);
                            setConnectingId(null);
                          }
                        }}
                        className={cn(
                          "group relative flex items-center w-full p-3.5 rounded-xl border border-white/5 bg-[#111316] hover:bg-[#16181b] transition-all",
                          border,
                          isConnecting && "opacity-70 cursor-wait"
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mr-4", bg)}>
                          {isConnecting ? (
                            <Loader2 className={cn("w-5 h-5 animate-spin", color)} />
                          ) : (
                            <Icon className={cn("w-5 h-5", color)} />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <span className="block font-medium text-sm text-white">{connector.name}</span>
                          <span className="text-[11px] text-muted-foreground/70">
                            {isConnecting ? 'Connecting...' : 'Click to connect'}
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
                    
                    return (
                      <button 
                        key={wallet.adapter.name}
                        onClick={async () => {
                          if (wallet.adapter.name !== currentTronWallet?.adapter.name) {
                            selectTronWallet(wallet.adapter.name);
                          }
                          try {
                            await connectTronWallet();
                          } catch (e) {
                            console.error('Tron connection error:', e);
                          }
                        }}
                        className={cn(
                          "group relative flex items-center w-full p-3.5 rounded-xl border border-white/5 bg-[#111316] hover:bg-[#16181b] transition-all",
                          border
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mr-4", bg)}>
                          {wallet.adapter.icon ? (
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
                            {wallet.adapter.name === 'WalletConnect' ? 'Trust Wallet / TronLink' : 'Browser Extension'}
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
                disabled={!amount || !hasSufficientBalance}
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
