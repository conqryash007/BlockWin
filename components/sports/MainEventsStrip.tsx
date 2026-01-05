"use client";

import { useFeaturedEvents } from "@/hooks/useSportsData";
import { CompactEventCard } from "./CompactEventCard";
import { MainEventCard } from "./MainEventCard";
import { usePrefetchTeamLogos } from "./TeamLogo";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface MainEventsStripProps {
  showFeaturedCard?: boolean;
  className?: string;
}

export function MainEventsStrip({ showFeaturedCard = true, className }: MainEventsStripProps) {
  const { events, isLoading } = useFeaturedEvents(true);

  // Prefetch team logos for all visible events
  const teamNames = useMemo(() => {
    return events.flatMap(event => [event.home_team, event.away_team]);
  }, [events]);
  usePrefetchTeamLogos(teamNames);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-casino-brand" />
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return null;
  }

  // First event for featured card, rest for strip
  const featuredEvent = events[0];
  const stripEvents = showFeaturedCard ? events.slice(1) : events;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded bg-casino-brand" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-casino-brand" />
            <h2 className="text-xl font-bold text-white uppercase tracking-wide">
              Main Events
            </h2>
          </div>
        </div>
        <Link href="/sports">
          <Button variant="link" className="text-sm text-muted-foreground hover:text-casino-brand">
            See all
            <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Featured Large Card (Desktop Hero) */}
      {showFeaturedCard && featuredEvent && (
        <div className="hidden md:block">
          <MainEventCard event={featuredEvent} />
        </div>
      )}

      {/* Mobile: Show featured as compact */}
      {showFeaturedCard && featuredEvent && (
        <div className="md:hidden">
          <CompactEventCard event={featuredEvent} className="w-full max-w-none" />
        </div>
      )}

      {/* Horizontal Scrollable Strip */}
      {stripEvents.length > 0 && (
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {stripEvents.map((event) => (
              <CompactEventCard
                key={event.id}
                event={event}
                className="shrink-0"
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>
      )}
    </div>
  );
}
