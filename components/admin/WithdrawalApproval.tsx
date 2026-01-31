'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { supabase } from '@/lib/supabase';
import { getActiveTronConfig } from '@/lib/contracts';
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
  selected: boolean;
  approvalAmount: string;
}

// Helper to check if address is a TRON address (starts with T or t, case-insensitive)
const isTronAddress = (address: string): boolean => {
  return address && (address.startsWith('T') || address.startsWith('t')) && address.length === 34;
};

// Convert stored lowercase address to proper TRON Base58 format for display
const formatTronAddress = (address: string): string => {
  // If already uppercase, return as-is
  if (address.startsWith('T')) return address;
  // Convert first letter to uppercase for display (TRON addresses always start with T)
  return 'T' + address.slice(1);
};

export function WithdrawalApproval() {
  const { address: tronAddress, connected: isTronConnected } = useWallet();
  const [users, setUsers] = useState<UserWithBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAll, setSelectedAll] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch users with their balances - only TRON addresses (stored lowercase in DB, start with 't')
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          wallet_address,
          balances (amount)
        `)
        .not('wallet_address', 'is', null)
        .like('wallet_address', 't%');

      if (error) throw error;

      const formattedUsers: UserWithBalance[] = (data || [])
        .filter((user: any) => isTronAddress(user.wallet_address))
        .map((user: any) => ({
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
      setIsProcessing(true);
      setTxSuccess(false);
      
      const tronWeb = (window as any).tronWeb || (window as any).tronLink?.tronWeb;
      if (!tronWeb || !tronWeb.ready) {
        toast.error('TronLink wallet not detected or not ready');
        return;
      }

      const tronConfig = getActiveTronConfig();
      const casinoContract = await tronWeb.contract().at(tronConfig.casinoDepositAddress);
      
      // Convert amount to sun (USDT on TRON has 6 decimals)
      const amountInSun = Math.floor(parseFloat(user.approvalAmount) * 1e6);
      
      // Call approveWithdrawal on the CasinoDeposit contract
      // Use properly formatted TRON address (uppercase T)
      const tx = await casinoContract.approveWithdrawal(
        formatTronAddress(user.wallet_address),
        tronConfig.usdt,
        amountInSun
      ).send();

      console.log('Approval tx:', tx);
      toast.success('Withdrawal approval submitted!');
      setTxSuccess(true);
      
      // Reset this user's selection
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, selected: false, approvalAmount: '' } : u
      ));
    } catch (err: any) {
      console.error('Approval error:', err);
      toast.error(err.message || 'Failed to approve withdrawal');
    } finally {
      setIsProcessing(false);
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
      setIsProcessing(true);
      setTxSuccess(false);
      
      const tronWeb = (window as any).tronWeb || (window as any).tronLink?.tronWeb;
      if (!tronWeb || !tronWeb.ready) {
        toast.error('TronLink wallet not detected or not ready');
        return;
      }

      const tronConfig = getActiveTronConfig();
      const casinoContract = await tronWeb.contract().at(tronConfig.casinoDepositAddress);
      
      // Use properly formatted TRON addresses (uppercase T)
      const addresses = selectedUsers.map(u => formatTronAddress(u.wallet_address));
      const amounts = selectedUsers.map(u => Math.floor(parseFloat(u.approvalAmount) * 1e6));
      
      // Call batchApproveWithdrawals on the CasinoDeposit contract
      const tx = await casinoContract.batchApproveWithdrawals(
        tronConfig.usdt,
        addresses,
        amounts
      ).send();

      console.log('Batch approval tx:', tx);
      toast.success('Batch withdrawal approvals submitted!');
      setTxSuccess(true);
      
      // Reset selections
      setUsers(prev => prev.map(u => ({ ...u, selected: false, approvalAmount: '' })));
      setSelectedAll(false);
    } catch (err: any) {
      console.error('Batch approval error:', err);
      toast.error(err.message || 'Failed to batch approve withdrawals');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCount = users.filter(u => u.selected).length;

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
            <CardTitle>TRON Withdrawal Approvals</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={isLoading}
            >
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
          Approve on-chain withdrawal allowances for TRON users. Connected wallet must be the contract owner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isTronConnected ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Wallet className="h-5 w-5 text-yellow-500" />
            <span className="text-yellow-400">Please connect your TRON admin wallet to approve withdrawals</span>
          </div>
        ) : (
          <>
            {/* Connected Wallet Info */}
            <div className="flex items-center gap-2 p-3 rounded-lg mb-4 bg-casino-brand/10 border border-casino-brand/20">
              <Wallet className="h-4 w-4 text-casino-brand" />
              <span className="text-casino-brand text-sm">
                Connected: {tronAddress?.slice(0, 6)}...{tronAddress?.slice(-4)}
              </span>
            </div>

            {/* Transaction Success Status */}
            {txSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg mb-4 bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-green-400">Transaction submitted successfully!</span>
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
                    <TableHead>TRON Wallet Address</TableHead>
                    <TableHead>Platform Balance</TableHead>
                    <TableHead>Approval Amount (USDT)</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No TRON users found
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
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs border-red-500/50 text-red-400">
                              TRC-20
                            </Badge>
                            {formatTronAddress(user.wallet_address).slice(0, 8)}...{formatTronAddress(user.wallet_address).slice(-6)}
                          </div>
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
