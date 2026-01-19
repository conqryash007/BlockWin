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
import { getAdminFromToken, getBalance, updateBalance } from '@/lib/game-utils';
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

        // Calculate payout and new balance
        let payoutAmount = 0;
        let newBalance = balance;
        let transactionType = '';
        let transactionDescription = '';

        switch (outcome) {
          case 'won':
            payoutAmount = Number(bet.potential_payout);
            newBalance = balance + payoutAmount;
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
            newBalance = balance + payoutAmount;
            transactionType = 'sports_refund';
            transactionDescription = `Void/refunded bet on ${bet.selection} (${bet.event_name})`;
            break;
        }

        // Update balance if needed
        if (outcome === 'won' || outcome === 'void') {
          const { error: updateError } = await updateBalance(bet.user_id, newBalance);
          if (updateError) {
            results.push({ betId, success: false, error: 'Failed to update user balance' });
            failCount++;
            continue;
          }
          userBalances.set(bet.user_id, newBalance);
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
          // Rollback balance
          if (outcome === 'won' || outcome === 'void') {
            await updateBalance(bet.user_id, balance);
            userBalances.set(bet.user_id, balance);
          }
          results.push({ betId, success: false, error: 'Failed to update bet status' });
          failCount++;
          continue;
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
