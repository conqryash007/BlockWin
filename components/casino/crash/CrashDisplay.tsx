"use client";

import { cn } from "@/lib/utils";
import { CrashGraph } from "./CrashGraph";

interface CrashDisplayProps {
  gameState: "waiting" | "running" | "crashed";
  multiplier: number;
  countdown: number;
  history: { multiplier: number; id: number }[];
  crashPoint?: number;
  hasBet: boolean;
  cashedOut: boolean;
  cashOutMultiplier?: number;
}

export function CrashDisplay({
  gameState,
  multiplier,
  countdown,
  history,
  crashPoint,
  hasBet,
  cashedOut,
  cashOutMultiplier,
}: CrashDisplayProps) {
  const getMultiplierColor = () => {
    if (gameState === "crashed") return "text-red-500";
    if (cashedOut) return "text-yellow-400";
    if (multiplier >= 5) return "text-yellow-400";
    if (multiplier >= 2) return "text-casino-brand";
    return "text-white";
  };

  const getStatusText = () => {
    if (gameState === "waiting") return "WAITING";
    if (gameState === "crashed") return "CRASHED";
    return "RUNNING";
  };

  const getStatusColor = () => {
    if (gameState === "waiting") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    if (gameState === "crashed") return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-casino-brand/20 text-casino-brand border-casino-brand/30";
  };

  return (
    <div className="relative flex-1 bg-[#0d1014] rounded-xl border-2 border-casino-brand/20 shadow-[0_0_20px_rgba(0,255,163,0.15)] flex flex-col overflow-hidden">
      {/* Pattern Background */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,163,0.1),transparent_70%)] pointer-events-none" />
      
      {/* History Strip */}
      <div className="absolute top-0 inset-x-0 z-20 p-4">
        <div className="flex items-center justify-between">
          <div className={cn("px-3 py-1.5 rounded-lg border-2 text-xs font-bold uppercase", getStatusColor())}>
            {getStatusText()}
          </div>
          
          <div className="flex gap-1.5 overflow-x-auto max-w-[60%] scrollbar-hide">
            {history.slice(0, 10).map((h) => {
              const bgColor = 
                h.multiplier >= 10 ? "bg-yellow-500" :
                h.multiplier >= 2 ? "bg-casino-brand" :
                "bg-red-500";
              
              return (
                <div 
                  key={h.id} 
                  className={cn(
                    "shrink-0 px-2.5 py-1 rounded text-[10px] font-bold text-black animate-in fade-in slide-in-from-right-2",
                    bgColor
                  )}
                >
                  {h.multiplier.toFixed(2)}×
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="flex-1 relative flex items-center justify-center p-8 pt-16">
        {/* Graph */}
        <div className="absolute inset-4 top-16">
          <CrashGraph 
            multiplier={multiplier} 
            gameState={gameState}
            crashPoint={crashPoint}
          />
        </div>

        {/* Centered Multiplier Display */}
        <div className="relative z-10 flex flex-col items-center">
          {gameState === "waiting" ? (
            <div className="flex flex-col items-center">
              <span className="text-6xl md:text-8xl font-black text-white tabular-nums">
                {countdown.toFixed(1)}s
              </span>
              <span className="text-lg text-gray-400 mt-2 uppercase tracking-wider">Next Round</span>
            </div>
          ) : (
            <>
              <span 
                className={cn(
                  "text-6xl md:text-9xl font-black tabular-nums transition-colors duration-200",
                  getMultiplierColor(),
                  gameState === "crashed" && "animate-pulse"
                )}
                style={{
                  textShadow: gameState === "crashed" 
                    ? "0 0 40px rgba(239, 68, 68, 0.8)" 
                    : multiplier >= 2 
                      ? "0 0 40px rgba(0, 255, 163, 0.5)" 
                      : "none"
                }}
              >
                {multiplier.toFixed(2)}×
              </span>
              
              {/* Cash Out Success Message */}
              {cashedOut && cashOutMultiplier && (
                <div className="mt-4 px-6 py-3 bg-green-500/20 border-2 border-green-500/50 rounded-xl animate-in zoom-in">
                  <span className="text-lg font-bold text-green-400">
                    Cashed out at {cashOutMultiplier.toFixed(2)}×
                  </span>
                </div>
              )}

              {/* Crashed with bet */}
              {gameState === "crashed" && hasBet && !cashedOut && (
                <div className="mt-4 px-6 py-3 bg-red-500/20 border-2 border-red-500/50 rounded-xl animate-in zoom-in">
                  <span className="text-lg font-bold text-red-400">
                    Busted! Better luck next time.
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom Tension Glow Effect */}
      {gameState === "running" && (
        <div 
          className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
          style={{
            background: multiplier >= 5 
              ? "linear-gradient(to top, rgba(234, 179, 8, 0.15), transparent)"
              : "linear-gradient(to top, rgba(0, 255, 163, 0.1), transparent)"
          }}
        />
      )}

      {/* Crash Flash Effect */}
      {gameState === "crashed" && (
        <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" style={{ animationDuration: '0.5s' }} />
      )}
    </div>
  );
}
