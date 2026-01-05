"use client";

import { SportEvent } from "@/types/sports";
import { isEventLive, formatEventTime } from "@/lib/oddsUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Radio, Clock, Play, MapPin } from "lucide-react";

interface MatchInfoProps {
  event: SportEvent;
  className?: string;
}

export function MatchInfo({ event, className }: MatchInfoProps) {
  const isLive = isEventLive(event.commence_time, event.completed);
  
  // Get scores if available
  const homeScore = event.scores?.find((s) => s.name === event.home_team)?.score;
  const awayScore = event.scores?.find((s) => s.name === event.away_team)?.score;

  return (
    <div className={cn(
      "rounded-2xl border border-casino-border bg-gradient-to-br from-casino-card to-casino-bg p-6",
      className
    )}>
      {/* Header with League & Status */}
      <div className="flex items-center justify-between mb-6">
        <Badge variant="outline" className="border-white/20 text-muted-foreground">
          <MapPin className="w-3 h-3 mr-1" />
          {event.league || event.sport_title}
        </Badge>
        
        {isLive ? (
          <Badge className="bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse" aria-label="Live match">
            <Radio className="w-3 h-3 mr-1" />
            LIVE
          </Badge>
        ) : (
          <Badge variant="outline" className="border-white/20 text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            {formatEventTime(event.commence_time)}
          </Badge>
        )}
      </div>

      {/* Teams Display */}
      <div className="flex items-center justify-between gap-4">
        {/* Home Team */}
        <div className="flex-1 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
            <span className="text-4xl font-black text-white">
              {event.home_team.charAt(0)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{event.home_team}</h3>
          <p className="text-xs text-muted-foreground">Home</p>
          
          {/* Live Score */}
          {isLive && homeScore !== undefined && (
            <div className="mt-3">
              <span className="text-5xl font-black text-casino-brand">
                {homeScore}
              </span>
            </div>
          )}
        </div>

        {/* VS Divider */}
        <div className="flex flex-col items-center gap-2 px-4">
          {isLive ? (
            <div className="text-center">
              <div className="text-3xl font-bold text-muted-foreground">-</div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-muted-foreground">VS</div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
            <span className="text-4xl font-black text-white">
              {event.away_team.charAt(0)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{event.away_team}</h3>
          <p className="text-xs text-muted-foreground">Away</p>
          
          {/* Live Score */}
          {isLive && awayScore !== undefined && (
            <div className="mt-3">
              <span className="text-5xl font-black text-casino-brand">
                {awayScore}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stream Button (if available) */}
      {event.streamUrl && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <Button 
            variant="secondary" 
            className="w-full bg-white/5 border border-white/10 hover:bg-white/10"
          >
            <Play className="w-4 h-4 mr-2" />
            Watch Live Stream
          </Button>
        </div>
      )}
    </div>
  );
}
