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
  const [lastWin, setLastWin] = useState(0);

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
    
    try {
        const { data, error } = await supabase.functions.invoke('game-plinko', {
            body: { 
                betAmount, 
                rows: 8, // Default 8 for now
                risk: 'low', // Default low for now
                clientSeed: "default"
            }
        });

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.error);
        
        // Deduct from visual balance immediately (API already deducted)
        setBalance(prev => prev - betAmount); 

        setPath(data.path);
        setResult(data.bucket);
        setPendingBalance(data.balance); // Store final balance (with winnings)
        setLastWin(data.payout);
        setGameId(prev => prev + 1);

    } catch (err: any) {
        console.error(err);
        toast.error(err.message);
        setIsDropping(false);
    }
  };

  const onDropComplete = () => {
      setIsDropping(false);
      // Update balance to true server balance (includes winnings)
      setBalance(pendingBalance);
      
      if (lastWin > 0) {
          toast.success(`Won ${lastWin.toFixed(2)} USDT!`);
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
                        expectedMultiplier={5.6} // Display max mult?
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
