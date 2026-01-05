"use client";

import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { MainEventsStrip } from "@/components/sports/MainEventsStrip";
import { EventFilters } from "@/components/sports/EventFilters";
import { LeagueSection } from "@/components/sports/LeagueSection";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EventFilters as EventFiltersType, SportEvent } from "@/types/sports";
import { MOCK_EVENTS, MOCK_SPORTS, SPORT_CATEGORIES } from "@/lib/mockSportsData";
import { isEventLive } from "@/lib/oddsUtils";

export default function SportEventsPage() {
  const params = useParams();
  const sportKey = params.sport as string;

  const [filters, setFilters] = useState<EventFiltersType>({
    status: "all",
    market: "h2h",
    oddsFormat: "decimal",
  });

  // Find sport info
  const sportInfo = MOCK_SPORTS.find((s) => s.key === sportKey) || 
    SPORT_CATEGORIES.find((s) => sportKey.includes(s.key));

  // Filter events for this sport
  const sportEvents = useMemo(() => {
    let events = MOCK_EVENTS.filter((e) => 
      e.sport_key === sportKey || e.sport_key.includes(sportKey.split('_')[0])
    );

    // Filter by status
    if (filters.status === "live") {
      events = events.filter((e) => isEventLive(e.commence_time, e.completed));
    } else if (filters.status === "upcoming") {
      events = events.filter((e) => !isEventLive(e.commence_time, e.completed) && !e.completed);
    }

    return events;
  }, [sportKey, filters.status]);

  // Group events by league
  const eventsByLeague = useMemo(() => {
    const grouped: Record<string, SportEvent[]> = {};
    
    sportEvents.forEach((event) => {
      const league = event.league || event.sport_title;
      if (!grouped[league]) {
        grouped[league] = [];
      }
      grouped[league].push(event);
    });

    return grouped;
  }, [sportEvents]);

  const leagues = Object.keys(eventsByLeague);
  // MOCK_SPORTS has 'title', SPORT_CATEGORIES has 'label'
  const sportTitle = (sportInfo as any)?.title || (sportInfo as any)?.label || sportKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/sports">
          <Button variant="ghost" size="icon" className="hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">{sportTitle}</h1>
          <p className="text-muted-foreground mt-1">
            {sportEvents.length} events available
          </p>
        </div>
      </div>

      {/* Main Events Strip */}
      <MainEventsStrip showFeaturedCard={false} />

      {/* Filters */}
      <EventFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      {/* Events by League */}
      {leagues.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏟️</div>
          <p className="text-muted-foreground">No events found for this sport.</p>
          <Link href="/sports">
            <Button variant="link" className="mt-4">
              View all sports
            </Button>
          </Link>
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
    </div>
  );
}
