/**
 * Wallet Game History API Route
 * GET /api/wallet/history
 * 
 * Fetches the user's game history with pagination:
 * - Query params: limit, offset, gameType
 * - Returns game sessions with id, game_type, bet_amount, bet_fee, outcome, payout, created_at
 * - Normalizes win/loss status across different game types
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/game-utils';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Determine if a game session was a win based on game-specific logic
 */
function isGameWin(gameType: string, outcome: any, payout: number, betAmount: number): boolean {
  switch (gameType) {
    case 'crash':
      // Crash uses explicit win field in outcome
      return outcome?.win === true || outcome?.status === 'won';
    
    case 'mines':
      // Mines: 'cashed_out' = win, 'bust' = loss
      return outcome?.status === 'cashed_out';
    
    case 'dice':
      // Dice uses explicit win field
      return outcome?.win === true;
    
    case 'plinko':
      // Plinko: win if payout > bet amount (profit made)
      return payout > betAmount;
    
    case 'lottery':
      // Lottery uses explicit win field in outcome
      return outcome?.win === true;
    
    default:
      // Fallback: check for explicit win field or payout comparison
      if (typeof outcome?.win === 'boolean') {
        return outcome.win;
      }
      return payout > betAmount;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const { userId, error: authError } = await getUserFromToken(authHeader);
    if (authError) {
      return NextResponse.json({ error: authError, success: false }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100); // Max 100
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const gameType = searchParams.get('gameType');

    // Build query - always order by created_at DESC (latest first)
    let query = supabaseAdmin
      .from('game_sessions')
      .select('id, game_type, bet_amount, bet_fee, outcome, payout, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by game type if provided
    if (gameType) {
      query = query.eq('game_type', gameType);
    }

    const { data: games, error: gamesError } = await query;

    if (gamesError) {
      console.error('Error fetching game history:', gamesError);
      return NextResponse.json({ error: 'Failed to fetch game history', success: false }, { status: 500 });
    }

    // Get total count for pagination info
    let countQuery = supabaseAdmin
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (gameType) {
      countQuery = countQuery.eq('game_type', gameType);
    }
    
    const { count: totalCount } = await countQuery;

    // Format the response with normalized win/loss status
    const formattedGames = (games || []).map(game => {
      const betAmount = Number(game.bet_amount);
      const payout = Number(game.payout);
      const isWin = isGameWin(game.game_type, game.outcome, payout, betAmount);
      
      return {
        id: game.id,
        game_type: game.game_type,
        bet_amount: betAmount,
        bet_fee: Number(game.bet_fee),
        outcome: {
          ...game.outcome,
          win: isWin, // Normalized win status
        },
        payout: payout,
        created_at: game.created_at,
        // Calculated fields for easier frontend use
        profit: isWin ? payout - betAmount : -betAmount,
        isWin,
      };
    });

    return NextResponse.json({
      success: true,
      games: formattedGames,
      pagination: {
        limit,
        offset,
        total: totalCount || 0,
        hasMore: offset + formattedGames.length < (totalCount || 0),
      }
    });

  } catch (error: any) {
    console.error('Wallet history error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error', success: false }, { status: 500 });
  }
}
