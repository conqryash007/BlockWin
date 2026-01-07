"use client";

import { useLivePlayerActivity } from "@/hooks/useLivePlayerActivity";
import { LiveActivityFilter, LivePlayerActivity } from "@/types/liveActivity";
import { cn } from "@/lib/utils";
import { Trophy, X, Flame, TrendingUp, Radio } from "lucide-react";

interface LivePlayerActivityFeedProps {
  filter?: LiveActivityFilter;
  className?: string;
  title?: string;
  maxItems?: number;
}

// Format bet amount with currency symbol
function formatAmount(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  if (amount >= 100) {
    return `$${amount.toFixed(0)}`;
  }
  return `$${amount.toFixed(2)}`;
}

// Get game icon based on game name
function getGameIcon(game: string): string {
  const icons: Record<string, string> = {
    'Dice': '🎲',
    'Crash': '📈',
    'Plinko': '⚡',
    'Mines': '💣',
    'Blackjack': '🃏',
    'Roulette': '🎰',
  };
  
  // Sports icons embedded in game names
  if (game.includes('vs')) {
    if (game.includes('Arsenal') || game.includes('Liverpool') || game.includes('Barcelona') || 
        game.includes('Madrid') || game.includes('City') || game.includes('Chelsea')) {
      return '⚽';
    }
    if (game.includes('Lakers') || game.includes('Warriors') || game.includes('Celtics') || game.includes('Bucks')) {
      return '🏀';
    }
    if (game.includes('MI') || game.includes('CSK') || game.includes('RCB') || game.includes('KKR')) {
      return '🏏';
    }
    if (game.includes('Djokovic') || game.includes('Alcaraz') || game.includes('Federer') || game.includes('Nadal')) {
      return '🎾';
    }
    if (game.includes('McGregor') || game.includes('Poirier')) {
      return '🥊';
    }
  }
  
  return icons[game] || '🎮';
}

function ActivityRow({ activity, isNew, showGame = true }: { activity: LivePlayerActivity; isNew: boolean; showGame?: boolean }) {
  const { username, game, betAmount, multiplier, payout, isWin, gameType } = activity;
  
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2.5 px-3 rounded-lg transition-all duration-500",
        "border border-white/5",
        isNew && "animate-in slide-in-from-top-2 fade-in duration-300",
        isWin 
          ? "bg-green-500/5 hover:bg-green-500/10 border-green-500/20" 
          : "bg-red-500/5 hover:bg-red-500/10 border-red-500/20"
      )}
    >
      {/* Left: Game + User */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Game Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-lg">
          {getGameIcon(game)}
        </div>
        
        {/* User + Game */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white truncate max-w-[80px]">
              {username}
            </span>
            {isWin && multiplier >= 5 && (
              <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            )}
          </div>
          {showGame && (
            <div className="text-xs text-muted-foreground truncate max-w-[120px]">
              {game}
            </div>
          )}
        </div>
      </div>

      {/* Center: Bet Amount */}
      <div className="flex-shrink-0 text-center px-2">
        <div className="text-xs text-muted-foreground">Bet</div>
        <div className="text-sm font-medium text-white">
          {formatAmount(betAmount)}
        </div>
      </div>

      {/* Right: Result */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isWin ? (
          <>
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-green-400">
                <TrendingUp className="w-3 h-3" />
                {multiplier.toFixed(2)}x
              </div>
              <div className="text-sm font-bold text-green-400">
                +{formatAmount(payout)}
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-green-400" />
            </div>
          </>
        ) : (
          <>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Lost</div>
              <div className="text-sm font-bold text-red-400">
                -{formatAmount(betAmount)}
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-red-400" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function LivePlayerActivityFeed({ 
  filter = 'all', 
  className,
  title = "Live Players",
  maxItems = 8
}: LivePlayerActivityFeedProps) {
  const { activities } = useLivePlayerActivity(filter);
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded bg-casino-brand" />
          <h3 className="font-bold text-white uppercase tracking-wider text-xs">
            {title}
          </h3>
          <div className="flex items-center gap-1 text-red-400">
            <Radio className="w-3 h-3 animate-pulse" />
            <span className="text-[10px] font-bold">LIVE</span>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-1.5">
        {displayedActivities.map((activity, index) => (
          <ActivityRow 
            key={activity.id} 
            activity={activity} 
            isNew={index === 0}
            showGame={activity.gameType !== 'sports'}
          />
        ))}
      </div>
    </div>
  );
}
