// Sports Betting Type Definitions

export interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface SportEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Bookmaker[];
  scores?: Score[];
  completed?: boolean;
  last_update?: string;
  // Extended fields for UI
  league?: string;
  streamUrl?: string;
  isFeatured?: boolean;
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface Market {
  key: MarketType;
  last_update?: string;
  outcomes: Outcome[];
}

export type MarketType = 'h2h' | 'spreads' | 'totals';

export interface Outcome {
  name: string;
  price: number; // Decimal odds by default
  point?: number; // For spreads and totals
  description?: string;
}

export interface Score {
  name: string;
  score: string;
}

export interface LiveScore {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: Score[] | null;
  last_update: string | null;
}

// Extended bet item for sports betting
export interface SportsBetItem {
  id: string;
  eventId: string;
  eventName: string; // "Arsenal vs Liverpool"
  market: MarketType;
  outcomeName: string; // "Arsenal" or "Over 2.5" etc.
  odds: number;
  previousOdds?: number; // For tracking odds changes
  stake?: number;
  point?: number; // For spreads/totals
  isLive?: boolean;
}

// Odds format preference
export type OddsFormat = 'decimal' | 'american';

// Filter state
export interface EventFilters {
  status: 'all' | 'live' | 'upcoming';
  market: MarketType;
  oddsFormat: OddsFormat;
}

// API response types
export interface SportsApiResponse<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  remainingRequests?: number;
}

// Featured event data for MainEventCard
export interface FeaturedEvent extends SportEvent {
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  liveScore?: {
    home: number;
    away: number;
    period?: string;
    time?: string;
  };
  bestOdds?: {
    home: number;
    draw?: number;
    away: number;
    bookmaker: string;
  };
}
