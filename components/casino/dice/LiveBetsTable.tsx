"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LIVE_BETS } from "@/lib/mockData"; // Start with mock, but we would use specialized data

// Specialized mock data for Dice
const DICE_BETS = [
    { user: "Player1", bet: 10, multiplier: 1.98, profit: 9.80, win: true, target: 50, roll: 42.50 },
    { user: "HighRoller", bet: 500, multiplier: 2.00, profit: -500, win: false, target: 49.5, roll: 88.12 },
    { user: "LuckyDog", bet: 5, multiplier: 9.90, profit: 44.50, win: true, target: 10, roll: 8.23 },
    { user: "Bot_77", bet: 1, multiplier: 1.98, profit: 0.98, win: true, target: 50, roll: 2.11 },
];

export function LiveBetsTable() {
  return (
    <div className="bg-casino-panel border border-white/5 rounded-xl overflow-hidden">
         <div className="flex items-center gap-4 p-4 border-b border-white/5">
             <div className="flex gap-2">
                 <Badge variant="secondary" className="hover:bg-white/10 cursor-pointer bg-white/10 text-white">Live Bets</Badge>
                 <Badge variant="outline" className="hover:bg-white/10 cursor-pointer text-muted-foreground">My Bets</Badge>
                 <Badge variant="outline" className="hover:bg-white/10 cursor-pointer text-muted-foreground">High Rollers</Badge>
             </div>
         </div>
         <Table>
            <TableHeader className="bg-black/20">
                <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="h-10 text-xs uppercase font-bold text-muted-foreground w-1/4">Player</TableHead>
                    <TableHead className="h-10 text-xs uppercase font-bold text-muted-foreground">Target</TableHead>
                    <TableHead className="h-10 text-xs uppercase font-bold text-muted-foreground">Bet</TableHead>
                    <TableHead className="h-10 text-xs uppercase font-bold text-muted-foreground">Mult</TableHead>
                    <TableHead className="h-10 text-xs uppercase font-bold text-muted-foreground text-right w-1/4">Profit</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {DICE_BETS.map((bet, i) => (
                     <TableRow key={i} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="font-bold text-white text-xs">{bet.user}</TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">{bet.target}</TableCell>
                        <TableCell className="text-white text-xs font-mono bg-secondary/10 rounded px-2 py-1 flex w-fit items-center gap-1">
                             <span className="text-white/50">$</span> {bet.bet.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{bet.multiplier.toFixed(2)}x</TableCell>
                        <TableCell className={cn("text-right text-xs font-bold", bet.win ? "text-casino-brand" : "text-muted-foreground")}>
                            {bet.win ? `+${bet.profit.toFixed(2)}` : `-${Math.abs(bet.profit).toFixed(2)}`}
                        </TableCell>
                     </TableRow>
                ))}
            </TableBody>
         </Table>
    </div>
  );
}
