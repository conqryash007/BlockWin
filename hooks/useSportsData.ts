"use client";

// Custom hooks for sports data with polling

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sport, SportEvent, LiveScore, OddsFormat, FeaturedEvent } from '@/types/sports';
import * as api from '@/lib/sportsApi';
import { 
  MOCK_SPORTS, 
  MOCK_EVENTS, 
  MOCK_FEATURED_EVENTS, 
  MOCK_LIVE_SCORES,
  getEventsBySport,
  getLiveEvents,
  getUpcomingEvents,
} from '@/lib/mockSportsData';

// Storage keys
const ODDS_FORMAT_KEY = 'sports_odds_format';
const USE_MOCK_KEY = 'sports_use_mock_data';

/**
 * Hook to toggle between mock and live API data
 */
export function useMockMode() {
  const [useMock, setUseMock] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(USE_MOCK_KEY);
    if (stored !== null) {
      setUseMock(stored === 'true');
    }
  }, []);

  const toggleMockMode = useCallback(() => {
    setUseMock((prev) => {
      const newValue = !prev;
      localStorage.setItem(USE_MOCK_KEY, String(newValue));
      return newValue;
    });
  }, []);

  return { useMock, toggleMockMode };
}

/**
 * Hook for odds format preference with localStorage persistence
 */
export function useOddsFormat() {
  const [format, setFormat] = useState<OddsFormat>('decimal');

  useEffect(() => {
    const stored = localStorage.getItem(ODDS_FORMAT_KEY);
    if (stored === 'decimal' || stored === 'american') {
      setFormat(stored);
    }
  }, []);

  const toggleFormat = useCallback(() => {
    setFormat((prev) => {
      const newFormat = prev === 'decimal' ? 'american' : 'decimal';
      localStorage.setItem(ODDS_FORMAT_KEY, newFormat);
      return newFormat;
    });
  }, []);

  const setOddsFormat = useCallback((newFormat: OddsFormat) => {
    setFormat(newFormat);
    localStorage.setItem(ODDS_FORMAT_KEY, newFormat);
  }, []);

  return { format, toggleFormat, setOddsFormat };
}

/**
 * Hook to fetch list of sports
 */
export function useSports(useMock: boolean = true) {
  const [sports, setSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSports() {
      setIsLoading(true);
      setError(null);

      if (useMock) {
        setSports(MOCK_SPORTS);
        setIsLoading(false);
        return;
      }

      const response = await api.fetchSports();
      if (response.error) {
        setError(response.error);
        // Fallback to mock data on error
        setSports(MOCK_SPORTS);
      } else if (response.data) {
        setSports(response.data);
      }
      setIsLoading(false);
    }

    loadSports();
  }, [useMock]);

  return { sports, isLoading, error };
}

/**
 * Hook to fetch events for a sport with polling
 */
export function useEvents(
  sportKey: string,
  useMock: boolean = true,
  pollIntervalMs: number = 30000
) {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (useMock) {
      // Filter mock events by sport key pattern
      const sportGroup = sportKey.split('_')[0]; // e.g., "soccer" from "soccer_epl"
      const filtered = getEventsBySport(sportGroup);
      setEvents(filtered.length > 0 ? filtered : MOCK_EVENTS);
      setIsLoading(false);
      return;
    }

    const response = await api.fetchOdds(sportKey, { markets: 'h2h,spreads,totals' });
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setEvents(response.data);
      setError(null);
    }
    setIsLoading(false);
  }, [sportKey, useMock]);

  useEffect(() => {
    fetchData();

    // Set up polling
    if (pollIntervalMs > 0) {
      intervalRef.current = setInterval(fetchData, pollIntervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, pollIntervalMs]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  return { events, isLoading, error, refetch };
}

/**
 * Hook to fetch featured events for MainEventsStrip
 */
export function useFeaturedEvents(useMock: boolean = true) {
  const [events, setEvents] = useState<FeaturedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (useMock) {
      setEvents(MOCK_FEATURED_EVENTS);
      setIsLoading(false);
      return;
    }

    // For live API, we would fetch from multiple sports and select featured
    // For now, use mock data
    setEvents(MOCK_FEATURED_EVENTS);
    setIsLoading(false);
  }, [useMock]);

  return { events, isLoading };
}

/**
 * Hook to fetch live scores with polling
 */
export function useScores(
  sportKey: string,
  useMock: boolean = true,
  pollIntervalMs: number = 30000
) {
  const [scores, setScores] = useState<LiveScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (useMock) {
      setScores(MOCK_LIVE_SCORES);
      setIsLoading(false);
      return;
    }

    const response = await api.fetchScores(sportKey);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setScores(response.data);
      setError(null);
    }
    setIsLoading(false);
  }, [sportKey, useMock]);

  useEffect(() => {
    fetchData();

    if (pollIntervalMs > 0) {
      intervalRef.current = setInterval(fetchData, pollIntervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, pollIntervalMs]);

  return { scores, isLoading, error };
}

/**
 * Hook to fetch specific event odds with faster polling for live events
 */
export function useEventOdds(
  sportKey: string,
  eventId: string,
  isLive: boolean = false,
  useMock: boolean = true
) {
  const [event, setEvent] = useState<SportEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Faster polling for live events
  const pollIntervalMs = isLive ? 10000 : 30000;

  const fetchData = useCallback(async () => {
    if (useMock) {
      const mockEvent = MOCK_EVENTS.find((e) => e.id === eventId);
      setEvent(mockEvent || null);
      setIsLoading(false);
      return;
    }

    const response = await api.fetchEventOdds(sportKey, eventId);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setEvent(response.data);
      setError(null);
    }
    setIsLoading(false);
  }, [sportKey, eventId, useMock]);

  useEffect(() => {
    fetchData();

    if (pollIntervalMs > 0) {
      intervalRef.current = setInterval(fetchData, pollIntervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, pollIntervalMs]);

  return { event, isLoading, error };
}

/**
 * Hook to get live and upcoming events separately
 */
export function useLiveAndUpcomingEvents(useMock: boolean = true) {
  const { events, isLoading, error } = useEvents('all', useMock);
  
  const liveEvents = useMock ? getLiveEvents() : events.filter((e) => {
    const now = new Date();
    const startTime = new Date(e.commence_time);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    return startTime <= now && startTime >= threeHoursAgo && !e.completed;
  });

  const upcomingEvents = useMock ? getUpcomingEvents() : events.filter((e) => {
    const now = new Date();
    const startTime = new Date(e.commence_time);
    return startTime > now;
  });

  return { liveEvents, upcomingEvents, isLoading, error };
}

/**
 * Hook to track rate limit status
 */
export function useRateLimitStatus() {
  const [status, setStatus] = useState(api.getRateLimitStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(api.getRateLimitStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
}
