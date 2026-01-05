"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Minus, Plus, RefreshCw, Bomb, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GameState } from "./MinesGamePage";

interface MinesBetControlsProps {
  balance: number;
  betAmount: number;
  setBetAmount: (val: number) => void;
  mineCount: number;
  setMineCount: (val: number) => void;
  gameState: GameState;
  multiplier: number;
  nextMultiplier: number;
  potentialPayout: number;
  canCashOut: boolean;
  onStartGame: () => void;
  onCashOut: () => void;
  onReset: () => void;
}

export function MinesBetControls({
  balance,
  betAmount,
  setBetAmount,
  mineCount,
  setMineCount,
  gameState,
  multiplier,
  nextMultiplier,
  potentialPayout,
  canCashOut,
  onStartGame,
  onCashOut,
  onReset,
}: MinesBetControlsProps) {
  const isPlaying = gameState === "playing";
  const isGameOver = gameState === "won" || gameState === "lost";

  const adjustBet = (type: 'half' | 'double' | 'max') => {
    switch (type) {
      case 'half': setBetAmount(Math.max(0.1, betAmount / 2)); break;
      case 'double': setBetAmount(Math.min(balance, betAmount * 2)); break;
      case 'max': setBetAmount(balance); break;
    }
  };

  const handleMineSliderChange = (vals: number[]) => {
    setMineCount(vals[0]);
  };

  return (
    <div className="bg-gradient-to-b from-[#12151a] to-[#0d1014] rounded-xl p-4 flex flex-col gap-4 border-2 border-casino-brand/20 shadow-[0_0_15px_rgba(0,255,163,0.1)] h-full">
      
      {/* Balance */}
      <div className="flex justify-between items-center text-sm font-bold bg-black/30 p-3 rounded-lg border border-casino-brand/20">
        <span className="text-gray-400">Balance</span>
        <span className="text-white font-mono text-lg">${balance.toFixed(2)}</span>
      </div>

      {/* Bet Amount */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400 uppercase font-bold tracking-wider">
          <span>Bet Amount</span>
          <span className="text-white">${betAmount.toFixed(2)}</span>
        </div>
        <div className="relative">
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
              onClick={() => setBetAmount(Math.max(0.1, betAmount - 1))}
              disabled={isPlaying}
            >
              <Minus className="h-3 w-3" />
            </Button>
          </div>
          <Input 
            type="number" 
            value={betAmount} 
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="h-11 text-center font-bold bg-black/30 border-2 border-white/10 text-white text-lg px-12"
            disabled={isPlaying}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
              onClick={() => setBetAmount(betAmount + 1)}
              disabled={isPlaying}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/5 border-white/10 text-xs h-8 hover:bg-white/10 hover:border-casino-brand/30" 
            onClick={() => adjustBet('half')}
            disabled={isPlaying}
          >
            ½
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/5 border-white/10 text-xs h-8 hover:bg-white/10 hover:border-casino-brand/30" 
            onClick={() => adjustBet('double')}
            disabled={isPlaying}
          >
            2×
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/5 border-white/10 text-xs h-8 hover:bg-white/10 hover:border-casino-brand/30" 
            onClick={() => adjustBet('max')}
            disabled={isPlaying}
          >
            Max
          </Button>
        </div>
      </div>

      {/* Mines Selector */}
      <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase font-bold">
            <Bomb className="w-4 h-4" />
            Mines
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white">{mineCount}</span>
            <span className="text-xs text-gray-500">/ 24</span>
          </div>
        </div>
        <Slider 
          value={[mineCount]} 
          max={24} 
          min={1} 
          step={1} 
          onValueChange={handleMineSliderChange}
          disabled={isPlaying}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>Low Risk</span>
          <span>High Risk</span>
        </div>
      </div>

      {/* Action Buttons */}
      {!isPlaying && !isGameOver && (
        <Button 
          className="w-full h-14 text-xl font-black uppercase tracking-wider shadow-[0_0_25px_rgba(0,212,139,0.4)] hover:shadow-[0_0_40px_rgba(0,212,139,0.6)] transition-all active:scale-95 border-2 border-casino-brand/30"
          size="lg"
          variant="casino"
          onClick={onStartGame}
          disabled={betAmount > balance || betAmount <= 0}
        >
          Start Game
        </Button>
      )}

      {isPlaying && (
        <Button 
          className={cn(
            "w-full h-14 text-xl font-black uppercase tracking-wider transition-all active:scale-95 border-2",
            canCashOut 
              ? "bg-gradient-to-r from-casino-brand to-emerald-500 text-black shadow-[0_0_25px_rgba(0,212,139,0.4)] hover:shadow-[0_0_40px_rgba(0,212,139,0.6)] border-casino-brand/30"
              : "bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed"
          )}
          size="lg"
          onClick={onCashOut}
          disabled={!canCashOut}
        >
          {canCashOut ? `Cash Out $${potentialPayout.toFixed(2)}` : 'Reveal a tile first'}
        </Button>
      )}

      {isGameOver && (
        <Button 
          className="w-full h-14 text-xl font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 border-2 border-white/20 transition-all active:scale-95"
          size="lg"
          onClick={onReset}
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Play Again
        </Button>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-center mt-auto">
        <div className="bg-black/30 p-3 rounded-lg border border-white/5">
          <div className="text-[10px] uppercase text-gray-500 font-bold flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Current
          </div>
          <div className="text-lg font-black text-white">{multiplier.toFixed(2)}x</div>
        </div>
        <div className="bg-casino-brand/10 p-3 rounded-lg border border-casino-brand/30">
          <div className="text-[10px] uppercase text-casino-brand font-bold flex items-center justify-center gap-1">
            <Zap className="w-3 h-3" />
            Next Tile
          </div>
          <div className="text-lg font-black text-casino-brand">{nextMultiplier.toFixed(2)}x</div>
        </div>
      </div>

      {/* Auto Play Toggle */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Switch id="autoplay" disabled />
          <Label htmlFor="autoplay" className="text-xs font-bold uppercase cursor-pointer text-gray-500">
            Auto Play
          </Label>
        </div>
        <span className="text-[10px] text-gray-600 uppercase">Coming Soon</span>
      </div>
    </div>
  );
}
