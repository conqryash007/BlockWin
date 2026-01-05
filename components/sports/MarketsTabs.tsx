"use client";

import { SportEvent, MarketType } from "@/types/sports";
import { MarketRow } from "./MarketRow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TrendingUp, PlusCircle, MinusCircle } from "lucide-react";

interface MarketsTabsProps {
  event: SportEvent;
  defaultMarket?: MarketType;
  className?: string;
}

export function MarketsTabs({ event, defaultMarket = "h2h", className }: MarketsTabsProps) {
  const bookmaker = event.bookmakers?.[0];
  
  // Get available markets
  const h2hMarket = bookmaker?.markets?.find((m) => m.key === "h2h");
  const totalsMarket = bookmaker?.markets?.find((m) => m.key === "totals");
  const spreadsMarket = bookmaker?.markets?.find((m) => m.key === "spreads");

  const hasMarkets = h2hMarket || totalsMarket || spreadsMarket;

  if (!hasMarkets) {
    return (
      <div className={cn("rounded-xl border border-casino-border bg-casino-card p-6 text-center", className)}>
        <p className="text-muted-foreground">No betting markets available for this event.</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-casino-border bg-casino-card overflow-hidden", className)}>
      <Tabs defaultValue={defaultMarket} className="w-full">
        <TabsList className="w-full bg-transparent border-b border-casino-border rounded-none h-auto p-0">
          {h2hMarket && (
            <TabsTrigger
              value="h2h"
              className={cn(
                "flex-1 py-4 rounded-none border-b-2 border-transparent",
                "data-[state=active]:border-casino-brand data-[state=active]:bg-transparent data-[state=active]:text-casino-brand"
              )}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Match Winner
            </TabsTrigger>
          )}
          {totalsMarket && (
            <TabsTrigger
              value="totals"
              className={cn(
                "flex-1 py-4 rounded-none border-b-2 border-transparent",
                "data-[state=active]:border-casino-brand data-[state=active]:bg-transparent data-[state=active]:text-casino-brand"
              )}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Totals
            </TabsTrigger>
          )}
          {spreadsMarket && (
            <TabsTrigger
              value="spreads"
              className={cn(
                "flex-1 py-4 rounded-none border-b-2 border-transparent",
                "data-[state=active]:border-casino-brand data-[state=active]:bg-transparent data-[state=active]:text-casino-brand"
              )}
            >
              <MinusCircle className="w-4 h-4 mr-2" />
              Spread
            </TabsTrigger>
          )}
        </TabsList>

        {/* H2H Market */}
        {h2hMarket && (
          <TabsContent value="h2h" className="p-4 space-y-3 mt-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Match Winner (H2H)</h3>
              <span className="text-xs text-muted-foreground">
                via {bookmaker?.title || "Bookmaker"}
              </span>
            </div>
            {h2hMarket.outcomes.map((outcome, index) => (
              <MarketRow
                key={index}
                event={event}
                market="h2h"
                outcome={outcome}
                outcomeIndex={index}
              />
            ))}
          </TabsContent>
        )}

        {/* Totals Market */}
        {totalsMarket && (
          <TabsContent value="totals" className="p-4 space-y-3 mt-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Totals (Over/Under)</h3>
              <span className="text-xs text-muted-foreground">
                via {bookmaker?.title || "Bookmaker"}
              </span>
            </div>
            {totalsMarket.outcomes.map((outcome, index) => (
              <MarketRow
                key={index}
                event={event}
                market="totals"
                outcome={outcome}
                outcomeIndex={index}
              />
            ))}
          </TabsContent>
        )}

        {/* Spreads Market */}
        {spreadsMarket && (
          <TabsContent value="spreads" className="p-4 space-y-3 mt-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Handicap (Spread)</h3>
              <span className="text-xs text-muted-foreground">
                via {bookmaker?.title || "Bookmaker"}
              </span>
            </div>
            {spreadsMarket.outcomes.map((outcome, index) => (
              <MarketRow
                key={index}
                event={event}
                market="spreads"
                outcome={outcome}
                outcomeIndex={index}
              />
            ))}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
