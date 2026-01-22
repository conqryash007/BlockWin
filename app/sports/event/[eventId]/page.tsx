"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { MatchInfo } from "@/components/sports/MatchInfo";
import { MarketsTabs } from "@/components/sports/MarketsTabs";
import { SportsBetSlip } from "@/components/sports/SportsBetSlip";
import { SportsEducation } from "@/components/sports/SportsEducation";
import { TeamLogo } from "@/components/sports/TeamLogo";
import { LeagueBanner } from "@/components/sports/LeagueBanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { MOCK_EVENTS } from "@/lib/mockSportsData";
import { isEventLive } from "@/lib/oddsUtils";
import { cn } from "@/lib/utils";
import { useEventOdds } from "@/hooks/useSportsData";
import { SportEvent } from "@/types/sports";
import { MatchHighlights } from "@/components/sports/MatchHighlights";

export default function EventDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.eventId as string;
  const sportKey = searchParams.get('sport') || '';
  
  // First try mock data
  const mockEvent = useMemo(() => {
    return MOCK_EVENTS.find((e) => e.id === eventId);
  }, [eventId]);

  // If sport key is provided and not in mock data, try to fetch from API
  const shouldFetchFromAPI = !mockEvent && sportKey && sportKey.length > 0;
  const { event: apiEvent, isLoading: isLoadingAPI, error: apiError } = useEventOdds(
    shouldFetchFromAPI ? sportKey : '',
    eventId,
    false, // isLive
    !shouldFetchFromAPI  // useMock - use mock if we shouldn't fetch from API
  );

  // Determine which event to use
  const event: SportEvent | null = mockEvent || (shouldFetchFromAPI ? apiEvent : null);
  const isLoading = shouldFetchFromAPI ? isLoadingAPI : false;
  const error = shouldFetchFromAPI ? apiError : null;

  const isLive = event ? isEventLive(event.commence_time, event.completed) : false;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Loader2 className="w-8 h-8 animate-spin text-casino-brand mb-4" />
        <p className="text-muted-foreground">Loading event...</p>
      </div>
    );
  }

  if (!event || error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="w-20 h-20 rounded-full bg-casino-brand/10 flex items-center justify-center mb-6">
          <Search className="w-10 h-10 text-casino-brand" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Event Not Found</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          The event you're looking for doesn't exist or has been removed. It may have been completed or the event ID is invalid.
        </p>
        <Link href="/sports">
          <Button variant="casino" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Sports
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* League Banner Header */}
      <LeagueBanner
        leagueName={event.league || event.sport_title}
        sportKey={event.sport_key}
        height="sm"
        className="-mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8"
      >
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href="/sports">
              <Button variant="ghost" size="icon" className="hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              {/* Team Logos - Show on all screens */}
              <div className="flex items-center gap-3">
                <TeamLogo teamName={event.home_team} size="xl" />
                <span className="text-2xl font-bold text-white/50">vs</span>
                <TeamLogo teamName={event.away_team} size="xl" />
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white">
                    {event.home_team} vs {event.away_team}
                  </h1>
                  {isLive && (
                    <Badge className="bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                      LIVE
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.league || event.sport_title}
                </p>
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Odds
          </Button>
        </div>
      </LeagueBanner>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Match Info (Desktop) */}
        <div className="hidden lg:block">
          <MatchInfo event={event} />
        </div>

        {/* Center Column - Markets */}
        <div className="lg:col-span-1 space-y-6">
          {/* Mobile Match Info */}
          <div className="lg:hidden">
            <MatchInfo event={event} />
          </div>
          
          {/* Markets */}
          <MarketsTabs event={event} />

          {/* Video Highlights - ScoreBat Integration (Football/Soccer only) */}
          {event.sport_key?.includes('soccer') && (
            <MatchHighlights 
              homeTeam={event.home_team} 
              awayTeam={event.away_team} 
            />
          )}
        </div>

        {/* Right Column - Bet Slip (Desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <SportsBetSlip />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bet Slip */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-casino-bg border-t border-casino-border p-4">
        <MobileBetSlipTrigger />
      </div>

      {/* How to Play Section */}
      <SportsEducation />

      {/* Bottom padding for mobile sticky bar */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}

// Mobile bet slip trigger component
function MobileBetSlipTrigger() {
  const { useBetslip } = require("@/hooks/useBetslip");
  const { items, totalStake, potentialReturn, setIsOpen } = useBetslip();

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm">
        Select odds to add to your bet slip
      </div>
    );
  }

  return (
    <Button
      variant="casino"
      className="w-full h-12 justify-between"
      onClick={() => setIsOpen(true)}
    >
      <span className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-black/20 text-sm">
          {items.length}
        </span>
        Bet Slip
      </span>
      <span className="flex items-center gap-2">
        <span className="text-sm opacity-80">${totalStake.toFixed(0)}</span>
        <span className="text-white font-bold">→ ${potentialReturn.toFixed(2)}</span>
      </span>
    </Button>
  );
}
