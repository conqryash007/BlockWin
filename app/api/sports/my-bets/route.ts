/**
 * User Sports Bets API Route
 * GET /api/sports/my-bets
 * 
 * Fetches all sports bets for the authenticated user.
 * Supports pagination and filtering by status.
 * 
 * Query params:
 * - status: 'all' | 'pending' | 'won' | 'lost' | 'void' (default: 'all')
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/game-utils';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const { userId, error: authError } = await getUserFromToken(authHeader);
    if (authError) {
      return NextResponse.json({ error: authError, success: false }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found', success: false }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
    const offset = Number(searchParams.get('offset')) || 0;

    console.log('Fetching bets for user:', userId, 'status:', status, 'offset:', offset, 'limit:', limit);

    // First, let's check if the user exists and get their ID from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('User lookup error:', userError);
      // Continue anyway - user_id might be correct
    } else {
      console.log('User found:', userData);
    }

    // Build query
    let query = supabaseAdmin
      .from('sports_bets')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if not 'all'
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: bets, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('Failed to fetch sports bets:', fetchError);
      console.error('Query details:', { userId, status, offset, limit });
      return NextResponse.json({ error: 'Failed to fetch bets', success: false }, { status: 500 });
    }

    console.log('Found bets:', bets?.length || 0, 'total:', count);
    if (bets && bets.length > 0) {
      console.log('Sample bet:', {
        id: bets[0].id,
        user_id: bets[0].user_id,
        event_name: bets[0].event_name,
        status: bets[0].status,
      });
    }

    // Calculate summary stats
    const pendingBets = bets?.filter(b => b.status === 'pending') || [];
    const settledBets = bets?.filter(b => ['won', 'lost', 'void'].includes(b.status)) || [];
    
    const totalPendingStake = pendingBets.reduce((sum, b) => sum + Number(b.stake), 0);
    const totalPotentialPayout = pendingBets.reduce((sum, b) => sum + Number(b.potential_payout), 0);

    return NextResponse.json({
      success: true,
      bets: bets || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
      summary: {
        pending: pendingBets.length,
        settled: settledBets.length,
        totalPendingStake,
        totalPotentialPayout,
      },
    });

  } catch (error: any) {
    console.error('Fetch sports bets error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error', 
      success: false 
    }, { status: 500 });
  }
}
