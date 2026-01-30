import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { owner_address, contract_address, parameter } = body;

        if (!owner_address || !contract_address || !parameter) {
            return NextResponse.json({ error: 'Missing Tron parameters' }, { status: 400 });
        }

        const tronGridUrl = 'https://api.trongrid.io/wallet/triggerconstantcontract';
        
        const payload = {
            owner_address,
            contract_address,
            function_selector: 'balanceOf(address)',
            parameter,
            visible: true
        };

        const response = await fetch(tronGridUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'TRON-PRO-API-KEY': process.env.TRON_API_KEY || '' // Optional if we have one
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
