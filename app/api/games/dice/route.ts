/**
 * Dice Game API Route
 * POST /api/games/dice
 * 
 * Server-side dice game where house edge directly controls win probability.
 * The displayed roll is ALWAYS consistent with the win/loss outcome.
 * - 0% house edge = fair game (true probability)
 * - 100% house edge = roll always lands in losing zone
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromToken,
  getHouseEdge,
  getBalance,
  updateBalance,
  logGameSession,
  generateProvablyFairRandom,
  generateServerSeed,
  getNextNonce,
  checkRateLimit,
  validateBetAmount,
} from '@/lib/game-utils';

const GAME_SLUG = 'dice';

interface DiceRequest {
  betAmount: number;
  target: number;      // Target number (1-99)
  rollUnder: boolean;  // true = win if roll < target, false = win if roll > target
  clientSeed?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get('authorization');
    const { userId, error: authError } = await getUserFromToken(authHeader);
    if (authError) {
      return NextResponse.json({ error: authError, success: false }, { status: 401 });
    }

    // 2. Parse request body
    const body: DiceRequest = await request.json();
    const { betAmount, target, rollUnder, clientSeed = 'default' } = body;

    // 3. Validate target
    if (typeof target !== 'number' || target < 1 || target > 99) {
      return NextResponse.json({ error: 'Target must be between 1 and 99', success: false }, { status: 400 });
    }

    // 4. Check rate limit
    const { allowed, error: rateLimitError } = await checkRateLimit(userId);
    if (!allowed) {
      return NextResponse.json({ error: rateLimitError, success: false }, { status: 429 });
    }

    // 5. Get house edge from database
    const { houseEdge, error: gameError } = await getHouseEdge(GAME_SLUG);
    if (gameError) {
      return NextResponse.json({ error: gameError, success: false }, { status: 400 });
    }

    // 6. Get user balance
    const { balance, error: balanceError } = await getBalance(userId);
    if (balanceError) {
      return NextResponse.json({ error: balanceError, success: false }, { status: 400 });
    }

    // 7. Validate bet amount
    const { valid, error: betError } = validateBetAmount(betAmount, balance);
    if (!valid) {
      return NextResponse.json({ error: betError, success: false }, { status: 400 });
    }

    // 8. Generate result with house edge affecting the ACTUAL roll
    const serverSeed = generateServerSeed();
    const nonce = await getNextNonce(userId, GAME_SLUG);
    
    // Calculate win/loss zones
    // Roll Under: win zone = [1, target-1], lose zone = [target, 100]
    // Roll Over: win zone = [target+1, 100], lose zone = [1, target]
    let winZoneStart: number, winZoneEnd: number;
    let loseZoneStart: number, loseZoneEnd: number;
    
    if (rollUnder) {
      winZoneStart = 1;
      winZoneEnd = target - 1;
      loseZoneStart = target;
      loseZoneEnd = 100;
    } else {
      winZoneStart = target + 1;
      winZoneEnd = 100;
      loseZoneStart = 1;
      loseZoneEnd = target;
    }

    // Base win probability
    const baseWinProbability = rollUnder ? ((target - 1) / 100) : ((100 - target) / 100);
    
    // Adjusted win probability after house edge
    // At 100% house edge → 0% win chance
    // At 0% house edge → normal win chance
    const adjustedWinProbability = baseWinProbability * (1 - houseEdge);
    
    // First random: determine if player wins or loses based on adjusted probability
    const winRandom = generateProvablyFairRandom(serverSeed, clientSeed, nonce);
    const win = winRandom < adjustedWinProbability;
    
    // Second random: generate the actual displayed roll within the appropriate zone
    const rollRandom = generateProvablyFairRandom(serverSeed, clientSeed, nonce + 1000);
    
    let roll: number;
    if (win) {
      // Generate roll within winning zone
      const winZoneSize = winZoneEnd - winZoneStart + 1;
      if (winZoneSize > 0) {
        roll = winZoneStart + Math.floor(rollRandom * winZoneSize);
      } else {
        roll = winZoneStart; // Edge case
      }
    } else {
      // Generate roll within losing zone
      const loseZoneSize = loseZoneEnd - loseZoneStart + 1;
      if (loseZoneSize > 0) {
        roll = loseZoneStart + Math.floor(rollRandom * loseZoneSize);
      } else {
        roll = loseZoneStart; // Edge case
      }
    }
    
    // Ensure roll is within bounds
    roll = Math.max(1, Math.min(100, roll));

    // 9. Calculate payout (fair multiplier based on displayed probability)
    const displayMultiplier = 100 / (baseWinProbability * 100);
    const payout = win ? betAmount * displayMultiplier : 0;

    // 10. Calculate profit/loss
    const profitLoss = win ? (payout - betAmount) : -betAmount;
    const newBalance = balance + profitLoss;
    
    const { error: updateError } = await updateBalance(userId, newBalance);
    if (updateError) {
      return NextResponse.json({ error: updateError, success: false }, { status: 500 });
    }

    // 11. Log game session
    await logGameSession({
      user_id: userId,
      game_type: GAME_SLUG,
      bet_amount: betAmount,
      bet_fee: betAmount * houseEdge,
      outcome: {
        roll,
        target,
        rollUnder,
        win,
        houseEdge,
        baseWinProbability,
        adjustedWinProbability,
        multiplier: displayMultiplier
      },
      payout,
      server_seed: serverSeed,
      client_seed: clientSeed,
      nonce,
    });

    // 12. Return result
    return NextResponse.json({
      success: true,
      roll,              // This roll is ALWAYS consistent with win/loss
      win,
      payout,
      profitLoss,
      balance: newBalance,
      multiplier: displayMultiplier,
      houseEdge,
      previousBalance: balance,
    });

  } catch (error: any) {
    console.error('Dice game error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error', success: false }, { status: 500 });
  }
}
