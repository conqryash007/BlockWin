/**
 * Dice Game Edge Function
 * 
 * Secure server-side dice game with:
 * - Provably fair random number generation
 * - House edge applied to payouts
 * - Atomic balance updates
 * - Rate limiting and replay protection
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
  calculatePayout,
  type GameResult,
} from "../_shared/game-utils.ts";

const GAME_SLUG = "dice";

interface DiceRequest {
  betAmount: number;
  target: number;      // Target number (1-99)
  rollUnder: boolean;  // true = win if roll < target, false = win if roll > target
  clientSeed: string;
}

serve(async (req) => {
  // Handle CORS preflight
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

    // 2. Parse request body
    const body: DiceRequest = await req.json();
    const { betAmount, target, rollUnder, clientSeed = "default" } = body;

    // 3. Validate target
    if (typeof target !== "number" || target < 1 || target > 99) {
      return errorResponse(400, "Target must be between 1 and 99");
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

    // 8. Generate provably fair result
    const serverSeed = generateServerSeed();
    const nonce = await getNextNonce(supabase, userId, GAME_SLUG);
    const random = generateProvablyFairRandom(serverSeed, clientSeed, nonce);
    
    // Roll is 1-100
    const roll = Math.floor(random * 100) + 1;

    // 9. Determine win/loss
    const win = rollUnder ? roll < target : roll > target;

    // 10. Calculate multiplier and payout
    // Win chance = target for under, (100 - target) for over
    const winChance = rollUnder ? target : (100 - target);
    // Fair multiplier = 100 / winChance, then apply house edge
    const baseMultiplier = 100 / winChance;
    const adjustedMultiplier = baseMultiplier * (1 - houseEdge);
    
    const { payout, betFee } = calculatePayout(betAmount, adjustedMultiplier, houseEdge, win);

    // 11. Update balance
    const newBalance = win 
      ? balance - betAmount + payout 
      : balance - betAmount;
    
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
        roll,
        target,
        rollUnder,
        win,
        multiplier: adjustedMultiplier
      },
      payout: win ? payout : 0,
      server_seed: serverSeed,
      client_seed: clientSeed,
      nonce,
    });

    // 13. Return result
    const result: GameResult = {
      success: true,
      roll,
      win,
      payout: win ? payout : 0,
      balance: newBalance,
      multiplier: adjustedMultiplier,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Dice game error:", error);
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
