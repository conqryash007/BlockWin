"use client";

import { useState, useMemo } from "react";
import { MainEventsStrip } from "@/components/sports/MainEventsStrip";
import { EventFilters } from "@/components/sports/EventFilters";
import { LeagueSection } from "@/components/sports/LeagueSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useAllSportsEvents } from "@/hooks/useSportsData";
import { EventFilters as EventFiltersType, SportEvent } from "@/types/sports";
import { SPORT_CATEGORIES } from "@/lib/mockSportsData";
import { isEventLive } from "@/lib/oddsUtils";
import { LivePlayerActivityFeed } from "@/components/dashboard/LivePlayerActivityFeed";

export default function SportsPage() {
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFiltersType>({
    status: "all",
    market: "h2h",
    oddsFormat: "decimal",
  });

  // Fetch live events from The Odds API
  const { events: allEvents, isLoading, error, refetch } = useAllSportsEvents();

  // Filter events based on selected sport and filters
  const filteredEvents = useMemo(() => {
    let events = allEvents;

    // Filter by sport
    if (selectedSport) {
      events = events.filter((e) => 
        e.sport_key.toLowerCase().includes(selectedSport.toLowerCase())
      );
    }

    // Filter by status
    if (filters.status === "live") {
      events = events.filter((e) => isEventLive(e.commence_time, e.completed));
    } else if (filters.status === "upcoming") {
      events = events.filter((e) => !isEventLive(e.commence_time, e.completed) && !e.completed);
    }

    return events;
  }, [allEvents, selectedSport, filters.status]);

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
      {isLoading && allEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-casino-brand" />
          <p className="text-muted-foreground">Loading live events...</p>
        </div>
      ) : error && allEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-red-400">{error}</p>
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
    </div>
  );
}
