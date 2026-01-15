import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// User join lottery room API
// POST - Join a lottery room

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, stakeAmount } = body;

    if (!roomId || stakeAmount === undefined) {
      return NextResponse.json({ error: 'Missing roomId or stakeAmount' }, { status: 400 });
    }

    const stake = Number(stakeAmount);
    if (isNaN(stake) || stake <= 0) {
      return NextResponse.json({ error: 'Invalid stake amount' }, { status: 400 });
    }

    // Get the room
    const { data: room, error: roomError } = await supabase
      .from('lottery_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check room is open
    if (room.status !== 'open') {
      return NextResponse.json({ error: 'Room is not open for entries' }, { status: 400 });
    }

    // Check settlement time hasn't passed
    const settlementTime = new Date(room.settlement_time).getTime();
    if (Date.now() >= settlementTime) {
      return NextResponse.json({ error: 'Room has expired' }, { status: 400 });
    }

    // Validate stake amount
    const minStake = Number(room.min_stake);
    const maxStake = Number(room.max_stake);
    if (stake < minStake || stake > maxStake) {
      return NextResponse.json({ 
        error: `Stake must be between ${minStake} and ${maxStake}` 
      }, { status: 400 });
    }

    // Check if user already joined this room
    const { data: existingEntry, error: entryCheckError } = await supabase
      .from('lottery_entries')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (existingEntry) {
      return NextResponse.json({ error: 'You have already joined this room' }, { status: 400 });
    }

    // Get user balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('balances')
      .select('amount')
      .eq('user_id', user.id)
      .single();

    if (balanceError || !balanceData) {
      return NextResponse.json({ error: 'Could not fetch balance' }, { status: 500 });
    }

    const currentBalance = Number(balanceData.amount);
    if (currentBalance < stake) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Deduct stake from balance
    const newBalance = currentBalance - stake;
    const { error: updateBalanceError } = await supabase
      .from('balances')
      .update({ amount: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (updateBalanceError) {
      throw updateBalanceError;
    }

    // Create lottery entry
    const { data: entry, error: createEntryError } = await supabase
      .from('lottery_entries')
      .insert({
        room_id: roomId,
        user_id: user.id,
        stake_amount: stake
      })
      .select()
      .single();

    if (createEntryError) {
      // Rollback balance deduction
      await supabase
        .from('balances')
        .update({ amount: currentBalance })
        .eq('user_id', user.id);

      throw createEntryError;
    }

    // Record transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'lottery_entry',
        amount: -stake,
        description: `Lottery entry: ${room.name}`,
        reference_id: entry.id
      });

    return NextResponse.json({ 
      message: 'Joined lottery successfully',
      entry,
      newBalance
    });
  } catch (error: any) {
    console.error('Error joining lottery room:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
