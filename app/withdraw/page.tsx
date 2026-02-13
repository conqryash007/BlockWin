'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Wallet,
  ArrowRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePlatformBalance } from '@/hooks/usePlatformBalance';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { useWithdrawal, useWithdrawalRequests } from '@/hooks/useWithdrawal';
import { NetworkSelector } from '@/components/wallet/NetworkSelector';
import { WalletModal } from '@/components/wallet/WalletModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { WithdrawalLayout } from '@/components/withdrawal/WithdrawalLayout';
import { WithdrawalSteps } from '@/components/withdrawal/WithdrawalSteps';
import { motion, AnimatePresence } from 'framer-motion';

const WITHDRAWAL_FEE_PERCENT = 0.05;

type Step = 1 | 2 | 3 | 4 | 5;

function formatUsdt(amount: number): string {
  return `${amount.toFixed(2)} USDT`;
}

export default function WithdrawPage() {
  const { isAuthenticated } = useAuth();
  const { address: evmAddress } = useAccount();
  const { address: tronAddress, connected: isTronConnected } = useWallet();
  const { balance, isLoading: balanceLoading } = usePlatformBalance();
  const { config } = usePlatformConfig();
  const feePercent = config?.platform_fees?.withdrawal_percent ?? WITHDRAWAL_FEE_PERCENT;

  const [step, setStep] = useState<Step>(1);
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState<'ethereum' | 'tron' | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [allowanceData, setAllowanceData] = useState<{ allowance: string; contractBalance: string } | null>(null);
  const [successMode, setSuccessMode] = useState<'requested' | 'withdrawn' | null>(null);

  const {
    checkAllowance,
    requestApproval,
    executeWithdraw,
    allowanceLoading,
    requestLoading,
    isWithdrawPending,
    isWithdrawSuccess,
  } = useWithdrawal();
  const { requests } = useWithdrawalRequests();

  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * feePercent;
  const receiveAmount = amountNum - fee;
  const walletAddress =
    network === 'ethereum' ? evmAddress : network === 'tron' ? tronAddress ?? null : null;
  const isWalletConnected =
    network === 'ethereum' ? !!evmAddress : network === 'tron' ? isTronConnected : false;

  const fetchAllowance = useCallback(() => {
    if (!walletAddress || !network) return;
    setAllowanceData(null);
    checkAllowance(walletAddress, network).then((data) => {
      if (data) setAllowanceData({ allowance: data.allowance, contractBalance: data.contractBalance });
    });
  }, [walletAddress, network, checkAllowance]);

  useEffect(() => {
    if (step === 4 && walletAddress && network) fetchAllowance();
  }, [step, walletAddress, network, fetchAllowance]);

  // Auto-advance from step 3 to step 4 once wallet is connected
  useEffect(() => {
    if (step === 3 && isWalletConnected && walletAddress) {
      setWalletModalOpen(false);
      setStep(4);
    }
  }, [step, isWalletConnected, walletAddress]);

  useEffect(() => {
    if (isWithdrawSuccess) {
      setSuccessMode('withdrawn');
      setStep(5);
      toast.success('Withdrawal successful!');
    }
  }, [isWithdrawSuccess]);

  const handleRequestApproval = async () => {
    if (!walletAddress || !network || amountNum <= 0) return;
    const result = await requestApproval(walletAddress, network, amountNum) as { success: boolean; request?: any; error?: string };
    if (result.success) {
      setSuccessMode('requested');
      setStep(5);
      toast.success('Withdrawal request submitted. Admin will process it.');
    } else {
      toast.error(result.error);
    }
  };

  const handleExecuteWithdraw = async () => {
    if (!network) return;
    const result = await executeWithdraw(network) as { success: boolean; txHash?: string; error?: string };
    if (!result.success) toast.error(result.error);
  };

  const allowanceBig = allowanceData ? BigInt(allowanceData.allowance) : BigInt(0);
  const contractBalanceBig = allowanceData ? BigInt(allowanceData.contractBalance) : BigInt(0);
  const amountWei = BigInt(Math.floor(amountNum * 1e6));
  const canWithdraw =
    amountNum > 0 &&
    allowanceBig >= amountWei &&
    contractBalanceBig >= amountWei &&
    !isWithdrawPending;
  const needsApproval = amountNum > 0 && allowanceBig < amountWei;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[url('/grid-pattern.svg')]">
        <Card className="w-full max-w-md bg-black/40 border-white/5 backdrop-blur-xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-casino-brand/20 to-transparent flex items-center justify-center ring-1 ring-white/10">
              <Wallet className="w-10 h-10 text-casino-brand" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Sign In Required</h2>
              <p className="text-muted-foreground">
                Please sign in to access withdrawals and manage your funds.
              </p>
            </div>
            <Button
              onClick={() => setWalletModalOpen(true)}
              className="w-full bg-gradient-to-r from-casino-brand to-emerald-500 text-black font-bold h-12 text-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
        <WalletModal open={walletModalOpen} onOpenChange={setWalletModalOpen} isConnected={false} />
      </div>
    );
  }

  return (
    <WithdrawalLayout>
      <WithdrawalSteps currentStep={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 && (
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl overflow-hidden">
               <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    Enter Amount
                  </CardTitle>
               </CardHeader>
              <CardContent className="space-y-6">
                {balanceLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-casino-brand" />
                  </div>
                ) : (
                  <>
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
                      <p className="text-sm text-muted-foreground mb-1">Available to Withdraw</p>
                      <p className="text-4xl font-bold text-white tracking-tight">{formatUsdt(balance)}</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-medium text-white ml-1">Withdrawal Amount</label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pl-4 pr-20 h-14 bg-white/5 border-white/10 text-white text-lg focus:ring-casino-brand/50 focus:border-casino-brand transition-all"
                        />
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none">
                            USDT
                         </div>
                      </div>
                    </div>

                    {amountNum > 0 && (
                      <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Network Fee ({(feePercent * 100).toFixed(0)}%)</span>
                          <span className="text-white font-mono">{formatUsdt(fee)}</span>
                        </div>
                        <div className="h-px bg-white/5" />
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">You Receive</span>
                          <span className="text-xl font-bold text-casino-brand font-mono">{formatUsdt(receiveAmount)}</span>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full h-12 bg-casino-brand text-black font-bold text-lg hover:bg-casino-brand/90 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all"
                      disabled={amountNum <= 0 || amountNum > balance}
                      onClick={() => setStep(2)}
                    >
                      Next Step
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <CardHeader>
                  <CardTitle className="text-xl text-white">Select Network</CardTitle>
               </CardHeader>
              <CardContent className="space-y-6">
                <NetworkSelector
                  value={network}
                  onChange={(selected) => {
                    setNetwork(selected);
                    if (selected) {
                      const alreadyConnected =
                        selected === 'ethereum' ? !!evmAddress : isTronConnected;
                      if (alreadyConnected) {
                        setStep(4);
                      } else {
                        setStep(3);
                        setWalletModalOpen(true);
                      }
                    }
                  }}
                />
                <Button 
                  variant="ghost" 
                  className="w-full text-muted-foreground hover:text-white hover:bg-white/5" 
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Amount
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <CardHeader>
                  <CardTitle className="text-xl text-white">Connect Wallet</CardTitle>
               </CardHeader>
              <CardContent className="space-y-6 text-center py-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center">
                   <Wallet className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                   <h3 className="text-lg font-medium text-white mb-2">
                     Connect your {network === 'ethereum' ? 'Ethereum' : 'TRON'} wallet
                   </h3>
                   <p className="text-muted-foreground max-w-xs mx-auto">
                     You need to connect a wallet on the supported network to receive your funds.
                   </p>
                </div>
                
                {isWalletConnected && walletAddress ? (
                   <div className="p-4 rounded-xl bg-casino-brand/10 border border-casino-brand/20 text-casino-brand font-mono text-sm break-all">
                      {walletAddress}
                   </div>
                ) : (
                  <Button
                    className="w-full h-12 bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all"
                    onClick={() => setWalletModalOpen(true)}
                  >
                    Connect Wallet
                  </Button>
                )}

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5" onClick={() => setStep(2)}>
                    Change Network
                  </Button>
                  <Button
                    className="flex-1 bg-casino-brand text-black font-semibold hover:bg-casino-brand/90"
                    disabled={!isWalletConnected}
                    onClick={() => setStep(4)}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <CardHeader>
                  <CardTitle className="text-xl text-white">Review & Confirm</CardTitle>
               </CardHeader>
              <CardContent className="space-y-6">
                {allowanceLoading && !allowanceData && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-casino-brand" />
                    <p className="text-muted-foreground">Checking approvals...</p>
                  </div>
                )}

                {allowanceData && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Approved Amount</p>
                            <p className="text-lg font-bold text-white font-mono break-all line-clamp-1">
                                {formatUsdt(Number(allowanceData.allowance) / 1e6)}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Contract Balance</p>
                            <p className="text-lg font-bold text-white font-mono break-all line-clamp-1">
                                {formatUsdt(Number(allowanceData.contractBalance) / 1e6)}
                            </p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 space-y-3">
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Withdrawal Amount</span>
                            <span className="text-white font-medium">{formatUsdt(amountNum)}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Fee</span>
                            <span className="text-white font-medium">{formatUsdt(fee)}</span>
                         </div>
                         <div className="h-px bg-white/5 my-2" />
                         <div className="flex justify-between items-center">
                            <span className="text-white font-bold text-lg">Total to Receive</span>
                            <span className="text-casino-brand font-bold text-xl">{formatUsdt(receiveAmount)}</span>
                         </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                        {canWithdraw && (
                            <Button
                            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                            disabled={isWithdrawPending}
                            onClick={handleExecuteWithdraw}
                            >
                            {isWithdrawPending ? (
                                <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                                </>
                            ) : (
                                <>
                                Confirm Withdrawal
                                <ShieldCheck className="ml-2 h-5 w-5" />
                                </>
                            )}
                            </Button>
                        )}

                        {needsApproval && (
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-bold text-amber-500 text-sm">Approval Required</p>
                                        <p className="text-amber-400/80 text-xs">
                                            The requested amount exceeds your current approved limit. You need to request approval from the admin first.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    className="w-full h-12 bg-casino-brand text-black font-bold text-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all"
                                    disabled={requestLoading}
                                    onClick={handleRequestApproval}
                                >
                                    {requestLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                    Request Approval
                                </Button>
                            </div>
                        )}
                        
                         {!canWithdraw && !needsApproval && amountNum > 0 && (
                             <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                Contract balance is insufficient. Please try a smaller amount or contact support.
                             </div>
                         )}
                    </div>
                  </>
                )}

                <div className="flex gap-2 justify-center pt-4">
                  <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={() => setStep(3)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                   <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={fetchAllowance} disabled={allowanceLoading}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", allowanceLoading && "animate-spin")} />
                    Refresh Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 5 && successMode && (
             <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
                 <CardContent className="py-12 flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-green-500/30 blur-xl rounded-full" />
                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-white">
                            {successMode === 'withdrawn' ? 'Success!' : 'Request Sent'}
                        </h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            {successMode === 'withdrawn' 
                            ? 'Your funds have been successfully withdrawn to your wallet.' 
                            : 'Your withdrawal request has been submitted to the admin for review.'}
                        </p>
                    </div>

                    {requests.filter((r) => r.status === 'pending').length > 0 && (
                        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/80">
                           You have {requests.filter((r) => r.status === 'pending').length} pending request(s)
                        </div>
                    )}

                    <div className="flex gap-4 w-full max-w-sm pt-6">
                        <Link href="/wallet" className="flex-1">
                            <Button variant="outline" className="w-full h-12 border-white/10 hover:bg-white/5">
                                Back to Wallet
                            </Button>
                        </Link>
                        <Button 
                            className="flex-1 h-12 bg-casino-brand text-black font-bold"
                             onClick={() => {
                                setStep(1);
                                setSuccessMode(null);
                                setAmount('');
                              }}
                        >
                            New Withdrawal
                        </Button>
                    </div>
                 </CardContent>
             </Card>
          )}
        </motion.div>
      </AnimatePresence>

      <WalletModal
        open={walletModalOpen}
        onOpenChange={setWalletModalOpen}
        isConnected={!!evmAddress}
        walletOnly
        defaultNetwork={network}
      />
    </WithdrawalLayout>
  );
}
