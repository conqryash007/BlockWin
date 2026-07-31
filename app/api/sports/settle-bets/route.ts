/**
 * Batch Sports Bet Settlement API Route
 * POST /api/sports/settle-bets
 * 
 * Settles multiple sports bets in one request. Admin only.
 * 
 * Request body:
 * {
 *   settlements: Array<{
 *     betId: string;
 *     outcome: 'won' | 'lost' | 'void';
 *   }>;
 * }
 * 
 * Returns results for each bet settlement attempt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromToken, getBalance, adjustBalance } from '@/lib/game-utils';
import { supabaseAdmin } from '@/lib/supabase-admin';

type SettlementOutcome = 'won' | 'lost' | 'void';

interface SettlementItem {
  betId: string;
  outcome: SettlementOutcome;
}

interface BatchSettleRequest {
  settlements: SettlementItem[];
}

interface SettlementResult {
  betId: string;
  success: boolean;
  outcome?: SettlementOutcome;
  payoutAmount?: number;
  error?: string;
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
    const body: BatchSettleRequest = await request.json();
    const { settlements } = body;

    // Validate request
    if (!settlements || !Array.isArray(settlements) || settlements.length === 0) {
      return NextResponse.json(
        { error: 'Settlements array is required and must not be empty', success: false },
        { status: 400 }
      );
    }

    if (settlements.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 bets can be settled in one request', success: false },
        { status: 400 }
      );
    }

    // Process each settlement
    const results: SettlementResult[] = [];
    let successCount = 0;
    let failCount = 0;

    // Group settlements by user for efficient balance updates
    const userBalances: Map<string, number> = new Map();

    for (const settlement of settlements) {
      const { betId, outcome } = settlement;

      // Validate outcome
      if (!['won', 'lost', 'void'].includes(outcome)) {
        results.push({
          betId,
          success: false,
          error: 'Invalid outcome. Must be "won", "lost", or "void"',
        });
        failCount++;
        continue;
      }

      try {
        // Fetch the bet
        const { data: bet, error: fetchError } = await supabaseAdmin
          .from('sports_bets')
          .select('*')
          .eq('id', betId)
          .single();

        if (fetchError || !bet) {
          results.push({ betId, success: false, error: 'Bet not found' });
          failCount++;
          continue;
        }

        // Check if already settled
        if (bet.status !== 'pending') {
          results.push({
            betId,
            success: false,
            error: `Bet already settled with status: ${bet.status}`,
          });
          failCount++;
          continue;
        }

        // Get user's current balance (from cache or DB)
        let balance: number;
        if (userBalances.has(bet.user_id)) {
          balance = userBalances.get(bet.user_id)!;
        } else {
          const { balance: dbBalance, error: balanceError } = await getBalance(bet.user_id);
          if (balanceError) {
            results.push({ betId, success: false, error: 'Failed to fetch user balance' });
            failCount++;
            continue;
          }
          balance = dbBalance;
        }

        // Calculate payout
        let payoutAmount = 0;
        let transactionType = '';
        let transactionDescription = '';

        switch (outcome) {
          case 'won':
            payoutAmount = Number(bet.potential_payout);
            transactionType = 'sports_win';
            transactionDescription = `Won bet on ${bet.selection} (${bet.event_name})`;
            break;

          case 'lost':
            payoutAmount = 0;
            transactionType = 'sports_loss';
            transactionDescription = `Lost bet on ${bet.selection} (${bet.event_name})`;
            break;

          case 'void':
            payoutAmount = Number(bet.stake);
            transactionType = 'sports_refund';
            transactionDescription = `Void/refunded bet on ${bet.selection} (${bet.event_name})`;
            break;
        }

        // Claim the bet first, guarded on it still being pending. Only one
        // concurrent settlement can win this, so a bet cannot be paid twice.
        const { data: claimedBet, error: updateBetError } = await supabaseAdmin
          .from('sports_bets')
          .update({
            status: outcome,
            settled_at: new Date().toISOString(),
          })
          .eq('id', betId)
          .eq('status', 'pending')
          .select('id');

        if (updateBetError) {
          results.push({ betId, success: false, error: 'Failed to update bet status' });
          failCount++;
          continue;
        }

        if (!claimedBet || claimedBet.length === 0) {
          results.push({ betId, success: false, error: 'Bet was already settled' });
          failCount++;
          continue;
        }

        // Credit the payout atomically
        let newBalance = balance;
        if (outcome === 'won' || outcome === 'void') {
          const { balance: updated, success, error: creditError } =
            await adjustBalance(bet.user_id, payoutAmount);

          if (!success) {
            // Release the claim so the settlement can be retried.
            await supabaseAdmin
              .from('sports_bets')
              .update({ status: 'pending', settled_at: null })
              .eq('id', betId);

            results.push({ betId, success: false, error: creditError || 'Failed to update user balance' });
            failCount++;
            continue;
          }

          newBalance = updated;
          userBalances.set(bet.user_id, updated);
        }

        // Create transaction record
        if (outcome !== 'lost') {
          await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: bet.user_id,
              type: transactionType,
              amount: payoutAmount,
              description: transactionDescription,
            });
        }

        results.push({
          betId,
          success: true,
          outcome,
          payoutAmount,
        });
        successCount++;

      } catch (error: any) {
        results.push({
          betId,
          success: false,
          error: error.message || 'Settlement failed',
        });
        failCount++;
      }
    }

    // Log batch settlement in audit_logs
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        admin_id: adminId,
        table_name: 'sports_bets',
        action: 'batch_settle_bets',
        new_value: {
          total: settlements.length,
          success: successCount,
          failed: failCount,
          settlements: results,
        },
      });

    return NextResponse.json({
      success: true,
      message: `Settled ${successCount} of ${settlements.length} bets`,
      summary: {
        total: settlements.length,
        success: successCount,
        failed: failCount,
      },
      results,
    });

  } catch (error: any) {
    console.error('Batch settlement error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
