'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RoomWithPlayers, PlayerStake, getRoomStatus, RoomStatus, PayoutType, formatTokenToUSD, shortenAddress, WinnerInfo } from '@/types/lottery';
import { Trophy, Users, Clock, DollarSign, AlertCircle, CheckCircle2, Crown, Timer, Award } from 'lucide-react';

interface LotteryRoomDetailProps {
  room: RoomWithPlayers;
  stakes: PlayerStake[];
  isLoadingStakes: boolean;
  winners?: WinnerInfo[];
  isLoadingWinners?: boolean;
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

function getStatusIcon(status: RoomStatus) {
  switch (status) {
    case RoomStatus.OPEN:
      return <CheckCircle2 className="w-4 h-4" />;
    case RoomStatus.CLOSED:
      return <AlertCircle className="w-4 h-4" />;
    case RoomStatus.SETTLED:
      return <Crown className="w-4 h-4" />;
  }
}

function getPayoutLabel(payoutType: PayoutType): string {
  return payoutType === PayoutType.WINNER_TAKES_ALL ? 'Winner Takes All' : 'Top 3 Split (50/30/20)';
}

function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return 'from-yellow-400 to-amber-500';
    case 2:
      return 'from-gray-300 to-gray-400';
    case 3:
      return 'from-amber-600 to-orange-700';
    default:
      return 'from-gray-500 to-gray-600';
  }
}

function getRankLabel(rank: number): string {
  switch (rank) {
    case 1:
      return '1st Place';
    case 2:
      return '2nd Place';
    case 3:
      return '3rd Place';
    default:
      return `${rank}th Place`;
  }
}

// Live countdown hook
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

export function LotteryRoomDetail({ room, stakes, isLoadingStakes, winners, isLoadingWinners }: LotteryRoomDetailProps) {
  const status = getRoomStatus(room);
  const isSettled = status === RoomStatus.SETTLED;
  const timeLeft = useCountdown(room.settlementTimestamp, isSettled);
  const totalPool = stakes.reduce((acc, s) => acc + s.stake, BigInt(0));

  // Calculate progress for timer
  const now = Math.floor(Date.now() / 1000);
  const settlement = Number(room.settlementTimestamp);
  const totalDuration = 7 * 24 * 60 * 60; // Assume 7 days
  const elapsed = totalDuration - Math.max(0, settlement - now);
  const progress = isSettled ? 100 : Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  return (
    <div className="space-y-6">
      {/* Room Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-6">
        <div className="absolute inset-0 bg-gradient-to-tr from-casino-brand/10 via-transparent to-purple-500/10 opacity-50" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isSettled ? 'bg-purple-500/10 border-purple-500/20' : 'bg-casino-brand/10 border-casino-brand/20'} border`}>
                {isSettled ? <Crown className="w-8 h-8 text-purple-400" /> : <Trophy className="w-8 h-8 text-casino-brand" />}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Lottery Room #{room.roomId.toString()}
                </h1>
                <p className="text-muted-foreground mt-1">{getPayoutLabel(room.payoutType)}</p>
              </div>
            </div>
            <Badge variant="outline" className={`${getStatusColor(status)} text-sm font-semibold px-4 py-2 flex items-center gap-2`}>
              {getStatusIcon(status)}
              {status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Winner Section - Only for settled rooms */}
      {isSettled && (
        <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-[#0f1115] border border-purple-500/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">Winners</span>
          </div>

          {isLoadingWinners ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-black/30 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="h-4 w-32 bg-white/10 rounded" />
                  <div className="ml-auto h-4 w-20 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          ) : winners && winners.length > 0 ? (
            <div className="space-y-3">
              {winners.map((winner, index) => (
                <div
                  key={winner.address}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    winner.rank === 1 
                      ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30' 
                      : 'bg-black/30 border-white/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRankColor(winner.rank)} flex items-center justify-center text-black font-bold shadow-lg`}>
                    {winner.rank}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-mono text-sm">{shortenAddress(winner.address)}</p>
                    <p className="text-xs text-muted-foreground">{getRankLabel(winner.rank)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-casino-brand font-bold text-lg">{formatTokenToUSD(winner.prize)}</p>
                    <p className="text-xs text-muted-foreground">Won</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Crown className="w-12 h-12 text-purple-400/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Winner information unavailable</p>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <DollarSign className="w-4 h-4" />
            <span>Min Stake</span>
          </div>
          <p className="text-white font-bold text-xl">{formatTokenToUSD(room.minStakeAmount)}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <DollarSign className="w-4 h-4" />
            <span>Max Stake</span>
          </div>
          <p className="text-white font-bold text-xl">{formatTokenToUSD(room.maxStakeAmount)}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Users className="w-4 h-4" />
            <span>Players</span>
          </div>
          <p className="text-white font-bold text-xl">{room.players.length}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Trophy className="w-4 h-4 text-casino-brand" />
            <span>Total Pool</span>
          </div>
          <p className="text-casino-brand font-bold text-xl">{formatTokenToUSD(totalPool)}</p>
        </div>
      </div>

      {/* Time Progress / Countdown - Only for non-settled rooms */}
      {!isSettled && (
        <div className="rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Timer className={`w-5 h-5 ${timeLeft.total > 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-white font-medium">Settlement Countdown</span>
            </div>
          </div>
          
          {/* Large Countdown Display */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
              <p className="text-2xl md:text-3xl font-bold text-white">{timeLeft.days}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Days</p>
            </div>
            <div className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
              <p className="text-2xl md:text-3xl font-bold text-white">{timeLeft.hours}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Hours</p>
            </div>
            <div className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
              <p className="text-2xl md:text-3xl font-bold text-white">{timeLeft.minutes}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Mins</p>
            </div>
            <div className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
              <p className={`text-2xl md:text-3xl font-bold ${timeLeft.total > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {timeLeft.seconds}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Secs</p>
            </div>
          </div>

          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Started</span>
            <span>{timeLeft.total > 0 ? 'Settlement' : 'Ready to settle'}</span>
          </div>
        </div>
      )}

      {/* Players List */}
      <div className="rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-muted-foreground" />
          <span className="text-white font-medium">Players ({room.players.length})</span>
        </div>

        {room.players.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No players have joined yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Be the first to join this room!</p>
          </div>
        ) : isLoadingStakes ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-black/30 animate-pulse">
                <div className="h-4 w-32 bg-white/10 rounded" />
                <div className="h-4 w-20 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stakes.map((stake, index) => {
              // Check if this player is a winner
              const winnerInfo = winners?.find(w => w.address.toLowerCase() === stake.player.toLowerCase());
              
              return (
                <div
                  key={stake.player}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    winnerInfo 
                      ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30' 
                      : 'bg-black/30 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm w-6">#{index + 1}</span>
                    <span className="text-white font-mono text-sm">{shortenAddress(stake.player)}</span>
                    {winnerInfo && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                        {getRankLabel(winnerInfo.rank)}
                      </Badge>
                    )}
                  </div>
                  <span className="text-casino-brand font-semibold">{formatTokenToUSD(stake.stake)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Loading skeleton
export function LotteryRoomDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-2xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10" />
          <div>
            <div className="h-8 w-48 bg-white/10 rounded mb-2" />
            <div className="h-4 w-24 bg-white/5 rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-4">
            <div className="h-4 w-16 bg-white/5 rounded mb-2" />
            <div className="h-6 w-20 bg-white/10 rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-5 h-40" />
      <div className="rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-5 h-64" />
    </div>
  );
}
