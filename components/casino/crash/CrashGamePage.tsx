"use client";

import { useState, useEffect, useRef } from "react";
import { CrashHeader } from "./CrashHeader";
import { CrashBetControls } from "./CrashBetControls";
import { CrashDisplay } from "./CrashDisplay";
import { CrashEducation } from "./CrashEducation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { triggerBalanceRefresh } from "@/hooks/usePlatformBalance";

type GameState = "waiting" | "starting" | "running" | "crashed" | "won";

export function CrashGamePage() {
  const { address } = useAccount();
  const { login } = useAuth();
  const supabase = createClient();

  // Balance & Betting State
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  
  // Game State
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [lastProfitLoss, setLastProfitLoss] = useState<number | null>(null);
  const [houseEdge, setHouseEdge] = useState<number>(0);
  const [isWin, setIsWin] = useState(false);
  
  // Session tracking for two-phase gameplay
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [history, setHistory] = useState<{ multiplier: number; id: number }[]>([]);
  
  // Animation refs
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const targetCrashPoint = useRef<number>(1);
  const currentMultiplierRef = useRef<number>(1.00);

  // Fetch Balance & History
  useEffect(() => {
    if (!address) {
       setBalance(0);
       return;
    }
    
    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: bal } = await supabase.from('balances').select('amount').eq('user_id', user.id).single();
            if (bal) setBalance(Number(bal.amount));

            const { data: games } = await supabase
                .from('game_sessions')
                .select('outcome')
                .eq('game_type', 'crash')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (games) {
                const hist = games.map((g: any, i: number) => ({
                    multiplier: g.outcome?.crashPoint || 0,
                    id: i
                })).filter(h => h.multiplier > 0);
                setHistory(hist);
            }
        }
    };
    fetchData();
  }, [address, supabase]);

  // Animation loop - runs when gameState is "running"
  useEffect(() => {
    if (gameState === "running" && crashPoint) {
      const animate = () => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        // Exponential growth: 1.00 * e^(0.15*t) - faster animation
        const newMultiplier = Math.pow(Math.E, 0.15 * elapsed);
        
        // Check if we've reached the crash point
        if (newMultiplier >= targetCrashPoint.current) {
          // Stop animation - we crashed!
          cancelAnimationFrame(animationRef.current!);
          setMultiplier(targetCrashPoint.current);
          currentMultiplierRef.current = targetCrashPoint.current;
          
          // Only auto-crash if we haven't already cashed out
          if (gameState === "running" && !isProcessing) {
            handleCrashed();
          }
          return;
        }
        
        setMultiplier(newMultiplier);
        currentMultiplierRef.current = newMultiplier;
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [gameState, crashPoint]);

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
    
    if (isProcessing) return;

    try {
        setIsProcessing(true);
        setGameState("starting"); // Show "Please wait" message
        setLastProfitLoss(null);
        setMultiplier(1.00);
        currentMultiplierRef.current = 1.00;
        setCrashPoint(null);
        setIsWin(false);
        
        // Call Next.js API route with "start" action
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/games/crash', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authSession?.access_token}`,
          },
          body: JSON.stringify({
            action: 'start',
            betAmount,
            clientSeed: "default"
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to start game");

        // Store session and crash point
        setSessionId(data.sessionId);
        setCrashPoint(data.crashPoint);
        targetCrashPoint.current = data.crashPoint;
        setBalance(data.balance);
        setHouseEdge(data.houseEdge || 0);
        
        // Start animation
        startTimeRef.current = Date.now();
        setGameState("running");
        setIsProcessing(false);

    } catch (err: any) {
        console.error(err);
        toast.error(err.message);
        setGameState("waiting");
        setIsProcessing(false);
    }
  };

  // Handle cash out - player clicks cash out button during game
  const handleCashOut = async () => {
    if (!sessionId || isProcessing || gameState !== "running") return;
    
    // Cancel animation immediately to freeze the multiplier
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    const cashOutMultiplier = currentMultiplierRef.current;
    
    // Validate we haven't already crashed
    if (crashPoint && cashOutMultiplier >= crashPoint) {
      handleCrashed();
      return;
    }

    try {
      setIsProcessing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/games/crash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'cashout',
          sessionId,
          multiplier: Math.floor(cashOutMultiplier * 100) / 100, // Round down to 2 decimal places
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to cash out");

      // Update state with win result
      setBalance(data.balance);
      setLastProfitLoss(data.profitLoss);
      setIsWin(true);
      setGameState("won");
      
      toast.success(`🎉 Cashed out at ${cashOutMultiplier.toFixed(2)}x! +$${data.profitLoss.toFixed(2)}`);
      
      // Update history
      setHistory(prev => [{ multiplier: crashPoint!, id: Date.now() }, ...prev.slice(0, 9)]);
      
      // Trigger navbar balance refresh
      triggerBalanceRefresh();
      
      setSessionId(null);
      setIsProcessing(false);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
      setIsProcessing(false);
      // Resume animation if cash out failed
      if (gameState === "running") {
        startTimeRef.current = Date.now() - (Math.log(currentMultiplierRef.current) / 0.15) * 1000;
        animationRef.current = requestAnimationFrame(() => {
          const animate = () => {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            const newMultiplier = Math.pow(Math.E, 0.15 * elapsed);
            if (newMultiplier >= targetCrashPoint.current) {
              handleCrashed();
              return;
            }
            setMultiplier(newMultiplier);
            currentMultiplierRef.current = newMultiplier;
            animationRef.current = requestAnimationFrame(animate);
          };
          animate();
        });
      }
    }
  };

  // Handle crashed - game crashed before player cashed out
  const handleCrashed = async () => {
    if (!sessionId || isProcessing) return;
    
    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    try {
      setIsProcessing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/games/crash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'crashed',
          sessionId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to finalize crash");

      // Update state with loss result
      setBalance(data.balance);
      setLastProfitLoss(data.profitLoss);
      setIsWin(false);
      setGameState("crashed");
      
      toast.error(`💥 Crashed at ${crashPoint?.toFixed(2)}x! -$${Math.abs(data.profitLoss).toFixed(2)}`);
      
      // Update history
      setHistory(prev => [{ multiplier: crashPoint!, id: Date.now() }, ...prev.slice(0, 9)]);
      
      triggerBalanceRefresh();
      
      setSessionId(null);
      setIsProcessing(false);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
      setIsProcessing(false);
    }
  };

  // Reset for new game
  const handleNewGame = () => {
    if (isProcessing) return; // Prevent new game while processing
    setGameState("waiting");
    setMultiplier(1.00);
    currentMultiplierRef.current = 1.00;
    setCrashPoint(null);
    setLastProfitLoss(null);
    setSessionId(null);
  };

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
        
        {/* End of Round Result Display */}
        {lastProfitLoss !== null && (gameState === "crashed" || gameState === "won") && (
          <div className={`rounded-xl px-6 py-6 text-center space-y-2 ${
            lastProfitLoss >= 0 
              ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/30' 
              : 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/30'
          }`}>
            <div className="text-sm uppercase tracking-wider text-gray-400">
              {lastProfitLoss >= 0 ? '🎉 You Won!' : '💥 Better Luck Next Time'}
            </div>
            <div className={`text-4xl font-black ${
              lastProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {lastProfitLoss >= 0 ? '+' : ''}{lastProfitLoss.toFixed(2)} USDT
            </div>
            <div className="text-muted-foreground text-sm">
              New Balance: <span className="font-bold text-white">{balance.toFixed(2)} USDT</span>
            </div>
            {lastProfitLoss >= 0 && crashPoint && (
              <div className="text-casino-brand text-sm">
                Crashed at {crashPoint.toFixed(2)}x • Cashed out at {multiplier.toFixed(2)}x
              </div>
            )}
          </div>
        )}
        
        {/* Main Game Area */}
        <div className="flex flex-col lg:flex-row gap-4 h-auto">
          
          {/* Left Panel: Controls */}
          <div className="order-2 lg:order-1 w-full lg:w-[320px] shrink-0">
            <CrashBetControls 
              balance={balance}
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              gameState={gameState === "won" ? "crashed" : gameState as any}
              hasBet={gameState === "running" || gameState === "starting"}
              currentMultiplier={multiplier}
              onPlaceBet={handlePlaceBet}
              onCashOut={handleCashOut}
              isProcessing={isProcessing}
            />
          </div>

          {/* Center Panel: Display */}
          <div className="order-1 lg:order-2 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col gap-4">
              <CrashHeader />
              <CrashDisplay 
                gameState={gameState === "won" ? "crashed" : gameState === "starting" ? "starting" : gameState as any}
                multiplier={multiplier}
                countdown={0}
                history={history}
                crashPoint={crashPoint || 0}
                hasBet={gameState === "running" || gameState === "crashed" || gameState === "won" || gameState === "starting"}
                cashedOut={isWin}
                cashOutMultiplier={isWin ? multiplier : undefined}
                betAmount={betAmount}
                winAmount={lastProfitLoss !== null && lastProfitLoss >= 0 ? lastProfitLoss : undefined}
              />
            </div>
          </div>
        </div>

        {/* Play Again Button */}
        {(gameState === "crashed" || gameState === "won") && !isProcessing && (
          <div className="flex justify-center">
            <button
              onClick={handleNewGame}
              className="px-8 py-3 bg-casino-brand text-black font-bold rounded-lg hover:bg-casino-brand/80 transition-all"
            >
              Play Again
            </button>
          </div>
        )}
        
        {/* Processing Indicator */}
        {isProcessing && (gameState === "crashed" || gameState === "won") && (
          <div className="flex justify-center">
            <div className="px-8 py-3 bg-gray-500/20 text-gray-400 font-bold rounded-lg">
              Updating balance...
            </div>
          </div>
        )}

        {/* Education */}
        <CrashEducation />
      </div>
    </div>
  );
}
