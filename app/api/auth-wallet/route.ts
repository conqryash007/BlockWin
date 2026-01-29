import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';
import bs58 from 'bs58';


// Helper to check if address is Tron (Base58)
function isTronAddress(address: string): boolean {
    return address.startsWith('T') && address.length === 34;
}

// Helper to decode Tron address to hex
function decodeTronAddress(address: string): string {
    const decoded = bs58.decode(address);
    // Remove last 4 bytes (checksum)
    const noChecksum = decoded.slice(0, -4);
    // Convert to hex string
    return '0x' + Buffer.from(noChecksum).toString('hex');
}

// Helper to verify Tron signature
function verifyTronSignature(address: string, message: string, signature: string): string {
    // Tron signed message prefix
    const TRON_MESSAGE_PREFIX = '\x19TRON Signed Message:\n32';
    // Logic: In a full implementation we would recover the public key from signature
    // For this environment, we can rely on standard recovery if compatible,
    // Or we use the verifyMessage from viem but we must adjust the message or address?

    // ACTUALLY: Viem's verifyMessage expects standard Ethereum signed message prefix: "\x19Ethereum Signed Message:\n" + len + message.
    // TronLink signs with "\x19TRON Signed Message:\n" + len + message.
    // However, the signature itself is standard ECDSA.
    // To verify TRON signature using standard tools is tricky without a dedicated Tron lib on backend.
    
    // BUT: we can use a trick. If we can't easily verify the custom prefix with viem,
    // we should trust the recovered address if we can adjust the prefix.
    // Since we don't have a Tron-specific verifier package installed easily without adding massive weight (like full tronweb),
    // We will attempt to use 'verifyMessage' but we need to handle the prefix difference.
    
    // WAIT! Tron signatures are compatible with Eth tools IF checking the signature against the hash of (Prefix + Message).
    // Viem hashes the message with Eth prefix automatically.
    
    // SOLUTION: Use 'recoverMessageAddress' or similar to recover, but we need to construct the hash manually or just assume we need a proper verification.
    // given the constraints and tools (viem), the best way is:
    
    // Actually, 'verifyMessage' in viem forces Eth prefix.
    // We need to use `recoverAddress` on the hash of the Tron message.
    
    return address; // Placeholder, see Logic below in implementation
}


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
    let isValidSignature = false;
    let debugLogs: string[] = [];
    const log = (msg: string) => { 
        console.log(msg); 
        debugLogs.push(msg); 
    };

    if (isTronAddress(address)) {
        // TRON VERIFICATION
        
        try {
             // Robust import for TronWeb to handle ESM/CommonJS/Version differences
             const TronWebLib = require('tronweb');
             // Check if it's a default export, or named, or the object itself
             const TronWebConstructor = TronWebLib.TronWeb || TronWebLib.default || TronWebLib;
             
             if (typeof TronWebConstructor !== 'function') {
                 throw new Error('TronWeb constructor not found in export');
             }

             // Initialize with fullHost
             const tronWeb = new TronWebConstructor({
                fullHost: 'https://api.trongrid.io'
             });
             
             log(`[TronVerify] Verifying message: "${message}"`);
             log(`[TronVerify] Against signature: ${signature}`);
             log(`[TronVerify] Claims to be from: ${address}`);

             // Trust Wallet might sign differently than TronLink.
             // Try V2 first (standard for TronLink)
             let verifiedAddress = null;
             try {
                verifiedAddress = await tronWeb.trx.verifyMessageV2(message, signature);
                log(`[TronVerify] V2 Result: ${verifiedAddress}`);
             } catch (e: any) {
                 log(`[TronVerify] V2 Error: ${e.message}`);
             }

             if (verifiedAddress !== address) {
                 // Try V1 (older standard or different prefix handling)
                 log("[TronVerify] V2 mismatch or failed, trying V1...");
                 try {
                     const v1Result = await tronWeb.trx.verifyMessage(message, signature);
                     log(`[TronVerify] V1 Result: ${v1Result}`);
                     // verifyMessage returns boolean in some versions, or address in others?
                     if (typeof v1Result === 'string') {
                         verifiedAddress = v1Result;
                     } 
                 } catch (e: any) {
                     log(`[TronVerify] V1 Error: ${e.message}`);
                 }
             }
             
             if (verifiedAddress === address) {
                 log("[TronVerify] MATCH CONFIRMED");
                 isValidSignature = true;
             } else {
                 log(`[TronVerify] FAILED. Expected ${address}, got ${verifiedAddress}`);
             }
        } catch (e: any) {
            log(`[TronVerify] Critical Error: ${e.message}`);
            isValidSignature = false;
        }

    } else {
        // ETHEREUM VERIFICATION
        try {
            isValidSignature = await verifyMessage({
                address: address as `0x${string}`,
                message,
                signature: signature as `0x${string}`,
            });
        } catch (e: any) {
            log(`[EVMVerify] Error: ${e.message}`);
        }
    }

    if (!isValidSignature) {
      console.error(`Signature verification failed for address: ${address}`);
      return NextResponse.json(
        { error: "Invalid signature", debug: debugLogs },
        { status: 400 }
      );
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
      try {
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
          // Initialize balance for new user
          await supabaseAdmin
            .from("balances")
            .insert([{ user_id: authUser.user.id, amount: 0 }]);
        }
      } catch (createError: any) {
        console.warn("User creation failed, attempting sign-in fallback:", createError.message);
        // If creation failed (likely user exists), we proceed to sign-in/password update logic below
        // preventing the "Database error creating new user" from blocking the flow.
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
