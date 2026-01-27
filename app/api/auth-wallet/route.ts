import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

// Hash the signature to create a valid password (max 72 chars for Supabase)
function hashSignatureForPassword(signature: string): string {
  return crypto.createHash('sha256').update(signature).digest('hex').slice(0, 64);
}

export async function POST(request: NextRequest) {
  try {
    const { address, signature, nonce } = await request.json();

    if (!address || !signature || nonce === undefined || nonce === null) {
      console.error("Missing fields:", { address, signatureSent: !!signature, nonce });
      throw new Error("Missing required fields: address, signature, or nonce");
    }

    // Hash the signature for use as password (signatures are too long for Supabase's 72 char limit)
    const hashedPassword = hashSignatureForPassword(signature);

    // 1. Verify Signature
    console.log(`Verifying for address: ${address}, nonce: ${nonce}`);
    const message = `Sign this message to login to BlockWin Casino. Nonce: ${nonce}`;
    const isValidSignature = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValidSignature) {
      console.error(`Signature verification failed for address: ${address}`);
      throw new Error("Invalid signature");
    }
    console.log("Signature verified.");

    // 2. Check/Create User
    let { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("wallet_address", address.toLowerCase())
      .single();

    if (!user) {
      // Create new user (using admin auth)
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: `${address}@blockwin.casino`,
        password: hashedPassword,
        email_confirm: true,
        user_metadata: { wallet_address: address }
      });
      
      if (authError) throw authError;

      // Ensure entry in public.users (if not triggered by webhook)
      const { data: newUser, error: curError } = await supabaseAdmin
        .from("users")
        .insert([{ id: authUser.user.id, wallet_address: address.toLowerCase() }])
        .select()
        .single();
        
      if (curError) {
        // duplicate key implies webhook handled it. fetch again.
        const { data: existing } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("wallet_address", address.toLowerCase())
          .single();
        user = existing;
      } else {
        user = newUser;
      }
    }

    // 3. Create Session (Sign in to get JWT)
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: `${address}@blockwin.casino`,
      password: hashedPassword,
    });

    // If password login fails (e.g. password changed), we need to reset it
    if (sessionError) {
      console.log("Initial sign-in failed, updating password. Error:", sessionError.message);
      
      // Look up the auth user by email to get the correct ID
      const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error("Failed to list auth users:", listError);
        throw listError;
      }
      
      const authUser = authUsers.find(
        u => u.email?.toLowerCase() === `${address.toLowerCase()}@blockwin.casino`
      );
      
      if (!authUser) {
        console.error("Auth user not found for email:", `${address}@blockwin.casino`);
        throw new Error("Auth user not found");
      }
      
      console.log("Found auth user with id:", authUser.id);
      
      // Update password to current hashed signature so we can login
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        authUser.id,
        { password: hashedPassword }
      );
      
      if (updateError) {
        console.error("Failed to update password:", updateError);
        throw updateError;
      }
      
      console.log("Password updated, retrying sign-in...");
      
      const { data: retrySession, error: retryError } = await supabaseAdmin.auth.signInWithPassword({
        email: `${address}@blockwin.casino`,
        password: hashedPassword,
      });
      
      if (retryError) {
        console.error("Retry sign-in failed:", retryError);
        throw retryError;
      }
      
      return NextResponse.json(retrySession);
    }

    return NextResponse.json(sessionData);

  } catch (error: any) {
    console.error("Auth wallet error:", error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 400 }
    );
  }
}
