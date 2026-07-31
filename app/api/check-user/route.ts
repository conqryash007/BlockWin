import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Helper to check if address is Tron (Base58 - starts with T)
function isTronAddress(address: string): boolean {
  return address.startsWith('T') && address.length === 34;
}

// Rate limited by IP: this endpoint confirms whether a wallet address has an
// account, so unbounded access allows enumerating the user base.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  recent.push(now);
  requestLog.set(ip, recent);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (requestLog.size > 5000) {
    for (const [key, times] of requestLog) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) requestLog.delete(key);
    }
  }

  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const { address } = await request.json();

    if (!address) {
      throw new Error("Missing required field: address");
    }

    // TRON: use address as-is (case-sensitive). EVM: use lowercase
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, wallet_address")
      .eq("wallet_address", isTronAddress(address) ? address : address.toLowerCase())
      .single();

    // If no user found, PGRST116 error is returned (not an actual error)
    const exists = !!user && !error;

    return NextResponse.json({ exists });

  } catch (error: any) {
    // If the error is "no rows", user doesn't exist
    if (error.code === "PGRST116") {
      return NextResponse.json({ exists: false });
    }
    
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
