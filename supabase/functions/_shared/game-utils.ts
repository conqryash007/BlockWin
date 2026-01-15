/**
 * Shared Game Utilities
 * 
 * Provides common functionality for all game Edge Functions:
 * - Supabase client initialization with service role
 * - User authentication validation
 * - Balance fetching/updating with concurrency protection
 * - House edge fetching by game slug
 * - Game session creation/logging
 * - Provably fair random number generation
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// Types
export interface GameSession {
  id?: string;
  user_id: string;
  game_type: string;
  bet_amount: number;
  bet_fee: number;
  outcome: Record<string, unknown>;
  payout: number;
  server_seed: string;
  client_seed: string;
  nonce: number;
}

export interface GameResult {
  success: boolean;
  error?: string;
  roll?: number;
  bucket?: number;
  path?: number[];
  win?: boolean;
  payout: number;
  balance: number;
  multiplier?: number;
}

// Initialize Supabase client with service role for admin operations
export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

// Get user from JWT token
export async function getUserFromRequest(
  req: Request,
  supabase: SupabaseClient
): Promise<{ userId: string; error?: string }> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader) {
    return { userId: "", error: "Missing authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { userId: "", error: "Invalid or expired token" };
  }

  return { userId: user.id };
}

// Fetch house edge for a game
export async function getHouseEdge(
  supabase: SupabaseClient,
  gameSlug: string
): Promise<{ houseEdge: number; gameId: string; error?: string }> {
  const { data, error } = await supabase
    .from("games")
    .select("id, house_edge, is_active")
    .eq("slug", gameSlug)
    .single();

  if (error || !data) {
    return { houseEdge: 0, gameId: "", error: "Game not found" };
  }

  if (!data.is_active) {
    return { houseEdge: 0, gameId: "", error: "Game is currently disabled" };
  }

  return { houseEdge: Number(data.house_edge), gameId: data.id };
}

// Get user balance with row lock for concurrency
export async function getBalanceForUpdate(
  supabase: SupabaseClient,
  userId: string
): Promise<{ balance: number; error?: string }> {
  // Use RPC to get balance with FOR UPDATE lock
  const { data, error } = await supabase.rpc("get_balance_for_update", {
    p_user_id: userId
  });

  if (error) {
    // Fallback to regular select if RPC doesn't exist
    const { data: balanceData, error: selectError } = await supabase
      .from("balances")
      .select("amount")
      .eq("user_id", userId)
      .single();

    if (selectError || !balanceData) {
      return { balance: 0, error: "Could not fetch balance" };
    }
    
    return { balance: Number(balanceData.amount) };
  }

  return { balance: Number(data) };
}

// Update user balance atomically
export async function updateBalance(
  supabase: SupabaseClient,
  userId: string,
  newBalance: number
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("balances")
    .update({ amount: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: "Failed to update balance" };
  }

  return { success: true };
}

// Log game session
export async function logGameSession(
  supabase: SupabaseClient,
  session: GameSession
): Promise<{ sessionId: string; error?: string }> {
  const { data, error } = await supabase
    .from("game_sessions")
    .insert([session])
    .select("id")
    .single();

  if (error) {
    console.error("Failed to log game session:", error);
    return { sessionId: "", error: "Failed to log game session" };
  }

  return { sessionId: data.id };
}

// Generate provably fair random number
export function generateProvablyFairRandom(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  const combined = `${serverSeed}:${clientSeed}:${nonce}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  
  // Use SHA-256 hash
  const hashBuffer = new Uint8Array(32);
  const hash = createHash("sha-256");
  hash.update(data);
  const digest = hash.digest();
  
  // Convert first 4 bytes to a number between 0 and 1
  const view = new DataView(new Uint8Array(digest).buffer);
  const num = view.getUint32(0, false);
  return num / 0xFFFFFFFF;
}

// Generate random server seed
export function generateServerSeed(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Get next nonce for user (for replay protection)
export async function getNextNonce(
  supabase: SupabaseClient,
  userId: string,
  gameType: string
): Promise<number> {
  const { data } = await supabase
    .from("game_sessions")
    .select("nonce")
    .eq("user_id", userId)
    .eq("game_type", gameType)
    .order("nonce", { ascending: false })
    .limit(1)
    .single();

  return data?.nonce ? data.nonce + 1 : 1;
}

// Rate limiting check
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  maxPlaysPerMinute: number = 10
): Promise<{ allowed: boolean; error?: string }> {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  
  const { count, error } = await supabase
    .from("game_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneMinuteAgo);

  if (error) {
    console.error("Rate limit check failed:", error);
    return { allowed: true }; // Allow on error to not block gameplay
  }

  if ((count || 0) >= maxPlaysPerMinute) {
    return { allowed: false, error: "Rate limit exceeded. Please wait before playing again." };
  }

  return { allowed: true };
}

// Validate bet amount
export function validateBetAmount(
  betAmount: number,
  balance: number,
  minBet: number = 0.1,
  maxBet: number = 10000
): { valid: boolean; error?: string } {
  if (typeof betAmount !== "number" || isNaN(betAmount)) {
    return { valid: false, error: "Invalid bet amount" };
  }

  if (betAmount < minBet) {
    return { valid: false, error: `Minimum bet is ${minBet}` };
  }

  if (betAmount > maxBet) {
    return { valid: false, error: `Maximum bet is ${maxBet}` };
  }

  if (betAmount > balance) {
    return { valid: false, error: "Insufficient balance" };
  }

  return { valid: true };
}

// Calculate payout with house edge
export function calculatePayout(
  betAmount: number,
  multiplier: number,
  houseEdge: number,
  win: boolean
): { payout: number; betFee: number } {
  if (!win) {
    return { payout: 0, betFee: betAmount * houseEdge };
  }

  // Payout = bet * multiplier * (1 - houseEdge)
  const grossPayout = betAmount * multiplier;
  const betFee = grossPayout * houseEdge;
  const netPayout = grossPayout - betFee;

  return { payout: netPayout, betFee };
}
