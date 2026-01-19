/**
 * Sports Bet Settlement API Route
 * POST /api/sports/settle-bet
 * 
 * Settles a single sports bet. Admin only.
 * 
 * Request body:
 * {
 *   betId: string;         // The bet ID to settle
 *   outcome: 'won' | 'lost' | 'void';  // Settlement outcome
 * }
 * 
 * For 'won': Credits user's balance with potential_payout
 * For 'lost': No balance change (stake already deducted)
 * For 'void': Refunds the original stake to user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromToken, getBalance, updateBalance } from '@/lib/game-utils';
import { supabaseAdmin } from '@/lib/supabase-admin';

type SettlementOutcome = 'won' | 'lost' | 'void';

interface SettleBetRequest {
  betId: string;
  outcome: SettlementOutcome;
}

interface SportsBet {
  id: string;
  user_id: string;
  event_id: string;
  event_name: string;
  market_type: string;
  selection: string;
  odds: number;
  stake: number;
  bet_fee: number;
  potential_payout: number;
  status: string;
  parlay_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin
    const authHeader = request.headers.get('authorization');
    const { userId: adminId, isAdmin, error: authError } = await getAdminFromToken(authHeader);
    
    if (authError || !isAdmin) {
      return NextResponse.json(
        { error: authError || 'Admin access required', success: false },
        { status: 403 }
      );
    }

    // Parse request
    const body: SettleBetRequest = await request.json();
    const { betId, outcome } = body;

    // Validate request
    if (!betId) {
      return NextResponse.json(
        { error: 'Bet ID is required', success: false },
        { status: 400 }
      );
    }

    if (!['won', 'lost', 'void'].includes(outcome)) {
      return NextResponse.json(
        { error: 'Invalid outcome. Must be "won", "lost", or "void"', success: false },
        { status: 400 }
      );
    }

    // Fetch the bet
    const { data: bet, error: fetchError } = await supabaseAdmin
      .from('sports_bets')
      .select('*')
      .eq('id', betId)
      .single();

    if (fetchError || !bet) {
      return NextResponse.json(
        { error: 'Bet not found', success: false },
        { status: 404 }
      );
    }

    const sportsBet = bet as SportsBet;

    // Check if already settled
    if (sportsBet.status !== 'pending') {
      return NextResponse.json(
        { error: `Bet already settled with status: ${sportsBet.status}`, success: false },
        { status: 400 }
      );
    }

    // Get user's current balance
    const { balance, error: balanceError } = await getBalance(sportsBet.user_id);
    if (balanceError) {
      return NextResponse.json(
        { error: 'Failed to fetch user balance', success: false },
        { status: 500 }
      );
    }

    // Calculate new balance based on outcome
    let newBalance = balance;
    let payoutAmount = 0;
    let transactionDescription = '';

    switch (outcome) {
      case 'won':
        payoutAmount = Number(sportsBet.potential_payout);
        newBalance = balance + payoutAmount;
        transactionDescription = `Won bet on ${sportsBet.selection} (${sportsBet.event_name})`;
        break;
      
      case 'lost':
        payoutAmount = 0;
        // No balance change - stake was already deducted
        transactionDescription = `Lost bet on ${sportsBet.selection} (${sportsBet.event_name})`;
        break;
      
      case 'void':
        // Refund the original stake
        payoutAmount = Number(sportsBet.stake);
        newBalance = balance + payoutAmount;
        transactionDescription = `Void/refunded bet on ${sportsBet.selection} (${sportsBet.event_name})`;
        break;
    }

    // Update user balance if needed
    if (outcome === 'won' || outcome === 'void') {
      const { error: updateError } = await updateBalance(sportsBet.user_id, newBalance);
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update user balance', success: false },
          { status: 500 }
        );
      }
    }

    // Update bet status
    const { error: updateBetError } = await supabaseAdmin
      .from('sports_bets')
      .update({
        status: outcome,
        settled_at: new Date().toISOString(),
      })
      .eq('id', betId);

    if (updateBetError) {
      // Rollback balance if bet update fails
      if (outcome === 'won' || outcome === 'void') {
        await updateBalance(sportsBet.user_id, balance);
      }
      return NextResponse.json(
        { error: 'Failed to update bet status', success: false },
        { status: 500 }
      );
    }

    // Create transaction record
    if (outcome === 'won' || outcome === 'void') {
      await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: sportsBet.user_id,
          type: outcome === 'won' ? 'sports_win' : 'sports_refund',
          amount: payoutAmount,
          description: transactionDescription,
        });
    }

    // Log admin action in audit_logs
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        admin_id: adminId,
        table_name: 'sports_bets',
        record_id: betId,
        action: 'settle_bet',
        old_value: { status: 'pending' },
        new_value: { 
          status: outcome, 
          payout: payoutAmount,
          settled_at: new Date().toISOString()
        },
      });

    return NextResponse.json({
      success: true,
      betId,
      outcome,
      payoutAmount,
      newBalance,
      message: `Bet settled successfully as ${outcome}`,
    });

  } catch (error: any) {
    console.error('Bet settlement error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

// GET - Fetch pending bets for settlement
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin
    const authHeader = request.headers.get('authorization');
    const { isAdmin, error: authError } = await getAdminFromToken(authHeader);
    
    if (authError || !isAdmin) {
      return NextResponse.json(
        { error: authError || 'Admin access required', success: false },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch bets with user info
    const { data: bets, error: fetchError, count } = await supabaseAdmin
      .from('sports_bets')
      .select(`
        *,
        users:user_id (
          wallet_address
        )
      `, { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch bets', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bets: bets || [],
      total: count || 0,
      limit,
      offset,
    });

  } catch (error: any) {
    console.error('Fetch bets error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
