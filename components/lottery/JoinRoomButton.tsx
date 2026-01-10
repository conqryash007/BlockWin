'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLottery } from '@/hooks/useLottery';
import { RoomWithPlayers, formatTokenToUSD, formatTokenBalance, getRoomStatus, RoomStatus } from '@/types/lottery';
import { Wallet, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi'; // Keep wagmi just for "Connect Wallet" button if user wants to use wallet for auth triggers? 
// Actually verify: UseAuth handles keys. But maybe "Connect Wallet" text is misleading if we use Email/WalletSig.
// I'll keep "Connect Wallet" but call `login()` from useAuth.

interface JoinRoomButtonProps {
  room: RoomWithPlayers;
  onSuccess?: () => void;
}

export function JoinRoomButton({ room, onSuccess }: JoinRoomButtonProps) {
  const { login } = useAuth();
  const { joinRoom, loading } = useLottery();
  const supabase = createClient();
  
  // State
  const [stakeInput, setStakeInput] = useState('');
  const [balance, setBalance] = useState(0);
  const [session, setSession] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  // Check Session & Balance
  useEffect(() => {
    const fetchSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
            const { data } = await supabase.from('balances').select('amount').eq('user_id', session.user.id).single();
            if (data) setBalance(Number(data.amount));
        }
    };
    fetchSession();
    
    // Listen for auth changes?
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setSession(session);
        if (session) {
             supabase.from('balances').select('amount').eq('user_id', session.user.id).single()
             .then(({ data }) => { if(data) setBalance(Number(data.amount)); });
        } else {
             setBalance(0);
        }
    });
    
    return () => { authListener.subscription.unsubscribe(); };
  }, [supabase]);

  const status = getRoomStatus(room);
  const isRoomOpen = status === RoomStatus.OPEN;

  const stakeAmount = Number(stakeInput);
  const minStake = room.minStakeAmount;
  const maxStake = room.maxStakeAmount;

  // Validation
  const isValidStake = stakeAmount >= minStake && stakeAmount <= maxStake;
  const hasEnoughBalance = balance >= stakeAmount;

  const handleJoin = async () => {
    if (!stakeInput || !isValidStake || !hasEnoughBalance) return;
    setErrorMessage('');
    
    const result = await joinRoom(room.id, stakeAmount);
    if (result) {
        setSuccess(true);
        // Refresh balance? The hook doesn't return new balance explicitly but JoinRoom result usually does.
        // Assuming result success.
        onSuccess?.();
    }
  };

  // Not connected
  if (!session) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-5">
        <div className="text-center">
          <Wallet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-white font-medium mb-2">Login to Join</p>
           <Button
            className="w-full bg-gradient-to-r from-casino-brand to-emerald-500 text-black font-bold mt-2"
            onClick={login}
          >
            Connect / Login
          </Button>
        </div>
      </div>
    );
  }

  // Room closed
  if (!isRoomOpen) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-5">
         <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-400/50 mx-auto mb-3" />
          <p className="text-white font-medium mb-2">Room Not Available</p>
        </div>
      </div>
    );
  }

  // Success Mode
  if (success) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-[#0f1115] border border-emerald-500/20 p-5">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <p className="text-white font-bold text-lg mb-2">Successfully Joined!</p>
          <p className="text-sm text-muted-foreground">
            You've staked {formatTokenBalance(stakeAmount)} in this lottery
          </p>
          <Button 
             variant="ghost" 
             className="mt-4 text-xs text-muted-foreground hover:text-white"
             onClick={() => {
                setStakeInput('');
                setSuccess(false);
                setErrorMessage('');
             }}
          >
            Join Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-5">
      <h3 className="text-white font-bold text-lg mb-4">Join This Lottery</h3>

      <div className="mb-4">
        {/* Balance */}
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
           <span>Your Balance</span>
           <span className="text-white">{formatTokenBalance(balance)}</span>
        </div>

        {/* Input */}
        <div className="relative">
           <Input
            type="number"
            placeholder="0.00"
            value={stakeInput}
            onChange={(e) => setStakeInput(e.target.value)}
            className="pl-3 bg-black/30 border-white/10 focus:border-casino-brand"
            disabled={loading}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">mUSDT</span>
        </div>
        
        {/* Quick Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-2">
            {['min', 'mid', 'max'].map((type) => {
              const amount = type === 'min' ? minStake : type === 'max' ? maxStake : (minStake + maxStake) / 2;
              return (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  className="text-xs hover:bg-casino-brand/10 hover:border-casino-brand/30 h-7"
                  onClick={() => setStakeInput(amount.toString())}
                  disabled={loading}
                >
                  {type === 'min' ? 'Min' : type === 'max' ? 'Max' : 'Mid'}
                </Button>
              );
            })}
        </div>

        {/* Validation Errors */}
        {stakeInput && !isValidStake && (
             <p className="text-destructive text-xs mt-2">
               Stake must be between {formatTokenBalance(minStake)} and {formatTokenBalance(maxStake)}
             </p>
        )}
        {stakeInput && isValidStake && !hasEnoughBalance && (
             <p className="text-destructive text-xs mt-2">Insufficient balance</p>
        )}
      </div>

      {/* Main Action Button */}
      <Button
        className="w-full bg-gradient-to-r from-casino-brand to-emerald-500 text-black font-bold mt-2"
        onClick={handleJoin}
        disabled={!stakeInput || !isValidStake || !hasEnoughBalance || loading}
      >
        {loading ? (
           <>
             <Loader2 className="w-4 h-4 mr-2 animate-spin" />
             Joining...
           </>
        ) : (
           <>
             Join Lottery
             <ArrowRight className="w-4 h-4 ml-2" />
           </>
        )}
      </Button>

      {/* Status / Error Message */}
      {errorMessage && (
        <div className="mt-3 p-2 rounded bg-destructive/10 border border-destructive/20 text-center">
           <p className="text-destructive text-xs">{errorMessage}</p>
        </div>
      )}
      
    </div>
  );
}
