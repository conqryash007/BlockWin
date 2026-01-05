// Odds Utility Functions

import { OddsFormat } from '@/types/sports';

/**
 * Convert decimal odds to American odds
 * Decimal 2.0 = American +100
 * Decimal 1.5 = American -200
 */
export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2.0) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}

/**
 * Convert American odds to decimal odds
 */
export function americanToDecimal(american: number): number {
  if (american > 0) {
    return Number(((american / 100) + 1).toFixed(2));
  } else {
    return Number(((-100 / american) + 1).toFixed(2));
  }
}

/**
 * Calculate implied probability from decimal odds
 * Returns percentage (0-100)
 */
export function calculateImpliedProbability(decimal: number): number {
  if (decimal <= 0) return 0;
  return Number(((1 / decimal) * 100).toFixed(1));
}

/**
 * Calculate combined parlay odds from multiple decimal odds
 */
export function calculateParlayOdds(selections: number[]): number {
  if (selections.length === 0) return 0;
  return Number(selections.reduce((acc, odds) => acc * odds, 1).toFixed(2));
}

/**
 * Calculate potential return for a single bet
 */
export function calculatePotentialReturn(stake: number, odds: number): number {
  return Number((stake * odds).toFixed(2));
}

/**
 * Calculate potential return for a parlay bet
 */
export function calculateParlayReturn(stake: number, odds: number[]): number {
  const combinedOdds = calculateParlayOdds(odds);
  return calculatePotentialReturn(stake, combinedOdds);
}

/**
 * Format odds for display based on user preference
 */
export function formatOdds(odds: number, format: OddsFormat): string {
  if (format === 'american') {
    const american = decimalToAmerican(odds);
    return american > 0 ? `+${american}` : `${american}`;
  }
  return odds.toFixed(2);
}

/**
 * Format odds with both formats for display
 */
export function formatOddsBoth(odds: number): { decimal: string; american: string } {
  return {
    decimal: odds.toFixed(2),
    american: formatOdds(odds, 'american'),
  };
}

/**
 * Determine if odds went up or down
 */
export function getOddsChange(current: number, previous: number): 'up' | 'down' | 'none' {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'none';
}

/**
 * Format time for event display
 */
export function formatEventTime(commence_time: string): string {
  const date = new Date(commence_time);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (isToday) {
    return `Today ${timeStr}`;
  } else if (isTomorrow) {
    return `Tomorrow ${timeStr}`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}

/**
 * Check if event is currently live
 */
export function isEventLive(commence_time: string, completed?: boolean): boolean {
  if (completed) return false;
  const now = new Date();
  const start = new Date(commence_time);
  // Consider event live if it started within the last 3 hours
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return start <= now && start >= threeHoursAgo;
}

/**
 * Get best odds from bookmakers for H2H market
 */
export function getBestH2HOdds(bookmakers: { markets: { key: string; outcomes: { name: string; price: number }[] }[] }[]): {
  home?: number;
  draw?: number;
  away?: number;
  bookmaker?: string;
} {
  let bestHome = 0;
  let bestDraw = 0;
  let bestAway = 0;
  let bestBookmaker = '';

  bookmakers?.forEach((bookmaker) => {
    const h2hMarket = bookmaker.markets?.find((m) => m.key === 'h2h');
    if (h2hMarket) {
      h2hMarket.outcomes.forEach((outcome, index) => {
        if (index === 0 && outcome.price > bestHome) {
          bestHome = outcome.price;
          bestBookmaker = (bookmaker as any).title || '';
        } else if (index === 1) {
          // Could be draw or away depending on sport
          if (h2hMarket.outcomes.length === 3 && outcome.price > bestDraw) {
            bestDraw = outcome.price;
          } else if (h2hMarket.outcomes.length === 2 && outcome.price > bestAway) {
            bestAway = outcome.price;
          }
        } else if (index === 2 && outcome.price > bestAway) {
          bestAway = outcome.price;
        }
      });
    }
  });

  return {
    home: bestHome || undefined,
    draw: bestDraw || undefined,
    away: bestAway || undefined,
    bookmaker: bestBookmaker,
  };
}
