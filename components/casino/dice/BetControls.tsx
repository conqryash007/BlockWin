"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Minus, Plus, RefreshCw, Zap } from "lucide-react";
import { ProvablyFairInfo } from "./ProvablyFairInfo";
import { cn } from "@/lib/utils";

interface BetControlsProps {
  balance: number;
  betAmount: number;
  setBetAmount: (val: number) => void;
  winChance: number;
  setWinChance: (val: number) => void;
  isRolling: boolean;
  onBet: () => void;
  rollOver: boolean;
  setRollOver: (val: boolean) => void;
}

export function BetControls({
  balance,
  betAmount,
  setBetAmount,
  winChance,
  setWinChance,
  isRolling,
  onBet,
  rollOver,
  setRollOver
}: BetControlsProps) {

  const multiplier = (99 / winChance).toFixed(2);
  const payout = (betAmount * Number(multiplier)).toFixed(2);

  const handleSliderChange = (vals: number[]) => {
    setWinChance(vals[0]);
  };

  const adjustBet = (type: 'half' | 'double' | 'min' | 'max') => {
    switch (type) {
        case 'half': setBetAmount(Math.max(0.1, betAmount / 2)); break;
        case 'double': setBetAmount(Math.min(balance, betAmount * 2)); break;
        case 'min': setBetAmount(0.1); break;
        case 'max': setBetAmount(balance); break;
    }
  };

  return (
    <div className="bg-casino-panel rounded-xl p-4 flex flex-col gap-5 border-2 border-casino-brand/20 shadow-[0_0_15px_rgba(0,255,163,0.1)] h-full">
        
        {/* Balance */}
        <div className="flex justify-between items-center text-sm font-bold bg-black/20 p-3 rounded-lg border-2 border-casino-brand/20 shadow-[0_0_10px_rgba(0,255,163,0.1)]">
            <span className="text-gray-300">Balance</span>
            <span className="text-white font-mono">${balance.toFixed(2)}</span>
        </div>

        {/* Bet Amount */}
        <div className="space-y-2">
             <div className="flex justify-between text-xs text-gray-300 uppercase font-bold tracking-wider">
                 <span>Bet Amount</span>
                 <span>${betAmount.toFixed(2)}</span>
             </div>
             <div className="relative">
                 <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                     <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-secondary/50 hover:bg-secondary" onClick={() => setBetAmount(Math.max(0, betAmount - 1))}>
                        <Minus className="h-3 w-3" />
                     </Button>
                 </div>
                 <Input 
                    type="number" 
                    value={betAmount} 
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    className="h-10 text-center font-bold bg-secondary/20 border-2 border-white/10 text-white"
                 />
                 <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                     <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-secondary/50 hover:bg-secondary" onClick={() => setBetAmount(betAmount + 1)}>
                        <Plus className="h-3 w-3" />
                     </Button>
                 </div>
             </div>
             <div className="grid grid-cols-4 gap-2">
                 <Button variant="outline" size="sm" className="bg-transparent border-white/10 text-xs h-8" onClick={() => adjustBet('min')}>Min</Button>
                 <Button variant="outline" size="sm" className="bg-transparent border-white/10 text-xs h-8" onClick={() => adjustBet('half')}>1/2</Button>
                 <Button variant="outline" size="sm" className="bg-transparent border-white/10 text-xs h-8" onClick={() => adjustBet('double')}>x2</Button>
                 <Button variant="outline" size="sm" className="bg-transparent border-white/10 text-xs h-8" onClick={() => adjustBet('max')}>Max</Button>
             </div>
        </div>

        {/* Bet CTA */}
        <Button 
            className="w-full h-14 text-xl font-black uppercase tracking-wider shadow-[0_0_25px_rgba(0,212,139,0.4)] hover:shadow-[0_0_40px_rgba(0,212,139,0.6)] transition-all active:scale-95 border-2 border-casino-brand/30"
            size="lg"
            variant="casino"
            disabled={isRolling}
            onClick={onBet}
        >
            {isRolling ? <RefreshCw className="h-6 w-6 animate-spin" /> : 'Bet'}
        </Button>

        {/* Slider & Win Chance */}
        <div className="space-y-4 bg-black/10 p-4 rounded-xl border-2 border-white/10 shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]">
             <div className="flex justify-between text-xs font-bold uppercase text-gray-300">
                 <span>Result Range</span>
                 <span>{rollOver ? 'Roll Over' : 'Roll Under'}</span>
             </div>

             <div className="px-2 py-4">
                 <Slider 
                    value={[winChance]} 
                    max={98} 
                    min={1} 
                    step={1} 
                    onValueChange={handleSliderChange}
                    className="cursor-pointer" 
                    // Note: Ideally we'd style the track range color based on rollOver here with custom CSS props or variants
                 />
             </div>

             <div className="flex justify-between items-center bg-black/20 p-1 rounded-lg">
                 <Button 
                    size="sm" 
                    variant={!rollOver ? "secondary" : "ghost"} 
                    className={cn("flex-1 text-xs font-bold", !rollOver && "bg-casino-brand text-black hover:bg-casino-brand/90")}
                    onClick={() => setRollOver(false)}
                 >
                    Roll Under
                 </Button>
                  <Button 
                    size="sm" 
                    variant={rollOver ? "secondary" : "ghost"} 
                    className={cn("flex-1 text-xs font-bold", rollOver && "bg-casino-brand text-black hover:bg-casino-brand/90")}
                    onClick={() => setRollOver(true)}
                 >
                    Roll Over
                 </Button>
             </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-secondary/20 p-2 rounded-lg border-2 border-white/5">
                 <div className="text-[10px] uppercase text-gray-300 font-bold">Multiplier</div>
                 <div className="text-sm font-bold text-white">{multiplier}x</div>
            </div>
            <div className="bg-secondary/20 p-2 rounded-lg border-2 border-white/5">
                 <div className="text-[10px] uppercase text-gray-300 font-bold">Win Chance</div>
                 <div className="text-sm font-bold text-white">{winChance}%</div>
            </div>
            <div className="bg-casino-brand/10 p-2 rounded-lg border-2 border-casino-brand/30 shadow-[0_0_10px_rgba(0,255,163,0.1)]">
                 <div className="text-[10px] uppercase text-casino-brand font-bold">Payout</div>
                 <div className="text-sm font-bold text-white">${payout}</div>
            </div>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Switch id="autobet" />
                <Label htmlFor="autobet" className="text-xs font-bold uppercase cursor-pointer">Auto Bet</Label>
            </div>
            <ProvablyFairInfo />
        </div>
    </div>
  );
}
