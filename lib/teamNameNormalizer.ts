// Team Name Normalizer
// Normalizes team names for consistent API matching

/**
 * Common team name aliases
 * Maps shortened/alternate names to official names
 */
const TEAM_ALIASES: Record<string, string> = {
  // English Premier League
  'man u': 'Manchester United',
  'man utd': 'Manchester United',
  'man united': 'Manchester United',
  'mufc': 'Manchester United',
  'man c': 'Manchester City',
  'man city': 'Manchester City',
  'mcfc': 'Manchester City',
  'spurs': 'Tottenham Hotspur',
  'tottenham': 'Tottenham Hotspur',
  'wolves': 'Wolverhampton Wanderers',
  'brighton': 'Brighton and Hove Albion',
  'newcastle': 'Newcastle United',
  'west ham': 'West Ham United',
  'palace': 'Crystal Palace',
  'villa': 'Aston Villa',
  
  // La Liga
  'barca': 'Barcelona',
  'real': 'Real Madrid',
  'atletico': 'Atletico Madrid',
  'atleti': 'Atletico Madrid',
  
  // NBA
  'la lakers': 'Los Angeles Lakers',
  'lakers': 'Los Angeles Lakers',
  'la clippers': 'Los Angeles Clippers',
  'clippers': 'Los Angeles Clippers',
  'gsw': 'Golden State Warriors',
  'warriors': 'Golden State Warriors',
  'celtics': 'Boston Celtics',
  'bucks': 'Milwaukee Bucks',
  'heat': 'Miami Heat',
  'knicks': 'New York Knicks',
  'nets': 'Brooklyn Nets',
  'sixers': 'Philadelphia 76ers',
  '76ers': 'Philadelphia 76ers',
  'bulls': 'Chicago Bulls',
  'cavs': 'Cleveland Cavaliers',
  'mavs': 'Dallas Mavericks',
  
  // IPL
  'csk': 'Chennai Super Kings',
  'mi': 'Mumbai Indians',
  'rcb': 'Royal Challengers Bangalore',
  'kkr': 'Kolkata Knight Riders',
  'dc': 'Delhi Capitals',
  'srh': 'Sunrisers Hyderabad',
  'pbks': 'Punjab Kings',
  'rr': 'Rajasthan Royals',
  'gt': 'Gujarat Titans',
  'lsg': 'Lucknow Super Giants',
  
  // Tennis - handle player names
  'djoko': 'Novak Djokovic',
  'rafa': 'Rafael Nadal',
  'federer': 'Roger Federer',
  
  // UFC
  'bones': 'Jon Jones',
};

/**
 * Normalize a team name for caching and comparison
 * - Lowercase
 * - Trim whitespace
 * - Remove special punctuation
 * - Replace common aliases
 */
export function normalizeTeamName(name: string): string {
  if (!name) return '';
  
  let normalized = name
    .toLowerCase()
    .trim()
    .replace(/['']/g, "'") // Normalize apostrophes
    .replace(/[""]/g, '"') // Normalize quotes
    .replace(/[^\w\s'-]/g, '') // Remove special chars except alphanumeric, spaces, hyphens, apostrophes
    .replace(/\s+/g, ' '); // Collapse multiple spaces
  
  // Check for alias replacement
  const alias = TEAM_ALIASES[normalized];
  if (alias) {
    normalized = alias.toLowerCase();
  }
  
  return normalized;
}

/**
 * Get the display-ready alias for a team name
 * Returns the original name if no alias exists
 */
export function getTeamAlias(name: string): string {
  const normalized = name.toLowerCase().trim();
  return TEAM_ALIASES[normalized] || name;
}

/**
 * Calculate similarity score between two strings (0-1)
 * Uses Levenshtein distance normalized by max length
 */
function similarityScore(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Simple containment check first
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }
  
  // Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);
  
  return 1 - distance / maxLength;
}

/**
 * Find the best matching name from a list of candidates
 * Returns null if no good match found (threshold < 0.5)
 */
export function findBestMatch(
  target: string, 
  candidates: string[],
  threshold: number = 0.5
): string | null {
  if (!candidates || candidates.length === 0) return null;
  
  const normalizedTarget = normalizeTeamName(target);
  
  // First, try exact match
  const exactMatch = candidates.find(
    c => normalizeTeamName(c) === normalizedTarget
  );
  if (exactMatch) return exactMatch;
  
  // Calculate similarity scores
  let bestMatch: string | null = null;
  let bestScore = threshold;
  
  for (const candidate of candidates) {
    const score = similarityScore(normalizedTarget, normalizeTeamName(candidate));
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }
  
  return bestMatch;
}

/**
 * Extract sport name from sport_key
 * e.g., 'soccer_epl' -> 'Soccer', 'basketball_nba' -> 'Basketball'
 */
export function extractSportName(sportKey: string): string {
  if (!sportKey) return 'Sport';
  
  const sportMap: Record<string, string> = {
    soccer: 'Soccer',
    basketball: 'Basketball',
    cricket: 'Cricket',
    tennis: 'Tennis',
    mma: 'MMA',
    baseball: 'Baseball',
    americanfootball: 'American Football',
    icehockey: 'Ice Hockey',
    golf: 'Golf',
    boxing: 'Boxing',
  };
  
  const prefix = sportKey.split('_')[0].toLowerCase();
  return sportMap[prefix] || prefix.charAt(0).toUpperCase() + prefix.slice(1);
}
