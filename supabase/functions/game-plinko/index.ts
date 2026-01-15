/**
 * Plinko Game Edge Function
 * 
 * Secure server-side plinko game with:
 * - Provably fair ball path generation
 * - Configurable rows and risk levels
 * - House edge applied to payouts
 * - Atomic balance updates
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  createServiceClient,
  getUserFromRequest,
  getHouseEdge,
  getBalanceForUpdate,
  updateBalance,
  logGameSession,
  generateProvablyFairRandom,
  generateServerSeed,
  getNextNonce,
  checkRateLimit,
  validateBetAmount,
} from "../_shared/game-utils.ts";

const GAME_SLUG = "plinko";

// Multiplier tables for different risk levels (8 rows)
const MULTIPLIERS = {
  low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
  medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
  high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
};

interface PlinkoRequest {
  betAmount: number;
  rows?: number;       // Default 8
  risk?: "low" | "medium" | "high";
  clientSeed: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();

    // 1. Authenticate user
    const { userId, error: authError } = await getUserFromRequest(req, supabase);
    if (authError) {
      return errorResponse(401, authError);
    }

    // 2. Parse request
    const body: PlinkoRequest = await req.json();
    const { betAmount, rows = 8, risk = "low", clientSeed = "default" } = body;

    // 3. Validate inputs
    if (rows !== 8) {
      // For now only support 8 rows
      return errorResponse(400, "Only 8 rows supported currently");
    }

    if (!["low", "medium", "high"].includes(risk)) {
      return errorResponse(400, "Invalid risk level");
    }

    // 4. Check rate limit
    const { allowed, error: rateLimitError } = await checkRateLimit(supabase, userId);
    if (!allowed) {
      return errorResponse(429, rateLimitError!);
    }

    // 5. Get house edge
    const { houseEdge, error: gameError } = await getHouseEdge(supabase, GAME_SLUG);
    if (gameError) {
      return errorResponse(400, gameError);
    }

    // 6. Get balance
    const { balance, error: balanceError } = await getBalanceForUpdate(supabase, userId);
    if (balanceError) {
      return errorResponse(400, balanceError);
    }

    // 7. Validate bet
    const { valid, error: betError } = validateBetAmount(betAmount, balance);
    if (!valid) {
      return errorResponse(400, betError!);
    }

    // 8. Generate provably fair path
    const serverSeed = generateServerSeed();
    const nonce = await getNextNonce(supabase, userId, GAME_SLUG);
    
    // Generate path - each step is left (0) or right (1)
    const path: number[] = [];
    let bucket = 0;
    
    for (let i = 0; i < rows; i++) {
      const random = generateProvablyFairRandom(serverSeed, clientSeed, nonce * 100 + i);
      const direction = random < 0.5 ? 0 : 1;
      path.push(direction);
      bucket += direction;
    }

    // 9. Get multiplier for landing bucket
    const multipliers = MULTIPLIERS[risk as keyof typeof MULTIPLIERS];
    const baseMultiplier = multipliers[bucket];
    
    // Apply house edge
    const adjustedMultiplier = baseMultiplier * (1 - houseEdge);
    
    // 10. Calculate payout
    const grossPayout = betAmount * adjustedMultiplier;
    const betFee = betAmount * houseEdge;
    const payout = grossPayout;

    // 11. Update balance (deduct bet, add payout)
    const newBalance = balance - betAmount + payout;
    
    const { error: updateError } = await updateBalance(supabase, userId, newBalance);
    if (updateError) {
      return errorResponse(500, updateError);
    }

    // 12. Log game session
    await logGameSession(supabase, {
      user_id: userId,
      game_type: GAME_SLUG,
      bet_amount: betAmount,
      bet_fee: betFee,
      outcome: {
        path,
        bucket,
        rows,
        risk,
        multiplier: adjustedMultiplier,
      },
      payout,
      server_seed: serverSeed,
      client_seed: clientSeed,
      nonce,
    });

    // 13. Return result
    return new Response(JSON.stringify({
      success: true,
      path,
      bucket,
      multiplier: adjustedMultiplier,
      payout,
      balance: newBalance,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Plinko game error:", error);
    return errorResponse(500, error.message || "Internal server error");
  }
});

function errorResponse(status: number, message: string): Response {
  return new Response(
    JSON.stringify({ error: message, success: false }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
