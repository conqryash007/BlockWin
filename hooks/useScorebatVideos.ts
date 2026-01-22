"use client";

// Custom hooks for ScoreBat video data
// Uses the free ScoreBat Video API for football highlights

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScorebatMatch,
  fetchFreeVideoFeed,
  findMatchVideos,
  filterByCompetition,
} from '@/lib/scorebatApi';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Global cache for video feed
let videoCache: {
  data: ScorebatMatch[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

/**
 * Hook to fetch and cache the ScoreBat video feed
 * Returns all available video highlights
 */
export function useScorebatVideos(competitionFilter?: string) {
  const [videos, setVideos] = useState<ScorebatMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Check cache first
    const now = Date.now();
    if (videoCache.data && now - videoCache.timestamp < CACHE_DURATION) {
      const filteredVideos = competitionFilter
        ? filterByCompetition(videoCache.data, competitionFilter)
        : videoCache.data;
      
      if (isMounted.current) {
        setVideos(filteredVideos);
        setIsLoading(false);
      }
      return;
    }

    try {
      const response = await fetchFreeVideoFeed();
      
      if (response.error) {
        if (isMounted.current) {
          setError(response.error);
          setVideos([]);
        }
      } else if (response.data) {
        // Update cache
        videoCache = {
          data: response.data,
          timestamp: now,
        };
        
        const filteredVideos = competitionFilter
          ? filterByCompetition(response.data, competitionFilter)
          : response.data;
        
        if (isMounted.current) {
          setVideos(filteredVideos);
        }
      }
    } catch (err) {
      console.error('Error fetching ScoreBat videos:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch videos');
        setVideos([]);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [competitionFilter]);

  useEffect(() => {
    isMounted.current = true;
    fetchVideos();

    return () => {
      isMounted.current = false;
    };
  }, [fetchVideos]);

  const refetch = useCallback(() => {
    // Clear cache to force fresh fetch
    videoCache = { data: null, timestamp: 0 };
    fetchVideos();
  }, [fetchVideos]);

  return { videos, isLoading, error, refetch };
}

/**
 * Hook to find videos for a specific match
 * Searches through the video feed to find matching highlights
 */
export function useMatchVideos(homeTeam: string, awayTeam: string) {
  const [matchVideos, setMatchVideos] = useState<ScorebatMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    async function findVideos() {
      if (!homeTeam || !awayTeam) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check cache first
        const now = Date.now();
        let allVideos: ScorebatMatch[] | null = null;
        
        if (videoCache.data && now - videoCache.timestamp < CACHE_DURATION) {
          allVideos = videoCache.data;
        } else {
          const response = await fetchFreeVideoFeed();
          if (response.error) {
            if (isMounted.current) {
              setError(response.error);
              setIsLoading(false);
            }
            return;
          }
          
          allVideos = response.data;
          if (allVideos) {
            videoCache = { data: allVideos, timestamp: now };
          }
        }

        if (allVideos && isMounted.current) {
          const matched = findMatchVideos(allVideos, homeTeam, awayTeam);
          setMatchVideos(matched);
        }
      } catch (err) {
        console.error('Error finding match videos:', err);
        if (isMounted.current) {
          setError(err instanceof Error ? err.message : 'Failed to find videos');
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    }

    findVideos();

    return () => {
      isMounted.current = false;
    };
  }, [homeTeam, awayTeam]);

  return { matchVideos, isLoading, error };
}

/**
 * Hook to get featured/latest videos for display
 * Returns a limited number of the most recent videos
 */
export function useFeaturedVideos(limit: number = 6) {
  const { videos, isLoading, error, refetch } = useScorebatVideos();
  
  // Get the most recent videos up to the limit
  const featuredVideos = videos.slice(0, limit);
  
  return { featuredVideos, isLoading, error, refetch };
}

/**
 * Clear the video cache
 * Useful when you want to force a fresh fetch
 */
export function clearVideoCache() {
  videoCache = { data: null, timestamp: 0 };
}
