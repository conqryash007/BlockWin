import { NextRequest, NextResponse } from 'next/server';
import { TronWeb } from 'tronweb';
import { getActiveTronConfig } from '@/lib/contracts';

export const dynamic = 'force-dynamic';

// Minimal ABI for allowance check
const ALLOWANCE_ABI = [{
  "constant": true,
  "inputs": [
    { "name": "owner", "type": "address" },
    { "name": "spender", "type": "address" }
  ],
  "name": "allowance",
  "outputs": [{ "name": "", "type": "uint256" }],
  "type": "function"
}];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const owner = searchParams.get('owner');
    const spender = searchParams.get('spender');
    const token = searchParams.get('token');

    if (!owner || !spender || !token) {
      return NextResponse.json({ error: 'Missing owner, spender, or token' }, { status: 400 });
    }

    const tronConfig = getActiveTronConfig();
    const tronWeb = new TronWeb({
      fullHost: tronConfig.fullHost,
      headers: process.env.TRON_API_KEY ? { 'TRON-PRO-API-KEY': process.env.TRON_API_KEY } : undefined,
    });
    
    // Set a default address for read-only calls
    tronWeb.setAddress(owner);

    const contract = tronWeb.contract(ALLOWANCE_ABI, token);
    const result = await contract.allowance(owner, spender).call();
    const allowance = result.toString();

    return NextResponse.json({ allowance });
  } catch (error: any) {
    console.error('Tron allowance GET error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch allowance' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { owner, spender, token } = body;

    if (!owner || !spender || !token) {
      return NextResponse.json({ error: 'Missing owner, spender, or token' }, { status: 400 });
    }

    const tronConfig = getActiveTronConfig();
    const tronWeb = new TronWeb({
      fullHost: tronConfig.fullHost,
      headers: process.env.TRON_API_KEY ? { 'TRON-PRO-API-KEY': process.env.TRON_API_KEY } : undefined,
    });

    // Set a default address for read-only calls
    tronWeb.setAddress(owner);

    const contract = tronWeb.contract(ALLOWANCE_ABI, token);
    const result = await contract.allowance(owner, spender).call();
    const allowance = result.toString();

    return NextResponse.json({ allowance });
  } catch (error: any) {
    console.error('Tron allowance POST error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch allowance' }, { status: 500 });
  }
}
