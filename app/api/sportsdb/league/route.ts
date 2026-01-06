import { NextRequest, NextResponse } from 'next/server';

// TheSportsDB v1 API with free key
const SPORTSDB_API_KEY = '123';
const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}`;

// Cache control: 30 days
const CACHE_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * GET /api/sportsdb/league?name=LeagueName
 * 
 * Proxy endpoint to search for league data from TheSportsDB v1 API
 * Avoids CORS issues by making server-side requests
 * 
 * v1 Endpoint: /api/v1/json/{key}/search_all_leagues.php?l={league_name}
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const leagueName = searchParams.get('name');

  if (!leagueName) {
    return NextResponse.json(
      { error: 'Missing required parameter: name' },
      { status: 400 }
    );
  }

  try {
    // v1 API uses search_all_leagues.php with l parameter for league name search
    // Or we can try searching all leagues by sport and filter
    const encodedName = encodeURIComponent(leagueName);
    
    // First try direct league search
    const response = await fetch(
      `${SPORTSDB_BASE}/search_all_leagues.php?l=${encodedName}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: CACHE_MAX_AGE },
      }
    );

    if (!response.ok) {
      console.warn(`[SportsDB Proxy] API error: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch league data' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // v1 API returns leagues in "countries" array (confusingly named)
    const leagues = data.countries || data.leagues;
    
    if (!leagues || leagues.length === 0) {
      return NextResponse.json({ league: null });
    }

    // Get first league result
    const league = leagues[0];

    // v1 API uses strBadge, strLogo, strFanart1 for leagues too
    const result = {
      league: {
        id: league.idLeague,
        name: league.strLeague,
        sport: league.strSport,
        badge: league.strBadge ? `${league.strBadge}/small` : null,
        fanart: league.strFanart1 ? `${league.strFanart1}/small` : null,
        logo: league.strLogo ? `${league.strLogo}/small` : null,
        banner: league.strBanner ? `${league.strBanner}/small` : null,
      },
    };

    return NextResponse.json(result, {
      headers: {
        // Disable CDN-level caching to prevent Netlify from caching wrong data
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
