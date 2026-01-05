"use client";

import { cn } from "@/lib/utils";
import { Bomb, TrendingUp, DollarSign } from "lucide-react";
import type { GameState } from "./MinesGamePage";

interface MinesHeaderProps {
  multiplier: number;
  potentialPayout: number;
  gameState: GameState;
}

export function MinesHeader({ multiplier, potentialPayout, gameState }: MinesHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-[#0d1014] to-[#12151a] rounded-xl border-2 border-casino-brand/20 shadow-[0_0_15px_rgba(0,255,163,0.1)] p-4 flex items-center justify-between">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-casino-brand/10 border border-casino-brand/30 flex items-center justify-center">
          <Bomb className="w-5 h-5 text-casino-brand" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider">Mines</h1>
          <p className="text-xs text-gray-500">Avoid the bombs, collect the gems</p>
        </div>
      </div>

      {/* Live Stats */}
      <div className="flex items-center gap-4">
        {/* Multiplier */}
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-gray-400 uppercase font-bold">
            <TrendingUp className="w-3 h-3" />
            Multiplier
          </div>
          <div className={cn(
            "text-xl font-black tabular-nums transition-all duration-300",
            gameState === "playing" && multiplier > 1 
              ? "text-casino-brand drop-shadow-[0_0_10px_rgba(0,255,163,0.5)]" 
              : "text-white"
          )}>
            {multiplier.toFixed(2)}x
          </div>
        </div>

        {/* Potential Payout */}
        <div className="text-right pl-4 border-l border-white/10">
          <div className="flex items-center gap-1 text-xs text-gray-400 uppercase font-bold">
            <DollarSign className="w-3 h-3" />
            Payout
          </div>
          <div className={cn(
            "text-xl font-black tabular-nums transition-all duration-300",
            gameState === "playing" && multiplier > 1 
              ? "text-casino-brand drop-shadow-[0_0_10px_rgba(0,255,163,0.5)]" 
              : "text-white"
          )}>
            ${potentialPayout.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
