'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

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

  return { balance, isLoading, refetch: fetchBalance };
}
