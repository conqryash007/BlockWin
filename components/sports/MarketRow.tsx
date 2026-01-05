"use client";

import { SportEvent, MarketType, Outcome } from "@/types/sports";
import { useBetslip } from "@/hooks/useBetslip";
import { useOddsFormat } from "@/hooks/useSportsData";
import { formatOdds, calculateImpliedProbability, isEventLive } from "@/lib/oddsUtils";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Info } from "lucide-react";

interface MarketRowProps {
  event: SportEvent;
  market: MarketType;
  outcome: Outcome;
  outcomeIndex: number;
  className?: string;
}

export function MarketRow({ event, market, outcome, outcomeIndex, className }: MarketRowProps) {
  const { addItem, items, hasOddsChanged } = useBetslip();
  const { format } = useOddsFormat();
  const isLive = isEventLive(event.commence_time, event.completed);

  const betId = `${event.id}-${market}-${outcomeIndex}`;
  const isSelected = items.some((item) => item.id === betId);
  const impliedProbability = calculateImpliedProbability(outcome.price);

  // Determine outcome display name
  let displayName = outcome.name;
  if (market === "totals" && outcome.point) {
    displayName = `${outcome.name} ${outcome.point}`;
  } else if (market === "spreads" && outcome.point) {
    displayName = `${outcome.name} ${outcome.point > 0 ? "+" : ""}${outcome.point}`;
  }

  const handleClick = () => {
    addItem({
      id: betId,
      name: displayName,
      eventId: event.id,
      eventName: `${event.home_team} vs ${event.away_team}`,
      odds: outcome.price,
      market,
      isLive,
    });
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-xl",
        "bg-casino-card border border-casino-border",
        "hover:border-casino-brand/50 hover:bg-casino-card-hover",
        "transition-all duration-200 group",
        isSelected && "border-casino-brand bg-casino-brand/10",
        className
      )}
    >
      {/* Outcome Name */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          "bg-white/5 border border-white/10",
          isSelected && "bg-casino-brand/20 border-casino-brand/30"
        )}>
          <span className={cn(
            "text-sm font-bold",
            isSelected ? "text-casino-brand" : "text-white"
          )}>
            {market === "h2h" 
              ? outcomeIndex === 0 ? "1" : outcomeIndex === 1 && outcome.name === "Draw" ? "X" : "2"
              : outcome.name.charAt(0)
            }
          </span>
        </div>
        <div className="text-left">
          <p className={cn(
            "font-medium",
            isSelected ? "text-casino-brand" : "text-white"
          )}>
            {displayName}
          </p>
          {outcome.description && (
            <p className="text-xs text-muted-foreground">{outcome.description}</p>
          )}
        </div>
      </div>

      {/* Odds Display */}
      <div className="flex items-center gap-4">
        {/* Implied Probability Tooltip */}
        <div 
          className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          title={`Implied probability: ${impliedProbability}%`}
        >
          <Info className="w-3 h-3" />
          <span>{impliedProbability}%</span>
        </div>

        {/* Odds */}
        <div className="text-right">
          <p className={cn(
            "text-xl font-bold",
            isSelected ? "text-casino-brand" : "text-casino-brand"
          )}>
            {formatOdds(outcome.price, format)}
          </p>
          {format === "decimal" && (
            <p className="text-xs text-muted-foreground">
              {formatOdds(outcome.price, "american")}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
