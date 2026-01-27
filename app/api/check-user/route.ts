import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      throw new Error("Missing required field: address");
    }

    // Check if user exists in the database
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, wallet_address")
      .eq("wallet_address", address.toLowerCase())
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
