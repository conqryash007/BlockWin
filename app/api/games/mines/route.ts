/**
 * Mines Game API Route
 * POST /api/games/mines
 * 
 * Server-side mines game with provably fair mine placement
 * Supports: start, reveal, cashout actions
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromToken,
  getHouseEdge,
  getBalance,
  updateBalance,
  generateProvablyFairRandom,
  generateServerSeed,
  getNextNonce,
  checkRateLimit,
  validateBetAmount,
} from '@/lib/game-utils';
import { supabaseAdmin } from '@/lib/supabase-admin';

const GAME_SLUG = 'mines';
const TOTAL_TILES = 25; // 5x5 grid

interface MinesRequest {
  action: 'start' | 'reveal' | 'cashout';
  betAmount?: number;
  mineCount?: number;
  tileIndex?: number;
  gameSessionId?: string;
  clientSeed?: string;
}

// Calculate multiplier based on tiles revealed and mine count
// NOTE: House edge is NOT applied to payout calculation
// Maximum multiplier capped at 5x
const MAX_MULTIPLIER = 5;

function calculateMultiplier(revealed: number, mineCount: number): number {
  if (revealed === 0) return 1;

  const safeTiles = TOTAL_TILES - mineCount;
  let multiplier = 1;

  for (let i = 0; i < revealed; i++) {
    const remaining = safeTiles - i;
    const total = TOTAL_TILES - i;
    multiplier *= total / remaining;
  }

  // Cap at maximum multiplier
  return Math.min(multiplier, MAX_MULTIPLIER);
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get('authorization');
    const { userId, error: authError } = await getUserFromToken(authHeader);
    if (authError) {
      return NextResponse.json({ error: authError, success: false }, { status: 401 });
    }

    // 2. Parse request
    const body: MinesRequest = await request.json();
    const { action, clientSeed = 'default' } = body;

    // 3. Get house edge
    const { houseEdge, error: gameError } = await getHouseEdge(GAME_SLUG);
    if (gameError) {
      return NextResponse.json({ error: gameError, success: false }, { status: 400 });
    }

    if (action === 'start') {
      return handleStart(userId, body, houseEdge, clientSeed);
    } else if (action === 'reveal') {
      return handleReveal(userId, body, houseEdge);
    } else if (action === 'cashout') {
      return handleCashout(userId, body, houseEdge);
    } else {
      return NextResponse.json({ error: 'Invalid action', success: false }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Mines game error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error', success: false }, { status: 500 });
  }
}

async function handleStart(
  userId: string,
  body: MinesRequest,
  houseEdge: number,
  clientSeed: string
) {
  const { betAmount, mineCount = 3 } = body;

  if (!betAmount) {
    return NextResponse.json({ error: 'Bet amount required', success: false }, { status: 400 });
  }

  if (mineCount < 1 || mineCount > 24) {
    return NextResponse.json({ error: 'Mine count must be between 1 and 24', success: false }, { status: 400 });
  }

  // Check rate limit
  const { allowed, error: rateLimitError } = await checkRateLimit(userId);
  if (!allowed) {
    return NextResponse.json({ error: rateLimitError, success: false }, { status: 429 });
  }

  // Get balance
  const { balance, error: balanceError } = await getBalance(userId);
  if (balanceError) {
    return NextResponse.json({ error: balanceError, success: false }, { status: 400 });
  }

  // Validate bet
  const { valid, error: betError } = validateBetAmount(betAmount, balance);
  if (!valid) {
    return NextResponse.json({ error: betError, success: false }, { status: 400 });
  }

  // Generate mine positions (provably fair)
  // Always place exactly mineCount mines (house edge affects reveal probability, not count)
  const serverSeed = generateServerSeed();
  const nonce = await getNextNonce(userId, GAME_SLUG);

  // Fisher-Yates shuffle to place mines
  const positions = Array.from({ length: TOTAL_TILES }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const random = generateProvablyFairRandom(serverSeed, clientSeed, nonce * 100 + i);
    const j = Math.floor(random * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  const minePositions = positions.slice(0, mineCount);

  // Deduct bet from balance
  const newBalance = balance - betAmount;
  const { error: updateError } = await updateBalance(userId, newBalance);
  if (updateError) {
    return NextResponse.json({ error: updateError, success: false }, { status: 500 });
  }

  // Create game session (in progress)
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('game_sessions')
    .insert([{
      user_id: userId,
      game_type: GAME_SLUG,
      bet_amount: betAmount,
      bet_fee: 0,
      outcome: {
        minePositions,
        mineCount,
        revealedTiles: [],
        status: 'in_progress',
      },
      payout: 0,
      server_seed: serverSeed,
      client_seed: clientSeed,
      nonce,
    }])
    .select('id')
    .single();

  if (sessionError) {
    return NextResponse.json({ error: 'Failed to start game', success: false }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    gameSessionId: session.id,
    mineCount,
    balance: newBalance,
    houseEdge,
    actualMineCount: mineCount,
    nextMultiplier: calculateMultiplier(1, mineCount),
  });
}

async function handleReveal(
  userId: string,
  body: MinesRequest,
  houseEdge: number
) {
  const { gameSessionId, tileIndex } = body;

  if (!gameSessionId || tileIndex === undefined) {
    return NextResponse.json({ error: 'Game session ID and tile index required', success: false }, { status: 400 });
  }

  if (tileIndex < 0 || tileIndex >= TOTAL_TILES) {
    return NextResponse.json({ error: 'Invalid tile index', success: false }, { status: 400 });
  }

  // Get game session
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('game_sessions')
    .select('*')
    .eq('id', gameSessionId)
    .eq('user_id', userId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Game session not found', success: false }, { status: 400 });
  }

  const outcome = session.outcome as any;
  if (outcome.status !== 'in_progress') {
    return NextResponse.json({ error: 'Game already ended', success: false }, { status: 400 });
  }

  if (outcome.revealedTiles.includes(tileIndex)) {
    return NextResponse.json({ error: 'Tile already revealed', success: false }, { status: 400 });
  }

  // Apply house edge to determine outcome
  // Generate random number to determine if user hits mine based on house edge
  const revealRandom = generateProvablyFairRandom(
    session.server_seed,
    session.client_seed,
    session.nonce * 1000 + outcome.revealedTiles.length
  );

  let hitMine: boolean;
  let actualTileRevealed = tileIndex;

  if (houseEdge >= 1) {
    // 100% house edge: Always hit a mine
    // Find an unrevealed mine position
    const unrevealedMines = outcome.minePositions.filter(
      (pos: number) => !outcome.revealedTiles.includes(pos)
    );

    if (unrevealedMines.length > 0) {
      // Force reveal a mine (preferably the clicked tile if it's a mine)
      if (outcome.minePositions.includes(tileIndex)) {
        actualTileRevealed = tileIndex;
      } else {
        actualTileRevealed = unrevealedMines[0];
      }
      hitMine = true;
    } else {
      // All mines already revealed somehow, treat as safe
      hitMine = false;
    }
  } else if (revealRandom < houseEdge) {
    // House edge probability: Force hit mine
    const unrevealedMines = outcome.minePositions.filter(
      (pos: number) => !outcome.revealedTiles.includes(pos)
    );

    if (unrevealedMines.length > 0) {
      if (outcome.minePositions.includes(tileIndex)) {
        actualTileRevealed = tileIndex;
      } else {
        actualTileRevealed = unrevealedMines[0];
      }
      hitMine = true;
    } else {
      hitMine = false;
    }
  } else {
    // Fair reveal: Check actual tile
    hitMine = outcome.minePositions.includes(tileIndex);
    actualTileRevealed = tileIndex;
  }

  outcome.revealedTiles.push(actualTileRevealed);

  if (hitMine) {
    // Game over - lost
    outcome.status = 'bust';
    
    await supabaseAdmin
      .from('game_sessions')
      .update({
        outcome,
        bet_fee: 0,
        payout: 0,
      })
      .eq('id', gameSessionId);

    // Get current balance
    const { balance } = await getBalance(userId);

    return NextResponse.json({
      success: true,
      hitMine: true,
      revealedTile: actualTileRevealed,
      minePositions: outcome.minePositions,
      payout: 0,
      balance,
    });
  }

  // Safe tile - update session
  const revealed = outcome.revealedTiles.length;
  const actualMineCount = outcome.mineCount;
  const currentMultiplier = calculateMultiplier(revealed, actualMineCount);
  const nextMultiplier = calculateMultiplier(revealed + 1, actualMineCount);
  const potentialPayout = session.bet_amount * currentMultiplier;

  await supabaseAdmin
    .from('game_sessions')
    .update({ outcome })
    .eq('id', gameSessionId);

  return NextResponse.json({
    success: true,
    hitMine: false,
    revealedTile: actualTileRevealed,
    revealedTiles: outcome.revealedTiles,
    currentMultiplier,
    nextMultiplier,
    potentialPayout,
  });
}

async function handleCashout(
  userId: string,
  body: MinesRequest,
  houseEdge: number
) {
  const { gameSessionId } = body;

  if (!gameSessionId) {
    return NextResponse.json({ error: 'Game session ID required', success: false }, { status: 400 });
  }

  // Get game session
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('game_sessions')
    .select('*')
    .eq('id', gameSessionId)
    .eq('user_id', userId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Game session not found', success: false }, { status: 400 });
  }

  const outcome = session.outcome as any;
  if (outcome.status !== 'in_progress') {
    return NextResponse.json({ error: 'Game already ended', success: false }, { status: 400 });
  }

  if (outcome.revealedTiles.length === 0) {
    return NextResponse.json({ error: 'Must reveal at least one tile before cashing out', success: false }, { status: 400 });
  }

  // Calculate payout (house edge NOT applied to multiplier)
  const revealed = outcome.revealedTiles.length;
  const actualMineCount = outcome.mineCount;
  const multiplier = calculateMultiplier(revealed, actualMineCount);
  const payout = session.bet_amount * multiplier;
  const betFee = 0; // No fee deducted from payout

  // Update balance
  const { balance } = await getBalance(userId);
  const newBalance = balance + payout;
  await updateBalance(userId, newBalance);

  // Update session
  outcome.status = 'cashed_out';
  await supabaseAdmin
    .from('game_sessions')
    .update({
      outcome,
      payout,
      bet_fee: betFee,
    })
    .eq('id', gameSessionId);

  return NextResponse.json({
    success: true,
    multiplier,
    payout,
    balance: newBalance,
  });
}
