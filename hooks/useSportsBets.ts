'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'cashed_out';

export interface SportsBet {
  id: string;
  user_id: string;
  event_id: string;
  event_name: string;
  market_type: string;
  selection: string;
  odds: number;
  stake: number;
  bet_fee: number;
  potential_payout: number;
  status: BetStatus;
  parlay_id?: string;
  created_at: string;
  settled_at?: string;
}

export interface SportsBetsSummary {
  pending: number;
  settled: number;
  totalPendingStake: number;
  totalPotentialPayout: number;
}

interface UseSportsBetsOptions {
  status?: 'all' | BetStatus;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useSportsBets(options: UseSportsBetsOptions = {}) {
  const { status = 'all', limit = 20, autoRefresh = false, refreshInterval = 30000 } = options;
  const { session, isAuthenticated } = useAuth();
  
  const [bets, setBets] = useState<SportsBet[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [summary, setSummary] = useState<SportsBetsSummary>({
    pending: 0,
    settled: 0,
    totalPendingStake: 0,
    totalPotentialPayout: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const fetchBets = useCallback(async (reset = false) => {
    if (!isAuthenticated || !session?.access_token) {
      setBets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        status,
        limit: limit.toString(),
        offset: currentOffset.toString(),
      });

      const response = await fetch(`/api/sports/my-bets?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      console.log('Sports bets API response:', { 
        success: data.success, 
        betsCount: data.bets?.length || 0, 
        total: data.total,
        error: data.error 
      });

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch bets');
      }

      if (reset) {
        setBets(data.bets || []);
        setOffset(limit);
      } else {
        setBets(prev => [...prev, ...(data.bets || [])]);
        setOffset(prev => prev + limit);
      }

      setTotal(data.total || 0);
      setHasMore((currentOffset + limit) < (data.total || 0));
      setSummary(data.summary || {
        pending: 0,
        settled: 0,
        totalPendingStake: 0,
        totalPotentialPayout: 0,
      });

    } catch (err: any) {
      setError(err.message || 'Failed to load bets');
      console.error('Sports bets fetch error:', err);
      setBets([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, session?.access_token, status, limit, offset]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchBets(false);
    }
  }, [fetchBets, isLoading, hasMore]);

  const refetch = useCallback(async () => {
    setOffset(0);
    // Fetch with reset flag directly
    if (!isAuthenticated || !session?.access_token) {
      setBets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        status,
        limit: limit.toString(),
        offset: '0',
      });

      const response = await fetch(`/api/sports/my-bets?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch bets');
      }

      setBets(data.bets || []);
      setOffset(limit);
      setTotal(data.total || 0);
      setHasMore(limit < (data.total || 0));
      setSummary(data.summary || {
        pending: 0,
        settled: 0,
        totalPendingStake: 0,
        totalPotentialPayout: 0,
      });

    } catch (err: any) {
      setError(err.message || 'Failed to load bets');
      console.error('Sports bets fetch error:', err);
      setBets([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, session?.access_token, status, limit]);

  // Initial fetch
  useEffect(() => {
    console.log('useSportsBets: Initial fetch effect', {
      isAuthenticated,
      hasToken: !!session?.access_token,
      status,
    });
    
    if (isAuthenticated && session?.access_token) {
      setOffset(0);
      // Use a small timeout to ensure offset is reset
      const timer = setTimeout(() => {
        console.log('useSportsBets: Triggering fetchBets');
        fetchBets(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      console.log('useSportsBets: Not authenticated, clearing bets');
      setBets([]);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, session?.access_token, status]);

  // Auto refresh for pending bets
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;

    const interval = setInterval(() => {
      fetchBets(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, isAuthenticated, refreshInterval, fetchBets]);

  return {
    bets,
    total,
    hasMore,
    summary,
    isLoading,
    error,
    loadMore,
    refetch,
  };
}

// Hook for just pending bets (for the betslip area or sports page)
export function usePendingBets() {
  return useSportsBets({ 
    status: 'pending', 
    limit: 50,
    autoRefresh: true,
    refreshInterval: 60000, // Refresh every minute
  });
}
