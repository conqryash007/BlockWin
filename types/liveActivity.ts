// Live Player Activity Type Definitions

export interface LivePlayerActivity {
  id: string;
  username: string;        // e.g., "Hidden", "Whale***", "Lucky_Gamer"
  game: string;            // e.g., "Dice", "Crash", "Arsenal vs Liverpool"
  gameType: 'casino' | 'sports';
  betAmount: number;
  multiplier: number;
  payout: number;
  isWin: boolean;
  timestamp: number;
}

export type LiveActivityFilter = 'all' | 'casino' | 'sports';
