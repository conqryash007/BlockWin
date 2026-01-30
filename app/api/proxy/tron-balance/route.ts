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
        // V8: Accept 'address' and 'token' (Base58) directly
        const { address, token } = body;

        // Fallback for old V6 payload if needed, but V8 simplifies it
        if (!address || !token) {
             // Check if old payload format
             if (body.owner_address && body.contract_address && body.parameter) {
                 // Forward legacy V6 payload directly
                 // ... (Legacy code omitted for brevity unless needed, but let's stick to V8 cleaner path)
             }
             return NextResponse.json({ error: 'Missing address or token' }, { status: 400 });
        }

        // Initialize Server-Side TronWeb (No private key needed for reading)
        const tronWeb = new TronWeb({
            fullHost: 'https://api.trongrid.io',
            headers: { 'TRON-PRO-API-KEY': process.env.TRON_API_KEY || '' }
        });

        // Convert to Hex on Server (Robust)
        const ownerHex = tronWeb.address.toHex(address);
        const tokenHex = tronWeb.address.toHex(token);

        if (!ownerHex || !tokenHex) {
            return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
        }

        const tronGridUrl = 'https://api.trongrid.io/wallet/triggerconstantcontract';
        
        const payload = {
            owner_address: ownerHex,
            contract_address: token, // API often accepts Base58 for contract, but hex is safer. Let's use Base58 for contract if that worked before, or usage. 
            // Actually, triggerConstantContract API docs say contract_address can be hex or base58.
            // But owner_address MUST be hex.
            // Let's use the toHex result for owner.
            
            function_selector: 'balanceOf(address)',
            parameter: '000000000000000000000000' + ownerHex.substring(2), // Pad to 64 chars
            visible: true
        };

        const response = await fetch(tronGridUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'TRON-PRO-API-KEY': process.env.TRON_API_KEY || ''
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Proxy Conversion Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
