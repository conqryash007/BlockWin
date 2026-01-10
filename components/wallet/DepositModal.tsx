'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { CONTRACTS } from '@/lib/contracts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, 
  ArrowRight, 
  Check, 
  Coins,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useDeposit, useTokenBalance, useTokenAllowance, useTokenDecimals, useTokenSymbol } from '@/hooks/useDeposit';
import { cn } from '@/lib/utils';

// Default token
const TOKEN_ADDRESS = CONTRACTS.MockUSDT.address;

export function DepositModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { address, isConnected } = useAccount();
  
  const { 
    signTerms,
    approveUnlimited, 
    deposit, 
    isSigningMessage,
    depositSuccess,
  } = useDeposit();
  
  const { balance, refetch: refetchBalance } = useTokenBalance(TOKEN_ADDRESS);
  const { allowance, refetch: refetchAllowance } = useTokenAllowance(TOKEN_ADDRESS);
  const { decimals: tokenDecimals } = useTokenDecimals(TOKEN_ADDRESS);
  const { symbol: tokenSymbol } = useTokenSymbol(TOKEN_ADDRESS);

  // Use fetched decimals or fallback to 18
  const TOKEN_DECIMALS = tokenDecimals ?? 18;
  const TOKEN_SYMBOL = tokenSymbol ?? 'TOKEN';

  // Parse amount
  const parsedAmount = amount ? parseUnits(amount, TOKEN_DECIMALS) : BigInt(0);
  
  // Check if already approved (unlimited)
  const hasUnlimitedApproval = allowance !== undefined && allowance >= maxUint256 / BigInt(2);
  const hasSufficientBalance = balance !== undefined && balance >= parsedAmount;

  // Handle deposit success
  useEffect(() => {
    if (depositSuccess && isProcessing) {
      setIsProcessing(false);
      setIsSuccess(true);
      refetchBalance();
      toast.success('Deposit successful!');
    }
  }, [depositSuccess, isProcessing, refetchBalance]);

  // Main deposit handler - chains all wallet popups
  const handleDeposit = async () => {
    if (!amount || parsedAmount <= BigInt(0)) {
      toast.error('Please enter an amount');
      return;
    }
    if (!hasSufficientBalance) {
      toast.error('Insufficient balance');
      return;
    }
    if (!termsAccepted) {
      toast.error('Please accept the terms');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Sign terms
      toast.info('Please sign the terms agreement...');
      const signature = await signTerms();
      if (!signature) {
        setIsProcessing(false);
        return;
      }

      // Step 2: Approve if needed
      if (!hasUnlimitedApproval) {
        toast.info('Please approve token spending...');
        const approved = await approveUnlimited(TOKEN_ADDRESS);
        if (!approved) {
          setIsProcessing(false);
          return;
        }
        // Wait for approval to be confirmed
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refetchAllowance();
      }

      // Step 3: Deposit
      toast.info('Please confirm the deposit...');
      await deposit(TOKEN_ADDRESS, parsedAmount);
      
    } catch (error: any) {
      console.error('Deposit flow error:', error);
      toast.error(error.message || 'Transaction failed');
      setIsProcessing(false);
    }
  };

  // Reset on close
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setAmount('');
      setTermsAccepted(false);
      setIsProcessing(false);
      setIsSuccess(false);
    }
  };

  // Close after success
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setAmount('');
      setTermsAccepted(false);
      setIsProcessing(false);
      setIsSuccess(false);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full h-12 bg-casino-brand text-black font-bold hover:bg-casino-brand/90 hover:shadow-neon transition-all">
          <Coins className="w-4 h-4 mr-2" />
          Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] bg-[#0f1115] text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl">Deposit {TOKEN_SYMBOL}</DialogTitle>
        </DialogHeader>

        {/* Success State */}
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-emerald-400">Deposit Successful!</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Your deposit of <span className="text-white font-bold">{amount} {TOKEN_SYMBOL}</span> has been submitted.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Balance will update after blockchain confirmation.
            </p>
            <Button 
              onClick={handleClose}
              className="mt-6"
              variant="outline"
            >
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-muted-foreground">
                  Balance: {balance ? parseFloat(formatUnits(balance, TOKEN_DECIMALS)).toFixed(4) : '0.0000'} {TOKEN_SYMBOL}
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
                  {TOKEN_SYMBOL}
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
                        setAmount(formatUnits(balance, TOKEN_DECIMALS));
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

            {/* Terms */}
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

            {/* Deposit Button */}
            <Button 
              onClick={handleDeposit}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
              disabled={isProcessing || !amount || !hasSufficientBalance || !termsAccepted}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Deposit {amount ? `${amount} ${TOKEN_SYMBOL}` : ''}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              You'll be asked to sign terms, approve tokens (if needed), then confirm deposit.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
