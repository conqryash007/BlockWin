import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin lottery management API
// GET - List all lottery rooms
// POST - Create new lottery room (admin only)
// PUT - Update lottery room / Settle room (admin only)

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: rooms, error } = await supabase
      .from('lottery_rooms')
      .select('*')
      .order('settlement_time', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ rooms });
  } catch (error: any) {
    console.error('Error fetching lottery rooms:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, minStake, maxStake, settlementTime, payoutType } = body;

    // Validate required fields
    if (!name || !minStake || !maxStake || !settlementTime || !payoutType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate stake amounts
    if (minStake <= 0 || maxStake <= 0 || minStake > maxStake) {
      return NextResponse.json({ error: 'Invalid stake amounts' }, { status: 400 });
    }

    // Validate payout type
    if (!['winner_takes_all', 'split'].includes(payoutType)) {
      return NextResponse.json({ error: 'Invalid payout type' }, { status: 400 });
    }

    // Create lottery room
    const { data: room, error: createError } = await supabase
      .from('lottery_rooms')
      .insert({
        name,
        min_stake: minStake,
        max_stake: maxStake,
        settlement_time: new Date(settlementTime).toISOString(),
        payout_type: payoutType,
        status: 'open',
        created_by: user.id
      })
      .select()
      .single();

    if (createError) throw createError;

    return NextResponse.json({ room, message: 'Lottery room created successfully' });
  } catch (error: any) {
    console.error('Error creating lottery room:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { roomId, action, winners } = body;

    if (!roomId || !action) {
      return NextResponse.json({ error: 'Missing roomId or action' }, { status: 400 });
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

    if (action === 'close') {
      // Just close the room (no more entries)
      const { error: updateError } = await supabase
        .from('lottery_rooms')
        .update({ status: 'closed' })
        .eq('id', roomId);

      if (updateError) throw updateError;

      return NextResponse.json({ message: 'Room closed successfully' });
    }

    if (action === 'settle') {
      // Settle the room with winner(s)
      if (room.status === 'settled') {
        return NextResponse.json({ error: 'Room already settled' }, { status: 400 });
      }

      // Get all entries for this room
      const { data: entries, error: entriesError } = await supabase
        .from('lottery_entries')
        .select('user_id, stake_amount')
        .eq('room_id', roomId);

      if (entriesError) throw entriesError;

      if (!entries || entries.length === 0) {
        // No participants - just close the room
        await supabase
          .from('lottery_rooms')
          .update({ status: 'settled', winners: [] })
          .eq('id', roomId);

        return NextResponse.json({ message: 'Room settled with no participants' });
      }

      // Calculate total pool
      const totalPool = entries.reduce((sum, e) => sum + Number(e.stake_amount), 0);
      
      // Fetch wallet addresses for all participants
      const userIds = entries.map(e => e.user_id);
      const { data: users } = await supabase
        .from('users')
        .select('id, wallet_address')
        .in('id', userIds);
      
      // Helper to get wallet address by user_id
      const getWalletAddress = (userId: string) => {
        const user = users?.find(u => u.id === userId);
        return user?.wallet_address || userId; // Fallback to user_id if no wallet
      };

      let winnersData: { address: string; prize: number; rank: number; userId: string }[] = [];

      if (winners && Array.isArray(winners) && winners.length > 0) {
        // Admin selected winners manually - convert user IDs to wallet addresses
        winnersData = winners.map(w => ({
          ...w,
          address: getWalletAddress(w.address),
          userId: w.address // Keep original user_id for balance operations
        }));
      } else if (body.randomSelect) {
        // Random winner selection
        const payoutType = room.payout_type;
        
        if (payoutType === 'winner_takes_all') {
          // Pick one random winner
          const randomIndex = Math.floor(Math.random() * entries.length);
          const winner = entries[randomIndex];
          winnersData = [{
            address: getWalletAddress(winner.user_id),
            userId: winner.user_id,
            prize: totalPool,
            rank: 1
          }];
        } else {
          // Split payout: 60%, 30%, 10% for top 3
          const shuffled = [...entries].sort(() => Math.random() - 0.5);
          const numWinners = Math.min(3, shuffled.length);
          const payouts = [0.60, 0.30, 0.10];

          for (let i = 0; i < numWinners; i++) {
            winnersData.push({
              address: getWalletAddress(shuffled[i].user_id),
              userId: shuffled[i].user_id,
              prize: Math.floor(totalPool * payouts[i] * 100) / 100,
              rank: i + 1
            });
          }

          // If only 1 or 2 participants for split, adjust distribution
          if (numWinners === 1) {
            winnersData[0].prize = totalPool;
          } else if (numWinners === 2) {
            winnersData[0].prize = Math.floor(totalPool * 0.65 * 100) / 100;
            winnersData[1].prize = Math.floor(totalPool * 0.35 * 100) / 100;
          }
        }
      } else {
        return NextResponse.json({ 
          error: 'Must provide winners array or set randomSelect: true' 
        }, { status: 400 });
      }

      // Credit winner balances and create game session records
      for (const winner of winnersData) {
        // Find the winner's entry to get their stake amount (use userId for database operations)
        const winnerEntry = entries.find(e => e.user_id === winner.userId);
        const stakeAmount = winnerEntry ? Number(winnerEntry.stake_amount) : 0;

        const { error: balanceError } = await supabase.rpc('increment_balance', {
          p_user_id: winner.userId,
          p_amount: winner.prize
        });

        if (balanceError) {
          console.error('Error crediting winner balance:', balanceError);
          // Try direct update as fallback
          const { data: currentBalance } = await supabase
            .from('balances')
            .select('amount')
            .eq('user_id', winner.userId)
            .single();

          if (currentBalance) {
            await supabase
              .from('balances')
              .update({ amount: Number(currentBalance.amount) + winner.prize })
              .eq('user_id', winner.userId);
          }
        }

        // Create game session record for the wallet history
        await supabase
          .from('game_sessions')
          .insert({
            user_id: winner.userId,
            game_type: 'lottery',
            bet_amount: stakeAmount,
            bet_fee: 0,
            server_seed: `lottery-${room.id}-${winner.rank}`,
            outcome: {
              win: true,
              roomId: room.id,
              roomName: room.name,
              rank: winner.rank,
              totalPool,
              participantCount: entries.length
            },
            payout: winner.prize
          });
      }

      // Create losing game session records for non-winners
      const winnerUserIds = winnersData.map(w => w.userId);
      const losers = entries.filter(e => !winnerUserIds.includes(e.user_id));
      
      for (const loser of losers) {
        await supabase
          .from('game_sessions')
          .insert({
            user_id: loser.user_id,
            game_type: 'lottery',
            bet_amount: Number(loser.stake_amount),
            bet_fee: 0,
            server_seed: `lottery-${room.id}-loss`,
            outcome: {
              win: false,
              roomId: room.id,
              roomName: room.name,
              totalPool,
              participantCount: entries.length
            },
            payout: 0
          });
      }

      // Update room with winners and settled status
      const { error: settleError } = await supabase
        .from('lottery_rooms')
        .update({ 
          status: 'settled', 
          winners: winnersData 
        })
        .eq('id', roomId);

      if (settleError) throw settleError;

      return NextResponse.json({ 
        message: 'Room settled successfully',
        winners: winnersData,
        totalPool
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating lottery room:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
