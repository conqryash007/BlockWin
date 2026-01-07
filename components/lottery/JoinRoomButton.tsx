'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useConnect, useSignMessage, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  useTokenBalance, 
  useTokenAllowance, 
  useJoinRoom, 
  useApproveTokens,
  useTokenDecimals
} from '@/hooks/useBettingRooms';
import { RoomWithPlayers, formatTokenToUSD, formatTokenBalance, getRoomStatus, RoomStatus } from '@/types/lottery';
import { Wallet, Loader2, CheckCircle2, AlertCircle, ArrowRight, FileSignature, ShieldCheck, Infinity as InfinityIcon } from 'lucide-react';
import { parseUnits, formatUnits, maxUint256 } from 'viem';

interface JoinRoomButtonProps {
  room: RoomWithPlayers;
  onSuccess?: () => void;
}

export function JoinRoomButton({ room, onSuccess }: JoinRoomButtonProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  
  // State for input
  const [stakeInput, setStakeInput] = useState('');
  
  // State for flow management
  const [flowState, setFlowState] = useState<'idle' | 'signing' | 'approving' | 'joining' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Refs to track current transaction flow to avoid side effects
  const isProcessingRef = useRef(false);

  // Wagmi Hooks

  // 1. Sign Message Hook
  const { signMessage, isPending: isSigning, reset: resetSign } = useSignMessage({
    mutation: {
       onSuccess: () => {
         // Proceed to next step: Check Allowance
         checkAllowanceAndProceed();
       },
       onError: (error) => {
         setErrorMessage('User rejected signature or signing failed.');
         setFlowState('idle');
         isProcessingRef.current = false;
       }
    }
  });

  const { data: balance } = useTokenBalance(address);
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(address);
  const { data: decimals = 18 } = useTokenDecimals();
  
  // 2. Approve Hook
  const { approve, isPending: isApprovingSend, txHash: approveTxHash, error: approveSendError } = useApproveTokens();
  
  // Wait for Approval Mining
  const { isLoading: isApprovingConfirm, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  const isApproving = isApprovingSend || isApprovingConfirm;

  // React to Approval Comfirmation
  useEffect(() => {
    if (isApproveConfirmed && flowState === 'approving') {
      // Approval mined, refresh allowance and proceed
      refetchAllowance().then(() => {
         proceedToJoin();
      });
    }
  }, [isApproveConfirmed, flowState, refetchAllowance]);

  // Handle Approve Send Error
  useEffect(() => {
    if (approveSendError && flowState === 'approving') {
       setErrorMessage('Approval transaction failed or rejected.');
       setFlowState('idle');
       isProcessingRef.current = false;
    }
  }, [approveSendError, flowState]);


  // 3. Join Room Hook
  const { joinRoom, isPending: isJoiningSend, txHash: joinTxHash, error: joinSendError } = useJoinRoom();

  // Wait for Join Mining
  const { isLoading: isJoiningConfirm, isSuccess: isJoinConfirmed } = useWaitForTransactionReceipt({
    hash: joinTxHash,
  });

  const isJoining = isJoiningSend || isJoiningConfirm;

  // React to Join Confirmation
  useEffect(() => {
    if (isJoinConfirmed && flowState === 'joining') {
       setFlowState('success');
       isProcessingRef.current = false;
       onSuccess?.();
    }
  }, [isJoinConfirmed, flowState, onSuccess]);

  // Handle Join Send Error
  useEffect(() => {
    if (joinSendError && flowState === 'joining') {
       setErrorMessage(joinSendError.message || 'Join transaction failed.');
       setFlowState('idle');
       isProcessingRef.current = false;
    }
  }, [joinSendError, flowState]);


  const status = getRoomStatus(room);
  const isRoomOpen = status === RoomStatus.OPEN;

  // Calculate stake amount in wei
  const stakeAmount = stakeInput ? parseUnits(stakeInput, decimals) : BigInt(0);
  const minStake = room.minStakeAmount;
  const maxStake = room.maxStakeAmount;

  // Validation
  const isValidStake = stakeAmount >= minStake && stakeAmount <= maxStake;
  const hasEnoughBalance = balance ? stakeAmount <= balance : false;


  const startJoinProcess = async () => {
    if (!stakeInput || !isValidStake || !hasEnoughBalance) return;
    
    setErrorMessage('');
    setFlowState('signing');
    isProcessingRef.current = true;

    // 1. Trigger Sign Message
    const termMessage = `I hereby agree to the Terms and Conditions of Casino Royale Lottery.\n\nRoom ID: ${room.roomId.toString()}\nStake Amount: ${stakeInput} mUSDT\n\nI confirm that I understand the risks involved and that I am of legal age to participate.`;
    signMessage({ message: termMessage });
  };

  const checkAllowanceAndProceed = () => {
    // 2. Check Allowance
    // We check both the current allowance data AND if we just approved (though refetch should handle it)
    // To be safe, we re-check allowance from the hook which we called refetch() on.
    
    // Note: allowance might still be old if refetch hasn't completed or RPC is slow, 
    // but if we are in this function called from sign success, we haven't approved yet in this flow.
    // So standard check is fine.
    
    if (allowance && allowance >= stakeAmount) {
       // Proceed directly to join
       proceedToJoin();
    } else {
       // Need approval
       setFlowState('approving');
       approve(maxUint256);
    }
  };

  const proceedToJoin = () => {
    setFlowState('joining');
    joinRoom(room.roomId, stakeAmount);
  };

  // UI Helpers
  const getButtonText = () => {
    switch (flowState) {
      case 'signing': return 'Please Sign in Wallet...';
      case 'approving': return isApprovingSend ? 'Check Wallet to Approve...' : 'Verifying Approval...';
      case 'joining': return isJoiningSend ? 'Check Wallet to Join...' : 'Confirming Join...';
      case 'success': return 'Joined Successfully!';
      default: return 'Join Lottery';
    }
  };

  const isFlowActive = flowState !== 'idle' && flowState !== 'success';

  // Not connected
  if (!isConnected) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 p-5">
        <div className="text-center">
          <Wallet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-white font-medium mb-2">Connect Wallet to Join</p>
           <Button
            className="w-full bg-gradient-to-r from-casino-brand to-emerald-500 text-black font-bold mt-2"
            onClick={() => connect({ connector: connectors[0] })}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
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
  if (flowState === 'success') {
    return (
      <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-[#0f1115] border border-emerald-500/20 p-5">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <p className="text-white font-bold text-lg mb-2">Successfully Joined!</p>
          <p className="text-sm text-muted-foreground">
            You've staked {formatTokenBalance(stakeAmount, decimals)} in this lottery
          </p>
          <Button 
             variant="ghost" 
             className="mt-4 text-xs text-muted-foreground hover:text-white"
             onClick={() => {
                setStakeInput('');
                setFlowState('idle');
                setErrorMessage('');
                resetSign();
                // We rely on standard wagmi resets or internal state reset
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

      {/* Progress Steps (Visual Only) */}
      <div className="flex items-center justify-between mb-6 px-2 opacity-80">
         {/* Simple circles to show active state */}
         <div className={`flex flex-col items-center gap-1 ${flowState === 'idle' || flowState === 'signing' || flowState === 'approving' || flowState === 'joining' ? 'text-white' : 'text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${flowState !== 'idle' ? 'bg-emerald-500' : 'bg-white/20'}`} />
            <span className="text-[10px] uppercase">Input</span>
         </div>
         <div className={`h-px flex-1 mx-2 ${flowState === 'signing'||flowState === 'approving'||flowState === 'joining' ? 'bg-emerald-500' : 'bg-white/10'}`} />
         
         <div className={`flex flex-col items-center gap-1 ${flowState === 'signing' || flowState === 'approving' || flowState === 'joining' ? 'text-white' : 'text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${['signing', 'approving', 'joining'].includes(flowState) ? 'bg-casino-brand animate-pulse' : 'bg-white/20'}`} />
            <span className="text-[10px] uppercase">Sign</span>
         </div>
         <div className={`h-px flex-1 mx-2 ${flowState === 'approving'||flowState === 'joining' ? 'bg-emerald-500' : 'bg-white/10'}`} />

         <div className={`flex flex-col items-center gap-1 ${flowState === 'approving' || flowState === 'joining' ? 'text-white' : 'text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${['approving', 'joining'].includes(flowState) ? 'bg-amber-500 animate-pulse' : 'bg-white/20'}`} />
            <span className="text-[10px] uppercase">Approve</span>
         </div>
         <div className={`h-px flex-1 mx-2 ${flowState === 'joining' ? 'bg-emerald-500' : 'bg-white/10'}`} />

         <div className={`flex flex-col items-center gap-1 ${flowState === 'joining' ? 'text-white' : 'text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${flowState === 'joining' ? 'bg-blue-500 animate-pulse' : 'bg-white/20'}`} />
            <span className="text-[10px] uppercase">Join</span>
         </div>
      </div>

      <div className="mb-4">
        {/* Balance */}
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
           <span>Your Balance</span>
           <span className="text-white">{balance ? formatTokenBalance(balance, decimals) : '0.00 mUSDT'}</span>
        </div>

        {/* Input */}
        <div className="relative">
           <Input
            type="number"
            placeholder="0.00"
            value={stakeInput}
            onChange={(e) => setStakeInput(e.target.value)}
            className="pl-3 bg-black/30 border-white/10 focus:border-casino-brand"
            disabled={isFlowActive}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">mUSDT</span>
        </div>
        
        {/* Quick Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-2">
            {['min', 'mid', 'max'].map((type) => {
              const amount = type === 'min' ? minStake : type === 'max' ? maxStake : (minStake + maxStake) / BigInt(2);
              return (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  className="text-xs hover:bg-casino-brand/10 hover:border-casino-brand/30 h-7"
                  onClick={() => setStakeInput(formatUnits(amount, decimals))}
                  disabled={isFlowActive}
                >
                  {type === 'min' ? 'Min' : type === 'max' ? 'Max' : 'Mid'}
                </Button>
              );
            })}
        </div>

        {/* Validation Errors */}
        {stakeInput && !isValidStake && (
             <p className="text-destructive text-xs mt-2">
               Stake must be between {formatTokenBalance(minStake, decimals)} and {formatTokenBalance(maxStake, decimals)}
             </p>
        )}
        {stakeInput && isValidStake && !hasEnoughBalance && (
             <p className="text-destructive text-xs mt-2">Insufficient balance</p>
        )}
      </div>

      {/* Main Action Button */}
      <Button
        className={`w-full font-bold transition-all ${
           flowState === 'signing' ? 'bg-blue-600' :
           flowState === 'approving' ? 'bg-amber-600' :
           flowState === 'joining' ? 'bg-emerald-600' :
           'bg-gradient-to-r from-casino-brand to-emerald-500 text-black'
        }`}
        onClick={startJoinProcess}
        disabled={!stakeInput || !isValidStake || !hasEnoughBalance || isFlowActive}
      >
        {isFlowActive ? (
           <>
             <Loader2 className="w-4 h-4 mr-2 animate-spin" />
             {getButtonText()}
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
      
      {isFlowActive && !errorMessage && (
         <p className="text-center text-xs text-muted-foreground mt-3 animate-pulse">
            {flowState === 'signing' && 'User action required: Sign message...'}
            {flowState === 'approving' && (isApprovingSend ? 'User action required: Confirm Approval...' : 'Waiting for blockchain confirmation...')}
            {flowState === 'joining' && (isJoiningSend ? 'User action required: Confirm Join...' : 'Waiting for blockchain confirmation...')}
         </p>
      )}

    </div>
  );
}
