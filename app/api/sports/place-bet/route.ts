/**
 * Sports Bet Placement API Route
 * POST /api/sports/place-bet
 * 
 * Handles single and parlay bet placement with:
 * - User authentication
 * - Balance validation and deduction
 * - 5% house edge on potential profit
 * - Database record creation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromToken,
  getBalance,
  updateBalance,
  checkRateLimit,
} from '@/lib/game-utils';
import { supabaseAdmin } from '@/lib/supabase-admin';

const HOUSE_EDGE = 0.05; // 5% fee on potential profit

interface BetSelection {
  eventId: string;
  eventName: string;
  market: string; // 'h2h' | 'spreads' | 'totals'
  selection: string; // Team name or 'Over'/'Under'
  odds: number;
  point?: number; // For spreads and totals
}

interface PlaceBetRequest {
  betType: 'single' | 'parlay';
  selections: BetSelection[];
  stakes: number[]; // For singles: stake per selection; For parlay: single stake
}

interface SportsBetRecord {
  user_id: string;
  event_id: string;
  event_name: string;
  market_type: string;
  selection: string;
  odds: number;
  stake: number;
  bet_fee: number;
  potential_payout: number;
  status: 'pending' | 'won' | 'lost' | 'void' | 'cashed_out';
  parlay_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const { userId, error: authError } = await getUserFromToken(authHeader);
    if (authError) {
      return NextResponse.json({ error: authError, success: false }, { status: 401 });
    }

    // Rate limit check
    const { allowed, error: rateLimitError } = await checkRateLimit(userId);
    if (!allowed) {
      return NextResponse.json({ error: rateLimitError, success: false }, { status: 429 });
    }

    // Parse request
    const body: PlaceBetRequest = await request.json();
    const { betType, selections, stakes } = body;

    // Validate request
    if (!selections || selections.length === 0) {
      return NextResponse.json({ error: 'No selections provided', success: false }, { status: 400 });
    }

    if (!stakes || stakes.length === 0) {
      return NextResponse.json({ error: 'No stake amounts provided', success: false }, { status: 400 });
    }

    // Validate stakes are positive
    for (const stake of stakes) {
      if (stake <= 0) {
        return NextResponse.json({ error: 'Stake must be greater than 0', success: false }, { status: 400 });
      }
    }

    // Get user balance
    const { balance, error: balanceError } = await getBalance(userId);
    if (balanceError) {
      return NextResponse.json({ error: balanceError, success: false }, { status: 400 });
    }

    // Calculate total stake
    const totalStake = betType === 'parlay' 
      ? stakes[0] 
      : stakes.reduce((sum, s) => sum + s, 0);

    // Check sufficient balance
    if (balance < totalStake) {
      return NextResponse.json({ 
        error: `Insufficient balance. Required: $${totalStake.toFixed(2)}, Available: $${balance.toFixed(2)}`, 
        success: false 
      }, { status: 400 });
    }

    // Calculate potential payouts and fees
    let betsToInsert: SportsBetRecord[] = [];
    let totalPotentialPayout = 0;
    let totalFees = 0;
    const parlayId = betType === 'parlay' ? crypto.randomUUID() : undefined;

    if (betType === 'single') {
      // Process single bets
      selections.forEach((sel, index) => {
        const stake = stakes[index] || stakes[0];
        const potentialPayout = stake * sel.odds;
        const profit = potentialPayout - stake;
        const betFee = profit * HOUSE_EDGE;
        
        totalPotentialPayout += potentialPayout - betFee;
        totalFees += betFee;

        betsToInsert.push({
          user_id: userId,
          event_id: sel.eventId,
          event_name: sel.eventName,
          market_type: sel.market,
          selection: sel.point ? `${sel.selection} (${sel.point > 0 ? '+' : ''}${sel.point})` : sel.selection,
          odds: sel.odds,
          stake: stake,
          bet_fee: betFee,
          potential_payout: potentialPayout - betFee,
          status: 'pending',
        });
      });
    } else {
      // Process parlay bet
      const combinedOdds = selections.reduce((acc, sel) => acc * sel.odds, 1);
      const stake = stakes[0];
      const potentialPayout = stake * combinedOdds;
      const profit = potentialPayout - stake;
      const betFee = profit * HOUSE_EDGE;
      
      totalPotentialPayout = potentialPayout - betFee;
      totalFees = betFee;

      // Create a single parlay record with all selections in the event_name
      const parlaySelections = selections.map(s => 
        s.point ? `${s.selection} (${s.point > 0 ? '+' : ''}${s.point})` : s.selection
      ).join(' + ');
      
      const eventNames = selections.map(s => s.eventName).join(' | ');

      betsToInsert.push({
        user_id: userId,
        event_id: selections.map(s => s.eventId).join(','),
        event_name: eventNames,
        market_type: 'parlay',
        selection: parlaySelections,
        odds: combinedOdds,
        stake: stake,
        bet_fee: betFee,
        potential_payout: totalPotentialPayout,
        status: 'pending',
        parlay_id: parlayId,
      });
    }

    // Deduct balance
    const newBalance = balance - totalStake;
    const { error: updateError } = await updateBalance(userId, newBalance);
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update balance', success: false }, { status: 500 });
    }

    // Insert bet records
    const { data: insertedBets, error: insertError } = await supabaseAdmin
      .from('sports_bets')
      .insert(betsToInsert)
      .select('id');

    if (insertError) {
      // Refund on failure
      await updateBalance(userId, balance);
      console.error('Failed to insert sports bet:', insertError);
      return NextResponse.json({ error: 'Failed to place bet', success: false }, { status: 500 });
    }

    // Create transaction record
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'sports_bet',
        amount: -totalStake,
        description: betType === 'parlay' 
          ? `Parlay bet on ${selections.length} selections` 
          : `${selections.length} sports bet(s)`,
      });

    return NextResponse.json({
      success: true,
      betIds: insertedBets?.map(b => b.id) || [],
      betType,
      selectionsCount: selections.length,
      totalStake,
      totalFees,
      potentialPayout: totalPotentialPayout,
      newBalance,
    });

  } catch (error: any) {
    console.error('Sports bet placement error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error', 
      success: false 
    }, { status: 500 });
  }
}
