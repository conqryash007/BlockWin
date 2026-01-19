"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBetslip } from "@/hooks/useBetslip";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const QUICK_STAKES = [50, 100, 200, 500];

export function BetslipDrawer() {
  const { 
    items, 
    isOpen, 
    setIsOpen, 
    removeItem, 
    updateStake,
    clearSlip,
    totalStake,
    totalOdds,
    potentialReturn 
  } = useBetslip();
  const { login, session, isAuthenticated } = useAuth();
  
  const [isPlacing, setIsPlacing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
    const hasValidStakes = items.every(item => (item.stake || 0) > 0);
    if (!hasValidStakes) {
      toast.error("Please enter stake amounts");
      return;
    }

    setIsPlacing(true);

    try {
      // Prepare selections for API
      const selections = items.map(item => ({
        eventId: item.eventId || item.id,
        eventName: item.eventName || item.name,
        market: item.market || 'h2h',
        selection: item.name,
        odds: Number(item.odds) || 0,
        point: item.point,
      }));

      const stakes = items.map(item => Number(item.stake) || 0);

      // Validate stakes
      if (stakes.some(s => s <= 0)) {
        throw new Error('All stakes must be greater than 0');
      }

      console.log('BetslipDrawer: Placing bet:', { selectionsCount: selections.length, stakes, totalStake });

      const response = await fetch('/api/sports/place-bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          betType: 'single',
          selections,
          stakes,
        }),
      });

      const data = await response.json();

      console.log('BetslipDrawer: Bet placement response:', { success: data.success, error: data.error, betIds: data.betIds });

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to place bet');
      }

      // Success!
      toast.success(
        `Bet placed! Potential payout: $${data.potentialPayout.toFixed(2)}`,
        { duration: 5000 }
      );
      
      setShowSuccess(true);
      
      // Trigger event to notify other components
      window.dispatchEvent(new CustomEvent('sports-bet-placed'));
      
      // Clear after showing success
      setTimeout(() => {
        setShowSuccess(false);
        clearSlip();
      }, 2000);

    } catch (error: any) {
      console.error('BetslipDrawer: Bet placement error:', error);
      toast.error(error.message || 'Failed to place bet');
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:w-[400px] bg-[#0d0f14] border-l border-[#1a1d24] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-4 border-b border-[#1a1d24] bg-[#0a0c10]">
          <SheetTitle className="flex items-center justify-between text-white">
            <span className="flex items-center gap-2">
              Betslip 
              {items.length > 0 && (
                <span className="text-casino-brand bg-casino-brand/20 px-2 py-0.5 rounded-full text-xs font-bold">
                  {items.length}
                </span>
              )}
            </span>
            {items.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearSlip} 
                className="h-6 text-xs text-muted-foreground hover:text-destructive"
              >
                Clear All
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Success State */}
        {showSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-casino-brand/20 flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-casino-brand" />
            </div>
            <h3 className="text-2xl font-bold text-casino-brand mb-2">Bet Placed!</h3>
            <p className="text-muted-foreground">
              Your bet has been submitted successfully.
            </p>
          </div>
        ) : (
          <>
            {/* Bet Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0d0f14]">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <div className="text-5xl mb-4">🎫</div>
                  <p className="font-medium">Your betslip is empty</p>
                  <p className="text-xs mt-1 opacity-70">Click on odds to add selections</p>
                </div>
              ) : (
                items.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-[#14171e] rounded-xl p-4 border border-[#1f232c] relative group"
                  >
                    {/* Remove Button */}
                    <button 
                      className="absolute right-3 top-3 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {/* Event Name */}
                    {item.eventName && (
                      <p className="text-xs text-muted-foreground pr-6 truncate mb-1">
                        {item.eventName}
                      </p>
                    )}

                    {/* Selection & Odds */}
                    <div className="flex justify-between items-center pr-6">
                      <h4 className="font-bold text-white">{item.name}</h4>
                      <span className="font-bold text-casino-brand text-lg">
                        {item.odds.toFixed(2)}
                      </span>
                    </div>

                    {/* Stake Input */}
                    <div className="mt-4">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input 
                          type="number"
                          className="h-10 pl-8 text-sm font-mono bg-[#0a0c10] border-[#1f232c] focus:border-casino-brand/50 focus:ring-casino-brand/20" 
                          placeholder="Enter stake" 
                          value={item.stake || ""}
                          onChange={(e) => updateStake(item.id, parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      
                      {/* Quick Stakes */}
                      <div className="flex gap-2 mt-2">
                        {QUICK_STAKES.map((amount) => (
                          <Button
                            key={amount}
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-8 text-xs bg-[#1a1d24] hover:bg-[#22262f] border border-[#2a2f3a] hover:border-casino-brand/30"
                            onClick={() => updateStake(item.id, amount)}
                          >
                            ${amount}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Potential Return for this bet */}
                    {item.stake && item.stake > 0 && (
                      <div className="flex justify-between mt-3 pt-3 border-t border-[#1f232c] text-sm">
                        <span className="text-muted-foreground">Potential Return</span>
                        <span className="text-casino-brand font-bold">
                          ${(item.stake * item.odds).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Summary Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-[#1a1d24] bg-[#0a0c10] space-y-4">
                {/* Summary Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Odds</span>
                    <span className="text-white font-medium">{totalOdds.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Stake</span>
                    <span className="text-white font-medium">${totalStake.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold pt-3 border-t border-[#1f232c]">
                    <span>Potential Return</span>
                    <span className="text-casino-brand text-xl">${potentialReturn.toFixed(2)}</span>
                  </div>
                </div>

                {/* Place Bet Button */}
                <Button 
                  className="w-full h-14 text-lg font-bold shadow-lg shadow-casino-brand/30" 
                  variant="casino" 
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
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
