// Mock Sports Data for Development

import { Sport, SportEvent, FeaturedEvent, Bookmaker, LiveScore } from '@/types/sports';

export const MOCK_SPORTS: Sport[] = [
  {
    key: 'soccer_epl',
    group: 'Soccer',
    title: 'English Premier League',
    description: 'English Premier League',
    active: true,
    has_outrights: true,
  },
  {
    key: 'soccer_spain_la_liga',
    group: 'Soccer',
    title: 'La Liga',
    description: 'Spanish La Liga',
    active: true,
    has_outrights: true,
  },
  {
    key: 'basketball_nba',
    group: 'Basketball',
    title: 'NBA',
    description: 'US Basketball',
    active: true,
    has_outrights: true,
  },
  {
    key: 'basketball_euroleague',
    group: 'Basketball',
    title: 'Euroleague',
    description: 'European Basketball',
    active: true,
    has_outrights: false,
  },
  {
    key: 'cricket_ipl',
    group: 'Cricket',
    title: 'IPL',
    description: 'Indian Premier League',
    active: true,
    has_outrights: true,
  },
  {
    key: 'tennis_atp',
    group: 'Tennis',
    title: 'ATP Tour',
    description: 'ATP Tennis Tour',
    active: true,
    has_outrights: false,
  },
  {
    key: 'mma_ufc',
    group: 'MMA',
    title: 'UFC',
    description: 'Ultimate Fighting Championship',
    active: true,
    has_outrights: false,
  },
  {
    key: 'baseball_mlb',
    group: 'Baseball',
    title: 'MLB',
    description: 'Major League Baseball',
    active: true,
    has_outrights: true,
  },
];

// Helper to generate future times
const getFutureTime = (hoursFromNow: number): string => {
  const date = new Date();
  date.setHours(date.getHours() + hoursFromNow);
  return date.toISOString();
};

const getPastTime = (hoursAgo: number): string => {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
};

export const MOCK_BOOKMAKERS: Bookmaker[] = [
  {
    key: 'draftkings',
    title: 'DraftKings',
    last_update: new Date().toISOString(),
    markets: [],
  },
  {
    key: 'fanduel',
    title: 'FanDuel',
    last_update: new Date().toISOString(),
    markets: [],
  },
  {
    key: 'betmgm',
    title: 'BetMGM',
    last_update: new Date().toISOString(),
    markets: [],
  },
];

