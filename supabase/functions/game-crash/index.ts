/**
 * Crash Game Edge Function
 * 
 * Secure server-side crash game with:
 * - Provably fair crash point generation
 * - House edge applied to crash multiplier
 * - Cash-out handling before crash
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

const GAME_SLUG = "crash";

interface CrashRequest {
  betAmount: number;
  autoCashOut?: number;  // Optional auto cash-out multiplier
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
    const body: CrashRequest = await req.json();
    const { betAmount, autoCashOut, clientSeed = "default" } = body;

    // 3. Validate auto cash-out
    if (autoCashOut !== undefined && (autoCashOut < 1.01 || autoCashOut > 1000)) {
      return errorResponse(400, "Auto cash-out must be between 1.01x and 1000x");
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

    // 8. Generate crash point (provably fair)
    const serverSeed = generateServerSeed();
    const nonce = await getNextNonce(supabase, userId, GAME_SLUG);
    const random = generateProvablyFairRandom(serverSeed, clientSeed, nonce);
    
    // Crash point formula with house edge
    // crashPoint = (1 - houseEdge) / random
    // This gives exponential distribution favoring lower values
    const rawCrashPoint = (1 - houseEdge) / random;
    
    // Cap at 1000x and ensure minimum of 1.00
    const crashPoint = Math.max(1.00, Math.min(1000, Math.floor(rawCrashPoint * 100) / 100));

    // 9. Determine outcome
    let win = false;
    let cashOutAt = crashPoint; // If instant crash
    let payout = 0;
    let multiplier = 1;

    if (autoCashOut) {
      // Auto cash-out mode
      if (autoCashOut <= crashPoint) {
        // Won - cashed out before crash
        win = true;
        cashOutAt = autoCashOut;
        multiplier = autoCashOut;
        payout = betAmount * multiplier;
      }
    } else {
      // For non-auto mode, we just simulate instant crash/cashout at minimum
      // In a real game, this would be a separate cash-out endpoint
      // For MVP, return crash point and let client handle animation
      win = crashPoint >= 1.01;
      if (win) {
        // Simulate a random cash-out between 1.01 and crash
        const cashOutRandom = generateProvablyFairRandom(serverSeed, clientSeed, nonce + 1);
        cashOutAt = 1.01 + cashOutRandom * (crashPoint - 1.01);
        cashOutAt = Math.floor(cashOutAt * 100) / 100;
        multiplier = cashOutAt;
        payout = betAmount * multiplier;
      }
    }

    const betFee = payout * houseEdge;

    // 10. Update balance
    const newBalance = balance - betAmount + payout;
    
    const { error: updateError } = await updateBalance(supabase, userId, newBalance);
    if (updateError) {
      return errorResponse(500, updateError);
    }

    // 11. Log game session
    await logGameSession(supabase, {
      user_id: userId,
      game_type: GAME_SLUG,
      bet_amount: betAmount,
      bet_fee: betFee,
      outcome: {
        crashPoint,
        cashOutAt: win ? cashOutAt : null,
        win,
        multiplier: win ? multiplier : 0,
        autoCashOut,
      },
      payout,
      server_seed: serverSeed,
      client_seed: clientSeed,
      nonce,
    });

    // 12. Return result
    return new Response(JSON.stringify({
      success: true,
      crashPoint,
      cashOutAt: win ? cashOutAt : null,
      win,
      multiplier: win ? multiplier : 0,
      payout,
      balance: newBalance,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Crash game error:", error);
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
