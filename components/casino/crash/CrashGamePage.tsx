"use client";

import { useState, useEffect, useRef } from "react";
import { CrashHeader } from "./CrashHeader";
import { CrashBetControls } from "./CrashBetControls";
import { CrashDisplay } from "./CrashDisplay";
import { CrashEducation } from "./CrashEducation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { triggerBalanceRefresh } from "@/hooks/usePlatformBalance";

type GameState = "waiting" | "starting" | "running" | "crashed" | "won";

// Multiplier curve: m(t) = e^(GROWTH_RATE * t). Must match GROWTH_RATE in
// app/api/games/crash/route.ts - the server recomputes the multiplier from this
// same curve and its own clock to decide every payout.
const GROWTH_RATE = 0.15;

export function CrashGamePage() {
  // Use useAuth - isAuthenticated for balance, login for prompting
  const { isAuthenticated, login } = useAuth();
  const supabase = createClient();

  // Balance & Betting State
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(10);

  // Game State
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [lastProfitLoss, setLastProfitLoss] = useState<number | null>(null);
  const [houseEdge, setHouseEdge] = useState<number>(0);
  const [isWin, setIsWin] = useState(false);

  // Session tracking for two-phase gameplay
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [history, setHistory] = useState<{ multiplier: number; id: number }[]>(
    [],
  );

  // Animation refs
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const currentMultiplierRef = useRef<number>(1.0);

  // Fetch Balance & History - based on Google auth, not wallet connection
  useEffect(() => {
    if (!isAuthenticated) {
      setBalance(0);
      return;
    }

    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: bal } = await supabase
          .from("balances")
          .select("amount")
          .eq("user_id", user.id)
          .single();
        if (bal) setBalance(Number(bal.amount));

        const { data: games } = await supabase
          .from("game_sessions")
          .select("outcome")
          .eq("game_type", "crash")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (games) {
          const hist = games
            .map((g: any, i: number) => ({
              multiplier: g.outcome?.crashPoint || 0,
              id: i,
            }))
            .filter((h) => h.multiplier > 0);
          setHistory(hist);
        }
      }
    };
    fetchData();
  }, [isAuthenticated, supabase]);

  // Apply a server-reported loss. The crash point arrives with this payload -
  // it is not known to the client before the round ends.
  const finishRoundAsLoss = (data: any) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const finalCrashPoint = Number(data.crashPoint);
    setCrashPoint(finalCrashPoint);
    setMultiplier(finalCrashPoint);
    currentMultiplierRef.current = finalCrashPoint;

    if (typeof data.balance === "number") setBalance(data.balance);
    setLastProfitLoss(typeof data.profitLoss === "number" ? data.profitLoss : null);
    setIsWin(false);
    setGameState("crashed");

    if (typeof data.profitLoss === "number") {
      toast.error(
        `💥 Crashed at ${finalCrashPoint.toFixed(2)}x! -$${Math.abs(data.profitLoss).toFixed(2)}`,
      );
    }

    setHistory((prev) => [
      { multiplier: finalCrashPoint, id: Date.now() },
      ...prev.slice(0, 9),
    ]);

    triggerBalanceRefresh();
    setSessionId(null);
    setIsProcessing(false);
  };

  // Animation loop - runs when gameState is "running".
  // The client does NOT know the crash point, so it simply animates the curve
  // and waits for the server to tell it the round ended.
  useEffect(() => {
    if (gameState !== "running") return;

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      // Exponential growth: 1.00 * e^(0.15*t) - must match GROWTH_RATE on the server
      const newMultiplier = Math.pow(Math.E, GROWTH_RATE * elapsed);

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
  }, [gameState]);

  // Poll the server for the round outcome. The crash point is only disclosed
  // once the round is actually over, so it cannot be used to cash out early.
  useEffect(() => {
    if (gameState !== "running" || !sessionId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const response = await fetch("/api/games/crash", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ action: "status", sessionId }),
        });

        const data = await response.json();
        if (cancelled || !response.ok) return;

        if (data.crashed) {
          finishRoundAsLoss(data);
        }
      } catch {
        // Transient failure - the next tick retries.
      }
    };

    const interval = setInterval(poll, 400);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, sessionId, supabase]);

  // Handle placing a bet (Start Game)
  const handlePlaceBet = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
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
      setMultiplier(1.0);
      currentMultiplierRef.current = 1.0;
      setCrashPoint(null);
      setIsWin(false);

      // Call Next.js API route with "start" action
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/games/crash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession?.access_token}`,
        },
        body: JSON.stringify({
          action: "start",
          betAmount,
          clientSeed: "default",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to start game");

      // Store session. The crash point is intentionally not returned by the
      // server while the round is live.
      setSessionId(data.sessionId);
      setCrashPoint(null);
      setBalance(data.balance);
      setHouseEdge(data.houseEdge || 0);

      // Anchor the animation to the server's round start so the curve the
      // player sees matches the curve the server settles against.
      const serverStartedAt = data.startedAt ? new Date(data.startedAt).getTime() : Date.now();
      const clockSkew = data.serverTime ? Date.now() - new Date(data.serverTime).getTime() : 0;
      startTimeRef.current = serverStartedAt + clockSkew;

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

    try {
      setIsProcessing(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/games/crash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: "cashout",
          sessionId,
          multiplier: Math.floor(cashOutMultiplier * 100) / 100, // Round down to 2 decimal places
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to cash out");

      // The server may report that the round had already crashed by its clock.
      if (data.crashed) {
        finishRoundAsLoss(data);
        return;
      }

      // The server decides the settled multiplier - trust it over the animation.
      const settledMultiplier = Number(data.multiplier ?? cashOutMultiplier);
      setMultiplier(settledMultiplier);
      currentMultiplierRef.current = settledMultiplier;
      setCrashPoint(Number(data.crashPoint));
      setBalance(data.balance);
      setLastProfitLoss(data.profitLoss);
      setIsWin(true);
      setGameState("won");

      toast.success(
        `🎉 Cashed out at ${settledMultiplier.toFixed(2)}x! +$${data.profitLoss.toFixed(2)}`,
      );

      // Update history
      setHistory((prev) => [
        { multiplier: Number(data.crashPoint), id: Date.now() },
        ...prev.slice(0, 9),
      ]);

      // Trigger navbar balance refresh
      triggerBalanceRefresh();

      setSessionId(null);
      setIsProcessing(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
      setIsProcessing(false);
      // The animation effect keeps running while gameState is still "running",
      // and the status poll will settle the round either way.
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

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/games/crash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: "crashed",
          sessionId,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to finalize crash");

      // The server decides whether this was actually a crash. If the round was
      // still live it settles as a cashout instead.
      if (data.crashed === false && data.win) {
        setCrashPoint(Number(data.crashPoint));
        setMultiplier(Number(data.multiplier));
        setBalance(data.balance);
        setLastProfitLoss(data.profitLoss);
        setIsWin(true);
        setGameState("won");
        triggerBalanceRefresh();
        setSessionId(null);
        setIsProcessing(false);
        return;
      }

      finishRoundAsLoss(data);
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
    setMultiplier(1.0);
    currentMultiplierRef.current = 1.0;
    setCrashPoint(null);
    setLastProfitLoss(null);
    setSessionId(null);
  };

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Game Container */}
      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        {/* End of Round Result Display */}
        {lastProfitLoss !== null &&
          (gameState === "crashed" || gameState === "won") && (
            <div
              className={`rounded-xl px-6 py-6 text-center space-y-2 ${
                lastProfitLoss >= 0
                  ? "bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/30"
                  : "bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/30"
              }`}
            >
              <div className="text-sm uppercase tracking-wider text-gray-400">
                {lastProfitLoss >= 0
                  ? "🎉 You Won!"
                  : "💥 Better Luck Next Time"}
              </div>
              <div
                className={`text-4xl font-black ${
                  lastProfitLoss >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {lastProfitLoss >= 0 ? "+" : ""}
                {lastProfitLoss.toFixed(2)} USDT
              </div>
              <div className="text-muted-foreground text-sm">
                New Balance:{" "}
                <span className="font-bold text-white">
                  {balance.toFixed(2)} USDT
                </span>
              </div>
              {lastProfitLoss >= 0 && crashPoint && (
                <div className="text-casino-brand text-sm">
                  Crashed at {crashPoint.toFixed(2)}x • Cashed out at{" "}
                  {multiplier.toFixed(2)}x
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
              gameState={gameState === "won" ? "crashed" : (gameState as any)}
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
                gameState={
                  gameState === "won"
                    ? "crashed"
                    : gameState === "starting"
                      ? "starting"
                      : (gameState as any)
                }
                multiplier={multiplier}
                countdown={0}
                history={history}
                crashPoint={crashPoint || 0}
                hasBet={
                  gameState === "running" ||
                  gameState === "crashed" ||
                  gameState === "won" ||
                  gameState === "starting"
                }
                cashedOut={isWin}
                cashOutMultiplier={isWin ? multiplier : undefined}
                betAmount={betAmount}
                winAmount={
                  lastProfitLoss !== null && lastProfitLoss >= 0
                    ? lastProfitLoss
                    : undefined
                }
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
