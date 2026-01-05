// TheSportsDB API Service
// Uses local API proxy to avoid CORS issues
// Images served with optimized sizes from r2.thesportsdb.com CDN

import { getCachedImage, setCachedImage } from './imageCache';
import { normalizeTeamName, findBestMatch } from './teamNameNormalizer';

// Use local proxy instead of direct API calls
const TEAM_API_PROXY = '/api/sportsdb/team';
const PLAYER_API_PROXY = '/api/sportsdb/player';
const LEAGUE_API_PROXY = '/api/sportsdb/league';

// Rate limiting state (for client-side throttling)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 500ms between requests
const requestQueue: Array<() => void> = [];
let isProcessingQueue = false;

export interface TheSportsDbTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort?: string;
  strTeamBadge: string | null;
  strTeamLogo: string | null;
  strTeamFanart1: string | null;
  strTeamFanart2?: string | null;
  strTeamFanart3?: string | null;
  strTeamFanart4?: string | null;
  strSport?: string;
  strLeague?: string;
}

export interface TheSportsDbLeague {
  idLeague: string;
  strLeague: string;
  strSport?: string;
  strLeagueBadge: string | null;
  strLeagueFanart1: string | null;
  strLeagueFanart2?: string | null;
  strLeagueFanart3?: string | null;
  strLeagueFanart4?: string | null;
  strLeaguePoster?: string | null;
  strLeagueLogo?: string | null;
}

export interface TeamImageData {
  badge: string | null;
  logo: string | null;
  fanart: string | null;
}

export interface LeagueImageData {
  badge: string | null;
  fanart: string | null;
  logo: string | null;
}

interface ProxyTeamResponse {
  team: {
    id: string;
    name: string;
    badge: string | null;
    badgeFull: string | null;
    logo: string | null;
    fanart: string | null;
  } | null;
  error?: string;
}

interface ProxyLeagueResponse {
  league: {
    id: string;
    name: string;
    sport?: string;
    badge: string | null;
    fanart: string | null;
    logo: string | null;
    banner?: string | null;
  } | null;
  error?: string;
}

interface ProxyPlayerResponse {
  player: {
    id: string;
    name: string;
    team?: string;
    sport?: string;
    cutout: string | null;
    thumb: string | null;
    render: string | null;
    fanart: string | null;
  } | null;
  error?: string;
}

/**
 * Process the request queue with rate limiting
 */
async function processQueue(): Promise<void> {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => 
        setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }
    
    const request = requestQueue.shift();
    if (request) {
      lastRequestTime = Date.now();
      request();
    }
  }
  
  isProcessingQueue = false;
}

/**
 * Enqueue a request with rate limiting
 */
function enqueueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    processQueue();
  });
}

/**
 * Search for a team by name using local proxy
 * Falls back to player search for individual sports (tennis, boxing, MMA, etc.)
 */
export async function searchTeam(teamName: string): Promise<TeamImageData | null> {
  const normalizedName = normalizeTeamName(teamName);
  const cacheKey = `team_${normalizedName}`;
  
  // Check cache first
  const cached = getCachedImage(cacheKey);
  if (cached) {
    return cached as TeamImageData;
  }
  
  // Make rate-limited request to local proxy
  const result = await enqueueRequest(async () => {
    try {
      const encoded = encodeURIComponent(teamName);
      
      // Try team search first
      const teamResponse = await fetch(`${TEAM_API_PROXY}?name=${encoded}`);
      
      if (teamResponse.ok) {
        const teamData: ProxyTeamResponse = await teamResponse.json();
        
        // If team found with images, use it
        if (teamData.team && (teamData.team.badge || teamData.team.logo)) {
          const imageData: TeamImageData = {
            badge: teamData.team.badge,
            logo: teamData.team.logo,
            fanart: teamData.team.fanart,
          };
          setCachedImage(cacheKey, imageData);
          return imageData;
        }
      }
      
      // If no team found or no images, try player search
      // This handles individual sports like tennis, boxing, MMA
      const playerResponse = await fetch(`${PLAYER_API_PROXY}?name=${encoded}`);
      
      if (playerResponse.ok) {
        const playerData: ProxyPlayerResponse = await playerResponse.json();
        
        if (playerData.player && (playerData.player.cutout || playerData.player.thumb)) {
          // Use player images as team images
          const imageData: TeamImageData = {
            badge: playerData.player.cutout || playerData.player.thumb,
            logo: playerData.player.render || playerData.player.thumb,
            fanart: playerData.player.fanart,
          };
          setCachedImage(cacheKey, imageData);
          return imageData;
        }
      }
      
      // Nothing found
      return null;
    } catch (error) {
      console.warn('[TheSportsDB] Request failed:', error);
      return null;
    }
  });
  
  return result;
}

/**
 * Lookup team by ID - uses search as fallback since v1 API
 */
export async function lookupTeam(teamId: string): Promise<TeamImageData | null> {
  // For now, this is a passthrough - the ID lookup would need a separate endpoint
  // Most use cases will use searchTeam instead
  const cacheKey = `team_id_${teamId}`;
  
  const cached = getCachedImage(cacheKey);
  if (cached) {
    return cached as TeamImageData;
  }
  
  return null;
}

/**
 * Search for a league by name using local proxy
 */
export async function searchLeague(leagueName: string): Promise<LeagueImageData | null> {
  const cacheKey = `league_${normalizeTeamName(leagueName)}`;
  
  // Check cache first
  const cached = getCachedImage(cacheKey);
  if (cached) {
    return cached as LeagueImageData;
  }
  
  const result = await enqueueRequest(async () => {
    try {
      const encoded = encodeURIComponent(leagueName);
      const response = await fetch(`${LEAGUE_API_PROXY}?name=${encoded}`);
      
      if (!response.ok) {
        console.warn(`[TheSportsDB] Proxy error: ${response.status}`);
        return null;
      }
      
      const data: ProxyLeagueResponse = await response.json();
      
      if (!data.league) {
        return null;
      }
      
      const leagueData: LeagueImageData = {
        badge: data.league.badge,
        fanart: data.league.fanart,
        logo: data.league.logo,
      };
      
      setCachedImage(cacheKey, leagueData);
      return leagueData;
    } catch (error) {
      console.warn('[TheSportsDB] Request failed:', error);
      return null;
    }
  });
  
  return result;
}

/**
 * Get league image data by league name
 * Uses the league name directly to search
 */
export async function getLeagueImages(
  leagueName: string, 
  _sportName: string // Kept for backwards compatibility
): Promise<LeagueImageData | null> {
  return searchLeague(leagueName);
}

/**
 * Batch fetch team images for multiple teams
 */
export async function batchFetchTeamImages(
  teamNames: string[]
): Promise<Map<string, TeamImageData | null>> {
  const results = new Map<string, TeamImageData | null>();
  
  // Filter out teams already in cache
  const uncachedTeams: string[] = [];
  for (const name of teamNames) {
    const cacheKey = `team_${normalizeTeamName(name)}`;
    const cached = getCachedImage(cacheKey);
    if (cached) {
      results.set(name, cached as TeamImageData);
    } else {
      uncachedTeams.push(name);
    }
  }
  
  // Fetch uncached teams (rate limited)
  for (const name of uncachedTeams) {
    const imageData = await searchTeam(name);
    results.set(name, imageData);
  }
  
  return results;
}
