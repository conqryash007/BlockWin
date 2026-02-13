import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/game-utils';
import { getBalance, updateBalance } from '@/lib/game-utils';
import { supabaseAdmin } from '@/lib/supabase-admin';

const WITHDRAWAL_FEE_PERCENT = 0.05;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { userId, error: authError } = await getUserFromToken(authHeader);

    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { wallet_address: walletAddress, network, amount } = body;

    if (!walletAddress || !network || amount == null || amount <= 0) {
      return NextResponse.json(
        { error: 'Missing or invalid wallet_address, network, or amount' },
        { status: 400 }
      );
    }

    const net = String(network).toLowerCase();
    if (net !== 'ethereum' && net !== 'tron') {
      return NextResponse.json({ error: 'Invalid network. Use ethereum or tron.' }, { status: 400 });
    }

    // Validate user owns this wallet via wallet_addresses table
    const normalizedAddress = net === 'ethereum' ? String(walletAddress).toLowerCase() : String(walletAddress);

    const { data: walletRows } = await supabaseAdmin
      .from('wallet_addresses')
      .select('address')
      .eq('user_id', userId)
      .eq('network', net);

    const ownsWallet =
      (walletRows || []).some(
        (row: { address: string }) =>
          (net === 'ethereum' ? row.address.toLowerCase() : row.address) === normalizedAddress
      );

    if (!ownsWallet) {
      return NextResponse.json({ error: 'Wallet address does not belong to your account' }, { status: 403 });
    }

    const requestAmount = Number(amount);
    if (!Number.isFinite(requestAmount) || requestAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const { balance, error: balanceError } = await getBalance(userId);
    if (balanceError) {
      return NextResponse.json({ error: balanceError }, { status: 500 });
    }
    if (balance < requestAmount) {
      return NextResponse.json(
        { error: `Insufficient balance. You have ${balance.toFixed(2)} USDT.` },
        { status: 400 }
      );
    }

    const newBalance = balance - requestAmount;
    const updateResult = await updateBalance(userId, newBalance);
    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error || 'Failed to update balance' }, { status: 500 });
    }

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('withdrawal_requests')
      .insert({
        user_id: userId,
        wallet_address: normalizedAddress,
        network: net,
        requested_amount: requestAmount,
        status: 'pending',
      })
      .select('id, status, created_at')
      .single();

    if (insertError) {
      await updateBalance(userId, balance);
      return NextResponse.json(
        { error: insertError.message || 'Failed to create withdrawal request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      request: {
        id: insertData.id,
        status: insertData.status,
        created_at: insertData.created_at,
        requested_amount: requestAmount,
        fee_percent: WITHDRAWAL_FEE_PERCENT,
        receive_amount: requestAmount * (1 - WITHDRAWAL_FEE_PERCENT),
      },
    });
  } catch (err: unknown) {
    console.error('[withdrawal/request]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
