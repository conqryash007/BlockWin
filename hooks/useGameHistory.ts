'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';

// Use the SSR-compatible browser client that maintains session
const supabase = createClient();

export interface GameSession {
  id: string;
  game_type: string;
  bet_amount: number;
  bet_fee: number;
  outcome: {
    win: boolean;
    [key: string]: any;
  };
  payout: number;
  created_at: string;
  // Additional normalized fields from API
  profit?: number;
  isWin?: boolean;
}

interface PaginationInfo {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

interface UseGameHistoryOptions {
  limit?: number;
  gameType?: string;
}

export function useGameHistory(options: UseGameHistoryOptions = {}) {
  const { limit = 20, gameType } = options;
  // Use isAuthenticated (Google login) instead of wallet connection
  const { isAuthenticated } = useAuth();
  const [games, setGames] = useState<GameSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    limit,
    offset: 0,
    total: 0,
    hasMore: false,
  });

  const fetchGameHistory = useCallback(async (newOffset: number = 0, append: boolean = false) => {
    if (!isAuthenticated) {
      setGames([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get session token
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        setError('Please sign in to view your game history');
        setIsLoading(false);
        return;
      }

      // Build URL with query params
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: newOffset.toString(),
      });
      if (gameType) {
        params.append('gameType', gameType);
      }

      // Fetch from API route
      const response = await fetch(`/api/wallet/history?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch game history');
      }

      const gameSessions = data.games as GameSession[];

      if (append && newOffset > 0) {
        setGames(prev => [...prev, ...gameSessions]);
      } else {
        setGames(gameSessions);
      }

      setPagination(data.pagination);

    } catch (err) {
      console.error('Error fetching game history:', err);
      setError('Failed to load game history');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, limit, gameType]);

  const loadMore = useCallback(() => {
    if (!isLoading && pagination.hasMore) {
      fetchGameHistory(pagination.offset + pagination.limit, true);
    }
  }, [fetchGameHistory, isLoading, pagination]);

  const refetch = useCallback(() => {
    fetchGameHistory(0, false);
  }, [fetchGameHistory]);

  useEffect(() => {
    fetchGameHistory(0, false);
  }, [fetchGameHistory]);

  return { 
    games, 
    isLoading, 
    error, 
    hasMore: pagination.hasMore,
    total: pagination.total,
    loadMore, 
    refetch,
  };
}
