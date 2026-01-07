'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { RoomWithPlayers, getRoomStatus, RoomStatus, PayoutType, formatTokenToUSD, shortenAddress, WinnerInfo } from '@/types/lottery';
import { Users, Clock, Trophy, DollarSign, ChevronRight, Crown, Timer } from 'lucide-react';

interface LotteryRoomCardProps {
  room: RoomWithPlayers;
}

function getStatusColor(status: RoomStatus): string {
  switch (status) {
    case RoomStatus.OPEN:
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case RoomStatus.CLOSED:
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case RoomStatus.SETTLED:
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  }
}

function getPayoutLabel(payoutType: PayoutType): string {
  return payoutType === PayoutType.WINNER_TAKES_ALL ? 'Winner Takes All' : 'Top 3 Split';
}

// Live countdown timer hook
function useCountdown(settlementTimestamp: bigint, isSettled: boolean) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    if (isSettled) return;

    const calculateTime = () => {
      const now = Math.floor(Date.now() / 1000);
      const settlement = Number(settlementTimestamp);
      const diff = Math.max(0, settlement - now);

      return {
        days: Math.floor(diff / 86400),
        hours: Math.floor((diff % 86400) / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
        total: diff,
      };
    };

    setTimeLeft(calculateTime());

    const interval = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [settlementTimestamp, isSettled]);

  return timeLeft;
}

function formatCountdown(timeLeft: { days: number; hours: number; minutes: number; seconds: number; total: number }): string {
  if (timeLeft.total <= 0) return 'Ready to settle';
  
  if (timeLeft.days > 0) {
    return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`;
  }
  if (timeLeft.hours > 0) {
    return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
  }
  if (timeLeft.minutes > 0) {
    return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
  }
  return `${timeLeft.seconds}s`;
}

export function LotteryRoomCard({ room }: LotteryRoomCardProps) {
  const status = getRoomStatus(room);
  const minStake = formatTokenToUSD(room.minStakeAmount);
  const maxStake = formatTokenToUSD(room.maxStakeAmount);
  const playerCount = room.players.length;
  const timeLeft = useCountdown(room.settlementTimestamp, room.settled);
  const isSettled = status === RoomStatus.SETTLED;

  // Use actual total pool from room data
  const poolDisplay = formatTokenToUSD(room.totalPool);

  return (
    <Link href={`/lottery/room/${room.roomId.toString()}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-5 transition-all duration-300 hover:border-casino-brand/30 hover:shadow-[0_0_30px_rgba(0,255,163,0.1)] cursor-pointer">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-casino-brand/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Card Header */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isSettled ? 'bg-purple-500/10 border-purple-500/20' : 'bg-casino-brand/10 border-casino-brand/20'} border`}>
              {isSettled ? <Crown className="w-5 h-5 text-purple-400" /> : <Trophy className="w-5 h-5 text-casino-brand" />}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Room #{room.roomId.toString()}</h3>
              <p className="text-xs text-muted-foreground">{getPayoutLabel(room.payoutType)}</p>
            </div>
          </div>
          <Badge variant="outline" className={`${getStatusColor(status)} uppercase text-xs font-semibold`}>
            {status}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-3 mb-4">
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Stake Range</span>
            </div>
            <p className="text-white font-semibold text-sm">{minStake} - {maxStake}</p>
          </div>
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Players</span>
            </div>
            <p className="text-white font-semibold text-sm">{playerCount} joined</p>
          </div>
        </div>

        {/* Pool & Timer/Winner */}
        <div className="relative z-10 pt-3 border-t border-white/5">
          {isSettled && room.winners && room.winners.length > 0 ? (
            // Show winner for settled rooms
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Pool</p>
                  <p className="text-casino-brand font-bold text-lg">{poolDisplay}</p>
                </div>
                <div className="flex items-center gap-1.5 text-purple-400">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-2 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-black text-xs font-bold">
                    1
                  </div>
                  <span className="text-white text-sm font-mono">{shortenAddress(room.winners[0].address)}</span>
                  <span className="ml-auto text-casino-brand font-semibold text-sm">{formatTokenToUSD(room.winners[0].prize)}</span>
                </div>
              </div>
            </div>
          ) : (
            // Show countdown for unsettled rooms
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Pool</p>
                <p className="text-casino-brand font-bold text-lg">{poolDisplay}</p>
              </div>
              <div className="flex items-center gap-2">
                <Timer className={`w-4 h-4 ${timeLeft.total > 0 ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
                <span className={`font-medium text-sm ${timeLeft.total > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {formatCountdown(timeLeft)}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-casino-brand group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Loading skeleton
export function LotteryRoomCardSkeleton() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10" />
          <div>
            <div className="h-5 w-24 bg-white/10 rounded mb-1" />
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
        </div>
        <div className="h-5 w-16 bg-white/10 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-black/30 rounded-xl p-3 h-16" />
        <div className="bg-black/30 rounded-xl p-3 h-16" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="h-8 w-20 bg-white/10 rounded" />
        <div className="h-5 w-16 bg-white/5 rounded" />
      </div>
    </div>
  );
}
