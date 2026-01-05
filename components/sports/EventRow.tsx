"use client";

import { SportEvent, MarketType } from "@/types/sports";
import { useBetslip } from "@/hooks/useBetslip";
import { useOddsFormat } from "@/hooks/useSportsData";
import { formatEventTime, isEventLive, formatOdds, calculateImpliedProbability } from "@/lib/oddsUtils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Radio } from "lucide-react";
import { TeamLogo } from "./TeamLogo";

interface EventRowProps {
  event: SportEvent;
  market?: MarketType;
  className?: string;
}

export function EventRow({ event, market = "h2h", className }: EventRowProps) {
  const { addItem, items } = useBetslip();
  const { format } = useOddsFormat();
  const isLive = isEventLive(event.commence_time, event.completed);

  // Get market data from first bookmaker
  const bookmaker = event.bookmakers?.[0];
  const marketData = bookmaker?.markets?.find((m) => m.key === market);
  const outcomes = marketData?.outcomes || [];

  // Get scores if live
  const homeScore = event.scores?.find((s) => s.name === event.home_team)?.score;
  const awayScore = event.scores?.find((s) => s.name === event.away_team)?.score;

  const handleBetClick = (outcomeIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const outcome = outcomes[outcomeIndex];
    if (!outcome) return;

    const betId = `${event.id}-${market}-${outcomeIndex}`;
    
    // Determine bet name based on market type
    let betName = outcome.name;
    if (market === "h2h") {
      betName = outcome.name === "Draw" ? "Draw" : `${outcome.name} to win`;
    } else if (market === "totals" && outcome.point) {
      betName = `${outcome.name} ${outcome.point}`;
    } else if (market === "spreads" && outcome.point) {
      betName = `${outcome.name} ${outcome.point > 0 ? "+" : ""}${outcome.point}`;
    }

    addItem({
      id: betId,
      name: betName,
      eventId: event.id,
      eventName: `${event.home_team} vs ${event.away_team}`,
      odds: outcome.price,
      market,
      isLive,
    });
  };

  const isSelected = (index: number) => {
    const betId = `${event.id}-${market}-${index}`;
    return items.some((item) => item.id === betId);
  };

  return (
    <Link href={`/sports/event/${event.id}`}>
      <div
        className={cn(
          "group flex flex-col md:flex-row items-stretch md:items-center gap-4 p-4",
          "bg-casino-card border border-casino-border rounded-xl",
          "hover:border-casino-brand/30 hover:bg-casino-card-hover",
          "transition-all duration-200 cursor-pointer",
          className
        )}
      >
        {/* Time & Status */}
        <div className="flex items-center gap-3 md:w-24 shrink-0">
          {isLive ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-400">LIVE</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {formatEventTime(event.commence_time)}
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Home Team */}
              <div className="flex items-center gap-2 mb-1">
                <TeamLogo teamName={event.home_team} size="sm" />
                <span className="text-sm font-medium text-white truncate">
                  {event.home_team}
                </span>
              </div>
              {/* Away Team */}
              <div className="flex items-center gap-2">
                <TeamLogo teamName={event.away_team} size="sm" />
                <span className="text-sm font-medium text-white truncate">
                  {event.away_team}
                </span>
              </div>
            </div>

            {/* Live Scores */}
            {isLive && (homeScore || awayScore) && (
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-casino-brand mb-1">
                  {homeScore || "0"}
                </div>
                <div className="text-lg font-bold text-casino-brand">
                  {awayScore || "0"}
                </div>
              </div>
            )}
          </div>

          {/* League */}
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {event.league || event.sport_title}
          </p>
        </div>

        {/* Odds Buttons */}
        <div className="flex gap-2 shrink-0 mt-2 md:mt-0">
          {outcomes.map((outcome, index) => (
            <Button
              key={index}
              variant="secondary"
              size="sm"
              onClick={(e) => handleBetClick(index, e)}
              className={cn(
                "flex-col h-14 w-16 md:w-20 gap-0.5",
                "bg-secondary/50 hover:bg-secondary border border-white/5",
                "hover:border-casino-brand/50 hover:shadow-lg hover:shadow-casino-brand/10",
                "transition-all duration-200",
                isSelected(index) && "bg-casino-brand/20 border-casino-brand text-casino-brand"
              )}
              title={`Implied probability: ${calculateImpliedProbability(outcome.price)}%`}
            >
              <span className="text-[10px] text-muted-foreground">
                {market === "h2h" 
                  ? (outcomes.length === 3 
                      ? ["1", "X", "2"][index] 
                      : ["1", "2"][index])
                  : outcome.point 
                    ? `${outcome.name.charAt(0)}${outcome.point > 0 ? "+" : ""}${outcome.point}`
                    : outcome.name.charAt(0)
                }
              </span>
              <span className={cn(
                "text-sm font-bold",
                isSelected(index) ? "text-casino-brand" : "text-casino-brand"
              )}>
                {formatOdds(outcome.price, format)}
              </span>
            </Button>
          ))}

          {/* Fallback if no outcomes */}
          {outcomes.length === 0 && (
            <span className="text-xs text-muted-foreground">No odds available</span>
          )}
        </div>
      </div>
    </Link>
  );
}
