'use client';

import { useState, useMemo } from 'react';
import { useAllRooms } from '@/hooks/useBettingRooms';
import { LotteryRoomCard, LotteryRoomCardSkeleton } from '@/components/lottery/LotteryRoomCard';
import { LotteryRoomFilters } from '@/components/lottery/LotteryRoomFilters';
import { LotteryFilters, getRoomStatus, RoomStatus, PayoutType } from '@/types/lottery';
import { Ticket, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LotteryPage() {
  const { rooms, isLoading, error, refetch } = useAllRooms();
  const [filters, setFilters] = useState<LotteryFilters>({
    status: 'all',
    payoutType: 'all',
  });

  // Filter rooms based on selected filters
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Status filter
      if (filters.status !== 'all') {
        const roomStatus = getRoomStatus(room);
        if (roomStatus !== filters.status) return false;
      }

      // Payout type filter
      if (filters.payoutType !== 'all') {
        if (room.payoutType !== filters.payoutType) return false;
      }

      return true;
    });
  }, [rooms, filters]);

  // Sort rooms: open first, then by settlement time
  const sortedRooms = useMemo(() => {
    return [...filteredRooms].sort((a, b) => {
      const statusA = getRoomStatus(a);
      const statusB = getRoomStatus(b);

      // Open rooms first
      if (statusA === RoomStatus.OPEN && statusB !== RoomStatus.OPEN) return -1;
      if (statusA !== RoomStatus.OPEN && statusB === RoomStatus.OPEN) return 1;

      // Then by settlement time (earliest first)
      return Number(a.settlementTimestamp - b.settlementTimestamp);
    });
  }, [filteredRooms]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-casino-brand/10 border border-casino-brand/20">
            <Ticket className="w-8 h-8 text-casino-brand" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Lottery Rooms</h1>
            <p className="text-muted-foreground mt-1">
              Join betting rooms and win big with blockchain-verified fairness
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="hover:bg-casino-brand/10 hover:border-casino-brand/30"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <LotteryRoomFilters filters={filters} onFiltersChange={setFilters} />

      {/* Error State */}
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive/50 mx-auto mb-3" />
          <p className="text-white font-medium mb-2">Failed to Load Rooms</p>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || 'Unable to connect to the blockchain'}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <LotteryRoomCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Room Grid */}
      {!isLoading && !error && (
        <>
          {sortedRooms.length === 0 ? (
            <div className="rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-12 text-center">
              <Ticket className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-white font-medium text-lg mb-2">No Rooms Found</p>
              <p className="text-sm text-muted-foreground">
                {rooms.length === 0
                  ? 'No lottery rooms have been created yet'
                  : 'No rooms match your current filters'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedRooms.map((room) => (
                <LotteryRoomCard key={room.roomId.toString()} room={room} />
              ))}
            </div>
          )}

          {/* Room Count */}
          {sortedRooms.length > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Showing {sortedRooms.length} of {rooms.length} rooms
            </p>
          )}
        </>
      )}
    </div>
  );
}

