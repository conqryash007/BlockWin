"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CrashHeader } from "./CrashHeader";
import { CrashBetControls } from "./CrashBetControls";
import { CrashDisplay } from "./CrashDisplay";
import { CrashEducation } from "./CrashEducation";

type GameState = "waiting" | "running" | "crashed";

export function CrashGamePage() {
  // Balance & Betting State
  const [balance, setBalance] = useState(1243.50);
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashOut, setAutoCashOut] = useState(0);
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashOutMultiplier, setCashOutMultiplier] = useState<number | undefined>();
  
  // Game State
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [multiplier, setMultiplier] = useState(1.00);
  const [countdown, setCountdown] = useState(5.0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [history, setHistory] = useState<{ multiplier: number; id: number }[]>([
    { multiplier: 2.34, id: 1 },
    { multiplier: 1.23, id: 2 },
    { multiplier: 5.67, id: 3 },
    { multiplier: 1.05, id: 4 },
    { multiplier: 12.45, id: 5 },
  ]);

  // Refs for animation
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const countdownRef = useRef<NodeJS.Timeout>();

  // Generate a random crash point (weighted towards lower values)
  const generateCrashPoint = useCallback(() => {
    // Simple crash point generation - weighted distribution
    const random = Math.random();
    if (random < 0.33) {
      return 1 + Math.random() * 0.5; // 33% chance: 1.00 - 1.50
    } else if (random < 0.66) {
      return 1.5 + Math.random() * 2; // 33% chance: 1.50 - 3.50
    } else if (random < 0.90) {
      return 3.5 + Math.random() * 6.5; // 24% chance: 3.50 - 10.00
    } else {
      return 10 + Math.random() * 40; // 10% chance: 10.00 - 50.00
    }
  }, []);

  // Handle placing a bet
  const handlePlaceBet = useCallback(() => {
    if (betAmount > 0 && betAmount <= balance && gameState === "waiting" && !hasBet) {
      setBalance(prev => prev - betAmount);
      setHasBet(true);
      setCashedOut(false);
      setCashOutMultiplier(undefined);
    }
  }, [betAmount, balance, gameState, hasBet]);

  // Handle cashing out
  const handleCashOut = useCallback(() => {
    if (gameState === "running" && hasBet && !cashedOut) {
      const winnings = betAmount * multiplier;
      setBalance(prev => prev + winnings);
      setCashedOut(true);
      setCashOutMultiplier(multiplier);
    }
  }, [gameState, hasBet, cashedOut, betAmount, multiplier]);

  // Countdown timer effect
  useEffect(() => {
    if (gameState === "waiting") {
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 0.1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }
  }, [gameState]);

  // Start round when countdown ends
  useEffect(() => {
    if (gameState === "waiting" && countdown <= 0) {
      // Generate crash point and start the round
      const newCrashPoint = generateCrashPoint();
      setCrashPoint(newCrashPoint);
      setGameState("running");
      setMultiplier(1.00);
      startTimeRef.current = Date.now();
    }
  }, [countdown, gameState, generateCrashPoint]);

  // Multiplier animation effect
  useEffect(() => {
    if (gameState === "running") {
      const animate = () => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        // Exponential growth formula for multiplier
        const newMultiplier = Math.pow(Math.E, 0.1 * elapsed);
        
        if (newMultiplier >= crashPoint) {
          // CRASH!
          setMultiplier(crashPoint);
          setGameState("crashed");
          
          // Add to history
          setHistory(prev => [
            { multiplier: crashPoint, id: Date.now() },
            ...prev.slice(0, 9)
          ]);

          // Reset for next round after delay
          setTimeout(() => {
            setGameState("waiting");
            setCountdown(5.0);
            setMultiplier(1.00);
            setHasBet(false);
            setCashedOut(false);
            setCashOutMultiplier(undefined);
          }, 3000);
        } else {
          setMultiplier(newMultiplier);
          
          // Check for auto cash out
          if (hasBet && !cashedOut && autoCashOut > 0 && newMultiplier >= autoCashOut) {
            handleCashOut();
          }
          
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [gameState, crashPoint, hasBet, cashedOut, autoCashOut, handleCashOut]);

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Game Container */}
      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        
        {/* Main Game Area */}
        <div className="flex flex-col lg:flex-row gap-4 h-auto">
          
          {/* Left Panel: Controls (Desktop) */}
          <div className="order-2 lg:order-1 w-full lg:w-[320px] shrink-0">
            <CrashBetControls 
              balance={balance}
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              autoCashOut={autoCashOut}
              setAutoCashOut={setAutoCashOut}
              gameState={gameState}
              hasBet={hasBet}
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
                gameState={gameState}
                multiplier={multiplier}
                countdown={countdown}
                history={history}
                crashPoint={crashPoint}
                hasBet={hasBet}
                cashedOut={cashedOut}
                cashOutMultiplier={cashOutMultiplier}
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
