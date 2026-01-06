// Dashboard Type Definitions

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  secondaryCta?: string | null;
  image: string;
  eventId?: string | null;
  streamUrl?: string | null;
  color: string;
}

export interface TeamInfo {
  name: string;
  score?: number | null;
}

export interface FeaturedGame {
  eventId: string;
  league: string;
  leagueIcon: string;
  home: TeamInfo;
  away: TeamInfo;
  startTime: string;
  status: 'live' | 'upcoming' | 'finished';
  period?: string | null;
  odds: {
    home: number;
    draw?: number;
    away: number;
  };
  sparkline?: number[];
}

export interface QuickCta {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  image: string;
  badge?: string;
}

export interface QuickBet {
  id: string;
  eventId: string;
  teams: string;
  market: string;
  selection: string;
  odds: number;
  isLive: boolean;
  time: string;
}

export interface UserInsights {
  todayBets: number;
  winRate: number;
  estReturn: number;
  profitLoss: number;
}

export interface TrendingLeague {
  id: string;
  name: string;
  icon: string;
  eventCount: number;
}

export interface WalletBalance {
  available: number;
  inPlay: number;
  currency: string;
  symbol: string;
}

export interface DashboardData {
  heroSlides: HeroSlide[];
  featuredGames: FeaturedGame[];
  quickCtas: QuickCta[];
  quickBets: QuickBet[];
  insights: UserInsights;
  trendingLeagues: TrendingLeague[];
  walletBalance: WalletBalance;
}
