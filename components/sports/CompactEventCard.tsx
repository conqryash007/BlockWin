"use client";

import { FeaturedEvent } from "@/types/sports";
import { formatEventTime, isEventLive, formatOdds } from "@/lib/oddsUtils";
import { useOddsFormat } from "@/hooks/useSportsData";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TeamLogo } from "./TeamLogo";

interface CompactEventCardProps {
  event: FeaturedEvent;
  className?: string;
}

export function CompactEventCard({ event, className }: CompactEventCardProps) {
  const { format } = useOddsFormat();
  const router = useRouter();
  const isLive = isEventLive(event.commence_time, event.completed);

  const handleQuickBet = () => {
    // Navigate to sports page
    router.push('/sports');
  };

  return (
    <Link href={`/sports/event/${event.id}?sport=${event.sport_key}`}>
      <div
        className={cn(
          "group relative flex items-center gap-4 p-4 rounded-xl",
          "bg-casino-card border border-casino-border",
          "hover:border-casino-brand/30 hover:bg-casino-card-hover",
          "transition-all duration-200 cursor-pointer",
          "min-w-[280px] max-w-[320px] h-[96px]",
          className
        )}
      >
        {/* Teams & Logos */}
        <div className="flex-1 min-w-0">
          {/* Home Team */}
          <div className="flex items-center gap-2 mb-1">
            <TeamLogo teamName={event.home_team} size="sm" />
            <span className="text-sm font-medium text-white truncate">
              {event.home_team}
            </span>
            {isLive && event.liveScore && (
              <span className="ml-auto text-sm font-bold text-casino-brand">
                {event.liveScore.home}
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-2">
            <TeamLogo teamName={event.away_team} size="sm" />
            <span className="text-sm font-medium text-white truncate">
              {event.away_team}
            </span>
            {isLive && event.liveScore && (
              <span className="ml-auto text-sm font-bold text-casino-brand">
                {event.liveScore.away}
              </span>
            )}
          </div>

          {/* Time / Live Status */}
          <div className="mt-1 flex items-center gap-2">
            {isLive ? (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-400 font-medium">LIVE</span>
                {event.liveScore?.time && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {event.liveScore.time}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                {formatEventTime(event.commence_time)}
              </span>
            )}
          </div>
        </div>

        {/* Odds & Bet CTA */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Best Odds Badge */}
          {event.bestOdds && (
            <Badge
              variant="secondary"
              className="bg-casino-brand/10 text-casino-brand border-casino-brand/30 text-xs font-bold"
            >
              {formatOdds(event.bestOdds.home, format)}
            </Badge>
          )}

          {/* Quick Bet Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleQuickBet();
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold",
              "bg-casino-brand text-black",
              "hover:bg-casino-brand/90 hover:shadow-lg hover:shadow-casino-brand/20",
              "transition-all duration-200"
            )}
          >
            Bet
          </button>
        </div>
      </div>
    </Link>
  );
}
