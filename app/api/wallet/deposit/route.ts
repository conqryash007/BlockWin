import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/game-utils';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('[Deposit API] Received deposit request');
    
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const { userId, error: authError } = await getUserFromToken(authHeader);
    
    if (authError || !userId) {
      console.log('[Deposit API] Auth failed:', authError);
      return NextResponse.json({ error: authError || 'Unauthorized', success: false }, { status: 401 });
    }

    const body = await request.json();
    const { txHash, amount, tokenAddress, network } = body;

    console.log('[Deposit API] Request body:', { userId, txHash, amount: Number(amount), tokenAddress, network });

    if (!txHash || amount === undefined || amount === null || !tokenAddress) {
      console.log('[Deposit API] Missing required fields');
      return NextResponse.json({ error: 'Missing required fields', success: false }, { status: 400 });
    }

    const depositAmount = Number(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      console.log('[Deposit API] Invalid amount:', amount);
      return NextResponse.json({ error: 'Invalid deposit amount', success: false }, { status: 400 });
    }

    console.log('[Deposit API] Processing deposit:', { userId, txHash, amount: depositAmount, network });

    // Check if transaction already exists
    const { data: existingTx } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('tx_hash', txHash)
      .maybeSingle();

    if (existingTx) {
      console.log('[Deposit API] Transaction already processed:', txHash);
      return NextResponse.json({ error: 'Transaction already processed', success: false }, { status: 400 });
    }

    // 1. Record Transaction
    console.log('[Deposit API] Recording transaction...');
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount: depositAmount,
        tx_hash: txHash,
        metadata: { 
            token: tokenAddress,
            network: network || 'ethereum',
            timestamp: new Date().toISOString()
        },
        game_type: 'wallet'
      });

    if (txError) {
      console.error('[Deposit API] Error recording transaction:', txError);
      return NextResponse.json({ error: 'Database error: ' + txError.message, success: false }, { status: 500 });
    }
    console.log('[Deposit API] Transaction recorded successfully');

    // 2. Update Balance
    console.log('[Deposit API] Updating balance...');
    const { data: balanceRecord } = await supabaseAdmin
      .from('balances')
      .select('amount')
      .eq('user_id', userId)
      .maybeSingle();

    let newBalance = 0;
    let balanceError = null;

    if (balanceRecord) {
       const currentAmount = Number(balanceRecord.amount) || 0;
       newBalance = currentAmount + depositAmount;
       console.log('[Deposit API] Updating existing balance:', { currentAmount, depositAmount, newBalance });
       
       const { error } = await supabaseAdmin
         .from('balances')
         .update({ amount: newBalance, updated_at: new Date().toISOString() })
         .eq('user_id', userId);
        balanceError = error;
    } else {
       newBalance = depositAmount;
       console.log('[Deposit API] Creating new balance record:', { newBalance });
       
       const { error } = await supabaseAdmin
         .from('balances')
         .insert({ user_id: userId, amount: newBalance });
        balanceError = error;
    }

    if (balanceError) {
      console.error('[Deposit API] Error updating balance:', balanceError);
      return NextResponse.json({ error: 'Balance update failed: ' + balanceError.message, success: false }, { status: 500 });
    }

    console.log('[Deposit API] Deposit successful! New balance:', newBalance);
    return NextResponse.json({ 
      success: true, 
      balance: newBalance 
    });

  } catch (error: any) {
    console.error('Deposit API error:', error);
    return NextResponse.json({ error: error.message || 'Server error', success: false }, { status: 500 });
  }
}
