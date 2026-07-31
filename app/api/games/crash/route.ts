/**
 * Crash Game API Route
 * POST /api/games/crash
 *
 * Phases:
 * - "start":   Deduct bet, generate a crash point (max 5X), create session.
 * - "status":  Report the current multiplier, and whether the round has crashed.
 * - "cashout": Settle a win at the multiplier actually reached.
 * - "crashed": Finalize a loss.
 *
 * The crash point is NEVER sent to the client while a round is live. The client
 * only knows when the round started; the multiplier is a deterministic function
 * of elapsed time, so the server recomputes it from its own clock and decides
 * every outcome. A scripted client cannot cash out at the crash point because it
 * cannot learn the crash point until the round is over.
 *
 * House edge is applied via the crash point distribution.
 * Max multiplier is capped at 5.00X.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromToken,
  getHouseEdge,
  getBalance,
  adjustBalance,
  settleGameSession,
  generateProvablyFairRandom,
  generateServerSeed,
  getNextNonce,
  checkRateLimit,
  validateBetAmount,
} from '@/lib/game-utils';
import { supabaseAdmin } from '@/lib/supabase-admin';

const GAME_SLUG = 'crash';
const MAX_MULTIPLIER = 5.00; // Maximum crash point cap

// Multiplier curve: m(t) = e^(GROWTH_RATE * t), t in seconds since round start.
// This must stay in sync with the client animation in CrashGamePage.
const GROWTH_RATE = 0.15;

// Grace allowance (seconds) for network latency on a cashout. Without it a
// player who clicks legitimately just before the crash can be beaten by their
// own request latency.
const CASHOUT_LATENCY_GRACE_SECONDS = 0.75;

interface CrashStartRequest {
  action: 'start';
  betAmount: number;
  clientSeed?: string;
}

interface CrashCashoutRequest {
  action: 'cashout';
  sessionId: string;
  multiplier?: number; // What the client displayed; only ever used to cap the payout
}

interface CrashStatusRequest {
  action: 'status';
  sessionId: string;
}

interface CrashCrashedRequest {
  action: 'crashed';
  sessionId: string;
}

type CrashRequest =
  | CrashStartRequest
  | CrashCashoutRequest
  | CrashStatusRequest
  | CrashCrashedRequest;

// Every handler returns either a payload or an error + HTTP status.
interface HandlerResult {
  data?: Record<string, unknown>;
  error?: string;
  status?: number;
}

function multiplierAtElapsed(elapsedSeconds: number): number {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return 1;
  return Math.pow(Math.E, GROWTH_RATE * elapsedSeconds);
}

function elapsedSecondsSince(startedAt: string): number {
  return (Date.now() - new Date(startedAt).getTime()) / 1000;
}

// Round down to 2dp so the payout matches what the player saw.
function floor2(value: number): number {
  return Math.floor(value * 100) / 100;
}

// Handle game start - deduct bet and generate crash point
async function handleStart(
  userId: string,
  betAmount: number,
  clientSeed: string = 'default'
): Promise<HandlerResult> {
  // Check rate limit
  const { allowed, error: rateLimitError } = await checkRateLimit(userId);
  if (!allowed) {
    return { error: rateLimitError, status: 429 };
  }

  // Get house edge from database
  const { houseEdge, error: gameError } = await getHouseEdge(GAME_SLUG);
  if (gameError) {
    return { error: gameError, status: 400 };
  }

  // Get user balance
  const { balance, error: balanceError } = await getBalance(userId);
  if (balanceError) {
    return { error: balanceError, status: 400 };
  }

  // Validate bet amount
  const { valid, error: betError } = validateBetAmount(betAmount, balance);
  if (!valid) {
    return { error: betError, status: 400 };
  }

  // Check for existing active session
  const { data: activeSession } = await supabaseAdmin
    .from('game_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('game_type', GAME_SLUG)
    .eq('outcome->>status', 'active')
    .maybeSingle();

  if (activeSession) {
    return { error: 'You already have an active crash game. Please complete it first.', status: 400 };
  }

  // Generate crash point with house edge determining the range
  // House edge controls the max possible crash point:
  // - 100% house edge (1.0) = crash at 1.00x (instant loss)
  // - 50% house edge (0.5) = random crash between 1.00x and 3.00x
  // - 0% house edge (0.0) = random crash between 1.00x and 5.00x
  const serverSeed = generateServerSeed();
  const nonce = await getNextNonce(userId, GAME_SLUG);
  const random = generateProvablyFairRandom(serverSeed, clientSeed, nonce);

  const effectiveMaxMultiplier = 1 + (MAX_MULTIPLIER - 1) * (1 - houseEdge);

  // Crash point: random value between 1.00 and effectiveMax (uniform distribution)
  let crashPoint = 1 + random * (effectiveMaxMultiplier - 1);
  crashPoint = Math.max(1.00, floor2(crashPoint));

  // Deduct bet atomically before the round exists.
  const { balance: newBalance, success: balanceUpdated, error: updateError, insufficientFunds } =
    await adjustBalance(userId, -betAmount);
  if (!balanceUpdated) {
    return { error: updateError, status: insufficientFunds ? 400 : 500 };
  }

  const startedAt = new Date().toISOString();

  // Create game session with status "active"
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('game_sessions')
    .insert([{
      user_id: userId,
      game_type: GAME_SLUG,
      bet_amount: betAmount,
      bet_fee: 0, // Will be calculated on payout
      outcome: {
        status: 'active',
        crashPoint,
        houseEdge,
        startedAt,
      },
      payout: 0,
      server_seed: serverSeed,
      client_seed: clientSeed,
      nonce,
    }])
    .select('id')
    .single();

  if (sessionError || !session) {
    // Refund the bet on error
    await adjustBalance(userId, betAmount);
    return { error: 'Failed to create game session', status: 500 };
  }

  // Deliberately does NOT include crashPoint - that is the whole point.
  return {
    data: {
      success: true,
      sessionId: session.id,
      betAmount,
      balance: newBalance,
      houseEdge,
      startedAt,
      serverTime: new Date().toISOString(),
      growthRate: GROWTH_RATE,
      maxMultiplier: MAX_MULTIPLIER,
    }
  };
}

// Settle a round that has already passed its crash point.
async function finalizeCrash(
  sessionId: string,
  userId: string,
  session: any,
  crashPoint: number
): Promise<HandlerResult> {
  await settleGameSession(sessionId, 'active', {
    outcome: {
      ...session.outcome,
      status: 'crashed',
      cashOutAt: null,
      win: false,
    },
    payout: 0,
    bet_fee: 0,
  });

  const { balance } = await getBalance(userId);

  return {
    data: {
      success: true,
      crashed: true,
      win: false,
      crashPoint,
      multiplier: 0,
      payout: 0,
      profitLoss: -Number(session.bet_amount),
      balance,
      houseEdge: session.outcome.houseEdge || 0,
    }
  };
}

async function loadActiveSession(userId: string, sessionId: string) {
  const { data: session, error } = await supabaseAdmin
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error || !session) {
    return { error: 'Game session not found', status: 404 as const };
  }

  return { session };
}

// Report live round state without ever revealing the crash point early.
async function handleStatus(userId: string, sessionId: string): Promise<HandlerResult> {
  const { session, error, status } = await loadActiveSession(userId, sessionId);
  if (error) return { error, status };

  const crashPoint = Number(session.outcome.crashPoint);

  if (session.outcome?.status !== 'active') {
    // Round is over - now it is safe to disclose the crash point.
    return {
      data: {
        success: true,
        crashed: session.outcome.status !== 'won',
        settled: true,
        crashPoint,
        status: session.outcome.status,
      }
    };
  }

  const serverMultiplier = multiplierAtElapsed(elapsedSecondsSince(session.outcome.startedAt));

  if (serverMultiplier >= crashPoint) {
    return finalizeCrash(sessionId, userId, session, crashPoint);
  }

  return {
    data: {
      success: true,
      crashed: false,
      settled: false,
      multiplier: floor2(serverMultiplier),
    }
  };
}

// Handle cash out - player cashes out before crash
async function handleCashout(
  userId: string,
  sessionId: string,
  clientMultiplier?: number
): Promise<HandlerResult> {
  const { session, error, status } = await loadActiveSession(userId, sessionId);
  if (error) return { error, status };

  // Validate session is active
  if (session.outcome?.status !== 'active') {
    return { error: 'Game session is not active', status: 400 };
  }

  const crashPoint = Number(session.outcome.crashPoint);

  // The server decides what multiplier was actually reached, from its own clock.
  const elapsed = elapsedSecondsSince(session.outcome.startedAt);
  const serverMultiplier = multiplierAtElapsed(elapsed);

  // Allow for request latency so an honest click near the crash still lands.
  const gracedMultiplier = multiplierAtElapsed(
    Math.max(0, elapsed - CASHOUT_LATENCY_GRACE_SECONDS)
  );

  if (gracedMultiplier >= crashPoint) {
    // Round is over - the player did not get out in time.
    return finalizeCrash(sessionId, userId, session, crashPoint);
  }

  // Pay at the lower of what the client displayed and what the server clock
  // says. The client can only ever reduce its own payout, never inflate it.
  let effectiveMultiplier = Math.min(serverMultiplier, crashPoint);
  if (typeof clientMultiplier === 'number' && Number.isFinite(clientMultiplier)) {
    effectiveMultiplier = Math.min(effectiveMultiplier, Math.max(1, clientMultiplier));
  }
  effectiveMultiplier = Math.max(1, floor2(effectiveMultiplier));

  const betAmount = Number(session.bet_amount);
  const payout = betAmount * effectiveMultiplier;
  const profitLoss = payout - betAmount;

  // Close the round first - only one request can win this transition, so a
  // round can never be cashed out twice.
  const { settled } = await settleGameSession(sessionId, 'active', {
    outcome: {
      ...session.outcome,
      status: 'won',
      cashOutAt: effectiveMultiplier,
      win: true,
    },
    payout,
    bet_fee: 0, // House edge is applied via crash point, not fee
  });

  if (!settled) {
    return { error: 'Game session is not active', status: 400 };
  }

  const { balance: newBalance, success: balanceUpdated, error: balanceError } =
    await adjustBalance(userId, payout);
  if (!balanceUpdated) {
    return { error: balanceError, status: 500 };
  }

  return {
    data: {
      success: true,
      crashed: false,
      win: true,
      crashPoint,
      multiplier: effectiveMultiplier,
      payout,
      profitLoss,
      balance: newBalance,
      houseEdge: session.outcome.houseEdge || 0,
    }
  };
}

// Handle crash - player didn't cash out in time
async function handleCrashed(userId: string, sessionId: string): Promise<HandlerResult> {
  const { session, error, status } = await loadActiveSession(userId, sessionId);
  if (error) return { error, status };

  // Validate session is active
  if (session.outcome?.status !== 'active') {
    return { error: 'Game session is not active', status: 400 };
  }

  const crashPoint = Number(session.outcome.crashPoint);

  // The client asking to crash does not make it so - the server clock decides.
  // If the round is still live this is treated as a cashout attempt instead, so
  // a client cannot dodge a loss (or force one) by lying about the crash.
  const serverMultiplier = multiplierAtElapsed(elapsedSecondsSince(session.outcome.startedAt));
  if (serverMultiplier < crashPoint) {
    return handleCashout(userId, sessionId, serverMultiplier);
  }

  return finalizeCrash(sessionId, userId, session, crashPoint);
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const { userId, error: authError } = await getUserFromToken(authHeader);
    if (authError) {
      return NextResponse.json({ error: authError, success: false }, { status: 401 });
    }

    // Parse request
    const body: CrashRequest = await request.json();

    // Route to appropriate handler based on action
    let result;

    switch (body.action) {
      case 'start':
        result = await handleStart(userId, body.betAmount, body.clientSeed);
        break;

      case 'status':
        result = await handleStatus(userId, body.sessionId);
        break;

      case 'cashout':
        result = await handleCashout(userId, body.sessionId, body.multiplier);
        break;

      case 'crashed':
        result = await handleCrashed(userId, body.sessionId);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action', success: false }, { status: 400 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error, success: false }, { status: result.status });
    }

    return NextResponse.json(result.data);

  } catch (error: any) {
    console.error('Crash game error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error', success: false }, { status: 500 });
  }
}
