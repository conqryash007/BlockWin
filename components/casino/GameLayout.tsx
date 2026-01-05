"use client";

import { BetControls } from "./BetControls";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LIVE_BETS } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";

interface GameLayoutProps {
  children: React.ReactNode;
  gameId: string;
}

export function GameLayout({ children, gameId }: GameLayoutProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row h-[calc(100vh-140px)]">
      {/* Left Column: Game Canvas box and Controls */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-white/5 bg-secondary/10 lg:flex-row">
         {/* Controls - Mobile First: Bottom on mobile, Left on desktop */}
         <div className="order-2 lg:order-1">
             <BetControls />
         </div>

         {/* Game Canvas Area */}
         <div className="flex-1 order-1 lg:order-2 flex flex-col relative bg-black/40">
            {children}
            
            {/* Game Info Bar */}
            <div className="h-12 border-t border-white/5 bg-secondary/30 flex items-center justify-between px-4 text-sm text-muted-foreground">
                <div className="flex gap-4">
                    <span>Max Profit: <span className="text-white font-mono">$1,000,000</span></span>
                </div>
                <div className="flex gap-2">
                    <button className="hover:text-white">Live Stats</button>
                    <button className="hover:text-white">Music</button>
                </div>
            </div>
         </div>
      </div>


    </div>
  );
}
