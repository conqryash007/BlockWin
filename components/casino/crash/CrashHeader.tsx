"use client";

import { Rocket } from "lucide-react";

export function CrashHeader() {
  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#1a1c24] to-[#0f1115] rounded-xl border-2 border-casino-brand/20 shadow-[0_0_15px_rgba(0,255,163,0.1)]">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-casino-brand/10 border-2 border-casino-brand/30 flex items-center justify-center">
          <Rocket className="w-6 h-6 text-casino-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wide">Crash</h1>
          <p className="text-xs text-gray-400">Cash out before it crashes!</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-lg bg-casino-brand/10 border border-casino-brand/30">
          <span className="text-xs font-bold text-casino-brand uppercase">Live</span>
        </div>
      </div>
    </div>
  );
}
