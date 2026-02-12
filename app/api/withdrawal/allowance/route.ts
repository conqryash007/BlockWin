import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/game-utils';
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { CONTRACTS } from '@/lib/contracts';

const EVM_CONFIG = {
  mainnet: {
    casinoDepositAddress: '0x82F1B70a42C38a645ce1Ea71ae1390d0dd6d49C4' as const,
    usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as const,
  },
  sepolia: {
    casinoDepositAddress: '0x2432E0a2c34C764449525269be6554Dce899340c' as const,
    usdt: '0x27D4F6456D51f6A1f943C1f599c36D2E4F5958aF' as const,
  },
};

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
  },
};

const isMainnet = () => process.env.NEXT_PUBLIC_NETWORK_ENV === 'mainnet';

function padAddress(hexAddress: string): string {
  const addr = hexAddress.startsWith('41') ? hexAddress.slice(2) : hexAddress.replace(/^0x/, '').slice(-40);
  return addr.padStart(64, '0');
}

function decodeUint256(hex: string): bigint {
  if (!hex || hex === '0x') return BigInt(0);
  return BigInt('0x' + hex.replace(/^0x/, ''));
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
    Accept: 'application/json',
  };
  if (apiKey) headers['TRON-PRO-API-KEY'] = apiKey;

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
  if (!res.ok) throw new Error(data.Error || data.message || `HTTP ${res.status}`);
  return data;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { userId, error: authError } = await getUserFromToken(authHeader);
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet_address');
    const network = searchParams.get('network')?.toLowerCase();

    if (!walletAddress || !network) {
      return NextResponse.json(
        { error: 'Missing wallet_address or network query params' },
        { status: 400 }
      );
    }
    if (network !== 'ethereum' && network !== 'tron') {
      return NextResponse.json({ error: 'Invalid network. Use ethereum or tron.' }, { status: 400 });
    }

    if (network === 'ethereum') {
      const config = isMainnet() ? EVM_CONFIG.mainnet : EVM_CONFIG.sepolia;
      const rpcUrl = isMainnet()
        ? process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'
        : process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo';
      const publicClient = createPublicClient({
        chain: isMainnet() ? mainnet : sepolia,
        transport: http(rpcUrl),
      });
      const address = walletAddress.startsWith('0x') ? (walletAddress as `0x${string}`) : (`0x${walletAddress}` as `0x${string}`);
      const [allowance, contractBalance] = await Promise.all([
        publicClient.readContract({
          address: config.casinoDepositAddress,
          abi: CONTRACTS.CasinoDeposit.abi,
          functionName: 'getWithdrawalAllowance',
          args: [address, config.usdt],
        }),
        publicClient.readContract({
          address: config.casinoDepositAddress,
          abi: CONTRACTS.CasinoDeposit.abi,
          functionName: 'getContractBalance',
          args: [config.usdt],
        }),
      ]);
      return NextResponse.json({
        allowance: allowance.toString(),
        contractBalance: contractBalance.toString(),
        decimals: 6,
      });
    }

    const tronNetwork = isMainnet() ? 'mainnet' : 'shasta';
    const config = TRON_CONFIG[tronNetwork];
    const apiKey = process.env.TRONGRID_API_KEY;
    const TronWebLib = require('tronweb');
    const TronWebConstructor = TronWebLib.TronWeb || TronWebLib.default || TronWebLib;
    const tronWeb = new TronWebConstructor({ fullHost: config.fullHost });
    const userHex = tronWeb.address.toHex(walletAddress);
    const usdtHex = tronWeb.address.toHex(config.usdt);
    const casinoHex = tronWeb.address.toHex(config.casinoDepositAddress);
    const callerHex = casinoHex;

    const allowanceParam = padAddress(userHex) + padAddress(usdtHex);
    const [allowanceRes, balanceRes] = await Promise.all([
      triggerConstantContract(
        config.fullHost,
        apiKey,
        casinoHex,
        'getWithdrawalAllowance(address,address)',
        allowanceParam,
        callerHex
      ),
      triggerConstantContract(
        config.fullHost,
        apiKey,
        casinoHex,
        'getContractBalance(address)',
        padAddress(usdtHex),
        callerHex
      ),
    ]);
    const allowance = decodeUint256(allowanceRes.constant_result?.[0] || '0x');
    const contractBalance = decodeUint256(balanceRes.constant_result?.[0] || '0x');
    return NextResponse.json({
      allowance: allowance.toString(),
      contractBalance: contractBalance.toString(),
      decimals: 6,
    });
  } catch (err: unknown) {
    console.error('[withdrawal/allowance]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
