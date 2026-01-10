"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CrashHeader } from "./CrashHeader";
import { CrashBetControls } from "./CrashBetControls";
import { CrashDisplay } from "./CrashDisplay";
import { CrashEducation } from "./CrashEducation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useAccount } from "wagmi";

type GameState = "waiting" | "running" | "crashed" | "won";

export function CrashGamePage() {
  const { address } = useAccount();
  const { login } = useAuth();
  const supabase = createClient();

  // Balance & Betting State
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashOut, setAutoCashOut] = useState(0); // 0 = disabled
  
  // Game State
  const [gameState, setGameState] = useState<GameState>("waiting"); // waiting = idle
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState<number | null>(null); // Only known after end in Blind mode
  const [currentInfo, setCurrentInfo] = useState<{ hasBet: boolean, cashedOut: boolean, gameId?: string }>({
      hasBet: false, 
      cashedOut: false 
  });
  
  const [history, setHistory] = useState<{ multiplier: number; id: number }[]>([]);

  // Refs for animation
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  // Fetch Balance & History
  useEffect(() => {
    if (!address) {
       setBalance(0);
       return;
    }
    
    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Balance
            const { data: bal } = await supabase.from('balances').select('amount').eq('user_id', user.id).single();
            if (bal) setBalance(Number(bal.amount));

            // History (Last 10 crash games global or personal? Personal is better for SP)
            const { data: games } = await supabase
                .from('game_sessions')
                .select('outcome')
                .eq('game_type', 'crash')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (games) {
                const hist = games.map((g: any, i: number) => ({
                    multiplier: g.outcome.crashPoint || 0,
                    id: i
                })).filter(h => h.multiplier > 0);
                setHistory(hist);
            }
        }
    };
    fetchData();
  }, [address, supabase]);

  // Handle placing a bet (Start Game)
  const handlePlaceBet = async () => {
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

    if (betAmount <= 0) return;

    try {
        setGameState("waiting"); // Transition
        
        const { data, error } = await supabase.functions.invoke('game-crash', {
            body: {
                action: 'bet',
                betAmount,
                autoCashout: autoCashOut > 1 ? autoCashOut : null, // Backend expects null if disabled
                clientSeed: "default"
            }
        });

        if (error) throw new Error(error.message || "Failed to start game");
        if (data.error) throw new Error(data.error);

        // Deduct local balance
        setBalance(data.balance);

        // If autoCashout hit instantly (returned win/crashPoint)
        if (data.crashPoint) {
             // Game finished instantly
             setCrashPoint(data.crashPoint);
             setMultiplier(data.crashPoint);
             if (data.win) {
                 setGameState("won");
                 toast.success(`Won ${data.payout.toFixed(2)} USDT!`);
                 setBalance(data.balance); // Update with win
             } else {
                 setGameState("crashed");
             }
             
             // Update history
             setHistory(prev => [{ multiplier: data.crashPoint, id: Date.now() }, ...prev.slice(0, 9)]);
        } else {
             // Game Active
             setCurrentInfo({ hasBet: true, cashedOut: false, gameId: data.gameId });
             startTimeRef.current = Date.now(); // Start animation sync
             setGameState("running");
             setMultiplier(1.00);
        }

    } catch (err: any) {
        console.error(err);
        toast.error(err.message);
        setGameState("waiting");
    }
  };

  // Handle cashing out
  const handleCashOut = async () => {
    if (gameState !== "running" || !currentInfo.gameId || currentInfo.cashedOut) return;
    
    // Capture current multiplier to request
    const requestMultiplier = multiplier;

    try {
         const { data, error } = await supabase.functions.invoke('game-crash', {
            body: {
                action: 'cashout',
                gameId: currentInfo.gameId,
                multiplier: requestMultiplier
            }
        });

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.error);

        setCrashPoint(data.crashPoint);

        if (data.win) {
            setGameState("won");
            setBalance(data.balance);
            setCurrentInfo(prev => ({ ...prev, cashedOut: true }));
            toast.success(`Cashed out at ${requestMultiplier.toFixed(2)}x! Payout: ${data.payout.toFixed(2)} USDT`);
        } else {
            // Late cashout -> Crashed
            setGameState("crashed");
            setMultiplier(data.crashPoint); // Show actual crash point
        }
        
        // History
        setHistory(prev => [{ multiplier: data.crashPoint, id: Date.now() }, ...prev.slice(0, 9)]);

    } catch (err: any) {
        console.error(err);
        toast.error(err.message);
    }
  };

  // Animation Loop
  // Only runs if gameState == 'running'
  // In Blind mode, we just increment based on time.
  useEffect(() => {
    if (gameState === "running") {
      const animate = () => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        // Exponential growth
        // Simple: 1.00 * e^(0.06 * t) ... tune speed
        // Current used 0.1 which is fast.
        const newMultiplier = Math.pow(Math.E, 0.06 * elapsed);
        
        setMultiplier(newMultiplier);
        
        // Auto-cashout check handling? 
        // If we used backend autoCashout, it would have handled it.
        // If we implement client-side auto-trigger for 'manual' backend mode, we do it here.
        // BUT backend `game-crash` 'bet' handles autoCashout natively. 
        // So if we are here, autoCashout was NOT set or NOT hit instantly (wait, backend handles `bet` autoCashout immediately).
        // So here we only handle manual cashout.
        
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [gameState]);

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Game Container */}
      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        
        {/* Main Game Area */}
        <div className="flex flex-col lg:flex-row gap-4 h-auto">
          
          {/* Left Panel: Controls */}
          <div className="order-2 lg:order-1 w-full lg:w-[320px] shrink-0">
            <CrashBetControls 
              balance={balance}
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              autoCashOut={autoCashOut}
              setAutoCashOut={setAutoCashOut}
              gameState={gameState as any}
              hasBet={currentInfo.hasBet}
              currentMultiplier={multiplier}
              onPlaceBet={handlePlaceBet}
              onCashOut={handleCashOut}
            />
          </div>

          {/* Center Panel: Display */}
          <div className="order-1 lg:order-2 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col gap-4">
              <CrashHeader />
              <CrashDisplay 
                gameState={gameState as any} // Cast if type mismatch in props
                multiplier={multiplier}
                countdown={0} // Removed
                history={history}
                crashPoint={crashPoint || 0}
                hasBet={currentInfo.hasBet}
                cashedOut={currentInfo.cashedOut}
                cashOutMultiplier={currentInfo.cashedOut ? multiplier : undefined}
              />
            </div>
          </div>
        </div>

        {/* Education */}
        <CrashEducation />
      </div>
    </div>
  );
}
