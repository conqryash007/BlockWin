"use client";

import { useState, useEffect } from "react";
import { DiceHeader } from "./DiceHeader";
import { BetControls } from "./BetControls";
import { DiceDisplay } from "./DiceDisplay";
import { DiceEducation } from "./DiceEducation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useAccount } from "wagmi";

export function DiceGamePage() {
  const { address } = useAccount(); // Wagmi address
  const { login } = useAuth(); // Auth hook
  const supabase = createClient();

  // Game State
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [winChance, setWinChance] = useState(50); // Probability
  const [rollOver, setRollOver] = useState(false); // Over/Under toggle
  
  // Roll State
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [win, setWin] = useState<boolean | null>(null);

  // Fetch Balance
  useEffect(() => {
    if (!address) {
       setBalance(0);
       return;
    }
    
    // Subscribe to balance changes
    const fetchBalance = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('balances').select('amount').eq('user_id', user.id).single();
            if (data) setBalance(Number(data.amount));
        }
    };

    fetchBalance();

    // Realtime subscription? For MVP plain fetch or simple interval
    // Trigger on game end is enough usually.
  }, [address, supabase]);

  const handleBet = async () => {
    // 1. Check Auth
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
    
    setIsRolling(true);
    setResult(null);
    setWin(null);
    
    try {
        // Calculate Target
        // If rollOver (Over), we want roll > X. WinChance % = (100-X). => X = 100 - WinChance.
        // If !rollOver (Under), we want roll < X. WinChance % = X. => X = WinChance.
        const target = rollOver ? (100 - winChance) : winChance;

        const { data, error } = await supabase.functions.invoke('game-dice', {
             body: { 
                 betAmount, 
                 target, 
                 rollUnder: !rollOver,
                 clientSeed: "default" // TODO: Add client seed input
             }
        });

        if (error) throw new Error(error.message || "Game request failed");
        if (data.error) throw new Error(data.error);

        // Success
        setResult(data.roll);
        setWin(data.win);
        setBalance(data.balance);
        
        if (data.win) {
             toast.success(`You won ${data.payout.toFixed(2)} USDT!`);
        }
        
    } catch (err: any) {
        console.error(err);
        toast.error(err.message);
    } finally {
        setIsRolling(false);
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
