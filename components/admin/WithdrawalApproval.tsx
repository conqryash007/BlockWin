'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { supabase } from '@/lib/supabase';
import { CONTRACTS, SUPPORTED_TOKENS } from '@/lib/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Users, AlertCircle, CheckCircle2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface UserWithBalance {
  id: string;
  wallet_address: string;
  balance: number;
  selected: boolean;
  approvalAmount: string;
}

export function WithdrawalApproval() {
  const { address, isConnected } = useAccount();
  const [users, setUsers] = useState<UserWithBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAll, setSelectedAll] = useState(false);
  
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch users with their balances
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          wallet_address,
          balances (amount)
        `)
        .not('wallet_address', 'is', null);

      if (error) throw error;

      const formattedUsers: UserWithBalance[] = (data || []).map((user: any) => ({
        id: user.id,
        wallet_address: user.wallet_address,
        balance: user.balances?.amount || 0,
        selected: false,
        approvalAmount: '',
      }));

      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (isTxSuccess) {
      toast.success('Withdrawal approval successful!');
      // Reset selections
      setUsers(prev => prev.map(u => ({ ...u, selected: false, approvalAmount: '' })));
      setSelectedAll(false);
    }
  }, [isTxSuccess]);

  useEffect(() => {
    if (writeError) {
      toast.error(`Transaction failed: ${writeError.message}`);
    }
  }, [writeError]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedAll(checked);
    setUsers(prev => prev.map(u => ({ ...u, selected: checked })));
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, selected: checked } : u
    ));
    
    // Update selectAll state
    const allSelected = users.every(u => u.id === userId ? checked : u.selected);
    setSelectedAll(allSelected);
  };

  const handleAmountChange = (userId: string, amount: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, approvalAmount: amount } : u
    ));
  };

  const handleSingleApproval = async (user: UserWithBalance) => {
    if (!user.approvalAmount || parseFloat(user.approvalAmount) <= 0) {
      toast.error('Please enter a valid approval amount');
      return;
    }

    try {
      const amountInWei = parseUnits(user.approvalAmount, SUPPORTED_TOKENS.USDT.decimals);
      
      writeContract({
        address: CONTRACTS.CasinoDeposit.address,
        abi: CONTRACTS.CasinoDeposit.abi,
        functionName: 'approveWithdrawal',
        args: [user.wallet_address as `0x${string}`, SUPPORTED_TOKENS.USDT.address, amountInWei],
      });
    } catch (err) {
      console.error('Approval error:', err);
      toast.error('Failed to initiate approval');
    }
  };

  const handleBatchApproval = async () => {
    const selectedUsers = users.filter(u => u.selected && u.approvalAmount && parseFloat(u.approvalAmount) > 0);
    
    if (selectedUsers.length === 0) {
      toast.error('Please select users and enter approval amounts');
      return;
    }

    if (selectedUsers.length === 1) {
      await handleSingleApproval(selectedUsers[0]);
      return;
    }

    try {
      const addresses = selectedUsers.map(u => u.wallet_address as `0x${string}`);
      const amounts = selectedUsers.map(u => parseUnits(u.approvalAmount, SUPPORTED_TOKENS.USDT.decimals));
      
      writeContract({
        address: CONTRACTS.CasinoDeposit.address,
        abi: CONTRACTS.CasinoDeposit.abi,
        functionName: 'batchApproveWithdrawals',
        args: [SUPPORTED_TOKENS.USDT.address, addresses, amounts],
      });
    } catch (err) {
      console.error('Batch approval error:', err);
      toast.error('Failed to initiate batch approval');
    }
  };

  const selectedCount = users.filter(u => u.selected).length;
  const isProcessing = isWritePending || isTxLoading;

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-casino-brand" />
            <CardTitle>Withdrawal Approvals</CardTitle>
          </div>
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
        <CardDescription>
          Approve on-chain withdrawal allowances for users. Connected wallet must be the contract owner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Wallet className="h-5 w-5 text-yellow-500" />
            <span className="text-yellow-400">Please connect your admin wallet to approve withdrawals</span>
          </div>
        ) : (
          <>
            {/* Transaction Status */}
            {txHash && (
              <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${isTxSuccess ? 'bg-green-500/10 border border-green-500/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                {isTxLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    <span className="text-blue-400">Transaction pending...</span>
                  </>
                ) : isTxSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-green-400">Transaction confirmed!</span>
                  </>
                ) : null}
              </div>
            )}

            <div className="rounded-md border border-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Wallet Address</TableHead>
                    <TableHead>Platform Balance</TableHead>
                    <TableHead>Approval Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} className="border-white/5">
                        <TableCell>
                          <Checkbox
                            checked={user.selected}
                            onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-secondary/50">
                            ${user.balance.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Amount"
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
                            disabled={!user.approvalAmount || parseFloat(user.approvalAmount) <= 0 || isProcessing}
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
                    ))
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
