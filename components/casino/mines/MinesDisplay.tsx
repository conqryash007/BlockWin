"use client";

import { cn } from "@/lib/utils";
import { Gem, Bomb } from "lucide-react";
import type { Tile, GameState } from "./MinesGamePage";

interface MinesDisplayProps {
  grid: Tile[];
  gameState: GameState;
  onTileClick: (id: number) => void;
  multiplier: number;
  betAmount: number;
}

export function MinesDisplay({ 
  grid, 
  gameState, 
  onTileClick,
  multiplier,
  betAmount 
}: MinesDisplayProps) {
  const isGameOver = gameState === "won" || gameState === "lost";

  return (
    <div className="relative flex-1 bg-[#0d1014] rounded-xl border-2 border-casino-brand/20 shadow-[0_0_20px_rgba(0,255,163,0.15)] hover:shadow-[0_0_30px_rgba(0,255,163,0.25)] transition-all flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden min-h-[400px]">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
      
      {/* 5x5 Game Grid */}
      <div className="relative z-10 grid grid-cols-5 gap-2 sm:gap-3 w-full max-w-[400px] aspect-square">
        {grid.map((tile, index) => (
          <button
            key={tile.id}
            onClick={() => onTileClick(tile.id)}
            disabled={gameState !== "playing" || tile.state !== "hidden"}
            className={cn(
              "aspect-square rounded-lg sm:rounded-xl relative overflow-hidden transition-all duration-300 transform",
              "border-2 flex items-center justify-center",
              // Hidden state
              tile.state === "hidden" && [
                "bg-gradient-to-br from-[#1a1d23] to-[#12151a]",
                "border-white/10 hover:border-casino-brand/40",
                "hover:shadow-[0_0_15px_rgba(0,255,163,0.3)]",
                "hover:scale-105 active:scale-95",
                gameState !== "playing" && "opacity-50 cursor-not-allowed hover:scale-100"
              ],
              // Safe state
              tile.state === "safe" && [
                "bg-gradient-to-br from-casino-brand/30 to-casino-brand/10",
                "border-casino-brand/50",
                "shadow-[0_0_20px_rgba(0,255,163,0.4)]",
                "animate-[pulse_2s_ease-in-out_infinite]"
              ],
              // Mine state
              tile.state === "mine" && [
                "bg-gradient-to-br from-red-500/30 to-red-900/20",
                "border-red-500/50",
                "shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              ]
            )}
            style={{
              animationDelay: tile.state !== "hidden" ? `${index * 30}ms` : "0ms"
            }}
          >
            {/* Hidden Tile Pattern */}
            {tile.state === "hidden" && (
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
            )}
            
            {/* Safe Icon */}
            {tile.state === "safe" && (
              <div className="animate-in zoom-in-50 duration-300">
                <Gem className="w-6 h-6 sm:w-8 sm:h-8 text-casino-brand drop-shadow-[0_0_8px_rgba(0,255,163,0.8)]" />
              </div>
            )}
            
            {/* Mine Icon */}
            {tile.state === "mine" && (
              <div className="animate-in zoom-in-50 spin-in-90 duration-300">
                <Bomb className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Game Over Overlay */}
      {isGameOver && (
        <div className={cn(
          "absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-sm",
          "animate-in fade-in duration-500",
          gameState === "won" ? "bg-casino-brand/10" : "bg-red-500/10"
        )}>
          <div className={cn(
            "text-center p-8 rounded-2xl border-2",
            gameState === "won" 
              ? "bg-casino-brand/20 border-casino-brand/50 shadow-[0_0_40px_rgba(0,255,163,0.5)]"
              : "bg-red-500/20 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.5)]"
          )}>
            <div className={cn(
              "text-5xl sm:text-7xl font-black mb-2",
              gameState === "won" ? "text-casino-brand" : "text-red-500"
            )}>
              {gameState === "won" ? "CASHED OUT!" : "BOOM!"}
            </div>
            
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {gameState === "won" ? `+$${(betAmount * multiplier).toFixed(2)}` : `-$${betAmount.toFixed(2)}`}
            </div>
            
            <div className="text-lg text-gray-400">
              {gameState === "won" ? `${multiplier.toFixed(2)}x Multiplier` : "Better luck next time!"}
            </div>
          </div>
        </div>
      )}

      {/* Idle State Hint */}
      {gameState === "idle" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div className="text-center">
            <Gem className="w-16 h-16 mx-auto mb-4 text-casino-brand/50 animate-pulse" />
            <p className="text-xl font-bold text-white/70">Set your bet and start the game</p>
            <p className="text-sm text-gray-500 mt-1">Avoid the mines to win big!</p>
          </div>
        </div>
      )}
    </div>
  );
}
