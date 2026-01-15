"use client";

import { useState, useCallback, useEffect } from "react";
import { MinesHeader } from "./MinesHeader";
import { MinesBetControls } from "./MinesBetControls";
import { MinesDisplay } from "./MinesDisplay";
import { MinesEducation } from "./MinesEducation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { triggerBalanceRefresh } from "@/hooks/usePlatformBalance";

export type TileState = "hidden" | "safe" | "mine";
export type GameState = "idle" | "playing" | "won" | "lost";

export interface Tile {
  id: number;
  state: TileState;
  isMine: boolean;
}

export function MinesGamePage() {
  const { address } = useAccount();
  const { login } = useAuth();
  const supabase = createClient();

  // Wallet / Balance State
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  
  // Game Config
  const [mineCount, setMineCount] = useState(5);
  const [actualMineCount, setActualMineCount] = useState(5); // Actual mines after house edge applied

  // Game State
  const [gameState, setGameState] = useState<GameState>("idle");
  const [grid, setGrid] = useState<Tile[]>(() => createEmptyGrid());
  const [multiplier, setMultiplier] = useState(1.00);
  const [revealedCount, setRevealedCount] = useState(0);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [lastProfitLoss, setLastProfitLoss] = useState<number | null>(null);
  const [houseEdge, setHouseEdge] = useState<number>(0);

  // Fetch Balance
  useEffect(() => {
    if (!address) {
       setBalance(0);
       return;
    }
    const fetchBalance = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('balances').select('amount').eq('user_id', user.id).single();
            if (data) setBalance(Number(data.amount));
        }
    };
    fetchBalance();
  }, [address, supabase]);

  // Create empty 25-tile grid
  function createEmptyGrid(): Tile[] {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      state: "hidden" as TileState,
      isMine: false,
    }));
  }

  // Calculate multiplier based on mines and revealed tiles
  // NOTE: No house edge applied to multiplier calculation
  // Maximum multiplier capped at 5x
  const MAX_MULTIPLIER = 5;

  const calculateMultiplier = useCallback((revealed: number, mines: number): number => {
    if (revealed === 0) return 1.00;

    let multiplier = 1;
    for (let i = 0; i < revealed; i++) {
      const safeTiles = 25 - mines;
      const remaining = safeTiles - i;
      const total = 25 - i;
      multiplier *= total / remaining;
    }

    // Cap at maximum multiplier and round to 2 decimals
    const cappedMultiplier = Math.min(multiplier, MAX_MULTIPLIER);
    return Math.floor(cappedMultiplier * 100) / 100;
  }, []);

  // Get next tile multiplier preview
  const getNextMultiplier = useCallback((): number => {
    return calculateMultiplier(revealedCount + 1, actualMineCount);
  }, [calculateMultiplier, revealedCount, actualMineCount]);

  // Start a new game
  const handleStartGame = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        toast.info("Please sign in to play");
        await login();
        return;
    }

    if (betAmount > balance) {
        toast.error("Insufficient balance");
        return;
    }
    
    try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/games/mines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authSession?.access_token}`,
          },
          body: JSON.stringify({
            action: 'start',
            betAmount,
            mineCount,
            clientSeed: "default"
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to start game");

        setBalance(data.balance);
        setGameSessionId(data.gameSessionId);
        setHouseEdge(data.houseEdge || 0);
        setActualMineCount(data.actualMineCount || mineCount);
        setLastProfitLoss(null);

        // Trigger navbar balance refresh (bet was deducted)
        triggerBalanceRefresh();

        // Reset Grid
        setGrid(createEmptyGrid());
        setGameState("playing");
        setMultiplier(1.00);
        setRevealedCount(0);
        
    } catch (err: any) {
        console.error(err);
        toast.error(err.message);
    }
  };

  // Handle tile click (Reveal)
  const handleTileClick = async (tileId: number) => {
    if (gameState !== "playing" || !gameSessionId) return;
    
    const tile = grid[tileId];
    if (tile.state !== "hidden") return;
    
    try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/games/mines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authSession?.access_token}`,
          },
          body: JSON.stringify({
            action: 'reveal',
            gameSessionId,
            tileIndex: tileId
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Reveal failed");

        const newGrid = [...grid];

        // Use the tile that was actually revealed (may differ from clicked tile due to house edge)
        const revealedTileIndex = data.revealedTile !== undefined ? data.revealedTile : tileId;

        if (data.hitMine) {
             // Boom - show all mines
             data.minePositions.forEach((idx: number) => {
                 newGrid[idx] = { ...newGrid[idx], state: "mine", isMine: true };
             });

             setGrid(newGrid);
             setGameState("lost");
             setBalance(data.balance);
             setLastProfitLoss(-betAmount);

             // Trigger navbar balance refresh
             triggerBalanceRefresh();

             const message = revealedTileIndex !== tileId
               ? `💥 BOOM! House edge forced a mine! -$${betAmount.toFixed(2)}`
               : `💥 BOOM! You hit a mine. -$${betAmount.toFixed(2)}`;
             toast.error(message);
        } else {
             // Safe - reveal the tile returned by backend
             newGrid[revealedTileIndex] = { ...newGrid[revealedTileIndex], state: "safe" };
             setGrid(newGrid);

             setRevealedCount(prev => prev + 1);
             setMultiplier(data.currentMultiplier);

             if (revealedTileIndex !== tileId) {
               toast.info(`House edge revealed a different tile`);
             }
        }
        
    } catch (err: any) {
        console.error(err);
        toast.error(err.message);
    }
  };

  // Cash out
  const handleCashOut = async () => {
    if (gameState !== "playing" || !gameSessionId) return;
    
    try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/games/mines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authSession?.access_token}`,
          },
          body: JSON.stringify({
            action: 'cashout',
            gameSessionId
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Cashout failed");

        setGameState("won");
        setBalance(data.balance);
        const profit = data.payout - betAmount;
        setLastProfitLoss(profit);

        // Trigger navbar balance refresh
        triggerBalanceRefresh();

        toast.success(`🎉 Cashed out! +$${profit.toFixed(2)}`);

    } catch (err: any) {
        console.error(err);
        toast.error(err.message);
    }
  };

  // Reset game
  const handleReset = useCallback(() => {
    setGrid(createEmptyGrid());
    setGameState("idle");
    setMultiplier(1.00);
    setRevealedCount(0);
    setGameSessionId(null);
    setLastProfitLoss(null);
  }, []);

  const potentialPayout = betAmount * calculateMultiplier(revealedCount, actualMineCount);
  const canCashOut = gameState === "playing" && revealedCount > 0;

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Game Container */}
      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        
        {/* House Edge Display */}
        {houseEdge > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2 text-center">
            <span className="text-yellow-400 text-sm">
              House Edge: {(houseEdge * 100).toFixed(1)}%
            </span>
          </div>
        )}
        
        {/* Last Result Display */}
        {lastProfitLoss !== null && (gameState === "won" || gameState === "lost") && (
          <div className={`rounded-lg px-4 py-3 text-center ${
            lastProfitLoss >= 0 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <span className={`text-lg font-bold ${
              lastProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {lastProfitLoss >= 0 ? '+' : ''}{lastProfitLoss.toFixed(2)} USDT
            </span>
            <span className="text-muted-foreground ml-2">
              | Balance: {balance.toFixed(2)} USDT
            </span>
          </div>
        )}
        
        {/* Main Game Area */}
        <div className="flex flex-col lg:flex-row gap-4 h-auto lg:min-h-[600px]">
          
          {/* Left Panel: Controls */}
          <div className="w-full lg:w-[320px] shrink-0 order-2 lg:order-1">
            <MinesBetControls 
              balance={balance}
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              mineCount={mineCount}
              setMineCount={setMineCount}
              gameState={gameState}
              multiplier={multiplier}
              nextMultiplier={getNextMultiplier()}
              potentialPayout={potentialPayout}
              canCashOut={canCashOut}
              onStartGame={handleStartGame}
              onCashOut={handleCashOut}
              onReset={handleReset}
            />
          </div>

          {/* Center Panel: Display */}
          <div className="flex-1 flex flex-col order-1 lg:order-2">
            <div className="flex-1 flex flex-col gap-4">
              <MinesHeader 
                multiplier={multiplier}
                potentialPayout={potentialPayout}
                gameState={gameState}
              />
              <MinesDisplay 
                grid={grid}
                gameState={gameState}
                onTileClick={handleTileClick}
                multiplier={multiplier}
                betAmount={betAmount}
              />
            </div>
          </div>
        </div>

        {/* Education */}
        <MinesEducation />
      </div>
    </div>
  );
}
