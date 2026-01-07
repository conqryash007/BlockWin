"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Ticket, 
  Trophy, 
  Sparkles,
  ArrowRight,
  Zap,
  Users,
  Timer,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAllRooms } from "@/hooks/useBettingRooms";
import { RoomWithPlayers, getRoomStatus, RoomStatus, formatTokenToUSD, PayoutType } from "@/types/lottery";

const GAMING_ITEMS = [
  {
    id: "dice",
    title: "Dice",
    description: "Roll & multiply your wins",
    image: "/images/dice.png",
    href: "/casino/dice",
    color: "from-blue-500 to-cyan-400",
    shadowColor: "shadow-blue-500/30",
    badge: "HOT",
  },
  {
    id: "crash",
    title: "Crash",
    description: "Ride the multiplier wave",
    image: "/images/crash.png",
    href: "/casino/crash",
    color: "from-red-500 to-orange-400",
    shadowColor: "shadow-red-500/30",
    badge: "LIVE",
  },
  {
    id: "plinko",
    title: "Plinko",
    description: "Drop & win big prizes",
    image: "/images/plinko.png",
    href: "/casino/plinko",
    color: "from-purple-500 to-pink-400",
    shadowColor: "shadow-purple-500/30",
  },
  {
    id: "mines",
    title: "Mines",
    description: "Uncover gems, avoid mines",
    image: "/images/mines.png",
    href: "/casino/mines",
    color: "from-yellow-500 to-amber-400",
    shadowColor: "shadow-yellow-500/30",
    badge: "NEW",
  },
];

interface GamingLotterySectionProps {
  className?: string;
}

const BADGE_STYLES: Record<string, string> = {
  HOT: "bg-orange-500 text-white",
  LIVE: "bg-red-500 text-white animate-pulse",
  NEW: "bg-casino-brand text-black",
};

// Live countdown hook
function useCountdown(settlementTimestamp: bigint) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
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
  }, [settlementTimestamp]);

  return timeLeft;
}

function formatCountdown(timeLeft: { days: number; hours: number; minutes: number; seconds: number; total: number }): string {
  if (timeLeft.total <= 0) return 'Ending soon';
  
  if (timeLeft.days > 0) {
    return `${timeLeft.days}d ${timeLeft.hours}h`;
  }
  if (timeLeft.hours > 0) {
    return `${timeLeft.hours}h ${timeLeft.minutes}m`;
  }
  if (timeLeft.minutes > 0) {
    return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
  }
  return `${timeLeft.seconds}s`;
}

