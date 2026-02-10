import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/game-utils';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const { userId, error: authError } = await getUserFromToken(authHeader);
    
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Fetch bonus status
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('welcome_bonus_status, first_deposit_at, welcome_bonus_credited_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching bonus status:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      status: data?.welcome_bonus_status || 'pending',
      amount: 10,
      firstDepositAt: data?.first_deposit_at,
      creditedAt: data?.welcome_bonus_credited_at,
    });

  } catch (error: any) {
    console.error('Bonus status API error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
