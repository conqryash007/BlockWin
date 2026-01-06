"use client";

import { useBetslip } from "@/hooks/useBetslip";
import { FeaturedGame } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { TeamLogo } from "@/components/sports/TeamLogo";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Radio } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface FeaturedGameCardProps {
  game: FeaturedGame;
  className?: string;
}

function MiniSparkline({ data }: { data?: number[] }) {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 60;
    const y = 20 - ((value - min) / range) * 16;
    return `${x},${y}`;
  }).join(' ');

  const trend = data[data.length - 1] > data[0] ? 'up' : data[data.length - 1] < data[0] ? 'down' : 'none';

  return (
    <div className="flex items-center gap-1">
      <svg width="60" height="20" className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#6b7280'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
      {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
    </div>
  );
}

export function FeaturedGameCard({ game, className }: FeaturedGameCardProps) {
  const { addItem } = useBetslip();
  const isLive = game.status === 'live';

  const handleBet = (team: 'home' | 'away', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const selection = team === 'home' ? game.home.name : game.away.name;
    const odds = team === 'home' ? game.odds.home : game.odds.away;
    
    addItem({
      id: `${game.eventId}-${team}`,
      name: selection,
      odds: odds,
      eventId: game.eventId,
      eventName: `${game.home.name} vs ${game.away.name}`,
      market: 'h2h',
      isLive: isLive,
    });
    
    toast.success(`Added ${selection} @ ${odds.toFixed(2)}`, {
      description: `${game.home.name} vs ${game.away.name}`,
      duration: 2000,
    });
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex-shrink-0"
    >
      <Link href="/sports">
        <div 
          className={cn(
            "relative w-[280px] p-4 rounded-2xl overflow-hidden",
            "bg-gradient-to-br from-[#1a1c24] via-[#141620] to-[#0f1015]",
            "border border-white/[0.08]",
            "transition-all duration-300",
            "hover:border-casino-brand/40",
            "hover:shadow-[0_8px_32px_rgba(0,255,163,0.15),0_0_0_1px_rgba(0,255,163,0.1)]",
            "cursor-pointer group",
            className
          )}
        >
          {/* Hover glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-casino-brand/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Card content - relative to stay above overlay */}
          <div className="relative z-10">
          {/* League Badge & Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{game.leagueIcon}</span>
              <span className="text-xs text-muted-foreground font-medium truncate max-w-[120px]">
                {game.league}
              </span>
            </div>
            {isLive ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                {game.period || 'LIVE'}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {new Date(game.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            )}
          </div>

          {/* Teams */}
          <div className="space-y-3 mb-4">
            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TeamLogo teamName={game.home.name} size="sm" />
                <span className="text-sm font-medium text-white truncate max-w-[100px]">
                  {game.home.name}
                </span>
              </div>
              {game.home.score !== null && game.home.score !== undefined && (
                <span className="text-lg font-bold text-white">
                  {game.home.score}
                </span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TeamLogo teamName={game.away.name} size="sm" />
                <span className="text-sm font-medium text-white truncate max-w-[100px]">
                  {game.away.name}
                </span>
              </div>
              {game.away.score !== null && game.away.score !== undefined && (
                <span className="text-lg font-bold text-white">
                  {game.away.score}
                </span>
              )}
            </div>
          </div>

          {/* Sparkline */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Odds Movement
            </span>
            <MiniSparkline data={game.sparkline} />
          </div>

          {/* Odds Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-casino-brand/20 hover:border-casino-brand/30 hover:text-casino-brand font-mono text-sm font-bold transition-all duration-200"
              onClick={(e) => handleBet('home', e)}
            >
              {game.odds.home.toFixed(2)}
            </Button>
            {game.odds.draw !== undefined && (
              <Button
                size="sm"
                variant="ghost"
                className="h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-casino-brand/20 hover:border-casino-brand/30 hover:text-casino-brand font-mono text-sm font-bold col-span-2 transition-all duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addItem({
                    id: `${game.eventId}-draw`,
                    name: 'Draw',
                    odds: game.odds.draw!,
                    eventId: game.eventId,
                    eventName: `${game.home.name} vs ${game.away.name}`,
                    market: 'h2h',
                    isLive: isLive,
                  });
                  toast.success(`Added Draw @ ${game.odds.draw!.toFixed(2)}`);
                }}
              >
                X {game.odds.draw.toFixed(2)}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-casino-brand/20 hover:border-casino-brand/30 hover:text-casino-brand font-mono text-sm font-bold transition-all duration-200",
                game.odds.draw === undefined && "col-span-1"
              )}
              onClick={(e) => handleBet('away', e)}
            >
              {game.odds.away.toFixed(2)}
            </Button>
          </div>
          </div> {/* End of relative z-10 wrapper */}
        </div>
      </Link>
    </motion.div>
  );
}
