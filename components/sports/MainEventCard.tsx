"use client";

import { FeaturedEvent } from "@/types/sports";
import { useBetslip } from "@/hooks/useBetslip";
import { formatEventTime, isEventLive, formatOdds } from "@/lib/oddsUtils";
import { useOddsFormat } from "@/hooks/useSportsData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Radio, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TeamLogo } from "./TeamLogo";
import { LeagueBanner } from "./LeagueBanner";

interface MainEventCardProps {
  event: FeaturedEvent;
  className?: string;
}

export function MainEventCard({ event, className }: MainEventCardProps) {
  const { addItem } = useBetslip();
  const { format } = useOddsFormat();
  const isLive = isEventLive(event.commence_time, event.completed);

  const handlePlaceBet = (team: "home" | "draw" | "away") => {
    if (!event.bestOdds) return;
    
    const odds = team === "home" 
      ? event.bestOdds.home 
      : team === "draw" 
        ? event.bestOdds.draw 
        : event.bestOdds.away;

    if (!odds) return;

    const teamName = team === "home" 
      ? event.home_team 
      : team === "draw" 
        ? "Draw" 
        : event.away_team;

    addItem({
      id: `${event.id}-${team}`,
      name: `${teamName} to win`,
      eventId: event.id,
      eventName: `${event.home_team} vs ${event.away_team}`,
      odds,
      market: "h2h",
      isLive,
    });
  };

  return (
    <LeagueBanner
      leagueName={event.league || event.sport_title}
      sportKey={event.sport_key}
      height="full"
      overlay={true}
      className={cn(
        "group border border-casino-border",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-neon-hover hover:border-casino-brand/30",
        "min-h-[260px] max-h-[280px]",
        className
      )}
    >
      {/* Background gradient overlay for hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-casino-brand/5 via-transparent to-casino-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]" />
      
      <div className="relative z-10 flex h-full">
        {/* Left Side - Visual Area (60%) */}
        <div className="relative w-[60%] p-6 flex flex-col justify-between overflow-hidden">

          {/* League Badge */}
          <div className="relative z-10">
            <Badge 
              className="bg-casino-brand/10 text-casino-brand border border-casino-brand/30 hover:bg-casino-brand/20"
            >
              {event.league || event.sport_title}
            </Badge>
          </div>

          {/* Teams Display */}
          <div className="relative z-10 flex-1 flex flex-col justify-center py-4">
            {/* Home Team */}
            <div className="flex items-center gap-3 mb-4">
              <TeamLogo teamName={event.home_team} size="lg" />
              <div>
                <p className="text-xl font-bold text-white truncate max-w-[200px]">
                  {event.home_team}
                </p>
                {isLive && event.liveScore && (
                  <p className="text-3xl font-black text-casino-brand">
                    {event.liveScore.home}
                  </p>
                )}
              </div>
            </div>

            {/* VS Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-sm font-bold text-muted-foreground px-2">VS</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-3">
              <TeamLogo teamName={event.away_team} size="lg" />
              <div>
                <p className="text-xl font-bold text-white truncate max-w-[200px]">
                  {event.away_team}
                </p>
                {isLive && event.liveScore && (
                  <p className="text-3xl font-black text-casino-brand">
                    {event.liveScore.away}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Match Time / Live Period */}
          {isLive && event.liveScore && (
            <div className="relative z-10 text-sm text-muted-foreground">
              <span className="text-casino-brand font-medium">
                {event.liveScore.period} • {event.liveScore.time}
              </span>
            </div>
          )}
        </div>

        {/* Right Side - Info & Actions (40%) */}
        <div className="w-[40%] p-6 flex flex-col justify-between bg-gradient-to-l from-black/20 to-transparent">
          {/* Status Badge */}
          <div className="flex justify-end">
            {isLive ? (
              <Badge 
                className="bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                aria-label="Live match in progress"
              >
                <Radio className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            ) : (
              <Badge 
                variant="outline"
                className="border-white/20 text-muted-foreground"
              >
                <Clock className="w-3 h-3 mr-1" />
                {formatEventTime(event.commence_time)}
              </Badge>
            )}
          </div>

          {/* Best Odds Display */}
          {event.bestOdds && (
            <div className="space-y-2 my-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Best Odds • {event.bestOdds.bookmaker}
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Home Odds */}
                <button
                  onClick={() => handlePlaceBet("home")}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg",
                    "bg-white/5 border border-white/10 hover:border-casino-brand/50 hover:bg-casino-brand/10",
                    "transition-all duration-200",
                    isLive && "group-hover:animate-pulse"
                  )}
                >
                  <span className="text-xs text-muted-foreground">1</span>
                  <span className="text-lg font-bold text-casino-brand">
                    {formatOdds(event.bestOdds.home, format)}
                  </span>
                </button>

                {/* Draw Odds (if available) */}
                {event.bestOdds.draw && (
                  <button
                    onClick={() => handlePlaceBet("draw")}
                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 border border-white/10 hover:border-casino-brand/50 hover:bg-casino-brand/10 transition-all duration-200"
                  >
                    <span className="text-xs text-muted-foreground">X</span>
                    <span className="text-lg font-bold text-casino-brand">
                      {formatOdds(event.bestOdds.draw, format)}
                    </span>
                  </button>
                )}

                {/* Away Odds */}
                <button
                  onClick={() => handlePlaceBet("away")}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg",
                    "bg-white/5 border border-white/10 hover:border-casino-brand/50 hover:bg-casino-brand/10",
                    "transition-all duration-200",
                    !event.bestOdds.draw && "col-span-1"
                  )}
                >
                  <span className="text-xs text-muted-foreground">2</span>
                  <span className="text-lg font-bold text-casino-brand">
                    {formatOdds(event.bestOdds.away, format)}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Link href={`/sports/event/${event.id}`} className="block">
              <Button variant="casino" className="w-full h-10 font-bold shadow-lg shadow-casino-brand/20">
                Place Bet
              </Button>
            </Link>
            
            <Button
              variant="secondary"
              className="w-full h-9 text-sm bg-white/5 border border-white/10 hover:bg-white/10"
              disabled={!event.streamUrl}
            >
              <Play className="w-4 h-4 mr-2" />
              Watch
            </Button>
          </div>
        </div>
      </div>
    </LeagueBanner>
  );
}
