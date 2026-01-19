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
  console.log('=== SPORTS BET PLACEMENT START ===');
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader, authHeader ? `(length: ${authHeader.length})` : '');
    
    const { userId, error: authError } = await getUserFromToken(authHeader);
    console.log('getUserFromToken result:', { userId: userId || 'EMPTY', authError: authError || 'NONE' });
    if (authError) {
      return NextResponse.json({ error: authError, success: false }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found', success: false }, { status: 401 });
    }

    // Verify user exists in users table (required for foreign key constraint)
    const { data: userCheck, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userCheckError || !userCheck) {
      console.error('User not found in users table:', { userId, error: userCheckError });
      return NextResponse.json({ 
        error: 'User account not found. Please ensure you are properly registered.', 
        success: false 
      }, { status: 404 });
    }

    // Rate limit check
    const { allowed, error: rateLimitError } = await checkRateLimit(userId);
    if (!allowed) {
      return NextResponse.json({ error: rateLimitError, success: false }, { status: 429 });
    }

    // Parse request
    const body: PlaceBetRequest = await request.json();
    const { betType, selections, stakes } = body;

    console.log('Received bet placement request:', {
      userId,
      betType,
      selectionsCount: selections?.length || 0,
      stakesCount: stakes?.length || 0,
      sampleSelection: selections?.[0],
    });

    // Validate request
    if (!selections || selections.length === 0) {
      return NextResponse.json({ error: 'No selections provided', success: false }, { status: 400 });
    }

    if (!stakes || stakes.length === 0) {
      return NextResponse.json({ error: 'No stake amounts provided', success: false }, { status: 400 });
    }

    // Validate each selection
    for (const sel of selections) {
      if (!sel.eventId || !sel.eventName || !sel.selection || !sel.odds || sel.odds <= 0) {
        console.error('Invalid selection:', sel);
        return NextResponse.json({ 
          error: `Invalid selection data: ${JSON.stringify(sel)}`, 
          success: false 
        }, { status: 400 });
      }
    }

    // Validate stakes are positive
    for (const stake of stakes) {
      if (!stake || stake <= 0) {
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
        const betFee = Math.max(0, profit * HOUSE_EDGE); // Ensure non-negative
        
        totalPotentialPayout += potentialPayout - betFee;
        totalFees += betFee;

        const betRecord: SportsBetRecord = {
          user_id: userId,
          event_id: sel.eventId || '',
          event_name: sel.eventName || '',
          market_type: sel.market || 'h2h',
          selection: sel.point ? `${sel.selection} (${sel.point > 0 ? '+' : ''}${sel.point})` : (sel.selection || ''),
          odds: Number(sel.odds) || 0,
          stake: Number(stake) || 0,
          bet_fee: Number(betFee) || 0,
          potential_payout: Number(potentialPayout - betFee) || 0,
          status: 'pending',
        };

        // Validate required fields
        if (!betRecord.event_id || !betRecord.event_name || !betRecord.selection) {
          console.error('Invalid bet record:', betRecord);
          throw new Error('Invalid bet data: missing required fields');
        }

        betsToInsert.push(betRecord);
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

      const parlayRecord: SportsBetRecord = {
        user_id: userId,
        event_id: selections.map(s => s.eventId || '').filter(Boolean).join(','),
        event_name: eventNames || '',
        market_type: 'parlay',
        selection: parlaySelections || '',
        odds: Number(combinedOdds) || 0,
        stake: Number(stake) || 0,
        bet_fee: Number(betFee) || 0,
        potential_payout: Number(totalPotentialPayout) || 0,
        status: 'pending',
        parlay_id: parlayId,
      };

      // Validate required fields
      if (!parlayRecord.event_id || !parlayRecord.event_name || !parlayRecord.selection) {
        console.error('Invalid parlay record:', parlayRecord);
        throw new Error('Invalid parlay data: missing required fields');
      }

      betsToInsert.push(parlayRecord);
    }

    // Deduct balance
    const newBalance = balance - totalStake;
    const { error: updateError } = await updateBalance(userId, newBalance);
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update balance', success: false }, { status: 500 });
    }

    // Log what we're about to insert
    console.log('Placing bet:', {
      userId,
      betType,
      betsToInsert: betsToInsert.length,
      totalStake,
      sampleBet: betsToInsert[0],
    });

    // Validate all bet records before insertion
    for (const bet of betsToInsert) {
      if (!bet.user_id || !bet.event_id || !bet.event_name || !bet.selection || !bet.odds || bet.stake <= 0) {
        console.error('Invalid bet record:', bet);
        return NextResponse.json({ 
          error: 'Invalid bet data: missing or invalid required fields', 
          success: false,
          invalidBet: bet
        }, { status: 400 });
      }
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
      console.error('Insert error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      console.error('Attempted to insert:', JSON.stringify(betsToInsert, null, 2));

      // Provide helpful error messages based on error code
      let errorMessage = insertError.message || 'Failed to place bet';
      let solution = '';
      
      if (insertError.code === '42P01') {
        errorMessage = 'Database error: sports_bets table does not exist.';
        solution = 'Please run the migration in Supabase Dashboard SQL Editor. Go to /migrations page for instructions.';
      } else if (insertError.code === '23503') {
        errorMessage = 'Database error: Foreign key constraint violation.';
        solution = 'User account may not exist in users table. Please ensure you are properly registered.';
      } else if (insertError.code === '23505') {
        errorMessage = 'Duplicate bet detected.';
        solution = 'This bet may have already been placed. Please try again.';
      } else if (insertError.code === '23502') {
        errorMessage = 'Database error: Required field is missing.';
        solution = 'Please check that all bet data is complete.';
      }

      return NextResponse.json({ 
        error: errorMessage,
        solution,
        success: false,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        attemptedData: process.env.NODE_ENV === 'development' ? betsToInsert : undefined,
      }, { status: 500 });
    }

    console.log('Successfully inserted bets:', {
      count: insertedBets?.length || 0,
      betIds: insertedBets?.map(b => b.id) || [],
    });

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