export const MOCK_EVENTS: SportEvent[] = [
  // Soccer EPL
  {
    id: 'evt_arsenal_liverpool',
    sport_key: 'soccer_epl',
    sport_title: 'English Premier League',
    commence_time: getFutureTime(2),
    home_team: 'Arsenal',
    away_team: 'Liverpool',
    league: 'Premier League',
    bookmakers: [
      {
        key: 'draftkings',
        title: 'DraftKings',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Arsenal', price: 2.45 },
              { name: 'Draw', price: 3.40 },
              { name: 'Liverpool', price: 2.85 },
            ],
          },
          {
            key: 'totals',
            outcomes: [
              { name: 'Over', price: 1.85, point: 2.5 },
              { name: 'Under', price: 1.95, point: 2.5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'evt_chelsea_mancity',
    sport_key: 'soccer_epl',
    sport_title: 'English Premier League',
    commence_time: getFutureTime(5),
    home_team: 'Chelsea',
    away_team: 'Manchester City',
    league: 'Premier League',
    bookmakers: [
      {
        key: 'draftkings',
        title: 'DraftKings',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Chelsea', price: 4.20 },
              { name: 'Draw', price: 3.80 },
              { name: 'Manchester City', price: 1.75 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'evt_manutd_tottenham',
    sport_key: 'soccer_epl',
    sport_title: 'English Premier League',
    commence_time: getFutureTime(26),
    home_team: 'Manchester United',
    away_team: 'Tottenham',
    league: 'Premier League',
    bookmakers: [
      {
        key: 'fanduel',
        title: 'FanDuel',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Manchester United', price: 2.10 },
              { name: 'Draw', price: 3.50 },
              { name: 'Tottenham', price: 3.25 },
            ],
          },
        ],
      },
    ],
  },
  // Live Soccer Match
  {
    id: 'evt_barcelona_realmadrid',
    sport_key: 'soccer_spain_la_liga',
    sport_title: 'La Liga',
    commence_time: getPastTime(1),
    home_team: 'Barcelona',
    away_team: 'Real Madrid',
    league: 'La Liga',
    bookmakers: [
      {
        key: 'draftkings',
        title: 'DraftKings',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Barcelona', price: 1.95 },
              { name: 'Draw', price: 3.60 },
              { name: 'Real Madrid', price: 3.80 },
            ],
          },
        ],
      },
    ],
    scores: [
      { name: 'Barcelona', score: '2' },
      { name: 'Real Madrid', score: '1' },
    ],
  },
  // NBA
  {
    id: 'evt_lakers_warriors',
    sport_key: 'basketball_nba',
    sport_title: 'NBA',
    commence_time: getFutureTime(8),
    home_team: 'Los Angeles Lakers',
    away_team: 'Golden State Warriors',
    league: 'NBA',
    bookmakers: [
      {
        key: 'fanduel',
        title: 'FanDuel',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Los Angeles Lakers', price: 1.85 },
              { name: 'Golden State Warriors', price: 1.95 },
            ],
          },
          {
            key: 'spreads',
            outcomes: [
              { name: 'Los Angeles Lakers', price: 1.91, point: -3.5 },
              { name: 'Golden State Warriors', price: 1.91, point: 3.5 },
            ],
          },
          {
            key: 'totals',
            outcomes: [
              { name: 'Over', price: 1.90, point: 224.5 },
              { name: 'Under', price: 1.90, point: 224.5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'evt_celtics_bucks',
    sport_key: 'basketball_nba',
    sport_title: 'NBA',
    commence_time: getFutureTime(10),
    home_team: 'Boston Celtics',
    away_team: 'Milwaukee Bucks',
    league: 'NBA',
    bookmakers: [
      {
        key: 'betmgm',
        title: 'BetMGM',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Boston Celtics', price: 1.65 },
              { name: 'Milwaukee Bucks', price: 2.20 },
            ],
          },
        ],
      },
    ],
  },
  // Live NBA
  {
    id: 'evt_heat_knicks_live',
    sport_key: 'basketball_nba',
    sport_title: 'NBA',
    commence_time: getPastTime(1.5),
    home_team: 'Miami Heat',
    away_team: 'New York Knicks',
    league: 'NBA',
    bookmakers: [
      {
        key: 'draftkings',
        title: 'DraftKings',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Miami Heat', price: 1.55 },
              { name: 'New York Knicks', price: 2.45 },
            ],
          },
        ],
      },
    ],
    scores: [
      { name: 'Miami Heat', score: '78' },
      { name: 'New York Knicks', score: '72' },
    ],
  },
  // Cricket IPL
  {
    id: 'evt_csk_mi',
    sport_key: 'cricket_ipl',
    sport_title: 'IPL',
    commence_time: getFutureTime(24),
    home_team: 'Chennai Super Kings',
    away_team: 'Mumbai Indians',
    league: 'Indian Premier League',
    bookmakers: [
      {
        key: 'draftkings',
        title: 'DraftKings',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Chennai Super Kings', price: 1.90 },
              { name: 'Mumbai Indians', price: 1.90 },
            ],
          },
        ],
      },
    ],
  },
  // Tennis
  {
    id: 'evt_djokovic_nadal',
    sport_key: 'tennis_atp',
    sport_title: 'ATP Tour',
    commence_time: getFutureTime(6),
    home_team: 'Novak Djokovic',
    away_team: 'Rafael Nadal',
    league: 'ATP Australian Open',
    bookmakers: [
      {
        key: 'fanduel',
        title: 'FanDuel',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Novak Djokovic', price: 1.55 },
              { name: 'Rafael Nadal', price: 2.35 },
            ],
          },
        ],
      },
    ],
  },
  // UFC
  {
    id: 'evt_ufc_main',
    sport_key: 'mma_ufc',
    sport_title: 'UFC',
    commence_time: getFutureTime(48),
    home_team: 'Jon Jones',
    away_team: 'Stipe Miocic',
    league: 'UFC 309',
    bookmakers: [
      {
        key: 'draftkings',
        title: 'DraftKings',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Jon Jones', price: 1.35 },
              { name: 'Stipe Miocic', price: 3.25 },
            ],
          },
        ],
      },
    ],
  },
];

