export const GAMES = [
  {
    id: "dice",
    name: "Dice",
    provider: "Originals",
    category: "originals",
    image: "/images/dice.png",
    rtp: 99.0,
    volatility: "Variable",
  },
  {
    id: "crash",
    name: "Crash",
    provider: "Originals",
    category: "originals",
    image: "/images/crash.png",
    rtp: 99.0,
    volatility: "High",
  },
  {
    id: "plinko",
    name: "Plinko",
    provider: "Originals",
    category: "originals",
    image: "/images/plinko.png",
    rtp: 99.0,
    volatility: "Medium",
  },
  {
    id: "mines",
    name: "Mines",
    provider: "Originals",
    category: "originals",
    image: "/images/mines.png",
    rtp: 99.0,
    volatility: "Variable",
  },
  {
    id: "blackjack",
    name: "Blackjack",
    provider: "Evolution",
    category: "live",
    image: "/images/blackjack.png",
    rtp: 99.5,
    volatility: "Low",
  },
  {
    id: "roulette",
    name: "Roulette",
    provider: "Pragmatic",
    category: "live",
    image: "/images/roulette.png",
    rtp: 97.3,
    volatility: "Medium",
  },
];

export const LIVE_BETS = [
  { user: "Hidden", game: "Dice", bet: 0.05, multiplier: 2.0, payout: 0.10 },
  { user: "MadDog", game: "Crash", bet: 1.20, multiplier: 1.4, payout: 1.68 },
  { user: "Whale123", game: "Plinko", bet: 5.00, multiplier: 0.2, payout: 0 },
  { user: "LuckyGuy", game: "Slots", bet: 0.25, multiplier: 50.0, payout: 12.5 },
  { user: "Satoshi", game: "Blackjack", bet: 0.10, multiplier: 2.0, payout: 0.20 },
];

export const SPORTS_EVENTS = [
  {
    id: "1",
    league: "Premier League",
    home: "Arsenal",
    away: "Liverpool",
    time: "19:00",
    odds: { home: 2.5, draw: 3.4, away: 2.8 },
  },
  {
    id: "2",
    league: "NBA",
    home: "Lakers",
    away: "Warriors",
    time: "21:30",
    odds: { home: 1.8, draw: null, away: 2.05 },
  },
];
