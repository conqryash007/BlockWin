import { NextRequest, NextResponse } from 'next/server';

// TheSportsDB v1 API with free key
const SPORTSDB_API_KEY = '123';
const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}`;

// Cache control: 30 days
const CACHE_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * GET /api/sportsdb/team?name=TeamName
 * 
 * Proxy endpoint to search for team data from TheSportsDB v1 API
 * Avoids CORS issues by making server-side requests
 * 
 * v1 Endpoint: /api/v1/json/{key}/searchteams.php?t={team_name}
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const teamName = searchParams.get('name');

  if (!teamName) {
    return NextResponse.json(
      { error: 'Missing required parameter: name' },
      { status: 400 }
    );
  }

  try {
    // TheSportsDB API works better with lowercase names
    const encodedName = encodeURIComponent(teamName.toLowerCase());
    
    const response = await fetch(
      `${SPORTSDB_BASE}/searchteams.php?t=${encodedName}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        // Disable cache for now to get fresh results
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.warn(`[SportsDB Proxy] API error: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch team data' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.teams || data.teams.length === 0) {
      return NextResponse.json({ team: null });
    }

    // Get first team result
    const team = data.teams[0];

    // v1 API returns strBadge, strLogo, strFanart1 (NOT strTeamBadge)
    // Return optimized image data with /small suffix for faster loading
    const result = {
      team: {
        id: team.idTeam,
        name: team.strTeam,
        badge: team.strBadge ? `${team.strBadge}/small` : null,
        badgeFull: team.strBadge || null,
        logo: team.strLogo ? `${team.strLogo}/small` : null,
        fanart: team.strFanart1 ? `${team.strFanart1}/small` : null,
      },
    };

    return NextResponse.json(result, {
      headers: {
        // Disable CDN-level caching to prevent Netlify from caching wrong team data
        // Client-side localStorage cache will handle repeat requests
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Netlify-CDN-Cache-Control': 'no-store',
        'CDN-Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[SportsDB Proxy] Request failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
