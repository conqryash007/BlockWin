'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';

// Custom event name for balance updates
const BALANCE_UPDATED_EVENT = 'balance-updated';

// Use the browser client that has access to the user's auth session
const supabase = createClient();

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
  const { isAuthenticated, user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const userIdRef = useRef<string | null>(null);

  const fetchBalance = useCallback(async () => {
    // Balance is tied to authenticated user (Google login), NOT wallet connection
    // User can view their balance even without a wallet connected
    setIsLoading(true);
    
    try {
      // Get current authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
         console.log('No authenticated user found');
         setBalance(0);
         setIsLoading(false);
         userIdRef.current = null;
         return;
      }

      console.log('Fetching balance for user:', authUser.id);
      
      // Store user ID for real-time subscription
      userIdRef.current = authUser.id;

      // Query balance by user_id (NOT wallet address)
      const { data: balanceData, error: balanceError } = await supabase
        .from('balances')
        .select('amount')
        .eq('user_id', authUser.id)
        .maybeSingle();

      console.log('Balance lookup result:', { balanceData, balanceError });

      if (balanceError) {
          console.error('Balance fetch error:', balanceError);
          setBalance(0);
      } else if (!balanceData) {
          // No balance record found - implies 0
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
  }, []);

  // Fetch on mount and when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
    } else {
      setBalance(0);
    }
  }, [fetchBalance, isAuthenticated]);

  // Real-time subscription for balance updates
  // This ensures the balance updates automatically when the webhook processes a deposit
  useEffect(() => {
    const userId = user?.id || userIdRef.current;
    if (!userId) return;

    console.log('Setting up real-time balance subscription for user:', userId);

    const channel = supabase
      .channel(`balance-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'balances',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Real-time balance update received:', payload);
          if (payload.new && 'amount' in payload.new) {
            const newBalance = Number(payload.new.amount) || 0;
            console.log('Updating balance to:', newBalance);
            setBalance(newBalance);
          } else if (payload.eventType === 'DELETE') {
            setBalance(0);
          }
        }
      )
      .subscribe((status) => {
        console.log('Balance subscription status:', status);
      });

    return () => {
      console.log('Cleaning up balance subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Listen for Supabase auth state changes (account switch triggers sign out/sign in)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_OUT') {
        // Immediately reset balance when signed out
        setBalance(0);
        userIdRef.current = null;
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
