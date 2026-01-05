"use client";

import { useState, useCallback } from "react";
import { MinesHeader } from "./MinesHeader";
import { MinesBetControls } from "./MinesBetControls";
import { MinesDisplay } from "./MinesDisplay";
import { MinesEducation } from "./MinesEducation";

export type TileState = "hidden" | "safe" | "mine";
export type GameState = "idle" | "playing" | "won" | "lost";

export interface Tile {
  id: number;
  state: TileState;
  isMine: boolean;
}

export function MinesGamePage() {
  // Wallet / Balance State
  const [balance, setBalance] = useState(1243.50);
  const [betAmount, setBetAmount] = useState(10);
  
  // Game Config
  const [mineCount, setMineCount] = useState(5);
  
  // Game State
  const [gameState, setGameState] = useState<GameState>("idle");
  const [grid, setGrid] = useState<Tile[]>(() => createEmptyGrid());
  const [multiplier, setMultiplier] = useState(1.00);
  const [revealedCount, setRevealedCount] = useState(0);

  // Create empty 25-tile grid
  function createEmptyGrid(): Tile[] {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      state: "hidden" as TileState,
      isMine: false,
    }));
  }

  // Calculate multiplier based on mines and revealed tiles
  const calculateMultiplier = useCallback((revealed: number, mines: number): number => {
    if (revealed === 0) return 1.00;
    
    const safeTiles = 25 - mines;
    let multiplier = 1;
    
    for (let i = 0; i < revealed; i++) {
      const remaining = safeTiles - i;
      const total = 25 - i;
      // House edge of ~1%
      multiplier *= (total / remaining) * 0.99;
    }
    
    return Math.round(multiplier * 100) / 100;
  }, []);

  // Get next tile multiplier preview
  const getNextMultiplier = useCallback((): number => {
    return calculateMultiplier(revealedCount + 1, mineCount);
  }, [calculateMultiplier, revealedCount, mineCount]);

  // Start a new game
  const handleStartGame = useCallback(() => {
    if (betAmount > balance) return;
    
    // Deduct bet
    setBalance(prev => prev - betAmount);
    
    // Generate mine positions
    const minePositions = new Set<number>();
    while (minePositions.size < mineCount) {
      minePositions.add(Math.floor(Math.random() * 25));
    }
    
    // Create new grid with mines
    const newGrid = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      state: "hidden" as TileState,
      isMine: minePositions.has(i),
    }));
    
    setGrid(newGrid);
    setGameState("playing");
    setMultiplier(1.00);
    setRevealedCount(0);
  }, [betAmount, balance, mineCount]);

  // Handle tile click
  const handleTileClick = useCallback((tileId: number) => {
    if (gameState !== "playing") return;
    
    const tile = grid[tileId];
    if (tile.state !== "hidden") return;
    
    const newGrid = [...grid];
    
    if (tile.isMine) {
      // Hit a mine - reveal all mines
      newGrid.forEach((t, i) => {
        if (t.isMine) {
          newGrid[i] = { ...t, state: "mine" };
        }
      });
      newGrid[tileId] = { ...newGrid[tileId], state: "mine" };
      setGrid(newGrid);
      setGameState("lost");
    } else {
      // Safe tile
      newGrid[tileId] = { ...tile, state: "safe" };
      setGrid(newGrid);
      
      const newRevealed = revealedCount + 1;
      setRevealedCount(newRevealed);
      setMultiplier(calculateMultiplier(newRevealed, mineCount));
      
      // Check if all safe tiles revealed (auto-win)
      const safeTilesTotal = 25 - mineCount;
      if (newRevealed >= safeTilesTotal) {
        handleCashOut();
      }
    }
  }, [gameState, grid, revealedCount, mineCount, calculateMultiplier]);

  // Cash out
  const handleCashOut = useCallback(() => {
    if (gameState !== "playing" || revealedCount === 0) return;
    
    const winnings = betAmount * multiplier;
    setBalance(prev => prev + winnings);
    setGameState("won");
  }, [gameState, revealedCount, betAmount, multiplier]);

  // Reset game
  const handleReset = useCallback(() => {
    setGrid(createEmptyGrid());
    setGameState("idle");
    setMultiplier(1.00);
    setRevealedCount(0);
  }, []);

  const potentialPayout = betAmount * multiplier;
  const canCashOut = gameState === "playing" && revealedCount > 0;

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Game Container */}
      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        
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
