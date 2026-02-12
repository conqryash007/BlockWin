'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { SUPPORTED_TOKENS, TRON_TOKENS } from '@/lib/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Info,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDeposit, useTokenBalance, useTokenAllowance } from '@/hooks/useDeposit';
import { useAuth } from '@/hooks/useAuth';
import { triggerBalanceRefresh } from '@/hooks/usePlatformBalance';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { triggerBonusUpdate } from '@/lib/depositEvents';

interface DepositFormProps {
  selectedNetwork: 'ethereum' | 'tron' | null;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function DepositForm({ selectedNetwork, onSuccess, onClose }: DepositFormProps) {
  // Determine active tokens based on network
  const activeTokens = useMemo(() => {
    return selectedNetwork === 'tron' ? TRON_TOKENS : SUPPORTED_TOKENS;
  }, [selectedNetwork]);

  const [selectedToken, setSelectedToken] = useState<string>('USDT');
  const [amount, setAmount] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [processLog, setProcessLog] = useState<string[]>([]);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [bonusCredited, setBonusCredited] = useState<{ credited: boolean; amount: number } | null>(null);
  const processLogRef = useRef<string[]>([]);

  const addLog = useCallback((msg: string) => {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    processLogRef.current = [...processLogRef.current.slice(-19), line];
    setProcessLog(processLogRef.current);
  }, []);

  // Reset selected token when network changes if current token invalid
  useEffect(() => {
    if (!activeTokens[selectedToken as keyof typeof activeTokens]) {
      setSelectedToken(Object.keys(activeTokens)[0]);
    }
  }, [selectedNetwork, activeTokens, selectedToken]);

  const { isConnected } = useAccount();
  const token = activeTokens[selectedToken as keyof typeof activeTokens];
  const tokenAddress = token?.address as `0x${string}`; // Type assertion for compatibility hooks
  
  const { 
    signTerms,
    approveUnlimited,
    deposit, 
    depositSuccess,
    depositHash,
  } = useDeposit();
  
  const {
    balance,
    refetch: refetchBalance,
    error: balanceError,
    debugInfo,
    isLoading: balanceLoading,
  } = useTokenBalance(
    tokenAddress || '0x0000000000000000000000000000000000000000',
    selectedNetwork || 'ethereum'
  );

  const { allowance, refetch: refetchAllowance } = useTokenAllowance(tokenAddress || '0x0000000000000000000000000000000000000000');
  const { hasUnlimitedApproval: authHasUnlimitedApproval, refetchTronAllowance } = useAuth();

  // Parse amount
  const parsedAmount = amount && token ? parseUnits(amount, token.decimals) : BigInt(0);

  // Check if already has unlimited approval (network-aware: use AuthContext for TRON, wagmi for EVM)
  const hasUnlimitedApprovalLocal =
    selectedNetwork === 'tron'
      ? authHasUnlimitedApproval
      : (allowance !== undefined && allowance >= maxUint256 / BigInt(2));
  const hasSufficientBalance = balance !== undefined && balance >= parsedAmount;

  // Refetch TRON allowance when deposit form is shown with TRON so we have fresh data (e.g. after approval)
  useEffect(() => {
    if (selectedNetwork === 'tron') {
      refetchTronAllowance();
    }
  }, [selectedNetwork, refetchTronAllowance]);

  // Handle deposit success (for EVM deposits via wagmi's depositSuccess)
  // Now also calls the deposit API to handle welcome bonus
  useEffect(() => {
    if (depositSuccess && isProcessing && selectedNetwork === 'ethereum') {
      const notifyServerForEvm = async () => {
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.access_token && amount && depositHash) {
            const depositAmount = parseFloat(amount);
            const txHash = depositHash;
            
            const res = await fetch('/api/wallet/deposit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                txHash: txHash,
                amount: depositAmount,
                tokenAddress: tokenAddress,
                network: 'ethereum',
              }),
            });
            const data = await res.json();
            
            if (res.ok && data?.success) {
              triggerBalanceRefresh();
              // Check if welcome bonus was credited
              if (data.bonusCredited && data.bonusAmount) {
                setBonusCredited({ credited: true, amount: data.bonusAmount });
                triggerBonusUpdate();
                toast.success(`$${data.bonusAmount} Welcome Bonus credited to your account!`, {
                  duration: 5000,
                  icon: '🎁',
                });
              }
            }
          }
        } catch (err) {
          console.warn('Failed to notify server of EVM deposit:', err);
        }
        
