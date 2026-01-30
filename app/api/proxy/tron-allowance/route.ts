import { NextRequest, NextResponse } from 'next/server';
import { TronWeb } from 'tronweb';
import { getActiveTronConfig } from '@/lib/contracts';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, token, spender } = body;
    if (!address || !token || !spender) {
      return NextResponse.json(
        { error: 'Missing address, token, or spender' },
        { status: 400 }
      );
    }
    const tronConfig = getActiveTronConfig();
    const tronWeb = new TronWeb({
      fullHost: tronConfig.fullHost,
      headers: process.env.TRON_API_KEY
        ? { 'TRON-PRO-API-KEY': process.env.TRON_API_KEY }
        : undefined,
    });
    tronWeb.setAddress(address);
    const contract = await tronWeb.contract().at(token);
    const result = await contract.allowance(address, spender).call();
    const allowance = result?.toString ? result.toString() : '0';
    return NextResponse.json({ allowance });
  } catch (error: any) {
    console.error('Tron allowance POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch allowance' },
      { status: 500 }
    );
  }
}
