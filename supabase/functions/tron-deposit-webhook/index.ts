import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-qn-api-version, x-qn-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Your Tron CasinoDeposit contract address (mainnet)
const TRON_CASINO_CONTRACT = 'TLvMnfDNjBwvabX1SXMC2DzegL897YJz11';
const TRON_USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

// Deposit event signature for Tron (same as Solidity but encoded differently)
// Deposit(address indexed user, address indexed token, uint256 amount, uint256 timestamp, bytes32 indexed depositId)

interface TronEvent {
  transaction_id: string;
  block_number: number;
  block_timestamp: number;
  contract_address: string;
  event_name: string;
  result: {
    user?: string;
    token?: string;
    amount?: string;
    timestamp?: string;
    depositId?: string;
    [key: string]: any;
  };
  result_type?: {
    [key: string]: string;
  };
}

interface QuickNodePayload {
  // QuickNode sends array of matched events
  data?: TronEvent[];
  // Or single event depending on configuration
  transaction_id?: string;
  block_number?: number;
  event_name?: string;
  result?: any;
  [key: string]: any;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get QuickNode signature for validation (optional but recommended)
    const qnSignature = req.headers.get('x-qn-signature');
    const validationToken = Deno.env.get('QUICKNODE_VALIDATION_TOKEN');
    
    // Optional: Validate signature if you've set up HMAC
    // For now, we'll accept all requests but log the signature
    console.log('Received webhook, signature:', qnSignature ? 'present' : 'missing');

    const payload: QuickNodePayload = await req.json();
    console.log('Tron webhook payload:', JSON.stringify(payload));

    // Handle both array and single event formats
    const events: TronEvent[] = Array.isArray(payload.data) 
      ? payload.data 
      : (payload.transaction_id ? [payload as unknown as TronEvent] : []);

    if (events.length === 0) {
      console.log('No events in payload');
      return new Response(
        JSON.stringify({ success: true, message: 'No events to process' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let processedCount = 0;

    for (const event of events) {
      // Only process Deposit events from our contract
      if (event.event_name !== 'Deposit') {
        console.log(`Skipping non-Deposit event: ${event.event_name}`);
        continue;
      }

      const txHash = event.transaction_id;
      const userAddress = event.result?.user;
      const tokenAddress = event.result?.token;
      const amount = event.result?.amount;

      if (!txHash || !userAddress || !amount) {
        console.log('Missing required fields in event:', event);
        continue;
      }

      console.log('Processing Tron deposit:', { txHash, userAddress, amount });

      // Check if transaction already processed
      const { data: existingTx } = await supabaseAdmin
        .from('transactions')
        .select('id')
        .eq('tx_hash', txHash)
        .maybeSingle();

      if (existingTx) {
        console.log(`Transaction ${txHash} already processed, skipping`);
        continue;
      }

      // Find user by their Tron wallet address
      // Note: You need to store wallet addresses in your users table
      // For now, we'll check if there's a mapping
      const { data: userData } = await supabaseAdmin
        .from('wallet_addresses')
        .select('user_id')
        .eq('address', userAddress)
        .eq('network', 'tron')
        .maybeSingle();

      if (!userData) {
        console.log(`No user found for Tron address ${userAddress}`);
        // Still record the transaction for manual reconciliation
        await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: null,
            type: 'deposit',
            amount: Number(amount) / 1e6, // USDT has 6 decimals
            tx_hash: txHash,
            metadata: {
              token: tokenAddress,
              network: 'tron',
              user_address: userAddress,
              status: 'pending_user_match',
              timestamp: new Date().toISOString()
            },
            game_type: 'wallet'
          });
        continue;
      }

      const userId = userData.user_id;
      const depositAmount = Number(amount) / 1e6; // USDT TRC20 has 6 decimals

      // Record transaction
      const { error: txError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount: depositAmount,
          tx_hash: txHash,
          metadata: {
            token: tokenAddress,
            network: 'tron',
            user_address: userAddress,
            block_number: event.block_number,
            timestamp: new Date().toISOString()
          },
          game_type: 'wallet'
        });

      if (txError) {
        console.error('Error recording transaction:', txError);
        continue;
      }

      // Update user balance
      const { data: balanceRecord } = await supabaseAdmin
        .from('balances')
        .select('amount')
        .eq('user_id', userId)
        .maybeSingle();

      if (balanceRecord) {
        const newBalance = Number(balanceRecord.amount) + depositAmount;
        await supabaseAdmin
          .from('balances')
          .update({ amount: newBalance, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      } else {
        await supabaseAdmin
          .from('balances')
          .insert({ user_id: userId, amount: depositAmount });
      }

      processedCount++;
      console.log(`Successfully processed Tron deposit for user ${userId}: ${depositAmount} USDT`);
    }

    return new Response(
      JSON.stringify({ success: true, processed: processedCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Tron webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
