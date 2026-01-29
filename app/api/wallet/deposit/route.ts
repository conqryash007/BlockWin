import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/game-utils';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const { userId, error: authError } = await getUserFromToken(authHeader);
    
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized', success: false }, { status: 401 });
    }

    const body = await request.json();
    const { txHash, amount, tokenAddress, network } = body;

    if (!txHash || !amount || !tokenAddress) {
      return NextResponse.json({ error: 'Missing required fields', success: false }, { status: 400 });
    }

    console.log('Processing deposit:', { userId, txHash, amount, network });

    // TODO: Verify transaction on-chain (EVM/Tron)
    // For now, we trust the client's txHash but ensure uniqueness via DB constraint or check
    // Ideally, we would fetch the tx receipt here to confirm validation.

    // Check if transaction already exists
    const { data: existingTx } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('tx_hash', txHash)
      .maybeSingle();

    if (existingTx) {
      return NextResponse.json({ error: 'Transaction already processed', success: false }, { status: 400 });
    }

    // 1. Record Transaction
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount: Number(amount), // Ensure number
        tx_hash: txHash,
        metadata: { 
            token: tokenAddress,
            network: network || 'ethereum',
            timestamp: new Date().toISOString()
        },
        game_type: 'wallet' // Use 'wallet' as generic type
      });

    if (txError) {
      console.error('Error recording transaction:', txError);
      return NextResponse.json({ error: 'Database error', success: false }, { status: 500 });
    }

    // 2. Update Balance
    // Fetch current balance first to handle 'upsert' manually or use RPC if available
    // We will use a safe increment approach if possible, or simple read-update
    
    // Check if balance record exists
    const { data: balanceRecord } = await supabaseAdmin
      .from('balances')
      .select('amount')
      .eq('user_id', userId)
      .maybeSingle();

    let newBalance = 0;
    let balanceError = null;

    if (balanceRecord) {
       const currentAmount = Number(balanceRecord.amount) || 0;
       newBalance = currentAmount + Number(amount);
       
       const { error } = await supabaseAdmin
         .from('balances')
         .update({ amount: newBalance, updated_at: new Date().toISOString() })
         .eq('user_id', userId);
        balanceError = error;
    } else {
       newBalance = Number(amount);
       const { error } = await supabaseAdmin
         .from('balances')
         .insert({ user_id: userId, amount: newBalance });
        balanceError = error;
    }

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      // NOTE: Transaction was recorded but balance failed. 
      // In production, transaction should be wrapped in DB function.
      return NextResponse.json({ error: 'Balance update failed', success: false }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      balance: newBalance 
    });

  } catch (error: any) {
    console.error('Deposit API error:', error);
    return NextResponse.json({ error: error.message || 'Server error', success: false }, { status: 500 });
  }
}
