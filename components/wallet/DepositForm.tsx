'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { SUPPORTED_TOKENS, TRON_TOKENS, TokenSymbol } from '@/lib/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  ArrowRight, 
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useDeposit, useTokenBalance, useTokenAllowance } from '@/hooks/useDeposit';
import { triggerBalanceRefresh } from '@/hooks/usePlatformBalance';

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
  } = useDeposit();
  
  // Only run hooks if token exists
  console.log('FORM_TRACE: DepositForm render', { selectedNetwork, tokenAddress });
  const { balance, refetch: refetchBalance, error: balanceError, debugInfo } = useTokenBalance(
    tokenAddress || '0x0000000000000000000000000000000000000000',
    selectedNetwork || 'ethereum'
  );
  const { allowance, refetch: refetchAllowance } = useTokenAllowance(
    tokenAddress || '0x0000000000000000000000000000000000000000', 
    selectedNetwork || 'ethereum'
  );

  // Parse amount
  const parsedAmount = amount && token ? parseUnits(amount, token.decimals) : BigInt(0);
  
  // Check if already has unlimited approval
  const hasUnlimitedApproval = allowance !== undefined && allowance >= maxUint256 / BigInt(2);
  const hasSufficientBalance = balance !== undefined && balance >= parsedAmount;

  // Handle deposit success
  useEffect(() => {
    if (depositSuccess && isProcessing) {
      setIsProcessing(false);
      setIsSuccess(true);
      refetchBalance();
      toast.success('Deposit successful!');
      triggerBalanceRefresh(); // Refresh platform balance
      if (onSuccess) onSuccess();
    }
  }, [depositSuccess, isProcessing, refetchBalance, onSuccess]);

  // Determine if this is a first-time deposit for this token
  const isFirstTime = !hasUnlimitedApproval;

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

    try {
      // FIRST TIME: Sign terms + Approve unlimited
      if (isFirstTime) {
        // Step 1: Sign terms
        toast.info('Please sign the terms agreement...');
        const signature = await signTerms(selectedNetwork || 'ethereum');
        if (!signature) {
          setIsProcessing(false);
          return;
        }

        // Step 2: Approve unlimited (network-specific approval popup)
        toast.info(
          selectedNetwork === 'tron'
            ? 'TronLink will open to approve USDT spending...'
            : 'Please approve token spending...'
        );
        const approved = await approveUnlimited(tokenAddress, selectedNetwork);
        if (!approved) {
          setIsProcessing(false);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refetchAllowance();
      }

      // Step 3: Deposit
      toast.info('Please confirm the deposit...');
      await deposit(tokenAddress, parsedAmount, selectedNetwork || 'ethereum', token.decimals);
      
    } catch (error: any) {
      console.error('Deposit flow error:', error);
      toast.error(error.message || 'Transaction failed');
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
    deposit,
    selectedNetwork,
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
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 animate-pulse">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-emerald-400">Deposit Successful!</h3>
        <p className="text-muted-foreground mt-2 text-center">
          Your deposit of <span className="text-white font-bold">{amount} {token.symbol}</span> has been submitted.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Balance will update after blockchain confirmation.
        </p>
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

      {/* DEBUG INFO - To be removed later */}
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