// Single live lottery room card component
function LiveLotteryRoomCard({ room, index }: { room: RoomWithPlayers; index: number }) {
  const timeLeft = useCountdown(room.settlementTimestamp);
  const poolDisplay = formatTokenToUSD(room.totalPool);
  const playerCount = room.players.length;
  const payoutLabel = room.payoutType === PayoutType.WINNER_TAKES_ALL ? 'Winner Takes All' : 'Top 3 Split';
  
  // Determine color based on room index for variety
  const colors = [
    "from-casino-brand to-emerald-400",
    "from-amber-500 to-yellow-300",
    "from-purple-500 to-pink-400",
  ];
  const color = colors[index % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.4, duration: 0.3 }}
    >
      <Link href={`/lottery/room/${room.roomId.toString()}`}>
        <div className={cn(
          "group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300",
          "bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10",
          "hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/10"
        )}>
          {/* Gradient Background */}
          <div className={cn(
            "absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity",
            `bg-gradient-to-r ${color}`
          )} />
          
          <div className="relative p-5">
            {/* Header with room info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                  `bg-gradient-to-br ${color}`,
                  "group-hover:scale-110 group-hover:shadow-lg"
                )}>
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white group-hover:text-yellow-400 transition-colors">
                    Room #{room.roomId.toString()}
                  </h4>
                  <p className="text-xs text-muted-foreground">{payoutLabel}</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <span className="text-emerald-400 text-xs font-semibold uppercase">Live</span>
              </div>
            </div>
            
            {/* Pool and Stats */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Prize Pool</p>
                <div className="text-xl font-black bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">
                  {poolDisplay}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{playerCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Timer className={`w-4 h-4 ${timeLeft.total > 0 ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
                  <span className={timeLeft.total > 0 ? 'text-emerald-400' : 'text-amber-400'}>
                    {formatCountdown(timeLeft)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* CTA */}
            <Button 
              size="sm"
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-bold hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
            >
              Join Now
            </Button>
          </div>
          
          {/* Animated Shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
        </div>
      </Link>
    </motion.div>
  );
}

// Loading skeleton for lottery rooms
function LotteryRoomSkeleton() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/10" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-white/10 rounded mb-1" />
          <div className="h-3 w-16 bg-white/5 rounded" />
        </div>
        <div className="h-5 w-12 bg-white/10 rounded-full" />
      </div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="h-3 w-16 bg-white/5 rounded mb-1" />
          <div className="h-6 w-20 bg-white/10 rounded" />
        </div>
        <div className="flex gap-4">
          <div className="h-4 w-10 bg-white/10 rounded" />
          <div className="h-4 w-16 bg-white/10 rounded" />
        </div>
      </div>
      <div className="h-8 w-full bg-white/10 rounded" />
    </div>
  );
}

export function GamingLotterySection({ className }: GamingLotterySectionProps) {
  const { rooms, isLoading } = useAllRooms();
  
  // Get open rooms sorted by pool size (highest first), then by settlement time (soonest first)
  const liveRooms = useMemo(() => {
    return rooms
      .filter((room) => getRoomStatus(room) === RoomStatus.OPEN)
      .sort((a, b) => {
        // First by pool size (descending)
        const poolDiff = Number(b.totalPool - a.totalPool);
        if (poolDiff !== 0) return poolDiff;
        // Then by settlement time (ascending - soonest first)
        return Number(a.settlementTimestamp - b.settlementTimestamp);
      })
      .slice(0, 3); // Show top 3 rooms
  }, [rooms]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Gaming Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-casino-brand" />
            <h3 className="text-lg font-bold text-white">Quick Games</h3>
          </div>
          <Link href="/casino" className="text-sm text-muted-foreground hover:text-casino-brand transition-colors flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GAMING_ITEMS.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Link href={game.href}>
                <div className={cn(
                  "group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 aspect-[4/5]",
                  "bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10",
                  "hover:border-white/20 hover:shadow-lg",
                  game.shadowColor && `hover:${game.shadowColor}`
                )}>
                  {/* Background Image */}
                  <Image
                    src={game.image}
                    alt={game.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  
                  {/* Badge */}
                  {game.badge && (
                    <div className={cn(
                      "absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider z-10",
                      BADGE_STYLES[game.badge]
                    )}>
                      {game.badge}
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <h4 className="text-base font-bold text-white mb-1 group-hover:text-casino-brand transition-colors">
                      {game.title}
                    </h4>
                    <p className="text-xs text-gray-300 line-clamp-1">
                      {game.description}
                    </p>
                  </div>
                  
                  {/* Play Hover Indicator */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="w-12 h-12 rounded-full bg-casino-brand/90 flex items-center justify-center shadow-lg shadow-casino-brand/50">
                      <Zap className="w-6 h-6 text-black" />
                    </div>
                  </div>
                  
                  {/* Hover Glow */}
                  <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                    "border-2 border-casino-brand/50"
                  )} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Lottery Section - Live Rooms */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-bold text-white">Live Lottery Rooms</h3>
          </div>
          <Link href="/lottery" className="text-sm text-muted-foreground hover:text-yellow-400 transition-colors flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <LotteryRoomSkeleton />
            <LotteryRoomSkeleton />
            <div className="hidden lg:block">
              <LotteryRoomSkeleton />
            </div>
          </div>
        )}
        
        {/* Live Rooms Grid */}
        {!isLoading && liveRooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveRooms.map((room, index) => (
              <LiveLotteryRoomCard key={room.roomId.toString()} room={room} index={index} />
            ))}
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && liveRooms.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <Link href="/lottery">
              <div className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/10 p-8 text-center">
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-r from-amber-500 to-yellow-300" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                    No Live Rooms Available
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Check back soon for new lottery rooms or view all rooms
                  </p>
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-bold hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
                  >
                    Browse All Rooms
                  </Button>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              </div>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
