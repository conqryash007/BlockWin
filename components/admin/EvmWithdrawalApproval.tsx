'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { CONTRACTS, SUPPORTED_TOKENS } from '@/lib/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Users, CheckCircle2, Wallet, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface UserWithBalance {
  id: string;
  wallet_address: string;
  balance: number;
  usdtBalance: string;
  allowance: string;
  withdrawalAllowance: string;
  hasApproval: boolean;
  isUnlimited: boolean;
  selected: boolean;
  approvalAmount: string;
}

const UNLIMITED_THRESHOLD = BigInt(10) ** BigInt(30);

export function EvmWithdrawalApproval() {
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { writeContractAsync, isPending: isProcessing } = useWriteContract();
  const [users, setUsers] = useState<UserWithBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAll, setSelectedAll] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);
  const [commonAmount, setCommonAmount] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/evm-approvals');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch users');
      const formattedUsers: UserWithBalance[] = (data.users || []).map((user: any) => ({
        id: user.id,
        wallet_address: user.wallet_address,
        balance: user.platformBalance ?? 0,
        usdtBalance: user.balance ?? '0',
        allowance: user.allowance ?? '0',
        withdrawalAllowance: user.withdrawalAllowance ?? '0',
        hasApproval: user.hasApproval ?? false,
        isUnlimited: user.isUnlimited ?? false,
        selected: false,
        approvalAmount: '',
      }));
      setUsers(formattedUsers);
    } catch (err: any) {
      console.error('Error fetching EVM users:', err);
      toast.error(err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedAll(checked);
    setUsers((prev) => prev.map((u) => ({ ...u, selected: checked })));
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, selected: checked } : u)));
    const allSelected = users.every((u) => (u.id === userId ? checked : u.selected));
    setSelectedAll(allSelected);
  };

  const handleAmountChange = (userId: string, amount: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, approvalAmount: amount } : u)));
  };

  const casinoAddress = CONTRACTS.CasinoDeposit.address;
  const usdtAddress = SUPPORTED_TOKENS.USDT.address;

  const handleSingleApproval = async (user: UserWithBalance) => {
    const amt = user.approvalAmount ? parseFloat(user.approvalAmount) : 0;
    if (amt <= 0) {
      toast.error('Please enter a valid approval amount');
      return;
    }
    try {
      setTxSuccess(false);
      const amountWei = BigInt(Math.floor(amt * 1e6));
      await writeContractAsync({
        address: casinoAddress,
        abi: CONTRACTS.CasinoDeposit.abi,
        functionName: 'approveWithdrawal',
        args: [user.wallet_address as `0x${string}`, usdtAddress, amountWei],
      });
      toast.success('Withdrawal approval submitted!');
      setTxSuccess(true);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, selected: false, approvalAmount: '' } : u))
      );
      fetchUsers();
    } catch (err: any) {
      console.error('Approval error:', err);
      toast.error(err?.message || 'Failed to approve withdrawal');
    }
  };

  const handleBatchApproval = async () => {
    const common = commonAmount ? parseFloat(commonAmount) : 0;
    const selectedUsers = users.filter((u) => u.selected);
    const useCommon = common > 0 && selectedUsers.length > 0;
    const withAmounts: UserWithBalance[] = useCommon
      ? selectedUsers.map((u) => ({ ...u, approvalAmount: commonAmount }))
      : selectedUsers.filter((u) => u.approvalAmount && parseFloat(u.approvalAmount) > 0);

    if (withAmounts.length === 0) {
      toast.error(useCommon ? 'Enter a common amount and select users' : 'Select users and enter approval amounts');
      return;
    }
    if (withAmounts.length === 1) {
      await handleSingleApproval(withAmounts[0]);
      return;
    }
    try {
      setTxSuccess(false);
      const addresses = withAmounts.map((u) => u.wallet_address as `0x${string}`);
      const amounts = withAmounts.map((u) => BigInt(Math.floor(parseFloat(u.approvalAmount) * 1e6)));
      await writeContractAsync({
        address: casinoAddress,
        abi: CONTRACTS.CasinoDeposit.abi,
        functionName: 'batchApproveWithdrawals',
        args: [usdtAddress, addresses, amounts],
      });
      toast.success('Batch withdrawal approvals submitted!');
      setTxSuccess(true);
      setUsers((prev) => prev.map((u) => ({ ...u, selected: false, approvalAmount: '' })));
      setSelectedAll(false);
      setCommonAmount('');
      fetchUsers();
    } catch (err: any) {
      console.error('Batch approval error:', err);
      toast.error(err?.message || 'Failed to batch approve withdrawals');
    }
  };

  const selectedCount = users.filter((u) => u.selected).length;

  if (isLoading) {
    return (
      <Card className="bg-casino-panel border-white/5">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-casino-brand" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-casino-panel border-white/5">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-casino-brand" />
            <CardTitle>EVM Withdrawal Approvals</CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {selectedCount > 0 && (
              <Button
                variant="casino"
                onClick={handleBatchApproval}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Approve Selected ({selectedCount})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Approve on-chain withdrawal allowances for Ethereum users. Connected wallet must be the contract owner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isEvmConnected ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Wallet className="h-5 w-5 text-yellow-500" />
            <span className="text-yellow-400">Please connect your EVM admin wallet to approve withdrawals</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 p-3 rounded-lg mb-4 bg-casino-brand/10 border border-casino-brand/20">
              <Wallet className="h-4 w-4 text-casino-brand" />
              <span className="text-casino-brand text-sm">
                Connected: {evmAddress?.slice(0, 6)}...{evmAddress?.slice(-4)}
              </span>
            </div>
            {txSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg mb-4 bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-green-400">Transaction submitted successfully!</span>
              </div>
            )}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Common amount for selected (USDT):</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 100"
                value={commonAmount}
                onChange={(e) => setCommonAmount(e.target.value)}
                className="w-32 h-8 bg-background/50"
              />
              <span className="text-xs text-muted-foreground">Apply to all selected when batch approving</span>
            </div>
            <div className="rounded-md border border-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="w-12">
                      <Checkbox checked={selectedAll} onCheckedChange={handleSelectAll} />
                    </TableHead>
                    <TableHead>EVM Wallet Address</TableHead>
                    <TableHead>Platform Balance</TableHead>
                    <TableHead>USDT Balance (On-Chain)</TableHead>
                    <TableHead>Approval Status</TableHead>
                    <TableHead>Approved Withdrawal (USDT)</TableHead>
                    <TableHead>Approval Amount (USDT)</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No EVM users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => {
                      const allowanceBigInt = BigInt(user.allowance);
                      const withdrawalAllowanceBigInt = BigInt(user.withdrawalAllowance);
                      const usdtBalanceNum = Number(user.usdtBalance) / 1e6;
                      const formatAmount = (val: bigint | number) => {
                        if (typeof val === 'bigint') {
                          const n = Number(val) / 1e6;
                          return n > 1e15 ? '∞' : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
                        }
                        return val > 1e15 ? '∞' : val.toLocaleString(undefined, { maximumFractionDigits: 2 });
                      };
                      const approvalBadge = user.isUnlimited ? (
                        <Badge variant="outline" className="border-green-500/50 text-green-400">
                          Unlimited
                        </Badge>
                      ) : user.hasApproval ? (
                        <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                          Approved ({formatAmount(allowanceBigInt)})
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500/50 text-red-400">
                          Not Approved
                        </Badge>
                      );
                      return (
                        <TableRow key={user.id} className="border-white/5">
                          <TableCell>
                            <Checkbox
                              checked={user.selected}
                              onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs border-[#627EEA]/50 text-[#627EEA]">
                                ERC-20
                              </Badge>
                              {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-6)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-secondary/50">
                              ${user.balance.toFixed(2)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">{formatAmount(usdtBalanceNum)} USDT</span>
                          </TableCell>
                          <TableCell>{approvalBadge}</TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">
                              {formatAmount(withdrawalAllowanceBigInt)} USDT
                            </span>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder={commonAmount || 'Amount'}
                              value={user.approvalAmount}
                              onChange={(e) => handleAmountChange(user.id, e.target.value)}
                              className="w-32 h-8 bg-background/50"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSingleApproval(user)}
                              disabled={
                                !user.approvalAmount ||
                                parseFloat(user.approvalAmount) <= 0 ||
                                isProcessing
                              }
                              className="hover:text-casino-brand"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
