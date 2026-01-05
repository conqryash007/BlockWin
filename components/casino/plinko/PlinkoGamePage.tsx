"use client";

import { useState } from "react";
import { PlinkoHeader } from "./PlinkoHeader";
import { BetControls } from "./BetControls";
import { PlinkoDisplay } from "./PlinkoDisplay";
import { PlinkoEducation } from "./PlinkoEducation";

const MULTIPLIERS = [0.5, 1, 2, 5, 10, 5, 2, 1, 0.5];

export function PlinkoGamePage() {
  // Game State
  const [balance, setBalance] = useState(1243.50);
  const [betAmount, setBetAmount] = useState(10);
  
  // Drop State
  const [isDropping, setIsDropping] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [path, setPath] = useState<number[] | null>(null);
  const [gameId, setGameId] = useState(0);

  const handleDrop = async () => {
    if (betAmount > balance || betAmount <= 0) return;
    
    setIsDropping(true);
    setResult(null);
    setPath(null);
    setGameId(prev => prev + 1);
    
    // Deduct bet
    setBalance(prev => prev - betAmount);

    // Generate Path (0 = Left, 1 = Right)
    // For 8 rows, we need 8 decisions
    // This determines the final bucket
    const newPath: number[] = [];
    for(let i=0; i<8; i++) {
        newPath.push(Math.random() > 0.5 ? 1 : 0);
    }
    
    // Calculate result index based on path (sum of rights)
    // 0 rights = leftmost bucket (index 0)
    // 8 rights = rightmost bucket (index 8)
    const bucketIndex = newPath.reduce((a, b) => a + b, 0);
    
    // Multipliers for 8 rows
    const MULTIPLIERS_8 = [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6];
    const landedMultiplier = MULTIPLIERS_8[bucketIndex];
    const profit = betAmount * landedMultiplier;
    
    
    setPath(newPath);
    setResult(bucketIndex);
    
    // We add winnings AFTER animation completes (callback from Display)
  };

  const onDropComplete = () => {
      setIsDropping(false);
      // Calculate profit again or store it? 
      // Re-calculating for safety/simplicity in this scope
      if (path) {
          const bucketIndex = path.reduce((a, b) => a + b, 0);
          const MULTIPLIERS_8 = [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6];
          const landedMultiplier = MULTIPLIERS_8[bucketIndex];
          const profit = betAmount * landedMultiplier;
          setBalance(prev => prev + profit);
      }
  };

  return (
    <div className="flex flex-col min-h-full bg-background">
        
        {/* Game Container */}
        <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
            
             {/* Main Game Area */}
             <div className="flex flex-col lg:flex-row gap-4 h-auto">
                 
                 {/* Left Panel: Controls */}
                 <div className="w-full lg:w-[320px] shrink-0">
                     <BetControls 
                        balance={balance}
                        betAmount={betAmount}
                        setBetAmount={setBetAmount}
                        isDropping={isDropping}
                        onDrop={handleDrop}
                        expectedMultiplier={5.6}
                     />
                 </div>

                 {/* Center Panel: Display */}
                 <div className="flex-1 flex flex-col">
                     <div className="flex-1 flex flex-col gap-4">
                         <PlinkoHeader />
                         <PlinkoDisplay 
                            result={result}
                            path={path}
                            gameId={gameId}
                            onDropComplete={onDropComplete}
                         />
                     </div>
                 </div>
             </div>


             {/* Education */}
             <PlinkoEducation />
        </div>
    </div>
  );
}
