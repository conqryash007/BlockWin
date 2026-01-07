'use client';

import { useReadContract, useReadContracts, useWriteContract, useAccount } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { CONTRACTS } from '@/lib/contracts';
import { RoomWithPlayers, PlayerStake, WinnerInfo } from '@/types/lottery';
import { useMemo } from 'react';

const bettingRoomsContract = {
  address: CONTRACTS.BettingRooms.address,
  abi: CONTRACTS.BettingRooms.abi,
  chainId: sepolia.id,
} as const;

const tokenContract = {
  address: CONTRACTS.MockERC20.address,
  abi: CONTRACTS.MockERC20.abi,
  chainId: sepolia.id,
} as const;

// Get the total number of rooms
export function useNextRoomId() {
  return useReadContract({
    ...bettingRoomsContract,
    functionName: 'nextRoomId',
  });
}

// Get all rooms data with real blockchain data
export function useAllRooms() {
  const { data: nextRoomId, isLoading: isLoadingCount, error: countError } = useNextRoomId();

  const roomCount = nextRoomId ? Number(nextRoomId) : 0;

  // Create array of room IDs to fetch
  const roomIds = useMemo(() => {
    return Array.from({ length: roomCount }, (_, i) => BigInt(i));
  }, [roomCount]);

  // Batch fetch all room data
  const { data: roomsData, isLoading: isLoadingRooms, error: roomsError, refetch } = useReadContracts({
    contracts: roomIds.map((roomId) => ({
      ...bettingRoomsContract,
      functionName: 'rooms' as const,
      args: [roomId],
    })),
  });

  // Batch fetch player arrays for each room
  const { data: playersData, isLoading: isLoadingPlayers } = useReadContracts({
    contracts: roomIds.map((roomId) => ({
      ...bettingRoomsContract,
      functionName: 'getRoomPlayers' as const,
      args: [roomId],
    })),
  });

  // Build flat list of all player stake queries
  const allStakeQueries = useMemo(() => {
    if (!playersData) return [];
    
    const queries: { roomIndex: number; roomId: bigint; player: `0x${string}` }[] = [];
    
    playersData.forEach((result, roomIndex) => {
      if (result.status === 'success' && result.result) {
        const players = result.result as `0x${string}`[];
        const roomId = roomIds[roomIndex];
        players.forEach((player) => {
          queries.push({ roomIndex, roomId, player });
        });
      }
    });
    
    return queries;
  }, [playersData, roomIds]);

  // Batch fetch all player stakes
  const { data: stakesData, isLoading: isLoadingStakes } = useReadContracts({
    contracts: allStakeQueries.map((q) => ({
      ...bettingRoomsContract,
      functionName: 'getPlayerStake' as const,
      args: [q.roomId, q.player],
    })),
  });

  // Fetch withdrawable balances for winner detection
  const { data: allUsersData, isLoading: isLoadingBalances } = useReadContract({
    ...bettingRoomsContract,
    functionName: 'getAllUsersWithBalances',
  });

  const rooms: RoomWithPlayers[] = useMemo(() => {
    if (!roomsData || roomsData.length === 0) return [];

    // Build stake sums per room
    const roomStakeSums: Map<number, bigint> = new Map();
    
    if (stakesData) {
      allStakeQueries.forEach((q, i) => {
        if (stakesData[i]?.status === 'success') {
          const stake = stakesData[i].result as bigint;
          const current = roomStakeSums.get(q.roomIndex) || BigInt(0);
          roomStakeSums.set(q.roomIndex, current + stake);
        }
      });
    }

    // Parse winner data from withdrawable balances
    let winnersWithBalances: { address: `0x${string}`; balance: bigint }[] = [];
    if (allUsersData) {
      const [addresses, balances] = allUsersData as [`0x${string}`[], bigint[]];
      winnersWithBalances = addresses
        .map((addr, i) => ({ address: addr, balance: balances[i] }))
        .filter(w => w.balance > BigInt(0))
        .sort((a, b) => Number(b.balance - a.balance));
    }

    return roomsData
      .map((result, index) => {
        if (result.status !== 'success' || !result.result) return null;

        // Handle both array and object return types from wagmi
        const data = result.result;
        let roomId: bigint, minStakeAmount: bigint, maxStakeAmount: bigint, 
            settlementTimestamp: bigint, closed: boolean, settled: boolean, payoutType: number;

        if (Array.isArray(data)) {
          [roomId, minStakeAmount, maxStakeAmount, settlementTimestamp, closed, settled, payoutType] = data as [bigint, bigint, bigint, bigint, boolean, boolean, number];
        } else {
          // Object with named properties
          const obj = data as {
            roomId: bigint;
            minStakeAmount: bigint;
            maxStakeAmount: bigint;
            settlementTimestamp: bigint;
            closed: boolean;
            settled: boolean;
            payoutType: number;
          };
          roomId = obj.roomId;
          minStakeAmount = obj.minStakeAmount;
          maxStakeAmount = obj.maxStakeAmount;
          settlementTimestamp = obj.settlementTimestamp;
          closed = obj.closed;
          settled = obj.settled;
          payoutType = obj.payoutType;
        }

        const players = playersData?.[index]?.status === 'success' 
          ? (playersData[index].result as `0x${string}`[]) 
          : [];

        // Use calculated total pool from actual stakes
        const totalPool = roomStakeSums.get(index) || BigInt(0);

        // Determine winners for settled rooms
        let winners: WinnerInfo[] | undefined;
        if (settled && winnersWithBalances.length > 0) {
          // Find players from this room who have withdrawable balances
          const roomPlayerSet = new Set(players.map(p => p.toLowerCase()));
          const roomWinners = winnersWithBalances.filter(w => 
            roomPlayerSet.has(w.address.toLowerCase())
          );

          if (roomWinners.length > 0) {
            if (payoutType === 0) {
              // WINNER_TAKES_ALL
              winners = [{
                address: roomWinners[0].address,
                prize: totalPool,
                rank: 1,
              }];
            } else {
              // TOP_3
              const prizes = [50, 30, 20];
              winners = roomWinners.slice(0, 3).map((w, i) => ({
                address: w.address,
                prize: (totalPool * BigInt(prizes[i] || 0)) / BigInt(100),
                rank: i + 1,
              }));
            }
          }
        }

        return {
          roomId,
          minStakeAmount,
          maxStakeAmount,
          settlementTimestamp,
          closed,
          settled,
          payoutType,
          players,
          totalPool,
          winners,
        } as RoomWithPlayers;
      })
      .filter((room): room is RoomWithPlayers => room !== null);
  }, [roomsData, playersData, stakesData, allStakeQueries, allUsersData]);

  return {
    rooms,
    isLoading: isLoadingCount || isLoadingRooms || isLoadingPlayers || isLoadingStakes || isLoadingBalances,
    error: countError || roomsError,
    refetch,
  };
}

