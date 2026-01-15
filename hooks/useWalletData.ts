'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface WalletStats {
  balance: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  totalEarnings: number;
  gamesPlayed: number;
  winRate: number;
  wins?: number;
  losses?: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win';
  amount: number;
  game_type: string | null;
  tx_hash: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
}

export function useWalletData() {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<WalletStats>({
    balance: 0,
    totalWagered: 0,
    totalWon: 0,
    totalLost: 0,
    totalEarnings: 0,
    gamesPlayed: 0,
    winRate: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = useCallback(async () => {
    if (!address || !isConnected) {
      setStats({
        balance: 0,
        totalWagered: 0,
        totalWon: 0,
        totalLost: 0,
        totalEarnings: 0,
        gamesPlayed: 0,
        winRate: 0,
      });
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get session token
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        setError('Please connect your wallet and sign in');
        setIsLoading(false);
        return;
      }

      // Fetch stats from API route
      const statsResponse = await fetch('/api/wallet/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const statsData = await statsResponse.json();

      if (!statsResponse.ok) {
        throw new Error(statsData.error || 'Failed to fetch wallet stats');
      }

      setStats(statsData.stats);

      // Fetch recent transactions (keeping existing logic for now)
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setTransactions(txData as Transaction[] || []);

    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  return { stats, transactions, isLoading, error, refetch: fetchWalletData };
}
