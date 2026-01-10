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
  
  // Game State
  const [gameState, setGameState] = useState<GameState>("idle");
  const [grid, setGrid] = useState<Tile[]>(() => createEmptyGrid());
  const [multiplier, setMultiplier] = useState(1.00);
  const [revealedCount, setRevealedCount] = useState(0);
  const [gameId, setGameId] = useState<string | null>(null);

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

  // Calculate multiplier based on mines and revealed tiles (Backend Formula Sync)
  const calculateMultiplier = useCallback((revealed: number, mines: number): number => {
    if (revealed === 0) return 1.00;
    
    // Formula: 0.97 / Probability
    // Probability = Prod((25-mines-i)/(25-i))
    let probability = 1;
    for (let i = 0; i < revealed; i++) {
        probability *= (25 - mines - i) / (25 - i);
    }
    
    const mult = 0.97 / probability;
    return Math.max(1.00, Math.floor(mult * 100) / 100);
  }, []);

  // Get next tile multiplier preview
  const getNextMultiplier = useCallback((): number => {
    return calculateMultiplier(revealedCount + 1, mineCount);
  }, [calculateMultiplier, revealedCount, mineCount]);

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
        const { data, error } = await supabase.functions.invoke('game-mines', {
             body: { action: 'start', betAmount, mineCount, clientSeed: "default" }
        });

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.error);

        setBalance(data.balance);
        setGameId(data.gameId);
        
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
    if (gameState !== "playing" || !gameId) return;
    
    const tile = grid[tileId];
    if (tile.state !== "hidden") return;
    
    try {
        const { data, error } = await supabase.functions.invoke('game-mines', {
             body: { action: 'reveal', gameId, tileIndex: tileId }
        });

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.error);

        const newGrid = [...grid];

        if (data.win === false) {
             // Boom
             data.mines.forEach((idx: number) => {
                 newGrid[idx] = { ...newGrid[idx], state: "mine", isMine: true };
             });
             // Highlight hit
             if (data.hit !== undefined) newGrid[data.hit] = { ...newGrid[data.hit], state: "mine", isMine: true }; // redundant check
             
             setGrid(newGrid);
             setGameState("lost");
             toast.error("BOOM! You hit a mine.");
        } else {
             // Safe
             newGrid[tileId] = { ...tile, state: "safe" };
             setGrid(newGrid);
             
             setRevealedCount(prev => prev + 1);
             setMultiplier(data.multiplier);
             
             if (data.active === false && data.win === true) {
                 // Auto win (all safe revealed)
                 setGameState("won");
                 setBalance(data.balance);
                 toast.success(`Cleared the board! Won ${data.payout.toFixed(2)} USDT`);
             }
        }
        
    } catch (err: any) {
        console.error(err);
        toast.error(err.message);
    }
  };

  // Cash out
  const handleCashOut = async () => {
    if (gameState !== "playing" || !gameId) return;
    
    try {
         const { data, error } = await supabase.functions.invoke('game-mines', {
             body: { action: 'cashout', gameId }
        });

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.error);
        
        // Reveal Mines
        const newGrid = [...grid];
        data.mines.forEach((idx: number) => {
             // Only show unrevealed mines? Usually shows all mines on end
             if (newGrid[idx].state === 'hidden') {
                 newGrid[idx] = { ...newGrid[idx], isMine: true, state: 'hidden' }; // Just mark them but don't 'explode' visually? 
                 // Or reveal them as safe-to-see? 
                 // Typically you show where mines were.
                 newGrid[idx] = { ...newGrid[idx], state: 'mine', isMine: true };
             }
        });
        setGrid(newGrid);

        setGameState("won");
        setBalance(data.balance);
        toast.success(`Cashed out! Won ${data.payout.toFixed(2)} USDT`);

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
    setGameId(null);
  }, []);

  const potentialPayout = betAmount * calculateMultiplier(revealedCount, mineCount);
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
