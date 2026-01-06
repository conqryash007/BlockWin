import { NextRequest, NextResponse } from 'next/server';

// TheSportsDB v1 API with free key
const SPORTSDB_API_KEY = '123';
const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}`;

/**
 * GET /api/sportsdb/player?name=PlayerName
 * 
 * Proxy endpoint to search for player data from TheSportsDB v1 API
 * Used for individual sports like tennis, boxing, MMA
 * 
 * v1 Endpoint: /api/v1/json/{key}/searchplayers.php?p={player_name}
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const playerName = searchParams.get('name');

  if (!playerName) {
    return NextResponse.json(
      { error: 'Missing required parameter: name' },
      { status: 400 }
    );
  }

  try {
    // TheSportsDB API works better with lowercase/underscore format
    const formattedName = playerName.toLowerCase().replace(/\s+/g, '_');
    
    const response = await fetch(
      `${SPORTSDB_BASE}/searchplayers.php?p=${formattedName}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.warn(`[SportsDB Proxy] Player API error: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch player data' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.player || data.player.length === 0) {
      return NextResponse.json({ player: null });
    }

    // Get first player result
    const player = data.player[0];

    // Player API returns strCutout, strThumb, strRender for images
    const result = {
      player: {
        id: player.idPlayer,
        name: player.strPlayer,
        team: player.strTeam,
        sport: player.strSport,
        // Player images
        cutout: player.strCutout ? `${player.strCutout}/small` : null,
        thumb: player.strThumb ? `${player.strThumb}/small` : null,
        render: player.strRender ? `${player.strRender}/small` : null,
        fanart: player.strFanart1 ? `${player.strFanart1}/small` : null,
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
    console.error('[SportsDB Proxy] Player request failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
