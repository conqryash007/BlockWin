/**
 * Plinko Game API Route
 * POST /api/games/plinko
 * 
 * Server-side plinko game where house edge biases ball path toward lower multipliers.
 * - 0% house edge = fair random path
 * - 100% house edge = ball always goes to lowest multiplier bucket
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

const GAME_SLUG = 'plinko';

// Multiplier table for 17 buckets (matching frontend)
// Max 5x at edges, middle 5: 1x, 0.8x, 0.5x, 0.8x, 1x
const MULTIPLIERS = [5, 3, 2, 1.5, 1.2, 1, 1, 0.8, 0.5, 0.8, 1, 1, 1.2, 1.5, 2, 3, 5];

// Center bucket (lowest multiplier 0.5x at index 8)
const CENTER_BUCKET = 8;
const TOTAL_BUCKETS = 17;

interface PlinkoRequest {
  betAmount: number;
  rows?: number;
  risk?: 'low' | 'medium' | 'high';
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

    // 2. Parse request
    const body: PlinkoRequest = await request.json();
    const { betAmount, rows = 8, risk = 'low', clientSeed = 'default' } = body;

    // 3. Validate inputs
    if (rows !== 8) {
      return NextResponse.json({ error: 'Only 8 rows supported currently', success: false }, { status: 400 });
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

    // 8. Generate bucket based on house edge
    const serverSeed = generateServerSeed();
    const nonce = await getNextNonce(userId, GAME_SLUG);
    const random = generateProvablyFairRandom(serverSeed, clientSeed, nonce);

    // Edge-based bucket selection:
    // - 100% house edge: always land on center bucket (0.5x)
    // - 50% house edge: land in middle 50% region (buckets 4-12)
    // - 0% house edge: land anywhere (buckets 0-16)
    let bucket: number;

    if (houseEdge >= 1) {
      // 100% edge: always center bucket
      bucket = CENTER_BUCKET;
    } else {
      // Calculate allowed bucket range based on house edge
      // houseEdge 0.0 → maxDistance = 8 → range [0, 16] (full range)
      // houseEdge 0.5 → maxDistance = 4 → range [4, 12] (middle 50%)
      // houseEdge 1.0 → maxDistance = 0 → range [8, 8] (center only)
      const maxDistance = CENTER_BUCKET * (1 - houseEdge);
      const minBucket = Math.ceil(CENTER_BUCKET - maxDistance);
      const maxBucket = Math.floor(CENTER_BUCKET + maxDistance);

      // Random bucket within allowed range
      const rangeSize = maxBucket - minBucket + 1;
      bucket = Math.floor(random * rangeSize) + minBucket;
    }

    // Generate path (for legacy/display purposes - not used in physics)
    const path: number[] = [];
    for (let i = 0; i < rows; i++) {
      path.push(Math.random() < 0.5 ? 0 : 1);
    }

    // 9. Get multiplier for landing bucket
    const multiplier = MULTIPLIERS[bucket];
    
    // 10. Calculate payout and profit/loss
    const payout = betAmount * multiplier;
    const profitLoss = payout - betAmount;
    const win = profitLoss > 0;
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
        path,
        bucket,
        rows,
        multiplier,
        houseEdge,
      },
      payout,
      server_seed: serverSeed,
      client_seed: clientSeed,
      nonce,
    });

    // 12. Return result with profit/loss
    return NextResponse.json({
      success: true,
      path,
      bucket,
      multiplier,
      payout,
      profitLoss,
      win,
      balance: newBalance,
      previousBalance: balance,
      houseEdge,
    });

  } catch (error: any) {
    console.error('Plinko game error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error', success: false }, { status: 500 });
  }
}
