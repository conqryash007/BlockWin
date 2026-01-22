"use client";

import { useState } from "react";
import { FeaturedEvent } from "@/types/sports";
import { useBetslip } from "@/hooks/useBetslip";
import { formatEventTime, isEventLive, formatOdds } from "@/lib/oddsUtils";
import { useOddsFormat } from "@/hooks/useSportsData";
import { useMatchVideos } from "@/hooks/useScorebatVideos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Radio, Clock, TrendingUp, X, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TeamLogo } from "./TeamLogo";
import { LeagueBanner } from "./LeagueBanner";
import { VideoPlayer } from "./VideoPlayer";

interface MainEventCardProps {
  event: FeaturedEvent;
  className?: string;
}

export function MainEventCard({ event, className }: MainEventCardProps) {
  const { addItem } = useBetslip();
  const { format } = useOddsFormat();
  const isLive = isEventLive(event.commence_time, event.completed);
  
  // Fetch match videos from ScoreBat
  const { matchVideos, isLoading: isLoadingVideos } = useMatchVideos(
    event.home_team,
    event.away_team
  );
  
  // State for video modal
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  const hasVideos = matchVideos && matchVideos.videos.length > 0;

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

  const handleWatchClick = () => {
    if (hasVideos) {
      setSelectedVideoIndex(0);
      setShowVideoModal(true);
    }
  };

  return (
    <>
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
          {/* Left Side - Visual Area (60%) - Clickable to go to event page */}
          <Link 
            href={`/sports/event/${event.id}?sport=${event.sport_key}`}
            className="relative w-[60%] p-6 flex flex-col justify-between overflow-hidden cursor-pointer hover:bg-white/5 transition-colors"
          >

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
          </Link>

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
                className={cn(
                  "w-full h-9 text-sm border transition-all",
                  hasVideos 
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20" 
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
                disabled={!hasVideos && !isLoadingVideos}
                onClick={handleWatchClick}
              >
                {isLoadingVideos ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </>
                ) : hasVideos ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Watch Highlights
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2 opacity-50" />
                    No Stream
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </LeagueBanner>

      {/* Video Modal */}
      {showVideoModal && matchVideos && matchVideos.videos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0" 
            onClick={() => setShowVideoModal(false)} 
          />
          
          {/* Modal content */}
          <div className="relative z-10 w-full max-w-4xl">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Video title */}
            <div className="mb-4">
              <h3 className="text-white text-xl font-bold">{matchVideos.title}</h3>
              <p className="text-white/60 text-sm">{matchVideos.competition}</p>
            </div>

            {/* Video player */}
            <div className="rounded-xl overflow-hidden">
              <VideoPlayer
                embedHtml={matchVideos.videos[selectedVideoIndex].embed}
                title={matchVideos.videos[selectedVideoIndex].title}
                autoPlay={true}
                showControls={false}
              />
            </div>

            {/* Video selector if multiple */}
            {matchVideos.videos.length > 1 && (
              <div className="mt-4">
                <p className="text-white/60 text-sm mb-2">More videos:</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {matchVideos.videos.map((v, index) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVideoIndex(index)}
                      className={cn(
                        "flex-shrink-0 px-3 py-1.5 rounded-lg text-sm transition-colors",
                        index === selectedVideoIndex
                          ? "bg-casino-brand text-black font-medium"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      )}
                    >
                      {v.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
