"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Banknote, 
  Bell 
} from "lucide-react";
import { DepositModal } from "@/components/wallet/DepositModal";
import { useAuth } from "@/hooks/useAuth";

interface QuickActionsColumnProps {
  className?: string;
}

const MARKET_CHIPS = [
  { id: "h2h", label: "H2H", active: true },
  { id: "totals", label: "Totals", active: false },
  { id: "spread", label: "Spread", active: false },
];

export function QuickActionsColumn({ className }: QuickActionsColumnProps) {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {isAuthenticated ? (
            <DepositModal />
        ) : (
            <Button 
              disabled 
              className="w-full h-12 bg-white/5 text-muted-foreground font-bold border border-white/5 cursor-not-allowed opacity-50"
            >
              Deposit
            </Button>
        )}
        
        <Button 
          variant="outline"
          className="w-full h-12 border-white/10 hover:bg-white/5 font-bold"
          disabled={!isAuthenticated}
        >
          <ArrowUpFromLine className="w-4 h-4 mr-2" />
          Withdraw
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button 
          variant="ghost"
          className="h-10 bg-white/5 hover:bg-white/10 text-sm font-medium"
        >
          <Banknote className="w-4 h-4 mr-2" />
          Cashout
        </Button>
        <Button 
          variant="ghost"
          className="h-10 bg-white/5 hover:bg-white/10 text-sm font-medium"
        >
          <Bell className="w-4 h-4 mr-2" />
          Alerts
        </Button>
      </div>

      {/* Popular Markets */}
      <div className="pt-2">
        <h4 className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">
          Popular Markets
        </h4>
        <div className="flex flex-wrap gap-2">
          {MARKET_CHIPS.map((chip) => (
            <button
              key={chip.id}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                chip.active
                  ? "bg-casino-brand/20 text-casino-brand border border-casino-brand/30"
                  : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 hover:text-white"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Live Events
          </span>
        </div>
        <div className="text-3xl font-bold text-white">247</div>
        <div className="text-xs text-muted-foreground">
          Across 12 sports
        </div>
      </div>
    </div>
  );
}