// Featured events for MainEventsStrip
export const MOCK_FEATURED_EVENTS: FeaturedEvent[] = [
  {
    id: 'evt_barcelona_realmadrid',
    sport_key: 'soccer_spain_la_liga',
    sport_title: 'La Liga',
    commence_time: getPastTime(1),
    home_team: 'Barcelona',
    away_team: 'Real Madrid',
    league: 'La Liga - El Clásico',
    isFeatured: true,
    streamUrl: 'https://example.com/stream',
    liveScore: {
      home: 2,
      away: 1,
      period: '2nd Half',
      time: "67'",
    },
    bestOdds: {
      home: 1.95,
      draw: 3.60,
      away: 3.80,
      bookmaker: 'DraftKings',
    },
  },
  {
    id: 'evt_arsenal_liverpool',
    sport_key: 'soccer_epl',
    sport_title: 'English Premier League',
    commence_time: getFutureTime(2),
    home_team: 'Arsenal',
    away_team: 'Liverpool',
    league: 'Premier League',
    isFeatured: true,
    bestOdds: {
      home: 2.45,
      draw: 3.40,
      away: 2.85,
      bookmaker: 'DraftKings',
    },
  },
  {
    id: 'evt_lakers_warriors',
    sport_key: 'basketball_nba',
    sport_title: 'NBA',
    commence_time: getFutureTime(8),
    home_team: 'Los Angeles Lakers',
    away_team: 'Golden State Warriors',
    league: 'NBA',
    isFeatured: true,
    bestOdds: {
      home: 1.85,
      away: 1.95,
      bookmaker: 'FanDuel',
    },
  },
  {
    id: 'evt_djokovic_nadal',
    sport_key: 'tennis_atp',
    sport_title: 'ATP Tour',
    commence_time: getFutureTime(6),
    home_team: 'Novak Djokovic',
    away_team: 'Rafael Nadal',
    league: 'ATP Australian Open',
    isFeatured: true,
    bestOdds: {
      home: 1.55,
      away: 2.35,
      bookmaker: 'FanDuel',
    },
  },
  {
    id: 'evt_heat_knicks_live',
    sport_key: 'basketball_nba',
    sport_title: 'NBA',
    commence_time: getPastTime(1.5),
    home_team: 'Miami Heat',
    away_team: 'New York Knicks',
    league: 'NBA',
    isFeatured: true,
    liveScore: {
      home: 78,
      away: 72,
      period: '3rd Quarter',
      time: '4:32',
    },
    bestOdds: {
      home: 1.55,
      away: 2.45,
      bookmaker: 'DraftKings',
    },
  },
];

// Live scores mock data
export const MOCK_LIVE_SCORES: LiveScore[] = [
  {
    id: 'evt_barcelona_realmadrid',
    sport_key: 'soccer_spain_la_liga',
    sport_title: 'La Liga',
    commence_time: getPastTime(1),
    completed: false,
    home_team: 'Barcelona',
    away_team: 'Real Madrid',
    scores: [
      { name: 'Barcelona', score: '2' },
      { name: 'Real Madrid', score: '1' },
    ],
    last_update: new Date().toISOString(),
  },
  {
    id: 'evt_heat_knicks_live',
    sport_key: 'basketball_nba',
    sport_title: 'NBA',
    commence_time: getPastTime(1.5),
    completed: false,
    home_team: 'Miami Heat',
    away_team: 'New York Knicks',
    scores: [
      { name: 'Miami Heat', score: '78' },
      { name: 'New York Knicks', score: '72' },
    ],
    last_update: new Date().toISOString(),
  },
];

// Sport categories with icons
export const SPORT_CATEGORIES = [
  { key: 'soccer', label: 'Soccer', icon: '⚽' },
  { key: 'basketball', label: 'Basketball', icon: '🏀' },
  { key: 'cricket', label: 'Cricket', icon: '🏏' },
  { key: 'tennis', label: 'Tennis', icon: '🎾' },
  { key: 'mma', label: 'MMA', icon: '🥊' },
  { key: 'baseball', label: 'Baseball', icon: '⚾' },
];

// Helper to get events by sport group
export function getEventsBySport(sportGroup: string): SportEvent[] {
  return MOCK_EVENTS.filter((event) =>
    event.sport_key.toLowerCase().includes(sportGroup.toLowerCase())
  );
}

// Helper to get live events
export function getLiveEvents(): SportEvent[] {
  const now = new Date();
  return MOCK_EVENTS.filter((event) => {
    const startTime = new Date(event.commence_time);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    return startTime <= now && startTime >= threeHoursAgo && !event.completed;
  });
}

// Helper to get upcoming events
export function getUpcomingEvents(): SportEvent[] {
  const now = new Date();
  return MOCK_EVENTS.filter((event) => {
    const startTime = new Date(event.commence_time);
    return startTime > now;
  });
}
