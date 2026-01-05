"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CrashBetControlsProps {
  balance: number;
  betAmount: number;
  setBetAmount: (amount: number) => void;
  autoCashOut: number;
  setAutoCashOut: (value: number) => void;
  gameState: "waiting" | "running" | "crashed";
  hasBet: boolean;
  currentMultiplier: number;
  onPlaceBet: () => void;
  onCashOut: () => void;
}

export function CrashBetControls({
  balance,
  betAmount,
  setBetAmount,
  autoCashOut,
  setAutoCashOut,
  gameState,
  hasBet,
  currentMultiplier,
  onPlaceBet,
  onCashOut,
}: CrashBetControlsProps) {
  const potentialWin = betAmount * currentMultiplier;
  const canPlaceBet = gameState === "waiting" && betAmount > 0 && betAmount <= balance && !hasBet;
  const canCashOut = gameState === "running" && hasBet;

  return (
    <div className="flex h-full flex-col gap-6 bg-black/20 backdrop-blur-md p-4 md:w-[320px] md:border-r border-white/5 relative z-10">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/5 p-1 h-12">
          <TabsTrigger value="manual" className="data-[state=active]:bg-casino-brand data-[state=active]:text-black font-bold h-full">Manual</TabsTrigger>
          <TabsTrigger value="auto" className="data-[state=active]:bg-casino-brand data-[state=active]:text-black font-bold h-full">Auto</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="space-y-5 mt-6">
          {/* Bet Amount */}
          <div className="space-y-3">
            <Label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Bet Amount</Label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-casino-brand font-bold">$</div>
              <Input 
                type="number" 
                value={betAmount} 
                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                disabled={gameState !== "waiting" || hasBet}
                className="pl-6 font-mono font-bold bg-black/40 border-white/10 focus-visible:ring-casino-brand h-12 text-lg transition-all group-hover:border-casino-brand/30 disabled:opacity-50" 
              />
              <div className="absolute right-1 top-1 flex gap-1 h-10 items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={gameState !== "waiting" || hasBet}
                  className="h-8 px-3 text-xs font-bold hover:text-casino-brand hover:bg-casino-brand/10 border border-white/5" 
                  onClick={() => setBetAmount(betAmount / 2)}
                >
                  ½
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={gameState !== "waiting" || hasBet}
                  className="h-8 px-3 text-xs font-bold hover:text-casino-brand hover:bg-casino-brand/10 border border-white/5" 
                  onClick={() => setBetAmount(betAmount * 2)}
                >
                  2×
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={gameState !== "waiting" || hasBet}
                  className="h-8 px-3 text-xs font-bold hover:text-casino-brand hover:bg-casino-brand/10 border border-white/5" 
                  onClick={() => setBetAmount(balance)}
                >
                  Max
                </Button>
              </div>
            </div>
          </div>

          {/* Auto Cash Out */}
          <div className="space-y-3">
            <Label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Auto Cash Out</Label>
            <div className="relative group">
              <Input 
                type="number" 
                value={autoCashOut || ""} 
                onChange={(e) => setAutoCashOut(parseFloat(e.target.value) || 0)}
                placeholder="Disabled"
                step="0.1"
                min="1.01"
                disabled={gameState !== "waiting"}
                className="font-mono font-bold bg-black/40 border-white/10 focus-visible:ring-casino-brand h-12 text-lg transition-all group-hover:border-casino-brand/30 disabled:opacity-50 pr-10" 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">×</div>
            </div>
            <p className="text-xs text-gray-500">Set to 0 to disable auto cash out</p>
          </div>

          {/* Potential Win */}
          {hasBet && gameState === "running" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <Label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Potential Win</Label>
              <div className="p-4 bg-casino-brand/10 border-2 border-casino-brand/30 rounded-lg">
                <span className="text-3xl font-black text-casino-brand">${potentialWin.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {gameState === "waiting" && !hasBet && (
            <Button 
              disabled={!canPlaceBet}
              onClick={onPlaceBet}
              className="w-full h-16 text-xl font-black uppercase tracking-widest bg-casino-brand text-black hover:bg-casino-brand/90 shadow-[0_0_20px_rgba(0,255,163,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] border-0 mt-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Place Bet
            </Button>
          )}

          {gameState === "waiting" && hasBet && (
            <div className="w-full h-16 flex items-center justify-center bg-yellow-500/20 border-2 border-yellow-500/30 rounded-xl">
              <span className="text-lg font-bold text-yellow-400">Waiting for round...</span>
            </div>
          )}

          {gameState === "running" && hasBet && (
            <Button 
              onClick={onCashOut}
              className="w-full h-20 text-xl font-black uppercase tracking-widest bg-green-500 text-white hover:bg-green-400 shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] border-0 mt-2 rounded-xl animate-pulse"
              style={{ animationDuration: '1s' }}
            >
              <div className="flex flex-col items-center">
                <span>Cash Out</span>
                <span className="text-2xl">${potentialWin.toFixed(2)}</span>
              </div>
            </Button>
          )}

          {gameState === "running" && !hasBet && (
            <div className="w-full h-16 flex items-center justify-center bg-gray-500/20 border-2 border-gray-500/30 rounded-xl">
              <span className="text-lg font-bold text-gray-400">Round in progress...</span>
            </div>
          )}

          {gameState === "crashed" && (
            <div className="w-full h-16 flex items-center justify-center bg-red-500/20 border-2 border-red-500/30 rounded-xl animate-in fade-in">
              <span className="text-lg font-bold text-red-400">Round ended</span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="auto" className="space-y-6 mt-6">
          <div className="space-y-3">
            <Label className="text-gray-400">Bet Amount</Label>
            <Input type="number" placeholder="0.00" className="bg-black/40 border-white/10" />
          </div>
          <div className="space-y-3">
            <Label className="text-gray-400">Number of Rounds</Label>
            <Input type="number" placeholder="∞" className="bg-black/40 border-white/10" />
          </div>
          <div className="space-y-3">
            <Label className="text-gray-400">Auto Cash Out At</Label>
            <Input type="number" placeholder="2.00" className="bg-black/40 border-white/10" />
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
            Start Auto Play
          </Button>
        </TabsContent>
      </Tabs>

      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="hover:text-white cursor-pointer transition-colors">Fairness Verified</span>
          <span className="text-casino-brand font-bold">${balance.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
