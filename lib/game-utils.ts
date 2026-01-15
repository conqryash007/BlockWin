/**
 * Game Utilities for Next.js API Routes
 * 
 * Server-side game logic utilities:
 * - Provably fair random number generation
 * - House edge calculations
 * - Balance management
 * - Game session logging
 */

import { createHash } from 'crypto';
import { supabaseAdmin } from './supabase-admin';

// Types
export interface GameSession {
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

// Get user from authorization header
export async function getUserFromToken(authHeader: string | null): Promise<{ userId: string; error?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: '', error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { userId: '', error: 'Invalid or expired token' };
  }

  return { userId: user.id };
}

// Fetch house edge for a game
export async function getHouseEdge(gameSlug: string): Promise<{ houseEdge: number; gameId: string; error?: string }> {
  const { data, error } = await supabaseAdmin
    .from('games')
    .select('id, house_edge, is_active')
    .eq('slug', gameSlug)
    .single();

  if (error || !data) {
    return { houseEdge: 0, gameId: '', error: 'Game not found' };
  }

  if (!data.is_active) {
    return { houseEdge: 0, gameId: '', error: 'Game is currently disabled' };
  }

  return { houseEdge: Number(data.house_edge), gameId: data.id };
}

// Get user balance
export async function getBalance(userId: string): Promise<{ balance: number; error?: string }> {
  const { data, error } = await supabaseAdmin
    .from('balances')
    .select('amount')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { balance: 0, error: 'Could not fetch balance' };
  }

  return { balance: Number(data.amount) };
}

// Update user balance
export async function updateBalance(userId: string, newBalance: number): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from('balances')
    .update({ amount: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: 'Failed to update balance' };
  }

  return { success: true };
}

// Log game session
export async function logGameSession(session: GameSession): Promise<{ sessionId: string; error?: string }> {
  const { data, error } = await supabaseAdmin
    .from('game_sessions')
    .insert([session])
    .select('id')
    .single();

  if (error) {
    console.error('Failed to log game session:', error);
    return { sessionId: '', error: 'Failed to log game session' };
  }

  return { sessionId: data.id };
}

// Generate provably fair random number using SHA-256
export function generateProvablyFairRandom(serverSeed: string, clientSeed: string, nonce: number): number {
  const combined = `${serverSeed}:${clientSeed}:${nonce}`;
  const hash = createHash('sha256').update(combined).digest('hex');
  
  // Convert first 8 hex chars to a number between 0 and 1
  const num = parseInt(hash.substring(0, 8), 16);
  return num / 0xFFFFFFFF;
}

// Generate random server seed
export function generateServerSeed(): string {
  const array = new Uint8Array(32);
  require('crypto').randomFillSync(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Get next nonce for user (for replay protection)
export async function getNextNonce(userId: string, gameType: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('game_sessions')
    .select('nonce')
    .eq('user_id', userId)
    .eq('game_type', gameType)
    .order('nonce', { ascending: false })
    .limit(1)
    .single();

  return data?.nonce ? data.nonce + 1 : 1;
}

// Rate limiting check
export async function checkRateLimit(userId: string, maxPlaysPerMinute: number = 10): Promise<{ allowed: boolean; error?: string }> {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  
  const { count, error } = await supabaseAdmin
    .from('game_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneMinuteAgo);

  if (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true }; // Allow on error to not block gameplay
  }

  if ((count || 0) >= maxPlaysPerMinute) {
    return { allowed: false, error: 'Rate limit exceeded. Please wait before playing again.' };
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
  if (typeof betAmount !== 'number' || isNaN(betAmount)) {
    return { valid: false, error: 'Invalid bet amount' };
  }

  if (betAmount < minBet) {
    return { valid: false, error: `Minimum bet is ${minBet}` };
  }

  if (betAmount > maxBet) {
    return { valid: false, error: `Maximum bet is ${maxBet}` };
  }

  if (betAmount > balance) {
    return { valid: false, error: 'Insufficient balance' };
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

  const grossPayout = betAmount * multiplier;
  const betFee = grossPayout * houseEdge;
  const netPayout = grossPayout - betFee;

  return { payout: netPayout, betFee };
}
