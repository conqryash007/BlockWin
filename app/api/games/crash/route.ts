/**
 * Crash Game API Route
 * POST /api/games/crash
 * 
 * Two-phase gameplay:
 * - "start": Deduct bet, generate crash point (max 5X), create session
 * - "cashout": Calculate winnings with house edge, update balance
 * - "crashed": Finalize loss when player doesn't cash out in time
 * 
 * House edge is applied to WINNINGS, not crash point generation.
 * Max multiplier is capped at 5.00X for controlled gameplay.
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

const GAME_SLUG = 'crash';
const MAX_MULTIPLIER = 5.00; // Maximum crash point cap

interface CrashStartRequest {
  action: 'start';
  betAmount: number;
  clientSeed?: string;
}

interface CrashCashoutRequest {
  action: 'cashout';
  sessionId: string;
  multiplier: number;
}

interface CrashCrashedRequest {
  action: 'crashed';
  sessionId: string;
}

type CrashRequest = CrashStartRequest | CrashCashoutRequest | CrashCrashedRequest;

// Handle game start - deduct bet and generate crash point
async function handleStart(userId: string, betAmount: number, clientSeed: string = 'default') {
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
    .single();

  if (activeSession) {
    return { error: 'You already have an active crash game. Please complete it first.', status: 400 };
  }

  // Generate crash point with house edge determining the range
  // House edge controls the max possible crash point:
  // - 100% house edge (1.0) = crash at 1.00x (instant loss)
  // - 50% house edge (0.5) = random crash between 1.00x and 3.00x
  // - 0% house edge (0.0) = random crash between 1.00x and 5.00x
  // Formula: effectiveMax = 1 + (MAX_MULTIPLIER - 1) * (1 - houseEdge)
  const serverSeed = generateServerSeed();
  const nonce = await getNextNonce(userId, GAME_SLUG);
  const random = generateProvablyFairRandom(serverSeed, clientSeed, nonce);
  
  // Calculate effective max multiplier based on house edge
  // At 100% house edge: effectiveMax = 1 + 4 * 0 = 1.00
  // At 50% house edge: effectiveMax = 1 + 4 * 0.5 = 3.00
  // At 0% house edge: effectiveMax = 1 + 4 * 1 = 5.00
  const effectiveMaxMultiplier = 1 + (MAX_MULTIPLIER - 1) * (1 - houseEdge);
  
  // Crash point: random value between 1.00 and effectiveMax (uniform distribution)
  let crashPoint = 1 + random * (effectiveMaxMultiplier - 1);
  crashPoint = Math.max(1.00, Math.floor(crashPoint * 100) / 100);

  // Deduct bet from balance immediately
  const newBalance = balance - betAmount;
  const { error: updateError } = await updateBalance(userId, newBalance);
  if (updateError) {
    return { error: updateError, status: 500 };
  }

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
    await updateBalance(userId, balance);
    return { error: 'Failed to create game session', status: 500 };
  }

  return {
    data: {
      success: true,
      sessionId: session.id,
      crashPoint,
      betAmount,
      balance: newBalance,
      houseEdge,
    }
  };
}

// Handle cash out - player cashes out before crash
async function handleCashout(userId: string, sessionId: string, multiplier: number) {
  // Validate multiplier
  if (multiplier < 1.00 || multiplier > MAX_MULTIPLIER) {
    return { error: `Multiplier must be between 1.00 and ${MAX_MULTIPLIER}`, status: 400 };
  }

  // Get the active session
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (sessionError || !session) {
    return { error: 'Game session not found', status: 404 };
  }

  // Validate session is active
  if (session.outcome?.status !== 'active') {
    return { error: 'Game session is not active', status: 400 };
  }

  // Validate multiplier is <= crash point (player can't cash out after crash)
  const crashPoint = session.outcome.crashPoint;
  if (multiplier > crashPoint) {
    return { error: 'Cannot cash out - game already crashed', status: 400 };
  }

  // Calculate payout - simple bet * multiplier (house edge already applied via crash point)
  const betAmount = session.bet_amount;
  const payout = betAmount * multiplier;
  const profitLoss = payout - betAmount;

  // Get current balance and add winnings
  const { balance, error: balanceError } = await getBalance(userId);
  if (balanceError) {
    return { error: balanceError, status: 400 };
  }

  const newBalance = balance + payout;
  const { error: updateError } = await updateBalance(userId, newBalance);
  if (updateError) {
    return { error: updateError, status: 500 };
  }

  // Update session with final outcome
  await supabaseAdmin
    .from('game_sessions')
    .update({
      outcome: {
        ...session.outcome,
        status: 'won',
        cashOutAt: multiplier,
        win: true,
      },
      payout: payout,
      bet_fee: 0, // House edge is applied via crash point, not fee
    })
    .eq('id', sessionId);

  return {
    data: {
      success: true,
      win: true,
      crashPoint,
      multiplier,
      payout,
      profitLoss,
      balance: newBalance,
      houseEdge: session.outcome.houseEdge || 0,
    }
  };
}

// Handle crash - player didn't cash out in time
async function handleCrashed(userId: string, sessionId: string) {
  // Get the active session
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (sessionError || !session) {
    return { error: 'Game session not found', status: 404 };
  }

  // Validate session is active
  if (session.outcome?.status !== 'active') {
    return { error: 'Game session is not active', status: 400 };
  }

  const crashPoint = session.outcome.crashPoint;
  const betAmount = session.bet_amount;

  // Update session with loss outcome (no balance update needed - bet was already deducted)
  await supabaseAdmin
    .from('game_sessions')
    .update({
      outcome: {
        ...session.outcome,
        status: 'crashed',
        cashOutAt: null,
        win: false,
      },
      payout: 0,
      bet_fee: 0,
    })
    .eq('id', sessionId);

  // Get current balance for response
  const { balance } = await getBalance(userId);

  return {
    data: {
      success: true,
      win: false,
      crashPoint,
      multiplier: 0,
      payout: 0,
      profitLoss: -betAmount,
      balance: balance,
      houseEdge: session.outcome.houseEdge || 0,
    }
  };
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
