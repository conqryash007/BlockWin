'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Game {
  id: string;
  name: string;
  slug: string;
  house_edge: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UseGamesReturn {
  games: Game[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateGame: (id: string, updates: Partial<Game>) => Promise<boolean>;
  updateHouseEdge: (id: string, houseEdge: number) => Promise<boolean>;
  toggleGameStatus: (id: string, isActive: boolean) => Promise<boolean>;
}

export function useGames(): UseGamesReturn {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('games')
        .select('*')
        .order('name', { ascending: true });

      if (queryError) throw queryError;
      setGames(data || []);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const updateGame = useCallback(async (id: string, updates: Partial<Game>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('games')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state
      setGames(prev => prev.map(game => 
        game.id === id ? { ...game, ...updates } : game
      ));
      return true;
    } catch (err) {
      console.error('Error updating game:', err);
      setError(err instanceof Error ? err.message : 'Failed to update game');
      return false;
    }
  }, []);

  const updateHouseEdge = useCallback(async (id: string, houseEdge: number): Promise<boolean> => {
    return updateGame(id, { house_edge: houseEdge });
  }, [updateGame]);

  const toggleGameStatus = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    return updateGame(id, { is_active: isActive });
  }, [updateGame]);

  return {
    games,
    isLoading,
    error,
    refetch: fetchGames,
    updateGame,
    updateHouseEdge,
    toggleGameStatus,
  };
}
