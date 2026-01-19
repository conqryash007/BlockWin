"use client";

import { useBetslip, BetItem } from "@/hooks/useBetslip";
import { useOddsFormat } from "@/hooks/useSportsData";
import { formatOdds, calculateParlayOdds, getOddsChange } from "@/lib/oddsUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Trash2, AlertTriangle, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SportsBetSlipProps {
  className?: string;
}

const QUICK_STAKES = [50, 200, 500, 1000];

export function SportsBetSlip({ className }: SportsBetSlipProps) {
  const {
    items,
    removeItem,
    updateStake,
    acceptOddsChange,
    clearSlip,
    hasOddsChanged,
    totalStake,
    totalOdds,
    potentialReturn,
  } = useBetslip();
  const { format } = useOddsFormat();
  const { login, session, isAuthenticated } = useAuth();
  
  const [isPlacing, setIsPlacing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [betType, setBetType] = useState<"single" | "parlay">("single");

  // Calculate returns based on bet type
  const calculateReturn = () => {
    if (items.length === 0) return 0;
    
    if (betType === "single") {
      return items.reduce((sum, item) => {
        const stake = item.stake || 0;
        return sum + stake * item.odds;
      }, 0);
    } else {
      const combinedOdds = calculateParlayOdds(items.map((i) => i.odds));
      return totalStake * combinedOdds;
    }
  };

  const handlePlaceBet = async () => {
    // Check authentication
    if (!isAuthenticated || !session?.access_token) {
      toast.error("Please sign in to place bets");
      login();
      return;
    }

    // Validate selections
    if (items.length === 0) {
      toast.error("Add selections to your bet slip");
      return;
    }

    // Validate stakes
    const hasValidStakes = betType === "parlay" 
      ? totalStake > 0 
      : items.every(item => (item.stake || 0) > 0);
    
    if (!hasValidStakes) {
      toast.error("Please enter stake amounts");
      return;
    }

    setIsPlacing(true);

    try {
      // Validate and prepare selections
      const selections = items.map(item => {
        const selection = {
          eventId: item.eventId || item.id,
          eventName: item.eventName || item.name,
          market: item.market || 'h2h',
          selection: item.name,
          odds: Number(item.odds) || 0,
          point: item.point,
        };

        // Validate selection
        if (!selection.eventId || !selection.eventName || !selection.selection || !selection.odds) {
          throw new Error(`Invalid selection: ${JSON.stringify(selection)}`);
        }

        return selection;
      });

      const stakes = betType === "parlay" 
        ? [totalStake] 
        : items.map(item => Number(item.stake) || 0);

      // Validate stakes
      if (stakes.some(s => s <= 0)) {
        throw new Error('All stakes must be greater than 0');
      }

      console.log('Placing bet:', { betType, selectionsCount: selections.length, stakes, totalStake });

      const response = await fetch('/api/sports/place-bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          betType,
          selections,
          stakes,
        }),
      });

      const data = await response.json();

      console.log('Bet placement response:', { success: data.success, error: data.error, betIds: data.betIds, code: data.code, details: data.details });

      if (!response.ok || !data.success) {
        const error = new Error(data.error || 'Failed to place bet') as any;
        error.code = data.code;
        error.details = data.details;
        throw error;
      }

      // Success!
      toast.success(
        `Bet placed! Potential payout: $${data.potentialPayout.toFixed(2)}`,
        { duration: 5000 }
      );
      clearSlip();
      setShowSuccess(true);
      
      // Trigger a custom event to notify other components to refresh
      window.dispatchEvent(new CustomEvent('sports-bet-placed'));
      
      // Reset success state after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (error: any) {
      console.error('Bet placement error:', error);
      const errorMessage = error.message || 'Failed to place bet';
      const solution = error.solution || '';
      
      // Show detailed error in toast
      toast.error(errorMessage, {
        description: solution || (error.code ? `Error code: ${error.code}` : undefined),
        duration: 10000,
      });
      
      // Log full error for debugging
      console.error('Full error object:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        solution: error.solution,
        stack: error.stack,
      });

      // If table doesn't exist, show a helpful message
      if (error.code === '42P01') {
        toast.error('Database table missing', {
          description: 'Please visit /migrations to run the required database migration',
          duration: 12000,
        });
      }
    } finally {
      setIsPlacing(false);
    }
  };

  const hasAnyOddsChanges = items.some((item) => hasOddsChanged(item.id));

  if (showSuccess) {
    return (
      <div className={cn(
        "rounded-xl border border-casino-brand bg-casino-brand/10 p-6",
        className
      )}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-casino-brand/20 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-casino-brand" />
          </div>
          <h3 className="text-xl font-bold text-casino-brand mb-2">Bet Placed!</h3>
          <p className="text-sm text-muted-foreground">
            Your bet has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border border-[#1a1d24] bg-[#0d0f14] overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1a1d24] bg-[#0a0c10]">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white">Bet Slip</h3>
          {items.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-casino-brand/20 text-casino-brand text-xs font-bold">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSlip}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Bet Type Toggle */}
      {items.length > 1 && (
        <div className="p-3 border-b border-[#1a1d24]">
          <div className="flex rounded-lg bg-[#14171e] p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 h-8 rounded-md text-xs",
                betType === "single" && "bg-casino-brand text-black hover:bg-casino-brand"
              )}
              onClick={() => setBetType("single")}
            >
              Singles
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 h-8 rounded-md text-xs",
                betType === "parlay" && "bg-casino-brand text-black hover:bg-casino-brand"
              )}
              onClick={() => setBetType("parlay")}
            >
              Parlay
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-4xl mb-3">🎫</div>
          <p className="text-muted-foreground text-sm">Your bet slip is empty</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click on odds to add selections
          </p>
        </div>
      ) : (
        <>
          {/* Bet Items */}
          <div className="max-h-[300px] overflow-y-auto">
            {items.map((item) => (
              <BetSlipItem
                key={item.id}
                item={item}
                format={format}
                betType={betType}
                onRemove={() => removeItem(item.id)}
                onStakeChange={(stake) => updateStake(item.id, stake)}
                onAcceptOdds={() => acceptOddsChange(item.id)}
                hasOddsChanged={hasOddsChanged(item.id)}
              />
            ))}
          </div>

          {/* Parlay Stake Input */}
          {betType === "parlay" && items.length > 1 && (
            <div className="p-4 border-t border-[#1a1d24]">
              <label className="text-xs text-muted-foreground block mb-2">Total Stake</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={totalStake || ""}
                  onChange={(e) => {
                    const stake = parseFloat(e.target.value) || 0;
                    // Distribute evenly or set first item
                    if (items.length > 0) {
                      updateStake(items[0].id, stake);
                    }
                  }}
                  className="pl-8 bg-[#0a0c10] border-[#1f232c] focus:border-casino-brand/50"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {QUICK_STAKES.map((amount) => (
                  <Button
                    key={amount}
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-xs bg-[#1a1d24] hover:bg-[#22262f] border border-[#2a2f3a]"
                    onClick={() => {
                      if (items.length > 0) {
                        updateStake(items[0].id, amount);
                      }
                    }}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-4 border-t border-[#1a1d24] bg-[#0a0c10] space-y-3">
            {betType === "parlay" && items.length > 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Combined Odds</span>
                <span className="text-white font-bold">
                  {formatOdds(calculateParlayOdds(items.map((i) => i.odds)), format)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Stake</span>
              <span className="text-white">${totalStake.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-[#1f232c]">
              <span className="text-white font-medium">Potential Return</span>
              <span className="text-casino-brand font-bold text-lg">
                ${calculateReturn().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Odds Change Warning */}
          {hasAnyOddsChanges && (
            <div className="p-3 bg-yellow-500/10 border-t border-yellow-500/30">
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Some odds have changed. Please review before placing.</span>
              </div>
            </div>
          )}

          {/* Place Bet Button */}
          <div className="p-4 border-t border-[#1a1d24]">
            <Button
              variant="casino"
              className="w-full h-12 text-lg font-bold shadow-lg shadow-casino-brand/30"
              disabled={items.length === 0 || totalStake === 0 || isPlacing}
              onClick={handlePlaceBet}
            >
              {isPlacing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Placing Bet...
                </>
              ) : (
                `Place Bet${totalStake > 0 ? ` • $${totalStake.toFixed(0)}` : ''}`
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// Individual bet item component
interface BetSlipItemProps {
  item: BetItem;
  format: "decimal" | "american";
  betType: "single" | "parlay";
  onRemove: () => void;
  onStakeChange: (stake: number) => void;
  onAcceptOdds: () => void;
  hasOddsChanged: boolean;
}

function BetSlipItem({
  item,
  format,
  betType,
  onRemove,
  onStakeChange,
  onAcceptOdds,
  hasOddsChanged,
}: BetSlipItemProps) {
  const oddsChange = item.previousOdds 
    ? getOddsChange(item.odds, item.previousOdds) 
    : "none";

  return (
    <div className={cn(
      "p-4 border-b border-[#1a1d24] relative group bg-[#0d0f14]",
      hasOddsChanged && "bg-yellow-500/5"
    )}>
      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute right-3 top-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Event Name */}
      <p className="text-xs text-muted-foreground pr-8 truncate">
        {item.eventName}
      </p>

      {/* Selection */}
      <div className="flex items-center justify-between mt-1">
        <h4 className="font-medium text-white text-sm">{item.name}</h4>
        <div className="flex items-center gap-2">
          {/* Odds Change Indicator */}
          {hasOddsChanged && item.previousOdds && (
            <span className={cn(
              "text-xs",
              oddsChange === "up" ? "text-green-400" : "text-red-400"
            )}>
              {formatOdds(item.previousOdds, format)} →
            </span>
          )}
          <span className={cn(
            "font-bold text-casino-brand",
            hasOddsChanged && oddsChange === "up" && "text-green-400",
            hasOddsChanged && oddsChange === "down" && "text-red-400"
          )}>
            {formatOdds(item.odds, format)}
          </span>
        </div>
      </div>

      {/* Odds Change Alert */}
      {hasOddsChanged && (
        <div className="mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-yellow-400">Odds changed</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
              onClick={onAcceptOdds}
            >
              Accept
            </Button>
          </div>
        </div>
      )}

      {/* Stake Input (for singles) */}
      {betType === "single" && (
        <div className="mt-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              placeholder="Enter stake"
              value={item.stake || ""}
              onChange={(e) => onStakeChange(parseFloat(e.target.value) || 0)}
              className="h-10 pl-8 text-sm bg-[#0a0c10] border-[#1f232c] focus:border-casino-brand/50 focus:ring-casino-brand/20"
            />
          </div>
          <div className="flex gap-2 mt-2">
            {QUICK_STAKES.slice(0, 4).map((amount) => (
              <Button
                key={amount}
                variant="ghost"
                size="sm"
                className="flex-1 h-8 text-xs bg-[#1a1d24] hover:bg-[#22262f] border border-[#2a2f3a] hover:border-casino-brand/30"
                onClick={() => onStakeChange(amount)}
              >
                ${amount}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Potential Return (for singles) */}
      {betType === "single" && item.stake && item.stake > 0 && (
        <div className="flex justify-between mt-2 text-xs">
          <span className="text-muted-foreground">Potential Return</span>
          <span className="text-casino-brand font-medium">
            ${(item.stake * item.odds).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
