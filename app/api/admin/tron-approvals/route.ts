import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// TRON configuration
const TRON_CONFIG = {
  mainnet: {
    fullHost: 'https://api.trongrid.io',
    casinoDepositAddress: 'TLvMnfDNjBwvabX1SXMC2DzegL897YJz11',
    usdt: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  },
  shasta: {
    fullHost: 'https://api.shasta.trongrid.io',
    casinoDepositAddress: 'TSemQAPrBNtFq99nhJWBfb7iY5DrNXstGU',
    usdt: 'TXRwfd4jqK9hLSAJjtgvZToodKgHfHiJEH',
  }
};

const isMainnet = () => process.env.NEXT_PUBLIC_NETWORK_ENV === 'mainnet';
const getConfig = () => isMainnet() ? TRON_CONFIG.mainnet : TRON_CONFIG.shasta;

export async function GET(request: NextRequest) {
  try {
    const config = getConfig();
    const apiKey = process.env.TRONGRID_API_KEY;
    
    // Initialize TronWeb for server-side contract calls
    const TronWebLib = require('tronweb');
    const TronWebConstructor = TronWebLib.TronWeb || TronWebLib.default || TronWebLib;
    
    const tronWeb = new TronWebConstructor({
      fullHost: config.fullHost,
      headers: apiKey ? { 'TRON-PRO-API-KEY': apiKey } : {}
    });
    
    const usersWithApprovals: any[] = [];
    const processedAddresses = new Set<string>();
    const usdtContract = await tronWeb.contract().at(config.usdt);

    // Method 1: Scan Approval events from USDT contract
    console.log('Scanning Approval events for casino contract:', config.casinoDepositAddress);
    try {
      const events = await tronWeb.getEventResult(config.usdt, {
        eventName: 'Approval',
        size: 200,
        onlyConfirmed: true
      });
      
      console.log(`Found ${events?.length || 0} total Approval events`);
      
      for (const event of events || []) {
        const spender = event.result?.spender || event.result?._spender;
        const owner = event.result?.owner || event.result?._owner;
        
        if (!spender || !owner) continue;
        
        // Convert hex to base58 if needed
        const spenderBase58 = spender.startsWith('41') 
          ? tronWeb.address.fromHex(spender) 
          : spender;
        
        // Check if this approval is for our casino contract
        if (spenderBase58 !== config.casinoDepositAddress) continue;
        
        const ownerBase58 = owner.startsWith('41') 
          ? tronWeb.address.fromHex(owner) 
          : owner;
        
        if (processedAddresses.has(ownerBase58)) continue;
        processedAddresses.add(ownerBase58);
        
        try {
          // Check current allowance (might have been revoked since event)
          const allowanceResult = await usdtContract.allowance(ownerBase58, config.casinoDepositAddress).call();
          const allowance = allowanceResult?.toString ? BigInt(allowanceResult.toString()) : BigInt(0);
          
          if (allowance > BigInt(0)) {
            const balanceResult = await usdtContract.balanceOf(ownerBase58).call();
            const balance = balanceResult?.toString ? BigInt(balanceResult.toString()) : BigInt(0);
            
            usersWithApprovals.push({
              id: ownerBase58,
              wallet_address: ownerBase58,
              allowance: allowance.toString(),
              balance: balance.toString(),
              source: 'event'
            });
          }
        } catch (err: any) {
          console.warn(`Failed to check allowance for ${ownerBase58}:`, err?.message);
        }
      }
    } catch (eventErr: any) {
      console.warn('Failed to fetch events:', eventErr?.message);
    }

    // Method 2: Also check database users with uppercase addresses
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, wallet_address')
      .not('wallet_address', 'is', null)
      .like('wallet_address', 'T%'); // Only uppercase TRON addresses
    
    for (const user of users || []) {
      const address = user.wallet_address;
      
      if (processedAddresses.has(address)) continue;
      processedAddresses.add(address);

      try {
        const allowanceResult = await usdtContract.allowance(address, config.casinoDepositAddress).call();
        const allowance = allowanceResult?.toString ? BigInt(allowanceResult.toString()) : BigInt(0);
        
        if (allowance > BigInt(0)) {
          const balanceResult = await usdtContract.balanceOf(address).call();
          const balance = balanceResult?.toString ? BigInt(balanceResult.toString()) : BigInt(0);

          usersWithApprovals.push({
            id: user.id,
            wallet_address: address,
            allowance: allowance.toString(),
            balance: balance.toString(),
            source: 'database'
          });
        }
      } catch (err: any) {
        console.warn(`Failed to check allowance for ${address}:`, err?.message);
      }
    }

    console.log(`Found ${usersWithApprovals.length} total users with TRON USDT approvals`);

    return NextResponse.json({ 
      users: usersWithApprovals,
      network: isMainnet() ? 'mainnet' : 'shasta',
      casinoContract: config.casinoDepositAddress
    });

  } catch (error: any) {
    console.error('Error fetching TRON approvals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}
