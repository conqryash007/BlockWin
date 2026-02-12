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
  ArrowUpFromLine,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePlatformBalance } from '@/hooks/usePlatformBalance';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { useWithdrawal, useWithdrawalRequests } from '@/hooks/useWithdrawal';
import { NetworkSelector } from '@/components/wallet/NetworkSelector';
import { WalletModal } from '@/components/wallet/WalletModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    if (isWithdrawSuccess) {
      setSuccessMode('withdrawn');
      setStep(5);
      toast.success('Withdrawal successful!');
    }
  }, [isWithdrawSuccess]);

  const handleRequestApproval = async () => {
    if (!walletAddress || !network || amountNum <= 0) return;
    const result = await requestApproval(walletAddress, network, amountNum);
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
    const result = await executeWithdraw(network);
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border-white/5">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-casino-brand/20 to-transparent flex items-center justify-center">
              <Wallet className="w-8 h-8 text-casino-brand" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to withdraw. You can then choose your network and wallet.
            </p>
            <Button
              onClick={() => setWalletModalOpen(true)}
              className="w-full bg-gradient-to-r from-casino-brand to-emerald-500 text-black font-bold hover:opacity-90"
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
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/wallet">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowUpFromLine className="w-6 h-6 text-casino-brand" />
            Withdraw
          </h1>
        </div>

        {balanceLoading && step === 1 && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-casino-brand" />
          </div>
        )}

        {!balanceLoading && step === 1 && (
          <Card className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border-white/5">
            <CardHeader>
              <CardTitle className="text-lg text-white">Withdrawable balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-2xl font-bold text-casino-brand">{formatUsdt(balance)}</p>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Amount to withdraw</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-background/50 border-white/10 text-white"
                />
              </div>
              {amountNum > 0 && (
                <div className="text-sm text-muted-foreground space-y-1 rounded-lg bg-white/5 p-3">
                  <div className="flex justify-between">
                    <span>Fee ({(feePercent * 100).toFixed(0)}%)</span>
                    <span>{formatUsdt(fee)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-white">
                    <span>You receive</span>
                    <span>{formatUsdt(receiveAmount)}</span>
                  </div>
                </div>
              )}
              <Button
                className="w-full bg-casino-brand text-black font-semibold hover:opacity-90"
                disabled={amountNum <= 0 || amountNum > balance}
                onClick={() => setStep(2)}
              >
                Next: Choose network
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border-white/5">
            <CardHeader>
              <CardTitle className="text-lg text-white">Choose network</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <NetworkSelector value={network} onChange={setNetwork} />
              <div className="flex gap-2">
                <Button variant="outline" className="border-white/10" onClick={() => setStep(1)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  className="flex-1 bg-casino-brand text-black font-semibold"
                  disabled={!network}
                  onClick={() => setStep(3)}
                >
                  Next: Connect wallet
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border-white/5">
            <CardHeader>
              <CardTitle className="text-lg text-white">Connect wallet</CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect your {network === 'ethereum' ? 'Ethereum' : 'TRON'} wallet to withdraw to.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {isWalletConnected && walletAddress ? (
                <div className="rounded-lg bg-casino-brand/10 border border-casino-brand/20 p-3 font-mono text-sm text-casino-brand break-all">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                </div>
              ) : (
                <Button
                  className="w-full bg-casino-brand text-black font-semibold"
                  onClick={() => setWalletModalOpen(true)}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect {network === 'ethereum' ? 'Ethereum' : 'TRON'} wallet
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="border-white/10" onClick={() => setStep(2)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  className="flex-1 bg-casino-brand text-black font-semibold"
                  disabled={!isWalletConnected}
                  onClick={() => setStep(4)}
                >
                  Next: Check approval
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border-white/5">
            <CardHeader>
              <CardTitle className="text-lg text-white">Approval & withdraw</CardTitle>
              <p className="text-sm text-muted-foreground">
                Approved amount is set by admin. If you need more, request approval and wait.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {allowanceLoading && !allowanceData && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-casino-brand" />
                </div>
              )}
              {allowanceData && (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Approved for this address</span>
                      <span className="text-white">
                        {formatUsdt(Number(allowanceData.allowance) / 1e6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contract balance</span>
                      <span className="text-white">
                        {formatUsdt(Number(allowanceData.contractBalance) / 1e6)}
                      </span>
                    </div>
                  </div>
                  {canWithdraw && (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                      disabled={isWithdrawPending}
                      onClick={handleExecuteWithdraw}
                    >
                      {isWithdrawPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Withdraw {formatUsdt(amountNum)}
                    </Button>
                  )}
                  {needsApproval && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Approved amount is less than your requested amount. Request more approval from admin.</span>
                      </div>
                      <Button
                        className="w-full bg-casino-brand text-black font-semibold"
                        disabled={requestLoading}
                        onClick={handleRequestApproval}
                      >
                        {requestLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Request approval for {formatUsdt(amountNum)}
                      </Button>
                    </div>
                  )}
                  {!canWithdraw && !needsApproval && amountNum > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Contract balance is insufficient for this withdrawal. Try a smaller amount or wait for admin to top up.
                    </p>
                  )}
                </>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="border-white/10" onClick={() => setStep(3)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button variant="ghost" onClick={fetchAllowance} disabled={allowanceLoading}>
                  {allowanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 5 && successMode && (
          <Card className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border-white/5">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {successMode === 'withdrawn' ? 'Withdrawal complete' : 'Request submitted'}
              </h2>
              <p className="text-muted-foreground">
                {successMode === 'withdrawn'
                  ? 'Funds have been sent to your wallet.'
                  : 'Admin will review and approve. Once approved, you can return here and click Withdraw to receive funds.'}
              </p>
              {requests.filter((r) => r.status === 'pending').length > 0 && (
                <p className="text-sm text-muted-foreground">
                  You have {requests.filter((r) => r.status === 'pending').length} pending request(s).
                </p>
              )}
              <div className="flex gap-2 justify-center">
                <Link href="/wallet">
                  <Button variant="outline" className="border-white/10">
                    Back to Wallet
                  </Button>
                </Link>
                <Button
                  className="bg-casino-brand text-black font-semibold"
                  onClick={() => {
                    setStep(1);
                    setSuccessMode(null);
                    setAmount('');
                  }}
                >
                  New withdrawal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <WalletModal
        open={walletModalOpen}
        onOpenChange={setWalletModalOpen}
        isConnected={!!evmAddress}
        walletOnly
      />
    </div>
  );
}