        setIsProcessing(false);
        setIsSuccess(true);
        refetchBalance();
        triggerBalanceRefresh();
        toast.success('Deposit successful!');
        if (onSuccess) onSuccess();
      };
      
      notifyServerForEvm();
    }
  }, [depositSuccess, isProcessing, refetchBalance, onSuccess, selectedNetwork, amount, tokenAddress, depositHash]);

  // Determine if this is a first-time deposit for this token
  const isFirstTime = !hasUnlimitedApprovalLocal;

  // Main deposit handler - SAME FLOW FOR ALL TOKENS
  const handleDeposit = useCallback(async () => {
    if (!selectedNetwork) {
      toast.error('Please connect wallet first');
      return;
    }
    if (!amount || parsedAmount <= BigInt(0)) {
      toast.error('Please enter an amount');
      return;
    }
    if (!hasSufficientBalance) {
      toast.error('Insufficient balance');
      return;
    }
    if (!termsAccepted && isFirstTime) {
      toast.error('Please accept the terms');
      return;
    }

    setIsProcessing(true);
    setDepositError(null);
    addLog('Deposit started');

    try {
      if (isFirstTime) {
        addLog('Step: Sign terms…');
        toast.info('Please sign the terms agreement...');
        const signature = await signTerms(selectedNetwork);
        if (!signature) {
          addLog('Error: Sign terms failed or cancelled');
          setDepositError('Sign terms failed or cancelled');
          setIsProcessing(false);
          return;
        }
        addLog('Step: Sign terms OK');

        addLog('Step: Approve token spending…');
        toast.info(
          selectedNetwork === 'tron'
            ? 'TronLink will open to approve USDT spending...'
            : 'Please approve token spending...'
        );
        const approved = await approveUnlimited(tokenAddress, selectedNetwork);
        if (!approved) {
          addLog('Error: Approval failed or rejected');
          setDepositError('Approval failed or rejected');
          setIsProcessing(false);
          return;
        }
        addLog('Step: Approval submitted, waiting…');
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (selectedNetwork === 'tron') {
          refetchTronAllowance();
        } else {
          await refetchAllowance();
        }
        addLog('Step: Approval OK');
      }

      addLog('Step: Sending deposit…');
      toast.info('Please confirm the deposit...');
      const depositResult = await deposit(tokenAddress, parsedAmount, selectedNetwork || 'ethereum');
      addLog('Step: Deposit submitted');

      // Tron: no webhook; notify server so it records the tx and credits balance (like EVM webhook does)
      if (depositResult && selectedNetwork === 'tron') {
        const tronTxId = typeof depositResult === 'string' ? depositResult : null;
        if (tronTxId) {
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
                // Check if welcome bonus was credited
                if (data.bonusCredited && data.bonusAmount) {
                  setBonusCredited({ credited: true, amount: data.bonusAmount });
                  triggerBonusUpdate();
                  toast.success(`$${data.bonusAmount} Welcome Bonus credited to your account!`, {
                    duration: 5000,
                    icon: '🎁',
                  });
                }
              } else if (!res.ok) {
                console.warn('Tron deposit record failed:', data?.error);
              }
            }
          } catch (err) {
            console.warn('Failed to notify server of Tron deposit:', err);
          }
        }
        setIsProcessing(false);
        setIsSuccess(true);
        refetchBalance();
        toast.success('Deposit successful!');
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      const msg = error?.message || 'Transaction failed';
      console.error('Deposit flow error:', error);
      addLog(`Error: ${msg}`);
      setDepositError(msg);
      toast.error(msg);
      setIsProcessing(false);
    }
  }, [
    amount,
    parsedAmount,
    hasSufficientBalance,
    termsAccepted,
    isFirstTime,
    signTerms,
    approveUnlimited,
    tokenAddress,
    refetchAllowance,
    refetchTronAllowance,
    refetchBalance,
    deposit,
    selectedNetwork,
    onSuccess,
  ]);

  if (!token) return null;

  // Get button text based on state
  const getButtonText = () => {
    if (isProcessing) return 'Processing...';
    
    if (isFirstTime) {
      return `Sign Terms, Approve & Deposit`;
    }
    
    return `Deposit ${amount ? `${amount} ${token.symbol}` : ''}`;
  };

  if (isSuccess) {
    return (
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
            {bonusCredited?.credited && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-casino-brand/20 via-emerald-500/20 to-casino-brand/20 border border-casino-brand/30 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl">🎁</span>
                  <span className="text-lg font-bold text-casino-brand">Welcome Bonus!</span>
                </div>
                <p className="text-white">
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-casino-brand to-emerald-400">
                    ${bonusCredited.amount}
                  </span>
                  <span className="ml-2 text-muted-foreground">has been credited to your account!</span>
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-emerald-400">Deposit Submitted!</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Your deposit of <span className="text-white font-bold">{amount} {token.symbol}</span> has been submitted.
            </p>
            {bonusCredited?.credited && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-casino-brand/20 via-emerald-500/20 to-casino-brand/20 border border-casino-brand/30 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl">🎁</span>
                  <span className="text-lg font-bold text-casino-brand">Welcome Bonus!</span>
                </div>
                <p className="text-white">
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-casino-brand to-emerald-400">
                    ${bonusCredited.amount}
                  </span>
                  <span className="ml-2 text-muted-foreground">has been credited to your account!</span>
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-3">
              Balance will update after blockchain confirmation.
            </p>
          </>
        )}
        {onClose && (
          <Button 
            onClick={onClose}
            className="mt-6"
            variant="outline"
          >
            Close
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      {/* Network Badge */}
      <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Network: <span className={selectedNetwork === 'tron' ? "text-red-500" : "text-indigo-400"}>
                {selectedNetwork === 'tron' ? 'TRON (TRC20)' : 'ETHEREUM (ERC20)'}
            </span>
          </span>
      </div>

      {/* Token Selector */}
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Select Token</span>
        <Select value={selectedToken} onValueChange={(v) => setSelectedToken(v)}>
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

      {/* Status & Debug panel – expandable */}
      <div className="rounded-lg border border-white/10 bg-black/20 overflow-hidden">
        <button
          type="button"
          onClick={() => setDebugPanelOpen((o) => !o)}
          className={cn(
            'flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium transition-colors',
            'hover:bg-white/5',
            (balanceError || depositError) && 'text-amber-400'
          )}
        >
          <span className="flex items-center gap-2">
            {debugPanelOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            Status &amp; debug
            {(balanceError || depositError) && (
              <AlertCircle className="h-4 w-4 text-amber-400" aria-hidden />
            )}
          </span>
          <span className="text-muted-foreground text-xs">
            {debugInfo?.status ?? '—'}
          </span>
        </button>
        {debugPanelOpen && (
          <div className="border-t border-white/10 px-3 py-2.5 space-y-2 text-xs font-mono">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <span className="text-muted-foreground">Status</span>
              <span>{debugInfo?.status ?? '—'}</span>
              <span className="text-muted-foreground">My address</span>
              <span className="truncate" title={debugInfo?.userAddr}>
                {debugInfo?.userAddr ?? '—'}
              </span>
              <span className="text-muted-foreground">Node</span>
              <span className="truncate" title={debugInfo?.node}>
                {debugInfo?.node ?? '—'}
              </span>
              <span className="text-muted-foreground">Token</span>
              <span className="truncate" title={String(tokenAddress)}>
                {tokenAddress ? `${String(tokenAddress).slice(0, 10)}…` : '—'}
              </span>
              <span className="text-muted-foreground">Balance</span>
              <span>
                {balanceLoading
                  ? 'Loading…'
                  : balance != null
                    ? `${formatUnits(balance, token.decimals)} ${token.symbol}`
                    : '—'}
              </span>
              <span className="text-muted-foreground">Balance error</span>
              <span className={balanceError ? 'text-red-400' : 'text-muted-foreground'}>
                {balanceError ?? 'None'}
              </span>
              <span className="text-muted-foreground">Last deposit error</span>
              <span className={depositError ? 'text-red-400' : 'text-muted-foreground'}>
                {depositError ?? 'None'}
              </span>
            </div>
            {processLog.length > 0 && (
              <div className="pt-2 border-t border-white/10">
                <div className="text-muted-foreground mb-1">Process log</div>
                <div className="max-h-24 overflow-y-auto space-y-0.5 text-[11px] text-muted-foreground">
                  {processLog.map((line, i) => (
                    <div key={i} className={line.startsWith('[', 0) && line.includes('Error') ? 'text-red-400' : ''}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedNetwork === 'tron' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 h-7 text-xs border-white/10"
                onClick={() => refetchBalance()}
                disabled={balanceLoading}
              >
                {balanceLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Info className="h-3 w-3 mr-1" />
                )}
                Refetch balance
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Amount</span>
          <span className="text-muted-foreground">
            Balance: {balance ? parseFloat(formatUnits(balance, token.decimals)).toFixed(4) : '0.0000'} {token.symbol}
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
            {token.symbol}
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
                  setAmount(formatUnits(balance, token.decimals));
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

      {/* Terms - only show on first time */}
      {isFirstTime && (
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <Checkbox 
            id="terms" 
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
            disabled={isProcessing}
          />
          <label htmlFor="terms" className="text-sm cursor-pointer">
            I am 18+ and agree to the terms of service
          </label>
        </div>
      )}

      {/* Info text */}
      <div className="text-xs text-muted-foreground p-2 rounded bg-white/5">
        {isFirstTime ? (
          <span>First deposit: Sign terms, approve unlimited spending (one-time), then deposit.</span>
        ) : (
          <span>Confirm deposit only - unlimited approval already granted.</span>
        )}
      </div>

      {/* Deposit Button */}
      <Button 
        onClick={handleDeposit}
        className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
        disabled={isProcessing || !amount || !hasSufficientBalance || (isFirstTime && !termsAccepted)}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {getButtonText()}
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