// Get single room with players and stakes
export function useRoom(roomId: bigint) {
  // Get room data
  const { data: roomData, isLoading: isLoadingRoom, error: roomError } = useReadContract({
    ...bettingRoomsContract,
    functionName: 'rooms',
    args: [roomId],
  });

  // Get players list
  const { data: players, isLoading: isLoadingPlayers } = useReadContract({
    ...bettingRoomsContract,
    functionName: 'getRoomPlayers',
    args: [roomId],
  });

  // Get stakes for all players
  const playerList = (players as `0x${string}`[]) || [];
  
  const { data: stakesData, isLoading: isLoadingStakes } = useReadContracts({
    contracts: playerList.map((player) => ({
      ...bettingRoomsContract,
      functionName: 'getPlayerStake' as const,
      args: [roomId, player],
    })),
  });

  const room: RoomWithPlayers | null = useMemo(() => {
    if (!roomData) return null;

    const [id, minStakeAmount, maxStakeAmount, settlementTimestamp, closed, settled, payoutType] = roomData as [bigint, bigint, bigint, bigint, boolean, boolean, number];

    // Calculate total pool from actual stakes
    let totalPool = BigInt(0);
    if (stakesData) {
      stakesData.forEach((result) => {
        if (result.status === 'success') {
          totalPool += result.result as bigint;
        }
      });
    }

    return {
      roomId: id,
      minStakeAmount,
      maxStakeAmount,
      settlementTimestamp,
      closed,
      settled,
      payoutType,
      players: playerList,
      totalPool,
    };
  }, [roomData, playerList, stakesData]);

  return {
    room,
    isLoading: isLoadingRoom || isLoadingPlayers || isLoadingStakes,
    error: roomError,
  };
}

