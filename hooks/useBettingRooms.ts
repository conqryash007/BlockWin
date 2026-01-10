'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { RoomWithPlayers, PlayerStake, BettingRoom, PayoutType, WinnerInfo, getRoomStatus, RoomStatus } from '@/types/lottery';

// Get all rooms data from Supabase
export function useAllRooms() {
  const [rooms, setRooms] = useState<RoomWithPlayers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('lottery_rooms')
        .select('*')
        .order('settlement_time', { ascending: true });

      if (roomsError) throw roomsError;

      // Fetch all entries (players) for these rooms
      // In a large app, we might want to paginate or fetch per room, but for now fetch all active entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('lottery_entries')
        .select('room_id, user_id, stake_amount');

      if (entriesError) throw entriesError;

      // Group entries by room
      const entriesByRoom: Record<string, { user_id: string; stake_amount: number }[]> = {};
      entriesData?.forEach((entry) => {
        if (!entriesByRoom[entry.room_id]) {
          entriesByRoom[entry.room_id] = [];
        }
        entriesByRoom[entry.room_id].push({
          user_id: entry.user_id,
          stake_amount: Number(entry.stake_amount),
        });
      });

      // Transform to RoomWithPlayers
      const formattedRooms: RoomWithPlayers[] = roomsData.map((room) => {
        const roomEntries = entriesByRoom[room.id] || [];
        const players = roomEntries.map(e => e.user_id);
        const totalPool = roomEntries.reduce((sum, e) => sum + e.stake_amount, 0);

        // Convert Supabase timestamp (ISO string) to unix timestamp (seconds)
        const settlementTimestamp = Math.floor(new Date(room.settlement_time).getTime() / 1000);

        const bettingRoom: BettingRoom = {
          id: room.id,
          roomId: room.id, // Use UUID as roomId
          name: room.name || `Room ${room.id.slice(0, 8)}`,
          minStakeAmount: Number(room.min_stake),
          maxStakeAmount: Number(room.max_stake),
          settlementTimestamp,
          closed: room.status === 'closed' || room.status === 'settled',
          settled: room.status === 'settled',
          payoutType: room.payout_type as PayoutType, // stored as string in DB
          created_by: room.created_by
        };

        // If settled, parse winners from JSONB if available
        let winners: WinnerInfo[] | undefined = undefined;
        if (room.winners) {
          // Assuming room.winners is stored exactly as WinnerInfo[] or compatible JSON
          winners = room.winners as WinnerInfo[];
        }

        return {
          ...bettingRoom,
          players,
          totalPool,
          winners
        };
      });

      setRooms(formattedRooms);
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    
    // Realtime subscription for room updates could be added here
    const channel = supabase
      .channel('public:lottery_rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lottery_rooms' }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRooms]);

  return {
    rooms,
    isLoading,
    error,
    refetch: fetchRooms,
  };
}

// Get single room with players and stakes
export function useRoom(roomId: string) {
  const [room, setRoom] = useState<RoomWithPlayers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Fetch room data
      const { data: roomData, error: roomError } = await supabase
        .from('lottery_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      if (!roomData) throw new Error('Room not found');

      // Fetch entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('lottery_entries')
        .select('user_id, stake_amount')
        .eq('room_id', roomId);

      if (entriesError) throw entriesError;

      const roomEntries = entriesData || [];
      const players = roomEntries.map(e => e.user_id);
      const totalPool = roomEntries.reduce((sum, e) => sum + Number(e.stake_amount), 0);
      const settlementTimestamp = Math.floor(new Date(roomData.settlement_time).getTime() / 1000);

      const bettingRoom: BettingRoom = {
        id: roomData.id,
        roomId: roomData.id,
        name: roomData.name,
        minStakeAmount: Number(roomData.min_stake),
        maxStakeAmount: Number(roomData.max_stake),
        settlementTimestamp,
        closed: roomData.status === 'closed' || roomData.status === 'settled',
        settled: roomData.status === 'settled',
        payoutType: roomData.payout_type as PayoutType,
        created_by: roomData.created_by
      };

      const roomWithPlayers: RoomWithPlayers = {
        ...bettingRoom,
        players,
        totalPool,
        winners: roomData.winners as WinnerInfo[] | undefined
      };

      setRoom(roomWithPlayers);
    } catch (err: any) {
      console.error('Error fetching room:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoom();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lottery_rooms', filter: `id=eq.${roomId}` }, () => {
        fetchRoom();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lottery_entries', filter: `room_id=eq.${roomId}` }, () => {
        fetchRoom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRoom, roomId]);

  return {
    room,
    isLoading,
    error,
    refetch: fetchRoom
  };
}

// Get player stakes for a room
// This is now redundant as useRoom returns players and total pool, 
// but we might want individual stakes map.
export function usePlayerStakes(roomId: string) {
  const [stakes, setStakes] = useState<PlayerStake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStakes() {
      if (!roomId) return;
      try {
        const { data, error } = await supabase
          .from('lottery_entries')
          .select('user_id, stake_amount')
          .eq('room_id', roomId);

        if (error) throw error;

        const formattedStakes: PlayerStake[] = (data || []).map(e => ({
          player: e.user_id,
          stake: Number(e.stake_amount)
        }));

        setStakes(formattedStakes);
      } catch (err) {
        console.error('Error fetching stakes:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStakes();
  }, [roomId]);

  return { stakes, isLoading };
}
