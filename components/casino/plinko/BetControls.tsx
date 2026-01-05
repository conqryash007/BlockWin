"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BetControlsProps {
  balance: number;
  betAmount: number;
  setBetAmount: (amount: number) => void;
  isDropping: boolean;
  onDrop: () => void;
  expectedMultiplier: number;
}

export function BetControls({ 
  balance, 
  betAmount, 
  setBetAmount, 
  isDropping, 
  onDrop,
  expectedMultiplier 
}: BetControlsProps) {
  return (
    <div className="flex h-full flex-col gap-6 bg-black/20 backdrop-blur-md p-4 md:w-[320px] md:border-r border-white/5 relative z-10">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/5 p-1 h-12">
          <TabsTrigger value="manual" className="data-[state=active]:bg-casino-brand data-[state=active]:text-black font-bold h-full">Manual</TabsTrigger>
          <TabsTrigger value="auto" className="data-[state=active]:bg-casino-brand data-[state=active]:text-black font-bold h-full">Auto</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="space-y-6 mt-6">
            <div className="space-y-3">
                <Label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Bet Amount</Label>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-casino-brand font-bold">$</div>
                    <Input 
                        type="number" 
                        value={betAmount} 
                        onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                        className="pl-6 font-mono font-bold bg-black/40 border-white/10 focus-visible:ring-casino-brand h-12 text-lg transition-all group-hover:border-casino-brand/30" 
                    />
                    <div className="absolute right-1 top-1 flex gap-1 h-10 items-center">
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-bold hover:text-casino-brand hover:bg-casino-brand/10 border border-white/5" onClick={() => setBetAmount(betAmount / 2)}>½</Button>
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-bold hover:text-casino-brand hover:bg-casino-brand/10 border border-white/5" onClick={() => setBetAmount(betAmount * 2)}>2×</Button>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                 <Label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Max Profit</Label>
                 <Input readOnly value={(betAmount * 10).toFixed(2)} className="font-mono bg-black/40 border-casino-brand/20 text-casino-brand font-bold h-12" />
            </div>

            <Button 
              disabled={isDropping || betAmount > balance || betAmount <= 0}
              onClick={onDrop}
              className="w-full h-16 text-xl font-black uppercase tracking-widest bg-casino-brand text-black hover:bg-casino-brand/90 shadow-[0_0_20px_rgba(0,255,163,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] border-0 mt-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isDropping ? "Dropping..." : "Drop Ball"}
            </Button>
        </TabsContent>

        <TabsContent value="auto" className="space-y-6 mt-6">
             <div className="space-y-3">
                <Label className="text-gray-400">Bet Amount</Label>
                <Input type="number" placeholder="0.00" className="bg-black/40 border-white/10" />
            </div>
            <div className="space-y-3">
                <Label className="text-gray-400">Number of Drops</Label>
                <Input type="number" placeholder="∞" className="bg-black/40 border-white/10" />
            </div>
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <Label className="text-sm font-medium">Stop on Profit</Label>
                <Switch />
            </div>
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <Label className="text-sm font-medium">Stop on Loss</Label>
                <Switch />
            </div>
            <Button className="w-full h-14 text-lg font-bold bg-casino-brand text-black hover:bg-casino-brand/90 hover:shadow-[0_0_15px_rgba(0,255,163,0.3)]">
                Start Autodrop
            </Button>
        </TabsContent>
      </Tabs>

      <div className="mt-auto pt-6 border-t border-white/5">
         <div className="flex justify-between text-xs text-muted-foreground">
            <span className="hover:text-white cursor-pointer transition-colors">Fairness Verified</span>
            <span className="hover:text-white cursor-pointer transition-colors">Server Seed</span>
         </div>
      </div>
    </div>
  );
}
