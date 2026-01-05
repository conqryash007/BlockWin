"use client";

import { useState } from "react";
import { DiceHeader } from "./DiceHeader";
import { BetControls } from "./BetControls";
import { DiceDisplay } from "./DiceDisplay";
import { DiceEducation } from "./DiceEducation";

export function DiceGamePage() {
  // Game State
  const [balance, setBalance] = useState(1243.50);
  const [betAmount, setBetAmount] = useState(10);
  const [winChance, setWinChance] = useState(50); // Simple integer 1-98
  const [rollOver, setRollOver] = useState(false); // Over/Under toggle
  
  // Roll State
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [win, setWin] = useState<boolean | null>(null);

  /*
    Logic:
    If rollOver is true, we win if roll > (100 - winChance)
    If rollOver is false, we win if roll < winChance
  */
  
  const handleBet = async () => {
    if (betAmount > balance) return;
    
    setIsRolling(true);
    setResult(null);
    setWin(null);
    
    // Deduct bet immediately for realism
    setBalance(prev => prev - betAmount);

    // Mock API delay (700ms animation)
    await new Promise(resolve => setTimeout(resolve, 700));

    // Determine result
    const rolledValue = Math.random() * 100;
    
    // Determine win condition
    const targetValue = rollOver ? (100 - winChance) : winChance;
    const isWin = rollOver 
        ? rolledValue > targetValue 
        : rolledValue < targetValue;
    
    setResult(rolledValue);
    setWin(isWin);
    setIsRolling(false);

    if (isWin) {
        const multiplier = 99 / winChance;
        const profit = betAmount * multiplier;
        setBalance(prev => prev + profit);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-background">
        
        {/* Game Container */}
        <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
            
             {/* Main Game Area */}
             <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[600px]">
                 
                 {/* Left Panel: Controls */}
                 <div className="w-full lg:w-[320px] shrink-0">
                     <BetControls 
                        balance={balance}
                        betAmount={betAmount}
                        setBetAmount={setBetAmount}
                        winChance={winChance}
                        setWinChance={setWinChance}
                        isRolling={isRolling}
                        onBet={handleBet}
                        rollOver={rollOver}
                        setRollOver={setRollOver}
                     />
                 </div>

                 {/* Center Panel: Display */}
                 <div className="flex-1 flex flex-col">
                     <div className="flex-1 flex flex-col gap-4">
                         <DiceHeader />
                         <DiceDisplay 
                            target={winChance}
                            rollOver={rollOver}
                            result={result}
                            isRolling={isRolling}
                            win={win}
                         />
                     </div>
                 </div>
             </div>


             {/* Education */}
             <DiceEducation />
        </div>
    </div>
  );
}
