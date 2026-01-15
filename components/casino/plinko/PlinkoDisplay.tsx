"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { BallManager } from "./game/classes/BallManager";
import { pad } from "./game/padding";
import { WIDTH } from "./game/constants";
import { usePlinkoSound } from "@/hooks/usePlinkoSound";

interface PlinkoDisplayProps {
  result: number | null;
  onDropComplete: () => void;
  gameId: number;
  path: number[] | null;
  multiplier: number;
}

// Multipliers for 17 sinks
// Max 5x at edges, middle 5 buckets: 1x, 0.8x, 0.5x, 0.8x, 1x
const MULTIPLIERS: {[ key: number ]: number} = {
    1: 5,
    2: 3,
    3: 2,
    4: 1.5,
    5: 1.2,
    6: 1,
    7: 1,
    8: 0.8,
    9: 0.5,
    10: 0.8,
    11: 1,
    12: 1,
    13: 1.2,
    14: 1.5,
    15: 2,
    16: 3,
    17: 5
}

export function PlinkoDisplay({ result, onDropComplete, gameId, path, multiplier }: PlinkoDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ballManager, setBallManager] = useState<BallManager>();
  const [history, setHistory] = useState<{multiplier: number, id: number}[]>([]);
  const [activeBucket, setActiveBucket] = useState<number | null>(null);
  const lastDroppedGameIdRef = useRef<number>(-1);
  const onDropCompleteRef = useRef(onDropComplete);
  const multiplierRef = useRef(multiplier);

  // Sound effects
  const { playPegHit, playWin } = usePlinkoSound();

  // Keep refs updated
  useEffect(() => {
    onDropCompleteRef.current = onDropComplete;
  }, [onDropComplete]);

  useEffect(() => {
    multiplierRef.current = multiplier;
  }, [multiplier]);

  // Stable callback for BallManager (no multiplier dependency to prevent recreation)
  const handleBallFinish = useCallback((index: number) => {
    // Highlight the winning bucket
    setActiveBucket(index);

    // Use the backend multiplier from ref (not recalculated from index)
    const backendMultiplier = multiplierRef.current || 1;

    // Update History with backend multiplier
    setHistory(prev => [{ multiplier: backendMultiplier, id: Date.now() }, ...prev.slice(0, 5)]);

    // Clear bucket highlight after 3 seconds
    setTimeout(() => {
      setActiveBucket(null);
    }, 3000);

    // Play win sound
    playWin(backendMultiplier);

    onDropCompleteRef.current();
  }, [playWin]);

  // Initialize BallManager once
  useEffect(() => {
    if (canvasRef.current) {
      const manager = new BallManager(
        canvasRef.current as HTMLCanvasElement,
        handleBallFinish,
        playPegHit
      );
      setBallManager(manager);

      return () => {
        manager.stop();
      };
    }
  }, [handleBallFinish, playPegHit]);

  // Add ball when game starts - only once per gameId
  useEffect(() => {
    if (result !== null && ballManager && gameId > 0 && gameId !== lastDroppedGameIdRef.current) {
      // Mark this gameId as processed to prevent double drops
      lastDroppedGameIdRef.current = gameId;

      // Add ball with random starting position for variety
      // Random offset between -15 and +15 pixels from center
      const randomOffset = (Math.random() - 0.5) * 30;
      const startX = pad(WIDTH / 2 + randomOffset);

      // Pass the backend result as target bucket to ensure correct landing
      ballManager.addBall(startX, result);
    }
  }, [gameId, result, ballManager]);

  return (
    <div className="relative flex-1 bg-[#0d1014] rounded-xl border-2 border-casino-brand/20 shadow-[0_0_20px_rgba(0,255,163,0.15)] flex flex-col overflow-hidden max-h-[calc(100vh-180px)]">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-10 bg-[url('/images/pattern.png')] bg-repeat pointer-events-none" />
        
        {/* Info Header */}
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/20 to-transparent flex items-start justify-between p-6 z-10 pointer-events-none">
            <div className="flex flex-col">
                <span className="text-xs text-gray-300 uppercase font-bold tracking-wider">Rows</span>
                <span className="text-xl font-bold text-white tabular-nums">16</span>
            </div>
             <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 text-xs text-gray-300 uppercase font-bold tracking-wider mb-1">
                   <span>History</span>
                   <RefreshCw className="w-3 h-3 cursor-pointer hover:text-white pointer-events-auto" onClick={() => setHistory([])} />
                </div>
                <div className="flex gap-1 h-6">
                    {history.slice(0, 6).map((h) => {
                        const formattedMult = h.multiplier % 1 === 0 ? h.multiplier.toFixed(0) : h.multiplier.toFixed(1);
                        return (
                        <div key={h.id} className={cn(
                            "w-10 h-full rounded text-[10px] font-bold flex items-center justify-center text-black animate-in fade-in slide-in-from-right-4 shadow-lg",
                            h.multiplier >= 10 ? "bg-yellow-500 box-shadow-yellow" :
                            h.multiplier >= 2 ? "bg-green-500 box-shadow-green" :
                            h.multiplier >= 1 ? "bg-gray-300" : "bg-red-500"
                        )}>
                            {formattedMult}x
                        </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Plinko Canvas - scales to fit viewport */}
        <canvas 
            ref={canvasRef}
            width="560"
            height="560"
            className="w-full h-full max-h-full object-contain relative z-20"
        />
    </div>
  );
}
