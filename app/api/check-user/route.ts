import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Helper to check if address is Tron (Base58 - starts with T)
function isTronAddress(address: string): boolean {
  return address.startsWith('T') && address.length === 34;
}

export async function POST(request: NextRequest) {
  try {
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
