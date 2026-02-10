import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/game-utils';
import { supabaseAdmin } from '@/lib/supabase-admin';

const WELCOME_BONUS_AMOUNT = 10; // $10 welcome bonus

export async function POST(request: NextRequest) {
  console.log('[Deposit API] Request received');
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const { userId, error: authError } = await getUserFromToken(authHeader);
    
    if (authError || !userId) {
      console.error('[Deposit API] Auth error:', authError);
      return NextResponse.json({ error: authError || 'Unauthorized', success: false }, { status: 401 });
    }

    const body = await request.json();
    console.log('[Deposit API] Payload:', body);
    const { txHash, amount, tokenAddress, network } = body;

    if (!txHash || !amount || !tokenAddress) {
      console.error('[Deposit API] Missing fields:', { txHash, amount, tokenAddress });
      return NextResponse.json({ error: 'Missing required fields', success: false }, { status: 400 });
    }

    console.log('[Deposit API] Processing deposit:', { userId, txHash, amount, network });

    // Check if transaction already exists (could be processed by webhook)
    const { data: existingTx } = await supabaseAdmin
      .from('transactions')
      .select('id, metadata')
      .eq('tx_hash', txHash)
      .maybeSingle();

    const transactionAlreadyExists = !!existingTx;
    console.log('[Deposit API] Transaction exists:', transactionAlreadyExists, existingTx?.metadata);

    // Check if this is user's first deposit (for welcome bonus)
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('first_deposit_at, welcome_bonus_status')
      .eq('id', userId)
      .single();

    const isFirstDeposit = !userData?.first_deposit_at;

    // Check welcome bonus eligibility
    const bonusStatus = userData?.welcome_bonus_status;
    const bonusEligible = bonusStatus !== 'credited';
    
    let bonusCredited = false;
    
    console.log('[Deposit API DEBUG] Eligibility Check:', { 
        userId,
        userData: userData,
        isFirstDeposit,
        bonusStatus,
        bonusEligible,
        transactionAlreadyExists
    });

    // 1. Record Deposit Transaction (only if not already recorded by webhook)
    if (!transactionAlreadyExists) {
      const { error: txError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount: Number(amount),
          tx_hash: txHash,
          metadata: { 
              token: tokenAddress,
              network: network || 'ethereum',
              timestamp: new Date().toISOString(),
              source: 'api'
          },
          game_type: 'wallet'
        });

      if (txError) {
        console.error('[Deposit API] Error recording transaction:', txError);
        return NextResponse.json({ error: 'Database error', success: false }, { status: 500 });
      }
    }

    // 2. Determine bonus applicability
    if (bonusEligible) {
      console.log('[Deposit API] User eligible for welcome bonus, adding $' + WELCOME_BONUS_AMOUNT);
      bonusCredited = true;
    }

    // 3. Update Balance
    // If transaction was already processed by webhook, only add bonus (webhook already added deposit)
    // If new transaction, add deposit + bonus
    const depositAmount = transactionAlreadyExists ? 0 : Number(amount);
    const bonusAmount = bonusCredited ? WELCOME_BONUS_AMOUNT : 0;
    const totalCredit = depositAmount + bonusAmount;
    
    console.log('[Deposit API] Updating balance. Deposit:', depositAmount, 'Bonus:', bonusAmount, 'Total:', totalCredit);
    
    // If nothing to credit (transaction already processed, bonus already credited), just return success
    if (totalCredit === 0) {
      console.log('[Deposit API] No credits to add (tx already processed, bonus already credited)');
      
      // Get current balance to return
      const { data: currentBalance } = await supabaseAdmin
        .from('balances')
        .select('amount')
        .eq('user_id', userId)
        .maybeSingle();
      
      return NextResponse.json({ 
        success: true, 
        balance: Number(currentBalance?.amount) || 0,
        bonusCredited: false,
        bonusAmount: 0,
        message: 'Transaction already processed'
      });
    }

    // Record bonus transaction if bonus is being credited
    if (bonusCredited) {
      await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'bonus',
          amount: WELCOME_BONUS_AMOUNT,
          tx_hash: null,
          metadata: { 
              type: 'welcome_bonus',
              related_deposit_tx: txHash,
              timestamp: new Date().toISOString()
          },
          game_type: 'wallet'
        });
      console.log('[Deposit API] Recorded bonus transaction');
    }

    // Check if balance record exists
    const { data: balanceRecord, error: fetchError } = await supabaseAdmin
      .from('balances')
      .select('amount')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (fetchError) {
        console.error('[Deposit API] Error fetching balance:', fetchError);
    }

    let newBalance = 0;
    let balanceError = null;

    if (balanceRecord) {
       const currentAmount = Number(balanceRecord.amount) || 0;
       newBalance = currentAmount + totalCredit;
       console.log('[Deposit API] Existing balance:', currentAmount, 'New balance:', newBalance);
       
       const { error } = await supabaseAdmin
         .from('balances')
         .update({ amount: newBalance, updated_at: new Date().toISOString() })
         .eq('user_id', userId);
        balanceError = error;
    } else {
       newBalance = totalCredit;
       console.log('[Deposit API] Creating new balance record:', newBalance);
       const { error } = await supabaseAdmin
         .from('balances')
         .insert({ user_id: userId, amount: newBalance });
        balanceError = error;
    }

    if (balanceError) {
      console.error('[Deposit API] Error updating balance:', balanceError);
      return NextResponse.json({ error: 'Balance update failed', success: false }, { status: 500 });
    }

    console.log('[Deposit API] Success. New balance:', newBalance);

    // 4. Check if we need to update user status (AFTER balance success)
    if (bonusCredited) {
       // Update user record with first deposit and bonus status
      const { error: userUpdateError } = await supabaseAdmin
        .from('users')
        .update({
          first_deposit_at: new Date().toISOString(),
          welcome_bonus_status: 'credited',
          welcome_bonus_credited_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (userUpdateError) {
        console.error('[Deposit API] Error updating user bonus status:', userUpdateError);
      }
    } else if (isFirstDeposit) {
      await supabaseAdmin
        .from('users')
        .update({ first_deposit_at: new Date().toISOString() })
        .eq('id', userId);
    }

    return NextResponse.json({ 
      success: true, 
      balance: newBalance,
      bonusCredited: bonusCredited,
      bonusAmount: bonusCredited ? WELCOME_BONUS_AMOUNT : 0
    });

  } catch (error: any) {
    console.error('[Deposit API] Deposit API error:', error);
    return NextResponse.json({ error: error.message || 'Server error', success: false }, { status: 500 });
  }
}
