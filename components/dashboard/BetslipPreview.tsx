"use client";

import { useBetslip } from "@/hooks/useBetslip";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronUp, X, Ticket } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BetslipPreviewProps {
  className?: string;
}

export function BetslipPreview({ className }: BetslipPreviewProps) {
  const { 
    items, 
    isOpen, 
    setIsOpen, 
    totalOdds, 
    totalStake, 
    potentialReturn,
    updateStake 
  } = useBetslip();
  
  const [stake, setStake] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show if no items
  if (items.length === 0) return null;

  const handleStakeChange = (value: string) => {
    setStake(value);
    const numValue = parseFloat(value) || 0;
    // Update stake for all items proportionally
    items.forEach(item => {
      updateStake(item.id, numValue / items.length);
    });
  };

  // Desktop version - fixed bottom right
  return (
    <>
      {/* Desktop Sticky Preview */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "hidden lg:block",
          "w-80",
          className
        )}
      >
        <div className="rounded-xl bg-[#0d0f14] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div 
            className="flex items-center justify-between p-3 bg-gradient-to-r from-casino-brand/20 to-transparent cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-casino-brand" />
              <span className="font-bold text-white text-sm">Betslip</span>
              <span className="px-2 py-0.5 rounded-full bg-casino-brand text-black text-xs font-bold">
                {items.length}
              </span>
            </div>
            <ChevronUp className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )} />
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Selections Preview */}
                <div className="p-3 border-t border-white/5 max-h-[150px] overflow-y-auto">
                  {items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-1.5 text-xs">
                      <span className="text-white truncate max-w-[180px]">{item.name}</span>
                      <span className="text-casino-brand font-mono font-bold">{item.odds.toFixed(2)}</span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div className="text-xs text-muted-foreground pt-1">
                      +{items.length - 3} more selections
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary */}
          <div className="p-3 border-t border-white/5 space-y-3">
            {/* Combined Odds */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Combined Odds</span>
              <span className="font-bold text-white">{totalOdds.toFixed(2)}</span>
            </div>

            {/* Stake Input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                type="number"
                placeholder="Enter stake"
                value={stake}
                onChange={(e) => handleStakeChange(e.target.value)}
                className="h-10 pl-8 text-sm bg-black/50 border-white/10 focus:border-casino-brand/50"
              />
            </div>

            {/* Potential Return */}
            {parseFloat(stake) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Potential Return</span>
                <span className="font-bold text-casino-brand">
                  ₹{(parseFloat(stake) * totalOdds).toFixed(2)}
                </span>
              </div>
            )}

            {/* Open Full Slip Button */}
            <Button
              className="w-full h-10 bg-casino-brand text-black font-bold hover:bg-casino-brand/90"
              onClick={() => setIsOpen(true)}
            >
              Open Full Betslip
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div 
          className="flex items-center justify-between px-4 py-3 bg-[#0d0f14] border-t border-white/10"
          onClick={() => setIsOpen(true)}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Ticket className="w-5 h-5 text-casino-brand" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-casino-brand text-black text-[10px] font-bold flex items-center justify-center">
                {items.length}
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                Odds: {totalOdds.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {items.length} selection{items.length !== 1 && 's'}
              </div>
            </div>
          </div>
          <Button 
            size="sm" 
            className="bg-casino-brand text-black font-bold hover:bg-casino-brand/90"
          >
            Open Slip
          </Button>
        </div>
      </div>
    </>
  );
}
