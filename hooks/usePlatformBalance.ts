'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';

// Custom event name for balance updates
const BALANCE_UPDATED_EVENT = 'balance-updated';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Trigger a balance refresh across all components using usePlatformBalance.
 * Call this after any action that changes the user's balance (game wins/losses, deposits, etc.)
 */
export function triggerBalanceRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BALANCE_UPDATED_EVENT));
  }
}

export function usePlatformBalance() {
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!address || !isConnected) {
      setBalance(0);
      return;
    }

    setIsLoading(true);
    console.log('Fetching balance for address:', address.toLowerCase());
    
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
         console.log('No authenticated user found');
         // Fallback? No, strict mode requires auth.
         setBalance(0);
         setIsLoading(false);
         return;
      }

      // Query balance by user_id
      const { data: balanceData, error: balanceError } = await supabase
        .from('balances')
        .select('amount')
        .eq('user_id', user.id)
        .single();

      console.log('Balance lookup result:', { balanceData, balanceError });

      if (balanceError || !balanceData) {
        setBalance(0);
      } else {
        setBalance(Number(balanceData.amount) || 0);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Fetch on mount and when address changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Listen for Supabase auth state changes (account switch triggers sign out/sign in)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_OUT') {
        // Immediately reset balance when signed out
        setBalance(0);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Fetch balance when signed in or token refreshed
        fetchBalance();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchBalance]);

  // Listen for balance update events (triggered by game components)
  useEffect(() => {
    const handleBalanceUpdate = () => {
      console.log('Balance update event received, refetching...');
      fetchBalance();
    };

    window.addEventListener(BALANCE_UPDATED_EVENT, handleBalanceUpdate);
    return () => {
      window.removeEventListener(BALANCE_UPDATED_EVENT, handleBalanceUpdate);
    };
  }, [fetchBalance]);

  return { balance, isLoading, refetch: fetchBalance };
}
