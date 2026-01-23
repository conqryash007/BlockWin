// Sports API Service - The Odds API v4

import { Sport, SportEvent, LiveScore, Bookmaker } from '@/types/sports';

const API_BASE = 'https://api.the-odds-api.com/v4';
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY || '';

// Rate limiting state
let remainingRequests: number | null = null;
let backoffUntil: number | null = null;

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  remainingRequests?: number;
}

/**
 * Base fetch function with error handling and rate limiting
 */
async function apiFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
  // Check if we're in backoff period
  if (backoffUntil && Date.now() < backoffUntil) {
    const waitSeconds = Math.ceil((backoffUntil - Date.now()) / 1000);
    return {
      data: null,
      error: `Rate limited. Please wait ${waitSeconds} seconds.`,
    };
  }

  const url = new URL(`${API_BASE}${endpoint}`);
  url.searchParams.append('apiKey', API_KEY);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });

  try {
    const response = await fetch(url.toString());

    // Update remaining requests from headers
    const remaining = response.headers.get('x-requests-remaining');
    if (remaining) {
      remainingRequests = parseInt(remaining, 10);
    }

    // Handle rate limiting
    if (response.status === 429) {
      // Exponential backoff: start with 60 seconds
      backoffUntil = Date.now() + 60000;
      return {
        data: null,
        error: 'Too many requests. Please wait before trying again.',
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: `API Error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      data,
      error: null,
      remainingRequests: remainingRequests ?? undefined,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * GET /v4/sports - Get list of in-season sports
 * Free endpoint - doesn't count against quota
 */
export async function fetchSports(): Promise<ApiResponse<Sport[]>> {
  return apiFetch<Sport[]>('/sports');
}

/**
 * GET /v4/sports/{sport}/events - Get events for a sport
 * Free endpoint - doesn't count against quota
 */
export async function fetchEvents(sport: string): Promise<ApiResponse<SportEvent[]>> {
  return apiFetch<SportEvent[]>(`/sports/${sport}/events`);
}

/**
 * GET /v4/sports/{sport}/odds - Get odds for events
 * Costs quota based on markets and regions
 */
export async function fetchOdds(
  sport: string,
  options: {
    regions?: string; // us, uk, eu, au - Default to 'us' for minimal quota usage
    markets?: string; // h2h, spreads, totals - Default to 'h2h' for minimal quota usage
    oddsFormat?: 'decimal' | 'american';
    eventIds?: string; // Comma-separated event IDs
  } = {}
): Promise<ApiResponse<SportEvent[]>> {
  // OPTIMIZATION: Default to single region and single market to minimize quota cost
  // Cost formula: markets × regions (e.g., 1 market × 1 region = 1 credit)
  const { regions = 'us', markets = 'h2h', oddsFormat = 'decimal', eventIds } = options;
  
  return apiFetch<SportEvent[]>(`/sports/${sport}/odds`, {
    regions,
    markets,
    oddsFormat,
    ...(eventIds && { eventIds }),
  });
}

/**
 * GET /v4/sports/{sport}/scores - Get scores for events
 * Live scores update approximately every 30 seconds
 */
export async function fetchScores(
  sport: string,
  options: {
    daysFrom?: number; // 1-3, for recently completed games
  } = {}
): Promise<ApiResponse<LiveScore[]>> {
  const { daysFrom } = options;
  
  return apiFetch<LiveScore[]>(`/sports/${sport}/scores`, {
    ...(daysFrom && { daysFrom: daysFrom.toString() }),
  });
}

/**
 * GET /v4/sports/{sport}/events/{eventId}/odds - Get odds for specific event
 */
export async function fetchEventOdds(
  sport: string,
  eventId: string,
  options: {
    regions?: string;
    markets?: string;
    oddsFormat?: 'decimal' | 'american';
  } = {}
): Promise<ApiResponse<SportEvent>> {
  // OPTIMIZATION: Use single region by default, keep all markets for detailed view
  // Cost: 3 markets × 1 region = 3 credits per event detail
  const { regions = 'us', markets = 'h2h,spreads,totals', oddsFormat = 'decimal' } = options;
  
  return apiFetch<SportEvent>(`/sports/${sport}/events/${eventId}/odds`, {
    regions,
    markets,
    oddsFormat,
  });
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(): {
  remainingRequests: number | null;
  isRateLimited: boolean;
  backoffSecondsRemaining: number | null;
} {
  const now = Date.now();
  const isRateLimited = backoffUntil !== null && now < backoffUntil;
  
  return {
    remainingRequests,
    isRateLimited,
    backoffSecondsRemaining: isRateLimited && backoffUntil 
      ? Math.ceil((backoffUntil - now) / 1000) 
      : null,
  };
}

/**
 * Reset rate limit backoff (for testing purposes)
 */
export function resetRateLimitBackoff(): void {
  backoffUntil = null;
}

/**
 * Featured sport to fetch for Main Events section
 * OPTIMIZED: Only fetch from one soccer league to minimize API credits
 * Cost: 1 market × 1 region = 1 credit per call
 */
const FEATURED_SPORT_KEY = 'soccer_epl'; // English Premier League (most popular)

/**
 * Fetch featured events for MainEventsStrip
 * OPTIMIZED: Only fetches from one soccer league to save API credits
 * Returns top 5 upcoming/live events
 */
export async function fetchFeaturedEvents(): Promise<ApiResponse<SportEvent[]>> {
  try {
    // Single API call - costs only 1 credit (1 market × 1 region)
    const response = await fetchOdds(FEATURED_SPORT_KEY, {
      regions: 'us',      // Single region
      markets: 'h2h',     // Single market (head-to-head only)
      oddsFormat: 'decimal',
    });
    
    if (response.error) {
      return {
        data: null,
        error: response.error,
      };
    }

    if (!response.data || response.data.length === 0) {
      return {
        data: null,
        error: 'No soccer events available at this time',
      };
    }

    // Sort events: live first, then by commence time
    const now = new Date();
    const sortedEvents = response.data.sort((a, b) => {
      const aTime = new Date(a.commence_time);
      const bTime = new Date(b.commence_time);
      const aIsLive = aTime <= now && !a.completed;
      const bIsLive = bTime <= now && !b.completed;
      
      // Live events first
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      
      // Then by commence time (soonest first)
      return aTime.getTime() - bTime.getTime();
    });

    // Return top 5 events only
    return {
      data: sortedEvents.slice(0, 5),
      error: null,
      remainingRequests: remainingRequests ?? undefined,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to fetch events',
    };
  }
}
