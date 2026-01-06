// Live Player Activity Mock Data Generator

import { LivePlayerActivity, LiveActivityFilter } from '@/types/liveActivity';

// Pool of usernames (obscured for privacy feel)
const USERNAMES = [
  'Hidden',
  'Whale***',
  'Lucky_777',
  'Crypto_King',
  'Sato***',
  'BigBet_Pro',
  'Moon_Boy',
  'Diamond***',
  'Anon_User',
  'High_Roller',
  'BetMaster',
  'Gold_Rush',
  'Ace_Player',
  'Wolf_Pack',
  'Lion_Heart',
  'Fast_Eddie',
  'Risk_Taker',
  'Jackpot_Joe',
  'Lucky_Star',
  'Win_Streak',
];

// Casino games
const CASINO_GAMES = [
  { name: 'Dice', icon: '🎲' },
  { name: 'Crash', icon: '📈' },
  { name: 'Plinko', icon: '⚡' },
  { name: 'Mines', icon: '💣' },
  { name: 'Blackjack', icon: '🃏' },
  { name: 'Roulette', icon: '🎰' },
];

// Sports events
const SPORTS_EVENTS = [
  { name: 'Arsenal vs Liverpool', icon: '⚽' },
  { name: 'Lakers vs Warriors', icon: '🏀' },
  { name: 'MI vs CSK', icon: '🏏' },
  { name: 'Barcelona vs Real Madrid', icon: '⚽' },
  { name: 'Djokovic vs Alcaraz', icon: '🎾' },
  { name: 'McGregor vs Poirier', icon: '🥊' },
  { name: 'Man City vs Chelsea', icon: '⚽' },
  { name: 'Celtics vs Bucks', icon: '🏀' },
  { name: 'RCB vs KKR', icon: '🏏' },
  { name: 'Federer vs Nadal', icon: '🎾' },
];

// Bet amount ranges (in USD equivalent)
const BET_AMOUNTS = [0.01, 0.05, 0.10, 0.25, 0.50, 1.00, 2.50, 5.00, 10.00, 25.00, 50.00, 100.00, 250.00, 500.00];

// Multiplier ranges for wins
const WIN_MULTIPLIERS = {
  casino: [1.2, 1.5, 1.8, 2.0, 2.5, 3.0, 4.0, 5.0, 8.0, 10.0, 15.0, 25.0, 50.0],
  sports: [1.3, 1.5, 1.65, 1.80, 2.0, 2.25, 2.50, 2.80, 3.20, 4.0, 5.5, 8.0],
};

// Helper to generate random ID
function generateId(): string {
  return `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to get random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate a single random activity
export function generateRandomActivity(filter: LiveActivityFilter = 'all'): LivePlayerActivity {
  // Determine game type based on filter
  let gameType: 'casino' | 'sports';
  if (filter === 'all') {
    gameType = Math.random() > 0.4 ? 'casino' : 'sports'; // Slightly favor casino
  } else {
    gameType = filter;
  }

  // Select game
  const gamePool = gameType === 'casino' ? CASINO_GAMES : SPORTS_EVENTS;
  const selectedGame = randomItem(gamePool);

  // Bet amount
  const betAmount = randomItem(BET_AMOUNTS);

  // Win probability: casino ~48%, sports ~45%
  const winProbability = gameType === 'casino' ? 0.48 : 0.45;
  const isWin = Math.random() < winProbability;

  // Multiplier and payout
  let multiplier: number;
  let payout: number;

  if (isWin) {
    multiplier = randomItem(WIN_MULTIPLIERS[gameType]);
    // Occasionally generate big wins
    if (Math.random() < 0.05) {
      multiplier = multiplier * (2 + Math.random() * 3); // 2x-5x bigger
    }
    payout = betAmount * multiplier;
  } else {
    multiplier = 0;
    payout = 0;
  }

  return {
    id: generateId(),
    username: randomItem(USERNAMES),
    game: selectedGame.name,
    gameType,
    betAmount,
    multiplier: Math.round(multiplier * 100) / 100,
    payout: Math.round(payout * 100) / 100,
    isWin,
    timestamp: Date.now(),
  };
}

// Generate initial batch of activities
export function generateInitialActivities(count: number = 8, filter: LiveActivityFilter = 'all'): LivePlayerActivity[] {
  const activities: LivePlayerActivity[] = [];
  for (let i = 0; i < count; i++) {
    const activity = generateRandomActivity(filter);
    // Stagger timestamps for initial batch
    activity.timestamp = Date.now() - (count - i) * 2000;
    activities.push(activity);
  }
  return activities;
}

// Get random delay for next update (irregular intervals: 1-4 seconds)
export function getRandomDelay(): number {
  return 1000 + Math.random() * 3000; // 1000-4000ms
}
