import { NextRequest, NextResponse } from 'next/server';
import { TronWeb } from 'tronweb';
import { getActiveTronConfig } from '@/lib/contracts';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txId } = body;
    
    if (!txId) {
      return NextResponse.json({ error: 'Missing txId' }, { status: 400 });
    }
    
    const tronConfig = getActiveTronConfig();
    const tronWeb = new TronWeb({
      fullHost: tronConfig.fullHost,
      headers: process.env.TRONGRID_API_KEY ? { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY } : undefined,
    });
    
    // Try to get transaction info
    try {
      const txInfo = await tronWeb.trx.getTransaction(txId);
      
      if (txInfo && txInfo.txID) {
        // Transaction exists on chain
        const ret = txInfo.ret?.[0];
        const contractRet = ret?.contractRet;
        
        // Get confirmation info
        let confirmed = false;
        try {
          const txInfoById = await tronWeb.trx.getTransactionInfo(txId);
          confirmed = txInfoById && Object.keys(txInfoById).length > 0;
        } catch {
          // Not confirmed yet
        }
        
        return NextResponse.json({ 
          exists: true,
          status: contractRet || 'PENDING',
          confirmed,
          txId: txInfo.txID,
        });
      }
      
      return NextResponse.json({ 
        exists: false, 
        status: 'NOT_FOUND',
        message: 'Transaction not found on chain yet' 
      });
      
    } catch (txError: any) {
      console.error('Error fetching transaction:', txError);
      
      // Transaction not found or error
      return NextResponse.json({ 
        exists: false, 
        status: 'NOT_FOUND',
        message: txError?.message || 'Transaction not found' 
      });
    }
    
  } catch (error: any) {
    console.error('Tron verify tx error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to verify transaction' }, { status: 500 });
  }
}
