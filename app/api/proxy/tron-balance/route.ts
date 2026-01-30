import { NextRequest, NextResponse } from 'next/server';
import * as TronWebLib from 'tronweb';

// Handle CJS/ESM interop for TronWeb
const TronWeb = (TronWebLib as any).default || TronWebLib;

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const token = searchParams.get('token');

    if (!address || !token) {
      return NextResponse.json({ error: 'Missing address or token' }, { status: 400 });
    }

    // Convert address to Hex (Tron format)
    // We assume the frontend passes Base58 or Hex. 
    // If it's Base58, we need to convert it. However, we don't have tronWeb here.
    // Ideally the frontend sends it in a format the usage expects, OR we treat it as opaque.
    // Using TronGrid 'triggerconstantcontract' we need Hex addresses usually (41...).
    
    // Simple Base58 to Hex is complex without a library. 
    // We will assume the frontend (which has TronWeb) sends us the HEX address.
    // OR we ask the frontend to send us the param string pre-calculated.
    
    // Let's rely on the frontend to send valid 'owner_address' and 'contract_address' in Hex 
    // if possible, but the hook currently has 'activeAddress' which is usually Base58.
    
    // REVISION: The frontend attempts Method 3 used `tronWeb.address.toHex()`. 
    // We should expect the FRONTEND to do the calc and send us the values, 
    // OR we just forward the payload.
    
    // Let's accept a POST to be flexible with payload
    return NextResponse.json({ error: 'Use POST method' }, { status: 405 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



// ... (GET method remains same/unused)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { address, token } = body;

        if (!address || !token) {
             return NextResponse.json({ error: 'Missing address or token' }, { status: 400 });
        }

        // Initialize Server-Side TronWeb
        const tronWeb = new TronWeb({
            fullHost: 'https://api.trongrid.io',
            headers: { 'TRON-PRO-API-KEY': process.env.TRON_API_KEY || '' }
        });
        
        // V9: Use High-Level API (official logic)
        // This automatically handles ABI encoding specifically for TRC20 'balanceOf'
        try {
            tronWeb.setAddress(address); // Set default address to avoid "owner_address" errors if any
            
            const contract = await tronWeb.contract().at(token);
            
            // Call balanceOf
            const result = await contract.balanceOf(address).call();
            
            // Result is normally a BigNumber object or string in standard TronWeb
            const balance = result.toString();
            
            return NextResponse.json({ 
                balance: balance,
                source: "V9_HighLevel"
            });
            
        } catch (innerError: any) {
            console.error('High-Level Call Error:', innerError);
            throw new Error('Contract call failed: ' + innerError.message);
        }

    } catch (error: any) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
