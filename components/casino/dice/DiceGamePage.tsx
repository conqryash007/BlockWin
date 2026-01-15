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
  const { address } = useAccount();
  const { login } = useAuth();
  const supabase = createClient();

  // Game State
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [winChance, setWinChance] = useState(50);
  const [rollOver, setRollOver] = useState(false);
  
  // Roll State
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [win, setWin] = useState<boolean | null>(null);
  
  // Result display
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
    setLastProfitLoss(null);
    
    try {
        const target = rollOver ? (100 - winChance) : winChance;

        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/games/dice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authSession?.access_token}`,
          },
          body: JSON.stringify({ 
            betAmount, 
            target, 
            rollUnder: !rollOver,
            clientSeed: "default"
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Game request failed");

        // Update state with results
        setResult(data.roll);
        setWin(data.win);
        setLastProfitLoss(data.profitLoss);
        setHouseEdge(data.houseEdge || 0);
        
        // Update balance from server response (ensures consistency)
        setBalance(data.balance);
        
        // Show win/loss toast with exact amount
        if (data.win) {
            toast.success(`🎉 You won! +$${data.profitLoss.toFixed(2)}`);
        } else {
            toast.error(`😞 You lost! -$${Math.abs(data.profitLoss).toFixed(2)}`);
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
            
             {/* House Edge Display */}
             {houseEdge > 0 && (
               <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2 text-center">
                 <span className="text-yellow-400 text-sm">
                   House Edge: {(houseEdge * 100).toFixed(1)}%
                 </span>
               </div>
             )}
            
             {/* Last Result Display */}
             {lastProfitLoss !== null && (
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
