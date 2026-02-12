import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/game-utils';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { userId, error: authError } = await getUserFromToken(authHeader);

    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('id, wallet_address, network, requested_amount, status, admin_note, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: data || [] });
  } catch (err: unknown) {
    console.error('[withdrawal/requests]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
