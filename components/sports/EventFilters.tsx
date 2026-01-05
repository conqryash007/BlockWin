"use client";

import { useState, useEffect } from "react";
import { EventFilters as EventFiltersType, MarketType, OddsFormat } from "@/types/sports";
import { useOddsFormat } from "@/hooks/useSportsData";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Radio, Clock, TrendingUp } from "lucide-react";

interface EventFiltersProps {
  filters: EventFiltersType;
  onFiltersChange: (filters: EventFiltersType) => void;
  className?: string;
}

export function EventFilters({ filters, onFiltersChange, className }: EventFiltersProps) {
  const { format, toggleFormat } = useOddsFormat();

  // Sync odds format with global preference
  useEffect(() => {
    if (filters.oddsFormat !== format) {
      onFiltersChange({ ...filters, oddsFormat: format });
    }
  }, [format, filters, onFiltersChange]);

  const handleStatusChange = (status: "all" | "live" | "upcoming") => {
    onFiltersChange({ ...filters, status });
  };

  const handleMarketChange = (market: MarketType) => {
    onFiltersChange({ ...filters, market });
  };

  const handleOddsFormatToggle = () => {
    toggleFormat();
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-4 p-4 rounded-xl bg-casino-card border border-casino-border", className)}>
      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground mr-2">Status:</span>
        <div className="flex rounded-lg bg-secondary/30 p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 rounded-md text-xs",
              filters.status === "all" && "bg-casino-brand text-black hover:bg-casino-brand"
            )}
            onClick={() => handleStatusChange("all")}
          >
            All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 rounded-md text-xs flex items-center gap-1",
              filters.status === "live" && "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            )}
            onClick={() => handleStatusChange("live")}
          >
            <Radio className="w-3 h-3" />
            Live
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 rounded-md text-xs flex items-center gap-1",
              filters.status === "upcoming" && "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
            )}
            onClick={() => handleStatusChange("upcoming")}
          >
            <Clock className="w-3 h-3" />
            Upcoming
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/10 hidden sm:block" />

      {/* Market Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground mr-2">Market:</span>
        <div className="flex rounded-lg bg-secondary/30 p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 rounded-md text-xs",
              filters.market === "h2h" && "bg-casino-brand text-black hover:bg-casino-brand"
            )}
            onClick={() => handleMarketChange("h2h")}
          >
            H2H
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 rounded-md text-xs",
              filters.market === "totals" && "bg-casino-brand text-black hover:bg-casino-brand"
            )}
            onClick={() => handleMarketChange("totals")}
          >
            Totals
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 rounded-md text-xs",
              filters.market === "spreads" && "bg-casino-brand text-black hover:bg-casino-brand"
            )}
            onClick={() => handleMarketChange("spreads")}
          >
            Spread
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/10 hidden sm:block" />

      {/* Odds Format Toggle */}
      <div className="flex items-center gap-3">
        <Label htmlFor="odds-format" className="text-xs text-muted-foreground flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Odds:
        </Label>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs", format === "decimal" ? "text-casino-brand" : "text-muted-foreground")}>
            Decimal
          </span>
          <Switch
            id="odds-format"
            checked={format === "american"}
            onCheckedChange={handleOddsFormatToggle}
            className="data-[state=checked]:bg-casino-brand"
          />
          <span className={cn("text-xs", format === "american" ? "text-casino-brand" : "text-muted-foreground")}>
            American
          </span>
        </div>
      </div>
    </div>
  );
}
