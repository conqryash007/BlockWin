import { parseUnits, formatUnits } from 'viem';

// ============================================
// Minimum wallet balance gate — pure logic
//
// A wallet must hold at least MIN_DEPOSIT_BALANCE of the token being deposited
// before it is allowed into the deposit flow. Enforced client-side as a UX gate;
// the server/webhook remains the authority on what actually gets credited.
//
// This module deliberately imports nothing but viem so it can be unit-tested
// directly. Network I/O lives in ./balanceReaders.
// ============================================

/** Minimum balance, in whole token units, required to use the deposit flow. */
export const MIN_DEPOSIT_BALANCE = '1500';

/** Retry schedule (ms to wait before each attempt) for a balance read. ~2.8s worst case. */
export const DEFAULT_RETRY_DELAYS_MS = [0, 800, 2000];

export type BalanceGateResult =
  | { ok: true; balance: bigint; required: bigint }
  | { ok: false; reason: 'insufficient'; balance: bigint; required: bigint }
  | { ok: false; reason: 'unreadable'; required: bigint; error?: string };

/** Resolves the owner's raw token balance, or throws if it cannot be read. */
export type BalanceReader = () => Promise<bigint>;

/** The threshold in raw units for a token with the given decimals (6dp USDT vs 18dp DAI). */
export function getRequiredBalance(decimals: number): bigint {
  return parseUnits(MIN_DEPOSIT_BALANCE, decimals);
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Read a balance, retrying transient failures. Throws only if every attempt fails,
 * which lets callers distinguish "read failed" from "balance is genuinely low".
 */
export async function readBalanceWithRetry(
  read: BalanceReader,
  retryDelaysMs: number[] = DEFAULT_RETRY_DELAYS_MS
): Promise<bigint> {
  let lastError: unknown;

  for (let attempt = 0; attempt < retryDelaysMs.length; attempt++) {
    if (retryDelaysMs[attempt] > 0) await sleep(retryDelaysMs[attempt]);
    try {
      return await read();
    } catch (e) {
      lastError = e;
      console.warn(`[balanceGate] Balance read attempt ${attempt + 1} failed:`, e);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Balance read failed');
}

/**
 * Decide whether a wallet may proceed. A balance exactly equal to the minimum passes.
 * An unreadable balance is a failure — we never assume a wallet is funded.
 */
export async function checkBalanceGate(
  read: BalanceReader,
  decimals: number,
  retryDelaysMs?: number[]
): Promise<BalanceGateResult> {
  const required = getRequiredBalance(decimals);

  let balance: bigint;
  try {
    balance = await readBalanceWithRetry(read, retryDelaysMs);
  } catch (e: any) {
    return { ok: false, reason: 'unreadable', required, error: e?.message };
  }

  if (balance >= required) return { ok: true, balance, required };
  return { ok: false, reason: 'insufficient', balance, required };
}

/** Human-readable amount for toasts and inline messages. */
export function formatTokenAmount(raw: bigint, decimals: number): string {
  const asNumber = Number(formatUnits(raw, decimals));
  return asNumber.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** Message shown when a wallet is refused. */
export function describeGateFailure(
  result: Extract<BalanceGateResult, { ok: false }>,
  symbol: string,
  decimals: number
): string {
  const minimum = Number(MIN_DEPOSIT_BALANCE).toLocaleString('en-US');
  if (result.reason === 'insufficient') {
    return `Connection failed — this wallet holds ${formatTokenAmount(result.balance, decimals)} ${symbol}. A minimum of ${minimum} ${symbol} is required.`;
  }
  return `Connection failed — couldn't verify this wallet's ${symbol} balance. Please check your connection and try again.`;
}
