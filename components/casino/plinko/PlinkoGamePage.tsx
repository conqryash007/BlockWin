"use client";

import { useState, useEffect } from "react";
import { PlinkoHeader } from "./PlinkoHeader";
import { BetControls } from "./BetControls";
import { PlinkoDisplay } from "./PlinkoDisplay";
import { PlinkoEducation } from "./PlinkoEducation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { triggerBalanceRefresh } from "@/hooks/usePlatformBalance";

export function PlinkoGamePage() {
  const { address } = useAccount();
  const { login } = useAuth();
  const supabase = createClient();

  // Game State
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  
  // Drop State
  const [isDropping, setIsDropping] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [path, setPath] = useState<number[] | null>(null);
  const [gameId, setGameId] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [pendingProfitLoss, setPendingProfitLoss] = useState(0);
  const [pendingMultiplier, setPendingMultiplier] = useState(0);

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

  const handleDrop = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        toast.info("Please sign in to play");
        await login();
        return;
    }

    if (betAmount > balance || betAmount <= 0) {
        if (betAmount > balance) toast.error("Insufficient balance");
        return;
    }
    
    setIsDropping(true);
    setResult(null);
    setPath(null);
    setLastProfitLoss(null);
    
    try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/games/plinko', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authSession?.access_token}`,
          },
          body: JSON.stringify({ 
            betAmount, 
            rows: 8,
            risk: 'low',
            clientSeed: "default"
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Game request failed");

        // Store results for animation completion
        setPath(data.path);
        setResult(data.bucket);
        setPendingBalance(data.balance);
        setPendingProfitLoss(data.profitLoss);
        setPendingMultiplier(data.multiplier);
        setHouseEdge(data.houseEdge || 0);
        setGameId(prev => prev + 1);

    } catch (err: any) {
        console.error(err);
        toast.error(err.message);
        setIsDropping(false);
    }
  };

  const onDropComplete = () => {
      setIsDropping(false);
      // Update balance and show result after animation completes
      setBalance(pendingBalance);
      setLastProfitLoss(pendingProfitLoss);

      // Trigger balance refresh in navbar
      triggerBalanceRefresh();

      // Show win/loss toast with exact amount
      if (pendingProfitLoss > 0) {
          toast.success(`🎉 You won! +$${pendingProfitLoss.toFixed(2)}`);
      } else if (pendingProfitLoss < 0) {
          toast.error(`😞 You lost! -$${Math.abs(pendingProfitLoss).toFixed(2)}`);
      } else {
          toast.info(`Push! $0.00`);
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
             <div className="flex flex-col lg:flex-row gap-4 h-auto">
                 
                 {/* Left Panel: Controls */}
                 <div className="w-full lg:w-[320px] shrink-0">
                     <BetControls 
                        balance={balance}
                        betAmount={betAmount}
                        setBetAmount={setBetAmount}
                        isDropping={isDropping}
                        onDrop={handleDrop}
                        expectedMultiplier={5}
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
                            multiplier={pendingMultiplier}
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
