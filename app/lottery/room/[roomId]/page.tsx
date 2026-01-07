'use client';

import { useParams, useRouter } from 'next/navigation';
import { useRoom, usePlayerStakes, useRoomWinners } from '@/hooks/useBettingRooms';
import { LotteryRoomDetail, LotteryRoomDetailSkeleton } from '@/components/lottery/LotteryRoomDetail';
import { JoinRoomButton } from '@/components/lottery/JoinRoomButton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getRoomStatus, RoomStatus } from '@/types/lottery';

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = BigInt(params.roomId as string);

  const { room, isLoading: isLoadingRoom, error: roomError } = useRoom(roomId);
  const { stakes, isLoading: isLoadingStakes } = usePlayerStakes(
    roomId,
    room?.players || []
  );

  // Calculate total pool from stakes
  const totalPool = stakes.reduce((acc, s) => acc + s.stake, BigInt(0));
  
  // Fetch winners for settled rooms
  const isSettled = room ? getRoomStatus(room) === RoomStatus.SETTLED : false;
  const { winners, isLoading: isLoadingWinners } = useRoomWinners(
    roomId,
    isSettled,
    totalPool,
    room?.payoutType ?? 0
  );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/lottery')}
        className="hover:bg-white/5 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Rooms
      </Button>

      {/* Error State */}
      {roomError && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive/50 mx-auto mb-3" />
          <p className="text-white font-medium mb-2">Failed to Load Room</p>
          <p className="text-sm text-muted-foreground mb-4">
            {roomError.message || 'Unable to fetch room data'}
          </p>
          <Button variant="outline" onClick={() => router.push('/lottery')}>
            Go Back
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoadingRoom && !roomError && <LotteryRoomDetailSkeleton />}

      {/* Room Content */}
      {room && !roomError && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <LotteryRoomDetail
              room={room}
              stakes={stakes}
              isLoadingStakes={isLoadingStakes}
              winners={winners}
              isLoadingWinners={isLoadingWinners}
            />
          </div>

          {/* Join Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <JoinRoomButton
                room={room}
                onSuccess={() => {
                  // Refresh room data after successful join
                  window.location.reload();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
