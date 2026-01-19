/**
 * Test endpoint to diagnose bet insertion issues
 * POST /api/sports/test-insert
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUserFromToken } from '@/lib/game-utils';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const { userId, error: authError } = await getUserFromToken(authHeader || '');
    
    if (authError || !userId) {
      return NextResponse.json({ 
        error: authError || 'Authentication failed',
        step: 'authentication'
      }, { status: 401 });
    }

    const diagnostics: any = {
      step: 'starting',
      userId,
      checks: [],
    };

    // Check 1: Verify user exists
    const { data: userCheck, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    diagnostics.checks.push({
      name: 'User exists in users table',
      passed: !userError && !!userCheck,
      error: userError?.message,
      code: userError?.code,
    });

    if (userError || !userCheck) {
      return NextResponse.json({
        ...diagnostics,
        error: 'User not found in users table',
        solution: 'Ensure you are properly registered and logged in',
      }, { status: 404 });
    }

    // Check 2: Try to query the table
    const { data: tableQuery, error: tableError } = await supabaseAdmin
      .from('sports_bets')
      .select('*')
      .limit(0);

    diagnostics.checks.push({
      name: 'sports_bets table exists',
      passed: !tableError,
      error: tableError?.message,
      code: tableError?.code,
    });

    if (tableError) {
      if (tableError.code === '42P01') {
        return NextResponse.json({
          ...diagnostics,
          error: 'sports_bets table does not exist',
          solution: 'Run the migration: supabase/migrations/20240101000000_create_sports_bets.sql in Supabase Dashboard SQL Editor',
          migrationSql: `CREATE TABLE IF NOT EXISTS sports_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  market_type TEXT NOT NULL,
  selection TEXT NOT NULL,
  odds DECIMAL(10, 2) NOT NULL,
  stake DECIMAL(10, 2) NOT NULL,
  bet_fee DECIMAL(10, 2) NOT NULL,
  potential_payout DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  parlay_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'won', 'lost', 'void', 'cashed_out'))
);

CREATE INDEX IF NOT EXISTS idx_sports_bets_user_id ON sports_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_sports_bets_status ON sports_bets(status);
CREATE INDEX IF NOT EXISTS idx_sports_bets_parlay_id ON sports_bets(parlay_id);
CREATE INDEX IF NOT EXISTS idx_sports_bets_created_at ON sports_bets(created_at DESC);`,
        }, { status: 500 });
      }
      
      return NextResponse.json({
        ...diagnostics,
        error: 'Table query failed',
        details: tableError,
      }, { status: 500 });
    }

    // Check 3: Try to insert a test record
    const testBet = {
      user_id: userId,
      event_id: 'test-event-123',
      event_name: 'Test Event',
      market_type: 'h2h',
      selection: 'Test Selection',
      odds: 2.0,
      stake: 1.0,
      bet_fee: 0.05,
      potential_payout: 1.95,
      status: 'pending' as const,
    };

    const { data: insertedBet, error: insertError } = await supabaseAdmin
      .from('sports_bets')
      .insert(testBet)
      .select('id')
      .single();

    diagnostics.checks.push({
      name: 'Test bet insertion',
      passed: !insertError && !!insertedBet,
      error: insertError?.message,
      code: insertError?.code,
      details: insertError?.details,
      hint: insertError?.hint,
    });

    if (insertError) {
      // Clean up: try to delete the test bet if it was partially created
      if (insertedBet?.id) {
        await supabaseAdmin.from('sports_bets').delete().eq('id', insertedBet.id);
      }

      return NextResponse.json({
        ...diagnostics,
        error: 'Test bet insertion failed',
        insertError: {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        },
        testBetData: testBet,
      }, { status: 500 });
    }

    // Clean up: delete the test bet
    if (insertedBet?.id) {
      await supabaseAdmin.from('sports_bets').delete().eq('id', insertedBet.id);
    }

    return NextResponse.json({
      ...diagnostics,
      success: true,
      message: 'All checks passed! The table exists and insertions work correctly.',
      testBetId: insertedBet?.id,
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      type: 'exception',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
