/**
 * Auto-Settle Sports Bets API Route
 * POST /api/sports/auto-settle
 * 
 * Automatically settles pending bets by fetching completed event scores 
 * from The Odds API and determining winners.
 * 
 * This can be triggered:
 * 1. Manually by admin
 * 2. Via cron job (e.g., Vercel cron, external scheduler)
 * 
 * Request body (optional):
 * {
 *   sportKey?: string;   // Optional: settle only bets for specific sport
 *   dryRun?: boolean;    // Optional: preview settlements without applying
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromToken, getBalance, updateBalance } from '@/lib/game-utils';
import { supabaseAdmin } from '@/lib/supabase-admin';

const ODDS_API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY || '';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

interface Score {
  name: string;
  score: string;
}

interface CompletedEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: Score[] | null;
}

interface PendingBet {
  id: string;
  user_id: string;
  event_id: string;
  event_name: string;
  market_type: string;
  selection: string;
  odds: number;
  stake: number;
  potential_payout: number;
  status: string;
}

interface SettlementResult {
  betId: string;
  eventId: string;
  selection: string;
  outcome: 'won' | 'lost' | 'void';
  winner?: string;
  payoutAmount: number;
  applied: boolean;
  reason?: string;
}

// Helper to determine H2H winner from scores
function determineH2HWinner(
  scores: Score[],
  homeTeam: string,
  awayTeam: string
): { winner: string | null; isDraw: boolean } {
  const homeScore = scores.find(s => s.name === homeTeam);
  const awayScore = scores.find(s => s.name === awayTeam);

  if (!homeScore || !awayScore) {
    return { winner: null, isDraw: false };
  }

  const homePoints = parseInt(homeScore.score, 10);
  const awayPoints = parseInt(awayScore.score, 10);

  if (isNaN(homePoints) || isNaN(awayPoints)) {
    return { winner: null, isDraw: false };
  }

  if (homePoints > awayPoints) {
    return { winner: homeTeam, isDraw: false };
  } else if (awayPoints > homePoints) {
    return { winner: awayTeam, isDraw: false };
  } else {
    return { winner: null, isDraw: true };
  }
}

// Fetch completed events from The Odds API
async function fetchCompletedEvents(sportKey: string): Promise<CompletedEvent[]> {
  try {
    const url = new URL(`${ODDS_API_BASE}/sports/${sportKey}/scores`);
    url.searchParams.append('apiKey', ODDS_API_KEY);
    url.searchParams.append('daysFrom', '3'); // Get events from last 3 days

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error(`Failed to fetch scores for ${sportKey}: ${response.status}`);
      return [];
    }

    const events: CompletedEvent[] = await response.json();
    return events.filter(e => e.completed && e.scores);
  } catch (error) {
    console.error(`Error fetching scores for ${sportKey}:`, error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin (or allow cron with secret key)
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');
    
    // Check for cron secret (for automated runs)
    const isCronJob = cronSecret === process.env.CRON_SECRET;
    
    if (!isCronJob) {
      const { isAdmin, error: authError } = await getAdminFromToken(authHeader);
      
      if (authError || !isAdmin) {
        return NextResponse.json(
          { error: authError || 'Admin access required', success: false },
          { status: 403 }
        );
      }
    }

    // Parse request
    const body = await request.json().catch(() => ({}));
    const { sportKey, dryRun = false } = body;

    // Fetch pending bets
    let query = supabaseAdmin
      .from('sports_bets')
      .select('*')
      .eq('status', 'pending')
      .eq('market_type', 'h2h'); // Only auto-settle H2H bets for now

    const { data: pendingBets, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch pending bets', success: false },
        { status: 500 }
      );
    }

    if (!pendingBets || pendingBets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending H2H bets to settle',
        results: [],
      });
    }

    // Group bets by event_id
    const betsByEvent = new Map<string, PendingBet[]>();
    for (const bet of pendingBets) {
      const existing = betsByEvent.get(bet.event_id) || [];
      existing.push(bet);
      betsByEvent.set(bet.event_id, existing);
    }

    // Get unique sport keys from pending bets (extract from event_id or use provided)
    const uniqueEventIds = new Set(pendingBets.map(b => b.event_id));
    
    // Fetch completed events - we need to check multiple sports
    // For simplicity, we'll fetch from common sports
    const sportsToCheck = sportKey 
      ? [sportKey] 
      : ['soccer_epl', 'soccer_uefa_champs_league', 'basketball_nba', 'americanfootball_nfl'];
    
    const completedEventsMap = new Map<string, CompletedEvent>();
    
    for (const sport of sportsToCheck) {
      const events = await fetchCompletedEvents(sport);
      for (const event of events) {
        if (uniqueEventIds.has(event.id)) {
          completedEventsMap.set(event.id, event);
        }
      }
    }

    // Process settlements
    const results: SettlementResult[] = [];
    const userBalances: Map<string, number> = new Map();
    let settledCount = 0;
    let skippedCount = 0;

    for (const [eventId, bets] of betsByEvent) {
      const completedEvent = completedEventsMap.get(eventId);
      
      if (!completedEvent) {
        // Event not completed yet
        for (const bet of bets) {
          results.push({
            betId: bet.id,
            eventId,
            selection: bet.selection,
            outcome: 'void',
            payoutAmount: 0,
            applied: false,
            reason: 'Event not completed or scores not available',
          });
          skippedCount++;
        }
        continue;
      }

      // Determine winner
      const { winner, isDraw } = determineH2HWinner(
        completedEvent.scores!,
        completedEvent.home_team,
        completedEvent.away_team
      );

      for (const bet of bets) {
        let outcome: 'won' | 'lost' | 'void';
        let payoutAmount = 0;

        if (isDraw) {
          // Check if user bet on Draw
          if (bet.selection.toLowerCase() === 'draw') {
            outcome = 'won';
            payoutAmount = Number(bet.potential_payout);
          } else {
            outcome = 'lost';
          }
        } else if (winner) {
          // Check if user's selection matches winner
          // Handle various selection formats:
          // - Direct match: "Arsenal" vs "Arsenal"
          // - "X to win" format: "Arsenal to win" vs "Arsenal"
          // - Partial matches: "Arsenal" vs "Arsenal FC"
          let selectionClean = bet.selection.toLowerCase();
          
          // Remove common suffixes like "to win"
          selectionClean = selectionClean
            .replace(/ to win$/i, '')
            .replace(/ win$/i, '')
            .trim();
          
          const winnerLower = winner.toLowerCase();
          
          if (selectionClean === winnerLower || 
              winnerLower.includes(selectionClean) || 
              selectionClean.includes(winnerLower)) {
            outcome = 'won';
            payoutAmount = Number(bet.potential_payout);
          } else {
            outcome = 'lost';
          }
        } else {
          // Cannot determine winner
          outcome = 'void';
          payoutAmount = Number(bet.stake); // Refund stake
        }

        // Apply settlement if not dry run
        if (!dryRun) {
          try {
            // Get user balance
            let balance: number;
            if (userBalances.has(bet.user_id)) {
              balance = userBalances.get(bet.user_id)!;
            } else {
              const { balance: dbBalance } = await getBalance(bet.user_id);
              balance = dbBalance;
            }

            // Update balance for wins/voids
            if (outcome === 'won' || outcome === 'void') {
              const newBalance = balance + payoutAmount;
              await updateBalance(bet.user_id, newBalance);
              userBalances.set(bet.user_id, newBalance);

              // Create transaction
              await supabaseAdmin
                .from('transactions')
                .insert({
                  user_id: bet.user_id,
                  type: outcome === 'won' ? 'sports_win' : 'sports_refund',
                  amount: payoutAmount,
                  description: `Auto-settled: ${outcome === 'won' ? 'Won' : 'Refund'} bet on ${bet.selection}`,
                });
            }

            // Update bet status
            await supabaseAdmin
              .from('sports_bets')
              .update({
                status: outcome,
                settled_at: new Date().toISOString(),
              })
              .eq('id', bet.id);

            results.push({
              betId: bet.id,
              eventId,
              selection: bet.selection,
              outcome,
              winner: winner || (isDraw ? 'Draw' : undefined),
              payoutAmount,
              applied: true,
            });
            settledCount++;

          } catch (error: any) {
            results.push({
              betId: bet.id,
              eventId,
              selection: bet.selection,
              outcome,
              payoutAmount,
              applied: false,
              reason: error.message || 'Settlement failed',
            });
            skippedCount++;
          }
        } else {
          // Dry run - just report what would happen
          results.push({
            betId: bet.id,
            eventId,
            selection: bet.selection,
            outcome,
            winner: winner || (isDraw ? 'Draw' : undefined),
            payoutAmount,
            applied: false,
            reason: 'Dry run mode',
          });
        }
      }
    }

    // Log auto-settlement run
    if (!dryRun && settledCount > 0) {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          table_name: 'sports_bets',
          action: 'auto_settle_bets',
          new_value: {
            settled: settledCount,
            skipped: skippedCount,
            isCronJob,
          },
        });
    }

    return NextResponse.json({
      success: true,
      dryRun,
      message: dryRun 
        ? `Preview: ${results.length} bets analyzed` 
        : `Auto-settled ${settledCount} bets, ${skippedCount} skipped`,
      summary: {
        total: pendingBets.length,
        matchedWithResults: completedEventsMap.size,
        settled: settledCount,
        skipped: skippedCount,
      },
      results,
    });

  } catch (error: any) {
    console.error('Auto-settlement error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
