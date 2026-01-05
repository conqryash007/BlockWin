"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";
import Image from "next/image";

interface DiceDisplayProps {
  target: number;
  rollOver: boolean;
  result: number | null;
  isRolling: boolean;
  win: boolean | null;
}

export function DiceDisplay({ target, rollOver, result, isRolling, win }: DiceDisplayProps) {
  const [displayValue, setDisplayValue] = useState(50.00);

  // Animation effect
  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setDisplayValue(Math.random() * 100);
      }, 50);
      return () => clearInterval(interval);
    } else if (result !== null) {
      setDisplayValue(result);
    }
  }, [isRolling, result]);

  return (
    <div className="relative flex-1 bg-[#0d1014] rounded-xl border-2 border-casino-brand/20 shadow-[0_0_20px_rgba(0,255,163,0.15)] hover:shadow-[0_0_30px_rgba(0,255,163,0.25)] transition-all flex flex-col items-center justify-center p-8 overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('/images/pattern.png')] bg-repeat" />
        
        {/* Top Info Bar */}
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/20 to-transparent flex items-start justify-between p-6 z-10">
            <div className="flex flex-col">
                <span className="text-xs text-gray-300 uppercase font-bold tracking-wider">Target Region</span>
                <span className="text-xl font-bold text-white tabular-nums">
                    {rollOver ? `> ${100 - target}.00` : `< ${target}.00`}
                </span>
            </div>
             <div className="flex flex-col items-end">
                <span className="text-xs text-gray-300 uppercase font-bold tracking-wider">Hash</span>
                <div className="flex items-center gap-2">
                     <span className="text-xs font-mono text-muted-foreground/50 hidden sm:block">e58c...902a</span>
                     <Copy className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-white" />
                </div>
            </div>
        </div>

        {/* Central Dice Visualization */}
        <div className="relative z-20 flex flex-col items-center">
            
            {/* The Floating Dice Cube (3D effect simulation) */}
            <div className={cn(
                "w-32 h-32 relative transition-all duration-700 ease-out perspective-1000",
                isRolling ? "animate-[bounce_0.5s_infinite]" : "animate-none",
                win === true ? "drop-shadow-[0_0_35px_rgba(0,212,139,0.6)]" : "drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]",
                win === false ? "drop-shadow-[0_0_35px_rgba(255,77,79,0.4)]" : ""
            )}>
                 <Image 
                    src="/images/dice.png" 
                    alt="Dice" 
                    fill 
                    className={cn(
                        "object-contain transition-transform duration-700",
                        isRolling ? "rotate-[360deg] scale-90" : "rotate-0 scale-100"
                    )} 
                 />
            </div>

            {/* The Number Result */}
            <div className="mt-8 relative">
                 <div className={cn(
                    "text-7xl sm:text-9xl font-black tabular-nums tracking-tight transition-all duration-300",
                    isRolling ? "opacity-50 blur-sm scale-90" : "opacity-100 blur-0 scale-100",
                    win === true ? "text-casino-brand" : (win === false ? "text-red-500" : "text-white")
                 )}>
                    {displayValue.toFixed(2)}
                 </div>
                 
                 {/* Result Badge */}
                 {!isRolling && win !== null && (
                     <div className={cn(
                         "absolute -top-4 -right-12 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest text-black transform rotate-12 animate-in zoom-in slide-in-from-bottom-2",
                         win ? "bg-casino-brand shadow-[0_0_20px_rgba(0,255,163,0.6)]" : "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                     )}>
                         {win ? "WIN" : "LOSS"}
                     </div>
                 )}
            </div>
        </div>

        {/* Range Bar */}
        <div className="absolute bottom-10 inset-x-12 h-4 bg-white/20 rounded-full overflow-hidden border-2 border-white/30 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
            {/* Logic to flip the bar based on rollover */}
            <div 
                className={cn("absolute h-full transition-all duration-500 ease-out", win ? "bg-casino-brand" : "bg-white/30")}
                style={{
                    left: rollOver ? `${100-target}%` : '0%',
                    width: `${target}%`,
                    opacity: 0.5
                }}
            />
            
            {/* Result Pin */}
            {!isRolling && (
                <div 
                    className={cn(
                        "absolute top-0 bottom-0 w-1 transition-all duration-500 z-10",
                        win ? "bg-casino-brand shadow-[0_0_15px_rgba(0,255,163,0.8)]" : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                    )}
                    style={{ left: `${displayValue}%` }}
                />
            )}
        </div>

    </div>
  );
}
