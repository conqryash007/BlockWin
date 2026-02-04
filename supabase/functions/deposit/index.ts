import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user via JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Client for user auth verification
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service role client for DB operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Parse request body
    const body = await req.json();
    const { txHash, amount, tokenAddress, network } = body;

    if (!txHash || !amount || !tokenAddress) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: txHash, amount, tokenAddress', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing deposit:', { userId, txHash, amount, network });

    // Check if transaction already exists (prevent double processing)
    const { data: existingTx } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('tx_hash', txHash)
      .maybeSingle();

    if (existingTx) {
      return new Response(
        JSON.stringify({ error: 'Transaction already processed', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Record Transaction
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount: Number(amount),
        tx_hash: txHash,
        metadata: {
          token: tokenAddress,
          network: network || 'ethereum',
          timestamp: new Date().toISOString()
        },
        game_type: 'wallet'
      });

    if (txError) {
      console.error('Error recording transaction:', txError);
      return new Response(
        JSON.stringify({ error: 'Failed to record transaction', success: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Update Balance
    // Check if balance record exists
    const { data: balanceRecord } = await supabaseAdmin
      .from('balances')
      .select('amount')
      .eq('user_id', userId)
      .maybeSingle();

    let newBalance = 0;
    let balanceError = null;

    if (balanceRecord) {
      const currentAmount = Number(balanceRecord.amount) || 0;
      newBalance = currentAmount + Number(amount);

      const { error } = await supabaseAdmin
        .from('balances')
        .update({ amount: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      balanceError = error;
    } else {
      newBalance = Number(amount);
      const { error } = await supabaseAdmin
        .from('balances')
        .insert({ user_id: userId, amount: newBalance });
      balanceError = error;
    }

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      return new Response(
        JSON.stringify({ error: 'Balance update failed', success: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deposit successful:', { userId, newBalance });

    return new Response(
      JSON.stringify({ success: true, balance: newBalance }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Deposit edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Server error', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
