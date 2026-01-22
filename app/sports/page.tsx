"use client";

import { useState, useMemo } from "react";
import { MainEventsStrip } from "@/components/sports/MainEventsStrip";
import { EventFilters } from "@/components/sports/EventFilters";
import { LeagueSection } from "@/components/sports/LeagueSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle, Trophy } from "lucide-react";
import { useLazySportEvents } from "@/hooks/useSportsData";
import { EventFilters as EventFiltersType, SportEvent } from "@/types/sports";
import { SPORT_CATEGORIES } from "@/lib/mockSportsData";
import { isEventLive } from "@/lib/oddsUtils";
import { LivePlayerActivityFeed } from "@/components/dashboard/LivePlayerActivityFeed";
import { MySportsBets } from "@/components/sports/MySportsBets";
import { LiveVideoFeed } from "@/components/sports/LiveVideoFeed";

export default function SportsPage() {
  // Start with no sport selected to avoid unnecessary API calls (0 credits on load)
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFiltersType>({
    status: "all",
    market: "h2h",
    oddsFormat: "decimal",
  });

  // OPTIMIZED: Uses lazy loading - only fetches when a sport is selected (1 credit per sport)
  const { events: allEvents, isLoading, error, refetch } = useLazySportEvents(selectedSport);

  // Filter events based on status filter only (sport already filtered by API)
  const filteredEvents = useMemo(() => {
    let events = allEvents;

    // Filter by status
    if (filters.status === "live") {
      events = events.filter((e) => isEventLive(e.commence_time, e.completed));
    } else if (filters.status === "upcoming") {
      events = events.filter((e) => !isEventLive(e.commence_time, e.completed) && !e.completed);
    }

    return events;
  }, [allEvents, filters.status]);

  // Group events by league
  const eventsByLeague = useMemo(() => {
    const grouped: Record<string, SportEvent[]> = {};
    
    filteredEvents.forEach((event) => {
      const league = event.league || event.sport_title;
      if (!grouped[league]) {
        grouped[league] = [];
      }
      grouped[league].push(event);
    });

    return grouped;
  }, [filteredEvents]);

  const leagues = Object.keys(eventsByLeague);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Sports Betting</h1>
          <p className="text-muted-foreground mt-1">
            Bet on your favorite sports with the best odds
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Odds
        </Button>
      </div>

      {/* Main Events Strip */}
      <MainEventsStrip showFeaturedCard={true} />

      {/* Football Video Highlights - ScoreBat Integration */}
      <LiveVideoFeed 
        title="Football Video Highlights" 
        limit={8} 
        showRefresh={true} 
      />

      {/* Sport Category Pills */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={`cursor-pointer transition-all ${
            !selectedSport
              ? "bg-casino-brand text-black border-casino-brand"
              : "hover:bg-white/10"
          }`}
          onClick={() => setSelectedSport(null)}
        >
          All Sports
        </Badge>
        {SPORT_CATEGORIES.map((cat) => (
          <Badge
            key={cat.key}
            variant="outline"
            className={`cursor-pointer transition-all ${
              selectedSport === cat.key
                ? "bg-casino-brand text-black border-casino-brand"
                : "hover:bg-white/10"
            }`}
            onClick={() => setSelectedSport(cat.key)}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.label}
          </Badge>
        ))}
      </div>

      {/* Filters */}
      <EventFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      {/* Events by League */}
      {!selectedSport ? (
        // No sport selected - prompt user to select one (0 API credits used)
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white/5 rounded-xl border border-white/10">
          <Trophy className="w-12 h-12 text-casino-brand opacity-70" />
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Select a Sport</h3>
            <p className="text-muted-foreground max-w-md">
              Choose a sport category above to view live events and odds
            </p>
          </div>
        </div>
      ) : isLoading && allEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-casino-brand" />
          <p className="text-muted-foreground">Loading {selectedSport} events...</p>
        </div>
      ) : error && allEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="w-8 h-8 text-yellow-500" />
          <p className="text-yellow-400">{error}</p>
          <Button variant="outline" size="sm" onClick={refetch}>
            Try Again
          </Button>
        </div>
      ) : leagues.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No events found for the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {leagues.map((league) => (
            <LeagueSection
              key={league}
              league={league}
              events={eventsByLeague[league]}
              market={filters.market}
              defaultOpen={true}
            />
          ))}
        </div>
      )}

      {/* Live Sports Betting Activity */}
      <LivePlayerActivityFeed filter="sports" title="Live Sports Bets" maxItems={6} />

      {/* My Sports Bets */}
      <MySportsBets showSummary={true} maxHeight="400px" />
    </div>
  );
}
