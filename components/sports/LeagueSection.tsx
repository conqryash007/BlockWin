"use client";

import { useState } from "react";
import { SportEvent, MarketType } from "@/types/sports";
import { EventRow } from "./EventRow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

interface LeagueSectionProps {
  league: string;
  events: SportEvent[];
  market?: MarketType;
  defaultOpen?: boolean;
  className?: string;
}

export function LeagueSection({ 
  league, 
  events, 
  market = "h2h",
  defaultOpen = true, 
  className 
}: LeagueSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (events.length === 0) return null;

  return (
    <div className={cn("rounded-xl overflow-hidden", className)}>
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 h-auto",
          "bg-casino-card border border-casino-border rounded-t-xl",
          !isOpen && "rounded-b-xl",
          "hover:bg-casino-card-hover"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-casino-brand/10 border border-casino-brand/30 flex items-center justify-center">
            <span className="text-casino-brand text-sm font-bold">
              {league.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-left">
            <h3 className="font-bold text-white">{league}</h3>
            <p className="text-xs text-muted-foreground">
              {events.length} {events.length === 1 ? "event" : "events"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </Button>

      {/* Events List */}
      {isOpen && (
        <div className="border-x border-b border-casino-border rounded-b-xl overflow-hidden">
          <div className="divide-y divide-casino-border">
            {events.map((event) => (
              <EventRow 
                key={event.id} 
                event={event} 
                market={market}
                className="rounded-none border-0"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
