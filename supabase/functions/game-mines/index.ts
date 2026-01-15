/**
 * Mines Game Edge Function
 * 
 * Secure server-side mines game with:
 * - Provably fair mine placement
 * - Progressive multiplier based on tiles revealed
 * - Cash-out at any point
 * - House edge applied to payouts
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

const GAME_SLUG = "mines";
const TOTAL_TILES = 25; // 5x5 grid

interface MinesRequest {
  action: "start" | "reveal" | "cashout";
  betAmount?: number;      // Required for "start"
  mineCount?: number;      // Required for "start" (1-24)
  tileIndex?: number;      // Required for "reveal" (0-24)
  gameSessionId?: string;  // Required for "reveal" and "cashout"
  clientSeed?: string;
}

// Calculate multiplier based on tiles revealed and mine count
function calculateMultiplier(revealed: number, mineCount: number, houseEdge: number): number {
  const safeTiles = TOTAL_TILES - mineCount;
  let multiplier = 1;
  
  for (let i = 0; i < revealed; i++) {
    const remaining = safeTiles - i;
    const total = TOTAL_TILES - i;
    multiplier *= total / remaining;
  }
  
  // Apply house edge
  return multiplier * (1 - houseEdge);
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
    const body: MinesRequest = await req.json();
    const { action, clientSeed = "default" } = body;

    // 3. Get house edge
    const { houseEdge, error: gameError } = await getHouseEdge(supabase, GAME_SLUG);
    if (gameError) {
      return errorResponse(400, gameError);
    }

    if (action === "start") {
      return handleStart(supabase, userId, body, houseEdge, clientSeed);
    } else if (action === "reveal") {
      return handleReveal(supabase, userId, body, houseEdge);
    } else if (action === "cashout") {
      return handleCashout(supabase, userId, body, houseEdge);
    } else {
      return errorResponse(400, "Invalid action");
    }

  } catch (error) {
    console.error("Mines game error:", error);
    return errorResponse(500, error.message || "Internal server error");
  }
});

async function handleStart(
  supabase: any,
  userId: string,
  body: MinesRequest,
  houseEdge: number,
  clientSeed: string
) {
  const { betAmount, mineCount = 3 } = body;

  if (!betAmount) {
    return errorResponse(400, "Bet amount required");
  }

  if (mineCount < 1 || mineCount > 24) {
    return errorResponse(400, "Mine count must be between 1 and 24");
  }

  // Check rate limit
  const { allowed, error: rateLimitError } = await checkRateLimit(supabase, userId);
  if (!allowed) {
    return errorResponse(429, rateLimitError!);
  }

  // Get balance
  const { balance, error: balanceError } = await getBalanceForUpdate(supabase, userId);
  if (balanceError) {
    return errorResponse(400, balanceError);
  }

  // Validate bet
  const { valid, error: betError } = validateBetAmount(betAmount, balance);
  if (!valid) {
    return errorResponse(400, betError!);
  }

  // Generate mine positions (provably fair)
  const serverSeed = generateServerSeed();
  const nonce = await getNextNonce(supabase, userId, GAME_SLUG);
  
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
  const { error: updateError } = await updateBalance(supabase, userId, newBalance);
  if (updateError) {
    return errorResponse(500, updateError);
  }

  // Create game session (in progress)
  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .insert([{
      user_id: userId,
      game_type: GAME_SLUG,
      bet_amount: betAmount,
      bet_fee: 0, // Calculated on cashout/bust
      outcome: {
        minePositions,
        mineCount,
        revealedTiles: [],
        status: "in_progress",
      },
      payout: 0,
      server_seed: serverSeed,
      client_seed: clientSeed,
      nonce,
    }])
    .select("id")
    .single();

  if (sessionError) {
    return errorResponse(500, "Failed to start game");
  }

  return new Response(JSON.stringify({
    success: true,
    gameSessionId: session.id,
    mineCount,
    balance: newBalance,
    nextMultiplier: calculateMultiplier(1, mineCount, houseEdge),
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleReveal(
  supabase: any,
  userId: string,
  body: MinesRequest,
  houseEdge: number
) {
  const { gameSessionId, tileIndex } = body;

  if (!gameSessionId || tileIndex === undefined) {
    return errorResponse(400, "Game session ID and tile index required");
  }

  if (tileIndex < 0 || tileIndex >= TOTAL_TILES) {
    return errorResponse(400, "Invalid tile index");
  }

  // Get game session
  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", gameSessionId)
    .eq("user_id", userId)
    .single();

  if (sessionError || !session) {
    return errorResponse(400, "Game session not found");
  }

  const outcome = session.outcome;
  if (outcome.status !== "in_progress") {
    return errorResponse(400, "Game already ended");
  }

  if (outcome.revealedTiles.includes(tileIndex)) {
    return errorResponse(400, "Tile already revealed");
  }

  // Check if hit mine
  const hitMine = outcome.minePositions.includes(tileIndex);
  outcome.revealedTiles.push(tileIndex);

  if (hitMine) {
    // Game over - lost
    outcome.status = "bust";
    
    await supabase
      .from("game_sessions")
      .update({
        outcome,
        bet_fee: session.bet_amount * houseEdge,
        payout: 0,
      })
      .eq("id", gameSessionId);

    return new Response(JSON.stringify({
      success: true,
      hitMine: true,
      minePositions: outcome.minePositions,
      payout: 0,
      balance: await getCurrentBalance(supabase, userId),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Safe tile - update session
  const revealed = outcome.revealedTiles.length;
  const currentMultiplier = calculateMultiplier(revealed, outcome.mineCount, houseEdge);
  const nextMultiplier = calculateMultiplier(revealed + 1, outcome.mineCount, houseEdge);
  const potentialPayout = session.bet_amount * currentMultiplier;

  await supabase
    .from("game_sessions")
    .update({ outcome })
    .eq("id", gameSessionId);

  return new Response(JSON.stringify({
    success: true,
    hitMine: false,
    revealedTiles: outcome.revealedTiles,
    currentMultiplier,
    nextMultiplier,
    potentialPayout,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleCashout(
  supabase: any,
  userId: string,
  body: MinesRequest,
  houseEdge: number
) {
  const { gameSessionId } = body;

  if (!gameSessionId) {
    return errorResponse(400, "Game session ID required");
  }

  // Get game session
  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", gameSessionId)
    .eq("user_id", userId)
    .single();

  if (sessionError || !session) {
    return errorResponse(400, "Game session not found");
  }

  const outcome = session.outcome;
  if (outcome.status !== "in_progress") {
    return errorResponse(400, "Game already ended");
  }

  if (outcome.revealedTiles.length === 0) {
    return errorResponse(400, "Must reveal at least one tile before cashing out");
  }

  // Calculate payout
  const revealed = outcome.revealedTiles.length;
  const multiplier = calculateMultiplier(revealed, outcome.mineCount, houseEdge);
  const payout = session.bet_amount * multiplier;
  const betFee = payout * houseEdge;

  // Update balance
  const { balance } = await getBalanceForUpdate(supabase, userId);
  const newBalance = balance + payout;
  await updateBalance(supabase, userId, newBalance);

  // Update session
  outcome.status = "cashed_out";
  await supabase
    .from("game_sessions")
    .update({
      outcome,
      payout,
      bet_fee: betFee,
    })
    .eq("id", gameSessionId);

  return new Response(JSON.stringify({
    success: true,
    multiplier,
    payout,
    balance: newBalance,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getCurrentBalance(supabase: any, userId: string): Promise<number> {
  const { data } = await supabase
    .from("balances")
    .select("amount")
    .eq("user_id", userId)
    .single();
  return Number(data?.amount || 0);
}

function errorResponse(status: number, message: string): Response {
  return new Response(
    JSON.stringify({ error: message, success: false }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
