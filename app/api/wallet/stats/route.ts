/**
 * Wallet Stats API Route
 * GET /api/wallet/stats
 * 
 * Fetches the user's wallet stats:
 * - Current balance
 * - Total wagered
 * - Total won
 * - Total lost
 * - Total earnings (net profit/loss)
 * - Games played
 * - Win rate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, getBalance } from '@/lib/game-utils';
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

    // Get user balance
    const { balance, error: balanceError } = await getBalance(userId);
    if (balanceError) {
      // If no balance record exists, return 0
      console.error('Balance fetch error:', balanceError);
    }

    // Fetch all game sessions for stats calculation
    const { data: gameSessions, error: sessionsError } = await supabaseAdmin
      .from('game_sessions')
      .select('game_type, bet_amount, payout, outcome')
      .eq('user_id', userId);

    if (sessionsError) {
      console.error('Error fetching game sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch game stats', success: false }, { status: 500 });
    }

    // Calculate stats from game sessions using game-specific win logic
    let totalWagered = 0;
    let totalWon = 0;
    let totalLost = 0;
    let wins = 0;
    const gamesPlayed = gameSessions?.length || 0;

    gameSessions?.forEach((session) => {
      const betAmount = Number(session.bet_amount) || 0;
      const payout = Number(session.payout) || 0;
      const isWin = isGameWin(session.game_type, session.outcome, payout, betAmount);

      totalWagered += betAmount;
      
      if (isWin) {
        wins++;
        totalWon += payout;
      } else {
        totalLost += betAmount;
      }
    });

    const totalEarnings = totalWon - totalLost;
    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

    return NextResponse.json({
      success: true,
      stats: {
        balance: balance || 0,
        totalWagered,
        totalWon,
        totalLost,
        totalEarnings,
        gamesPlayed,
        winRate,
        wins,
        losses: gamesPlayed - wins,
      }
    });

  } catch (error: any) {
    console.error('Wallet stats error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error', success: false }, { status: 500 });
  }
}
