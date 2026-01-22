"use client";

// Custom hooks for sports data with polling

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sport, SportEvent, LiveScore, OddsFormat, FeaturedEvent } from '@/types/sports';
import * as api from '@/lib/sportsApi';
import { 
  MOCK_SPORTS, 
  MOCK_EVENTS, 
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
 * Fetches real data from The Odds API, prioritizes live events
 */
export function useFeaturedEvents() {
  const [events, setEvents] = useState<FeaturedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.fetchFeaturedEvents();
      
      if (!isMounted.current) return;

      if (response.error) {
        setError(response.error);
        setEvents([]);
      } else if (response.data && response.data.length > 0) {
        // Transform SportEvent to FeaturedEvent
        const now = new Date();
        const featuredEvents: FeaturedEvent[] = response.data.map(event => {
          const commenceTime = new Date(event.commence_time);
          const isLive = commenceTime <= now && !event.completed;
          
          // Extract best odds from bookmakers
          let bestOdds: FeaturedEvent['bestOdds'] | undefined;
          if (event.bookmakers && event.bookmakers.length > 0) {
            const bookmaker = event.bookmakers[0];
            const h2hMarket = bookmaker.markets?.find(m => m.key === 'h2h');
            if (h2hMarket && h2hMarket.outcomes) {
              const homeOdds = h2hMarket.outcomes.find(o => o.name === event.home_team)?.price;
              const awayOdds = h2hMarket.outcomes.find(o => o.name === event.away_team)?.price;
              const drawOdds = h2hMarket.outcomes.find(o => o.name === 'Draw')?.price;
              
              if (homeOdds && awayOdds) {
                bestOdds = {
                  home: homeOdds,
                  away: awayOdds,
                  draw: drawOdds,
                  bookmaker: bookmaker.title,
                };
              }
            }
          }

          // Extract live score if available
          let liveScore: FeaturedEvent['liveScore'] | undefined;
          if (isLive && event.scores && event.scores.length >= 2) {
            const homeScore = event.scores.find(s => s.name === event.home_team);
            const awayScore = event.scores.find(s => s.name === event.away_team);
            if (homeScore && awayScore) {
              liveScore = {
                home: parseInt(homeScore.score, 10) || 0,
                away: parseInt(awayScore.score, 10) || 0,
                period: 'Live',
                time: '',
              };
            }
          }

          return {
            id: event.id,
            sport_key: event.sport_key,
            sport_title: event.sport_title,
            commence_time: event.commence_time,
            home_team: event.home_team,
            away_team: event.away_team,
            league: event.sport_title,
            isFeatured: true,
            bestOdds,
            liveScore,
          };
        });

        setEvents(featuredEvents);
      } else {
        setError('No events available at this time');
        setEvents([]);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch events');
        setEvents([]);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { events, isLoading, error, refetch };
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

// Sport keys for The Odds API (maps category to actual API sport keys)
// These are the actively supported sports for our platform
const SPORT_API_KEYS: Record<string, string[]> = {
  soccer: ['soccer_epl', 'soccer_spain_la_liga', 'soccer_germany_bundesliga', 'soccer_italy_serie_a'],
  basketball: ['basketball_nba', 'basketball_euroleague'],
  cricket: ['cricket_ipl', 'cricket_test_match'],
  tennis: ['tennis_atp_french_open', 'tennis_wta_french_open'],
  mma: ['mma_mixed_martial_arts'],
  baseball: ['baseball_mlb'],
  americanfootball: ['americanfootball_nfl'],
  icehockey: ['icehockey_nhl'],
};

/**
 * Hook to fetch events lazily - ONLY when a sport category is selected
 * This dramatically reduces API quota usage:
 * - Page load: 0 credits (vs 72 with useAllSportsEvents)
 * - Per sport selected: 1 credit (h2h market, us region)
 * 
 * Uses caching to avoid re-fetching the same sport
 */
export function useLazySportEvents(
  selectedSport: string | null,
  pollIntervalMs: number = 60000
) {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  // Cache to avoid re-fetching already loaded sports
  const cacheRef = useRef<Record<string, { events: SportEvent[]; timestamp: number }>>({});

  const fetchSportEvents = useCallback(async (sportCategory: string) => {
    setIsLoading(true);
    setError(null);

    // Check cache first (valid for 30 seconds)
    const cached = cacheRef.current[sportCategory];
    const now = Date.now();
    if (cached && now - cached.timestamp < 30000) {
      setEvents(cached.events);
      setIsLoading(false);
      return;
    }

    try {
      // Get the API sport keys for this category
      const sportKeys = SPORT_API_KEYS[sportCategory] || [];
      
      if (sportKeys.length === 0) {
        // If no mapping, try using the category directly as a sport filter
        setEvents([]);
        setIsLoading(false);
        return;
      }

      // Fetch odds for each sport in the category
      // OPTIMIZATION: Uses default 'us' region and 'h2h' market = 1 credit per sport
      const promises = sportKeys.map(sport => 
        api.fetchOdds(sport, { 
          oddsFormat: 'decimal'
          // Defaults: regions: 'us', markets: 'h2h' = 1 credit each
        })
      );

      const results = await Promise.all(promises);
      
      // Combine all events
      const allEvents: SportEvent[] = [];

      results.forEach((result, index) => {
        if (result.error) {
          console.warn(`Failed to fetch ${sportKeys[index]}:`, result.error);
        } else if (result.data) {
          result.data.forEach(event => {
            allEvents.push({
              ...event,
              league: event.sport_title || event.sport_key,
            });
          });
        }
      });

      // Sort by commence_time (soonest first)
      allEvents.sort((a, b) => 
        new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
      );

      // Update cache
      cacheRef.current[sportCategory] = {
        events: allEvents,
        timestamp: now,
      };

      if (isMounted.current) {
        setEvents(allEvents);
        
        if (allEvents.length === 0) {
          setError('No events found for this sport. Events may be unavailable if not in season.');
        }
      }
    } catch (err) {
      console.error('Error fetching sport events:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch events');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    
    // Clear previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only fetch if a sport is selected
    if (selectedSport) {
      fetchSportEvents(selectedSport);

      // Set up polling only when a sport is selected
      if (pollIntervalMs > 0) {
        intervalRef.current = setInterval(() => {
          // Clear cache before polling to get fresh data
          if (selectedSport) {
            delete cacheRef.current[selectedSport];
            fetchSportEvents(selectedSport);
          }
        }, pollIntervalMs);
      }
    } else {
      // No sport selected - clear events (no API call = 0 credits)
      setEvents([]);
      setIsLoading(false);
      setError(null);
    }

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [selectedSport, fetchSportEvents, pollIntervalMs]);

  const refetch = useCallback(() => {
    if (selectedSport) {
      // Clear cache to force fresh fetch
      delete cacheRef.current[selectedSport];
      fetchSportEvents(selectedSport);
    }
  }, [selectedSport, fetchSportEvents]);

  return { events, isLoading, error, refetch };
}

/**
 * @deprecated Use useLazySportEvents instead for better quota management
 * This hook fetches ALL sports at once and is very expensive (72+ credits per load)
 */
export function useAllSportsEvents(pollIntervalMs: number = 60000) {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  // DEPRECATED: This function is expensive and should not be used
  // Kept for backwards compatibility
  const fetchAllEvents = useCallback(async () => {
    console.warn('useAllSportsEvents is deprecated. Use useLazySportEvents instead for better quota management.');
    setIsLoading(true);
    setError(null);

    try {
      // Only fetch a single sport to reduce costs
      const response = await api.fetchOdds('soccer_epl', {
        oddsFormat: 'decimal'
      });

      if (response.error) {
        setError(response.error);
      } else if (response.data && isMounted.current) {
        const allEvents = response.data.map(event => ({
          ...event,
          league: event.sport_title || event.sport_key,
        }));
        
        allEvents.sort((a, b) => 
          new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
        );
        
        setEvents(allEvents);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch events');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchAllEvents();

    if (pollIntervalMs > 0) {
      intervalRef.current = setInterval(fetchAllEvents, pollIntervalMs);
    }

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAllEvents, pollIntervalMs]);

  const refetch = useCallback(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  return { events, isLoading, error, refetch };
}

