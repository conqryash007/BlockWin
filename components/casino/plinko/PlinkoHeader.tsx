"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Volume2, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function PlinkoHeader() {
  const [isDemo, setIsDemo] = useState(true);

  return (
    <div className="flex items-center justify-between p-4 bg-casino-panel border-b-2 border-casino-brand/20 shadow-[0_4px_20px_rgba(0,255,163,0.1)] h-16">
      <div className="flex items-center gap-4">
        <Link href="/casino">
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white gap-2 hover:bg-white/5 transition-all">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <h1 className="text-xl font-black text-white px-4 border-r-2 border-casino-brand/20 uppercase tracking-widest hidden sm:block">Plinko</h1>
        
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-black/20 border-2 border-white/10">
           <span className={`text-xs font-bold transition-all ${isDemo ? 'text-white' : 'text-gray-400'}`}>Demo</span>
           <Switch checked={!isDemo} onCheckedChange={(c) => setIsDemo(!c)} className="data-[state=checked]:bg-casino-brand data-[state=checked]:shadow-[0_0_15px_rgba(0,255,163,0.5)]" />
           <span className={`text-xs font-bold transition-all ${!isDemo ? 'text-casino-brand' : 'text-gray-400'}`}>Real</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
         <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-white/5 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all">
            <Volume2 className="h-5 w-5" />
         </Button>
         <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-white/5 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all">
            <Settings className="h-5 w-5" />
         </Button>
      </div>
    </div>
  );
}
