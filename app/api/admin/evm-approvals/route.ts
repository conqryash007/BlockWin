import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createPublicClient, http, erc20Abi } from 'viem';
import { mainnet, sepolia } from 'viem/chains';

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

const isMainnet = () => process.env.NEXT_PUBLIC_NETWORK_ENV === 'mainnet';
const getConfig = () => isMainnet() ? EVM_CONFIG.mainnet : EVM_CONFIG.sepolia;

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
    
    // Fetch all EVM users from database
    const { data: users, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, wallet_address')
      .not('wallet_address', 'is', null)
      .like('wallet_address', '0x%');
    
    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const usersWithApprovals: any[] = [];

    // Check allowance for each user
    for (const user of users || []) {
      const address = user.wallet_address as `0x${string}`;
      
      try {
        const allowance = await publicClient.readContract({
          address: config.usdt,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [address, config.casinoDepositAddress]
        });
        
        if (allowance > BigInt(0)) {
          const balance = await publicClient.readContract({
            address: config.usdt,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address]
          });

          usersWithApprovals.push({
            id: user.id,
            wallet_address: address,
            allowance: allowance.toString(),
            balance: balance.toString()
          });
        }
      } catch (err: any) {
        console.warn(`Failed to check allowance for ${address}:`, err?.message);
      }
    }

    console.log(`Found ${usersWithApprovals.length} users with EVM USDT approvals`);

    return NextResponse.json({ 
      users: usersWithApprovals,
      network: isMainnet() ? 'mainnet' : 'sepolia',
      casinoContract: config.casinoDepositAddress
    });

  } catch (error: any) {
    console.error('Error fetching EVM approvals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}
