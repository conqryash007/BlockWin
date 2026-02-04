import { NextRequest, NextResponse } from 'next/server';
import { TronWeb } from 'tronweb';
import { getActiveTronConfig } from '@/lib/contracts';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const token = searchParams.get('token');
    if (!address || !token) {
      return NextResponse.json({ error: 'Missing address or token' }, { status: 400 });
    }
    const tronConfig = getActiveTronConfig();
    const tronWeb = new TronWeb({
      fullHost: tronConfig.fullHost,
      headers: process.env.TRON_API_KEY ? { 'TRON-PRO-API-KEY': process.env.TRON_API_KEY } : undefined,
    });
    tronWeb.setAddress(address);
    // Use minimal ABI to avoid fetching from network
    const abi = [{
      "constant": true,
      "inputs": [{"name": "who", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "", "type": "uint256"}],
      "type": "function"
    }];
    const contract = tronWeb.contract(abi, token);
    const result = await contract.balanceOf(address).call();
    const balance = result.toString();
    return NextResponse.json({ balance });
  } catch (error: any) {
    console.error('Tron balance GET error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch balance' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, token } = body;
    if (!address || !token) {
      return NextResponse.json({ error: 'Missing address or token' }, { status: 400 });
    }
    const tronConfig = getActiveTronConfig();
    const tronWeb = new TronWeb({
      fullHost: tronConfig.fullHost,
      headers: process.env.TRON_API_KEY ? { 'TRON-PRO-API-KEY': process.env.TRON_API_KEY } : undefined,
    });
    tronWeb.setAddress(address);
    // Use minimal ABI to avoid fetching from network (rate limits)
    const minParam = [{ type: 'address', value: address }];
    // Manually trigger constant contract call to avoid ABI fetch
    // USDT contract on Tron is standard TRC20
    
    // Method 1: Using contract() with manual ABI (cleaner)
    const abi = [{
      "constant": true,
      "inputs": [{"name": "who", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "", "type": "uint256"}],
      "type": "function"
    }];
    const contract = tronWeb.contract(abi, token);
    const result = await contract.balanceOf(address).call();
    const balance = result.toString();
    return NextResponse.json({ balance });
  } catch (error: any) {
    console.error('Tron balance POST error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch balance' }, { status: 500 });
  }
}