// Get player stakes for a room
export function usePlayerStakes(roomId: bigint, players: `0x${string}`[]) {
  const { data: stakesData, isLoading } = useReadContracts({
    contracts: players.map((player) => ({
      ...bettingRoomsContract,
      functionName: 'getPlayerStake' as const,
      args: [roomId, player],
    })),
  });

  const stakes: PlayerStake[] = useMemo(() => {
    if (!stakesData) return [];

    return players.map((player, index) => ({
      player,
      stake: stakesData[index]?.status === 'success' 
        ? (stakesData[index].result as bigint) 
        : BigInt(0),
    }));
  }, [stakesData, players]);

  return { stakes, isLoading };
}

// Token balance hook
export function useTokenBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    ...tokenContract,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });
}

// Token allowance hook
export function useTokenAllowance(owner: `0x${string}` | undefined) {
  return useReadContract({
    ...tokenContract,
    functionName: 'allowance',
    args: owner ? [owner, CONTRACTS.BettingRooms.address] : undefined,
  });
}

// Token decimals hook
export function useTokenDecimals() {
  return useReadContract({
    ...tokenContract,
    functionName: 'decimals',
  });
}

// Join room write hook
export function useJoinRoom() {
  const { writeContract, isPending, isSuccess, error, data } = useWriteContract();

  const joinRoom = (roomId: bigint, stakeAmount: bigint) => {
    writeContract({
      ...bettingRoomsContract,
      functionName: 'joinRoom',
      args: [roomId, stakeAmount],
    });
  };

  return { joinRoom, isPending, isSuccess, error, txHash: data };
}

// Approve tokens write hook
export function useApproveTokens() {
  const { writeContract, isPending, isSuccess, error, data } = useWriteContract();

  const approve = (amount: bigint) => {
    writeContract({
      ...tokenContract,
      functionName: 'approve',
      args: [CONTRACTS.BettingRooms.address, amount],
    });
  };

  return { approve, isPending, isSuccess, error, txHash: data };
}

// Fetch winners for a settled room from blockchain events
export function useRoomWinners(roomId: bigint, isSettled: boolean, totalPool: bigint, payoutType: number) {
  // We'll use useReadContract to get withdrawable balances for players after settlement
  // Since the contract doesn't store winners directly, we check withdrawable balances
  
  const { data: allUsersData, isLoading } = useReadContract({
    ...bettingRoomsContract,
    functionName: 'getAllUsersWithBalances',
    query: {
      enabled: isSettled, // Only fetch if room is settled
    },
  });

  const winners = useMemo(() => {
    if (!isSettled || !allUsersData) return [];

    const [addresses, balances] = allUsersData as [`0x${string}`[], bigint[]];
    
    // Filter users with positive withdrawable balances (these are winners)
    const winnersWithBalances = addresses
      .map((addr, i) => ({ address: addr, balance: balances[i] }))
      .filter(w => w.balance > BigInt(0))
      .sort((a, b) => Number(b.balance - a.balance)); // Sort by balance descending

    // Calculate prize distribution based on payout type
    if (payoutType === 0) {
      // WINNER_TAKES_ALL - single winner gets 100%
      if (winnersWithBalances.length > 0) {
        return [{
          address: winnersWithBalances[0].address,
          prize: totalPool,
          rank: 1,
        }];
      }
    } else {
      // TOP_3 - 50%, 30%, 20% split
      const prizes = [
        { percent: 50, rank: 1 },
        { percent: 30, rank: 2 },
        { percent: 20, rank: 3 },
      ];
      
      return winnersWithBalances.slice(0, 3).map((w, i) => ({
        address: w.address,
        prize: (totalPool * BigInt(prizes[i]?.percent || 0)) / BigInt(100),
        rank: prizes[i]?.rank || i + 1,
      }));
    }

    return [];
  }, [isSettled, allUsersData, totalPool, payoutType]);

  return { winners, isLoading };
}
