// ScoreBat Video API Service - Free Plan
// Provides football video highlights and live streams
// Note: Free plan includes ScoreBat branding and ads

const SCOREBAT_BASE_URL = 'https://www.scorebat.com/video-api/v3';

// Types for ScoreBat API responses
export interface ScorebatVideo {
  id: string;
  title: string;
  embed: string;
}

export interface ScorebatMatch {
  title: string;
  competition: string;
  matchviewUrl: string;
  competitionUrl: string;
  thumbnail: string;
  date: string;
  videos: ScorebatVideo[];
}

export interface ScorebatFeedResponse {
  response: ScorebatMatch[];
  warning?: string;
}

export interface ScorebatApiResponse<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

// Competition slug mapping for popular leagues
export const COMPETITION_SLUGS: Record<string, string> = {
  'england-premier-league': 'england-premier-league',
  'spain-la-liga': 'spain-la-liga',
  'germany-bundesliga': 'germany-bundesliga',
  'italy-serie-a': 'italy-serie-a',
  'france-ligue-1': 'france-ligue-1',
  'uefa-champions-league': 'uefa-champions-league',
  'uefa-europa-league': 'uefa-europa-league',
};

// Popular team slugs for direct lookup
export const TEAM_SLUGS: Record<string, string> = {
  'Arsenal': 'arsenal',
  'Chelsea': 'chelsea',
  'Liverpool': 'liverpool',
  'Manchester United': 'manchester-united',
  'Manchester City': 'manchester-city',
  'Tottenham': 'tottenham',
  'Real Madrid': 'real-madrid',
  'Barcelona': 'barcelona',
  'Bayern Munich': 'bayern-munich',
  'Juventus': 'juventus',
  'AC Milan': 'ac-milan',
  'Inter Milan': 'inter-milan',
  'PSG': 'paris-sg',
};

/**
 * Fetch the free video feed from ScoreBat
 * This endpoint returns recent match highlights without requiring authentication
 * Note: Response includes ScoreBat branding and may show deprecated warning
 */
export async function fetchFreeVideoFeed(): Promise<ScorebatApiResponse<ScorebatMatch[]>> {
  try {
    const response = await fetch(`${SCOREBAT_BASE_URL}/`);
    
    if (!response.ok) {
      return {
        data: null,
        error: `Failed to fetch videos: ${response.status}`,
        isLoading: false,
      };
    }

    const data: ScorebatFeedResponse = await response.json();
    
    return {
      data: data.response || [],
      error: null,
      isLoading: false,
    };
  } catch (error) {
    console.error('ScoreBat API error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch videos',
      isLoading: false,
    };
  }
}

/**
 * Extract the iframe src URL from embed HTML
 * ScoreBat returns embed code as HTML string, this extracts the clean URL
 */
export function extractIframeSrc(embedHtml: string): string | null {
  const match = embedHtml.match(/src='([^']+)'/);
  return match ? match[1].replace(/\\\//g, '/') : null;
}

/**
 * Normalize team name for matching
 * Handles common variations in team naming
 */
export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/fc\s*/gi, '')
    .replace(/\s*(fc|sc|cf|afc)$/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two team names match (strict matching)
 * Requires good similarity to avoid false positives like "Real Madrid" vs "Real Sociedad"
 */
export function teamsMatch(team1: string, team2: string): boolean {
  const norm1 = normalizeTeamName(team1);
  const norm2 = normalizeTeamName(team2);
  
  // Exact match after normalization
  if (norm1 === norm2) return true;
  
  // Check if the names are very similar (one is contained in the other AND length is similar)
  // This prevents "Real Madrid" from matching "Real Sociedad"
  if (norm1.includes(norm2)) {
    // The contained name must be at least 70% of the length
    if (norm2.length / norm1.length >= 0.7) return true;
  }
  if (norm2.includes(norm1)) {
    if (norm1.length / norm2.length >= 0.7) return true;
  }
  
  // Split into words and check key word matching
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  
  // For teams with multiple words, check if the distinctive word matches
  // "Real Madrid" -> distinctive word is "madrid"
  // "Real Sociedad" -> distinctive word is "sociedad"
  if (words1.length >= 2 && words2.length >= 2) {
    // Find the most distinctive word (usually NOT "real", "fc", "united", "city")
    const commonWords = ['real', 'united', 'city', 'sporting', 'atletico', 'athletic', 'inter', 'dynamo'];
    const distinctive1 = words1.find(w => !commonWords.includes(w) && w.length > 3) || words1[words1.length - 1];
    const distinctive2 = words2.find(w => !commonWords.includes(w) && w.length > 3) || words2[words2.length - 1];
    
    if (distinctive1 === distinctive2) return true;
  }
  
  // Single word team names - need high similarity
  if (words1.length === 1 && words2.length === 1) {
    if (words1[0] === words2[0]) return true;
  }
  
  // For mixed (one single, one multi-word), check if the single word appears in the multi-word
  if (words1.length === 1 && words2.includes(words1[0]) && words1[0].length > 4) return true;
  if (words2.length === 1 && words1.includes(words2[0]) && words2[0].length > 4) return true;
  
  return false;
}

/**
 * Find videos for a specific match based on team names
 */
export function findMatchVideos(
  videos: ScorebatMatch[],
  homeTeam: string,
  awayTeam: string
): ScorebatMatch | null {
  for (const match of videos) {
    // ScoreBat title format: "Team1 - Team2"
    const [team1, team2] = match.title.split(' - ').map(t => t.trim());
    
    if (!team1 || !team2) continue;
    
    // Check both orderings (home-away or away-home)
    const matchesHomeAway = teamsMatch(team1, homeTeam) && teamsMatch(team2, awayTeam);
    const matchesAwayHome = teamsMatch(team1, awayTeam) && teamsMatch(team2, homeTeam);
    
    if (matchesHomeAway || matchesAwayHome) {
      return match;
    }
  }
  
  return null;
}

/**
 * Filter videos by competition
 */
export function filterByCompetition(
  videos: ScorebatMatch[],
  competitionFilter: string
): ScorebatMatch[] {
  const normalizedFilter = competitionFilter.toLowerCase();
  
  return videos.filter(match => {
    const normalizedCompetition = match.competition.toLowerCase();
    return normalizedCompetition.includes(normalizedFilter);
  });
}

/**
 * Get video type from title
 * ScoreBat videos can be: Highlights, Goals, Live Stream
 */
export function getVideoType(title: string): 'highlight' | 'goal' | 'live' | 'other' {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('highlight')) return 'highlight';
  if (lowerTitle.includes('goal') || /\d+-\d+/.test(title)) return 'goal';
  if (lowerTitle.includes('live') || lowerTitle.includes('stream')) return 'live';
  
  return 'other';
}

/**
 * Format match date for display
 */
export function formatMatchDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
