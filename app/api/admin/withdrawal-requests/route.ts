import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromToken } from '@/lib/game-utils';
import { adjustBalance } from '@/lib/game-utils';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSubdomain } from '@/lib/subdomain';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const requestSubdomain = getSubdomain(request.headers.get('x-subdomain') || new URL(request.url).hostname);
    const { isAdmin, adminOrigin, error: authError } = await getAdminFromToken(authHeader, requestSubdomain);
    if (!isAdmin || authError) {
      return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const network = searchParams.get('network');

    let query = supabaseAdmin
      .from('withdrawal_requests')
      .select('id, user_id, wallet_address, network, requested_amount, status, admin_note, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (network) query = query.eq('network', network);

    // Filter by origin when admin is scoped to a subdomain
    if (adminOrigin) {
      const { data: originUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('origin', adminOrigin);
      const userIds = (originUsers || []).map(u => u.id);
      if (userIds.length > 0) {
        query = query.in('user_id', userIds);
      } else {
        return NextResponse.json({ requests: [] });
      }
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ requests: data || [] });
  } catch (err: unknown) {
    console.error('[admin/withdrawal-requests GET]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const requestSubdomain = getSubdomain(request.headers.get('x-subdomain') || new URL(request.url).hostname);
    const { isAdmin, error: authError } = await getAdminFromToken(authHeader, requestSubdomain);
    if (!isAdmin || authError) {
      return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, admin_note } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data: row, error: fetchError } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('user_id, requested_amount, status')
      .eq('id', id)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }
    if (row.status !== 'pending') {
      return NextResponse.json({ error: 'Request is already processed' }, { status: 400 });
    }

    // Claim the request first, guarded on it still being pending. Only one
    // concurrent call can win this transition, so a rejected request cannot be
    // refunded twice.
    const { data: claimed, error: updateError } = await supabaseAdmin
      .from('withdrawal_requests')
      .update({
        status,
        admin_note: admin_note ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select('id');

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!claimed || claimed.length === 0) {
      return NextResponse.json({ error: 'Request is already processed' }, { status: 400 });
    }

    if (status === 'rejected') {
      const refundAmount = Number(row.requested_amount);
      const { success, error: refundError } = await adjustBalance(row.user_id, refundAmount);

      if (!success) {
        // Put the request back so the refund can be retried.
        await supabaseAdmin
          .from('withdrawal_requests')
          .update({ status: 'pending', updated_at: new Date().toISOString() })
          .eq('id', id);

        return NextResponse.json({ error: refundError || 'Failed to refund balance' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (err: unknown) {
    console.error('[admin/withdrawal-requests PATCH]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
