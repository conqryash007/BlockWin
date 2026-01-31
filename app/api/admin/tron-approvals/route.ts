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
    
    console.log(`[TRON Approvals] Network: ${isMainnet() ? 'mainnet' : 'shasta'}`);
    console.log(`[TRON Approvals] Casino Contract: ${config.casinoDepositAddress}`);
    console.log(`[TRON Approvals] USDT Contract: ${config.usdt}`);
    console.log(`[TRON Approvals] API Key present: ${!!apiKey}`);
    
    // Initialize TronWeb for server-side contract calls
    const TronWebLib = require('tronweb');
    const TronWebConstructor = TronWebLib.TronWeb || TronWebLib.default || TronWebLib;
    
    const tronWeb = new TronWebConstructor({
      fullHost: config.fullHost,
      headers: apiKey ? { 'TRON-PRO-API-KEY': apiKey } : {}
    });
    
    const usersWithApprovals: any[] = [];
    const processedAddresses = new Set<string>();

    // Method 1: Use TronGrid REST API to fetch Approval events directly
    console.log('[TRON Approvals] Fetching Approval events via REST API...');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['TRON-PRO-API-KEY'] = apiKey;
    }

    try {
      // TronGrid v1 API endpoint for contract events
      // This fetches events from the USDT contract with event name "Approval"
      const eventsUrl = `${config.fullHost}/v1/contracts/${config.usdt}/events?event_name=Approval&only_confirmed=true&limit=200`;
      
      console.log(`[TRON Approvals] Fetching from: ${eventsUrl}`);
      
      const eventsResponse = await fetch(eventsUrl, { headers });
      const eventsData = await eventsResponse.json();
      
      console.log(`[TRON Approvals] API Response success: ${eventsData.success}`);
      console.log(`[TRON Approvals] Events found: ${eventsData.data?.length || 0}`);
      
      if (eventsData.success && eventsData.data) {
        for (const event of eventsData.data) {
          // TronGrid v1 API returns events in format:
          // { result: { owner: "...", spender: "...", value: "..." }, ... }
          const result = event.result || {};
          let owner = result.owner || result._owner || result['0'];
          let spender = result.spender || result._spender || result['1'];
          
          if (!owner || !spender) {
            console.log('[TRON Approvals] Event missing owner/spender:', JSON.stringify(result));
            continue;
          }
          
          // Convert hex addresses to base58 if needed
          if (owner.startsWith('41') || owner.startsWith('0x')) {
            owner = tronWeb.address.fromHex(owner.replace('0x', ''));
          }
          if (spender.startsWith('41') || spender.startsWith('0x')) {
            spender = tronWeb.address.fromHex(spender.replace('0x', ''));
          }
          
          // Check if this approval is for our casino contract
          if (spender !== config.casinoDepositAddress) {
            continue;
          }
          
          if (processedAddresses.has(owner)) continue;
          processedAddresses.add(owner);
          
          console.log(`[TRON Approvals] Found approval from: ${owner}`);
        }
      }
    } catch (eventErr: any) {
      console.error('[TRON Approvals] Failed to fetch events via REST:', eventErr?.message);
    }

    // Method 2: Also try TronWeb's getEventResult as fallback
    try {
      console.log('[TRON Approvals] Trying TronWeb getEventResult as fallback...');
      const events = await tronWeb.getEventResult(config.usdt, {
        eventName: 'Approval',
        size: 200,
        onlyConfirmed: true
      });
      
      console.log(`[TRON Approvals] TronWeb found ${events?.length || 0} events`);
      
      for (const event of events || []) {
        let spender = event.result?.spender || event.result?._spender;
        let owner = event.result?.owner || event.result?._owner;
        
        if (!spender || !owner) continue;
        
        // Convert hex to base58 if needed
        if (spender.startsWith('41')) {
          spender = tronWeb.address.fromHex(spender);
        }
        if (owner.startsWith('41')) {
          owner = tronWeb.address.fromHex(owner);
        }
        
        if (spender !== config.casinoDepositAddress) continue;
        
        if (!processedAddresses.has(owner)) {
          processedAddresses.add(owner);
          console.log(`[TRON Approvals] TronWeb found approval from: ${owner}`);
        }
      }
    } catch (err: any) {
      console.warn('[TRON Approvals] TronWeb getEventResult failed:', err?.message);
    }

    // Method 3: Check database users with uppercase addresses
    console.log('[TRON Approvals] Checking database users...');
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, wallet_address')
      .not('wallet_address', 'is', null)
      .or('wallet_address.like.T%,wallet_address.like.t%');
    
    console.log(`[TRON Approvals] Found ${users?.length || 0} TRON users in database`);
    
    for (const user of users || []) {
      let address = user.wallet_address;
      
      // Skip already processed
      if (processedAddresses.has(address)) continue;
      
      // For lowercase addresses, we can't use them directly
      // But add to processed set to check later
      if (address.startsWith('T')) {
        processedAddresses.add(address);
      }
    }

    console.log(`[TRON Approvals] Total unique addresses to check: ${processedAddresses.size}`);

    // Now check allowance for all collected addresses
    const usdtContract = await tronWeb.contract().at(config.usdt);
    
    for (const address of processedAddresses) {
      try {
        const allowanceResult = await usdtContract.allowance(address, config.casinoDepositAddress).call();
        const allowance = allowanceResult?.toString ? BigInt(allowanceResult.toString()) : BigInt(0);
        
        console.log(`[TRON Approvals] ${address}: allowance = ${allowance.toString()}`);
        
        if (allowance > BigInt(0)) {
          const balanceResult = await usdtContract.balanceOf(address).call();
          const balance = balanceResult?.toString ? BigInt(balanceResult.toString()) : BigInt(0);
          
          // Try to find user ID from database
          const dbUser = users?.find(u => 
            u.wallet_address === address || 
            u.wallet_address.toLowerCase() === address.toLowerCase()
          );
          
          usersWithApprovals.push({
            id: dbUser?.id || address,
            wallet_address: address,
            allowance: allowance.toString(),
            balance: balance.toString()
          });
          
          console.log(`[TRON Approvals] ✓ Added: ${address} with allowance ${allowance.toString()}`);
        }
      } catch (err: any) {
        console.warn(`[TRON Approvals] Failed to check ${address}:`, err?.message);
      }
    }

    console.log(`[TRON Approvals] Final result: ${usersWithApprovals.length} users with active approvals`);

    return NextResponse.json({ 
      users: usersWithApprovals,
      network: isMainnet() ? 'mainnet' : 'shasta',
      casinoContract: config.casinoDepositAddress,
      totalChecked: processedAddresses.size
    });

  } catch (error: any) {
    console.error('[TRON Approvals] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}
