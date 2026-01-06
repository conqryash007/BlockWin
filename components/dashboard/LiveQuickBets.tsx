"use client";

import { QuickBet } from "@/types/dashboard";
import { useBetslip } from "@/hooks/useBetslip";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Radio, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface LiveQuickBetsProps {
  bets: QuickBet[];
  className?: string;
}

export function LiveQuickBets({ bets, className }: LiveQuickBetsProps) {
  const { addItem, items } = useBetslip();

  const handleAddBet = (bet: QuickBet) => {
    const isAlreadyAdded = items.some(item => item.id === bet.id);
    
    if (isAlreadyAdded) {
      toast.info("Already in betslip", {
        description: bet.selection,
        duration: 1500,
      });
      return;
    }

    addItem({
      id: bet.id,
      name: bet.selection,
      odds: bet.odds,
      eventId: bet.eventId,
      eventName: bet.teams,
      market: bet.market,
      isLive: bet.isLive,
    });

    toast.success(`Added ${bet.selection}`, {
      description: `${bet.teams} @ ${bet.odds.toFixed(2)}`,
      duration: 2000,
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded bg-casino-brand" />
          <h3 className="font-bold text-white uppercase tracking-wider text-xs">
            Quick Bets
          </h3>
        </div>
        <Link href="/sports">
          <Button variant="link" className="text-xs text-muted-foreground hover:text-casino-brand p-0 h-auto">
            More <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>

      {/* Bet List */}
      <div className="space-y-2">
        {bets.map((bet) => {
          const isAdded = items.some(item => item.id === bet.id);
          
          return (
            <div
              key={bet.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                "bg-casino-card border border-white/5",
                "hover:border-casino-brand/20 transition-all",
                "group cursor-pointer"
              )}
              onClick={() => handleAddBet(bet)}
            >
              {/* Left - Time/Live + Teams */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Time/Live Indicator */}
                <div className="flex-shrink-0 w-12 text-center">
                  {bet.isLive ? (
                    <span className="flex items-center justify-center gap-1 text-red-400 text-[10px] font-bold">
                      <Radio className="w-2.5 h-2.5 animate-pulse" />
                      {bet.time}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {bet.time}
                    </span>
                  )}
                </div>

                {/* Teams & Selection */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate">
                    {bet.teams}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {bet.market}: <span className="text-casino-brand">{bet.selection}</span>
                  </div>
                </div>
              </div>

              {/* Right - Odds + Add Button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono font-bold text-sm text-white">
                  {bet.odds.toFixed(2)}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    isAdded 
                      ? "bg-casino-brand text-black" 
                      : "bg-white/10 text-white hover:bg-casino-brand hover:text-black"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddBet(bet);
                  }}
                >
                  <Plus className={cn("h-4 w-4", isAdded && "rotate-45")} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
