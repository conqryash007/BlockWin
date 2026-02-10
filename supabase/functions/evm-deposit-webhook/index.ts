
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.7.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Event Signature for:
// event Deposit(address indexed user, address indexed token, uint256 amount, uint256 timestamp, bytes32 indexed depositId)
// We calculate it dynamically or hardcode it to ensure correctness
const DEPOSIT_EVENT_SIGNATURE = "Deposit(address,address,uint256,uint256,bytes32)";

const DEPOSIT_TOPIC = ethers.id(DEPOSIT_EVENT_SIGNATURE);

interface WebhookPayload {
  // Generic structure to support multiple providers (Alchemy, QuickNode, Custom)
  // We look for 'logs' or 'event' array
  logs?: any[]; // Standard JSON-RPC or Alchemy
  result?: any; // QuickNode sometimes
  
  // Direct fields if pre-parsed
  txHash?: string;
  userAddress?: string;
  tokenAddress?: string;
  amount?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const payload: WebhookPayload = await req.json();
    console.log('Received EVM webhook payload');

    let logsToProcess: any[] = [];

    // Normalize payload
    if (payload.type === 'ADDRESS_ACTIVITY' && payload.event && Array.isArray(payload.event.activity)) {
        // Alchemy Address Activity (Transfers)
        logsToProcess = payload.event.activity.map((activity: any) => ({
            type: 'alchemy_activity',
            data: activity,
            transactionHash: activity.hash
        }));
    } else if (Array.isArray(payload.logs)) {
      logsToProcess = payload.logs;
    } else if (Array.isArray(payload)) {
      logsToProcess = payload; // Raw array
    } else if (payload.result && Array.isArray(payload.result.logs)) {
      logsToProcess = payload.result.logs;
    } else if (payload.txHash && payload.amount && payload.userAddress) {
        // Direct payload
        logsToProcess = [{
            transactionHash: payload.txHash,
            topics: [],
            directData: payload
        }];
    }

    let processedCount = 0;

    for (const log of logsToProcess) {
      let txHash = log.transactionHash;
      let userAddress = '';
      let tokenAddress = '';
      let amountStr = '0';
      let extractedDecimals: number | undefined;

      if (log.type === 'alchemy_activity') {
          // Handle Alchemy Activity (Transfer)
          const activity = log.data;
          txHash = activity.hash;
          
          // For deposits TO the casino contract, the user is the sender (fromAddress)
          // The toAddress would be the casino contract being monitored
          userAddress = activity.fromAddress;
          
          // Get token address - rawContract.address for ERC20 tokens
          // activity.asset will be "ETH" for native transfers, which we skip
          const rawTokenAddress = activity.rawContract?.address;
          
          // Skip native ETH/currency transfers - we only support stablecoin deposits
          // Also skip if asset is ETH or if rawTokenAddress is missing/invalid
          if (!rawTokenAddress || 
              activity.asset === 'ETH' || 
              activity.category === 'external' ||
              rawTokenAddress === 'ETH' ||
              !rawTokenAddress.startsWith('0x') ||
              rawTokenAddress.length !== 42) {
              console.log(`Skipping native/invalid transfer (asset: ${activity.asset}, category: ${activity.category}, rawToken: ${rawTokenAddress})`);
              continue;
          }
          
          tokenAddress = rawTokenAddress;
          amountStr = activity.rawContract?.rawValue || activity.value?.toString() || '0';
          
          if (activity.rawContract?.decimals) {
              extractedDecimals = Number(activity.rawContract.decimals);
          }
          
          console.log(`Processing ERC20 transfer: token=${tokenAddress}, amount=${amountStr}, to=${userAddress}`);
          
      } else if (log.topics && log.topics.length > 0) {
        // Standard Event Log
        if (log.topics[0] !== DEPOSIT_TOPIC) {
            console.log(`Skipping log with topic ${log.topics[0]} (expected ${DEPOSIT_TOPIC})`);
            continue;
        }
        
        if (log.topics.length < 4) {
            console.error('Log has insufficient topics for Deposit event');
            continue;
        }

        // Extract addresses from topics (they are 32-byte padded)
        // Use getAddress to properly parse the padded address
        try {
            userAddress = ethers.getAddress('0x' + log.topics[1].slice(-40));
            tokenAddress = ethers.getAddress('0x' + log.topics[2].slice(-40));
        } catch (addrError) {
            console.log(`Failed to parse addresses from topics:`, addrError);
            continue;
        }
        
        const abiCoder = new ethers.AbiCoder();
        const decodedData = abiCoder.decode(['uint256', 'uint256'], log.data);
        
        amountStr = decodedData[0].toString();
        
      } else if (log.directData) {
          // Direct
          txHash = log.directData.txHash;
          userAddress = log.directData.userAddress;
          tokenAddress = log.directData.tokenAddress;
          amountStr = log.directData.amount;
      } else {
        console.log('Log missing topics/data, skipping');
        continue;
      }

      // 1b. Token Configuration (Address -> Decimals)
      // Copied from lib/contracts.ts for Deno compatibility
      const TOKEN_DECIMALS: Record<string, number> = {
        // Mainnet
        '0xdAC17F958D2ee523a2206206994597C13D831ec7': 6,  // USDT
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 6,  // USDC
        '0x6B175474E89094C44Da98b954EedeAC495271d0F': 18, // DAI
        
        // Sepolia (Testnet)
        '0x27D4F6456D51f6A1f943C1f599c36D2E4F5958aF': 6,  // USDT
        '0x83dB56E78912C649495B9a63E85b000fc73CD0f3': 6,  // USDC
        '0xaCAaBf070D3B9E5EBf416b9b950ED4B3E19c81Db': 6,  // DAI
      };

      // Validate and normalize token address
      // Skip if tokenAddress is not a valid hex address (e.g., "ETH", empty, etc.)
      if (!tokenAddress || !tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
          console.log(`Skipping invalid token address: ${tokenAddress}`);
          continue;
      }
      
      let normalizedTokenAddress: string;
      try {
          normalizedTokenAddress = ethers.getAddress(tokenAddress); // Checksummed
      } catch (e) {
          console.log(`Failed to normalize token address ${tokenAddress}:`, e);
          continue;
      }
      
      let decimals = 18;
      if (extractedDecimals !== undefined) {
          decimals = extractedDecimals;
      } else {
          decimals = TOKEN_DECIMALS[normalizedTokenAddress] || 18; // Default to 18
      }

      // 2. Idempotency Check
      const { data: existingTx } = await supabaseAdmin
        .from('transactions')
        .select('id')
        .eq('tx_hash', txHash)
        .maybeSingle();

      if (existingTx) {
        console.log(`Transaction ${txHash} already processed.`);
        continue;
      }

      // 3. Find User
      const normalizedUserAddress = userAddress.toLowerCase();
      
      const { data: walletData } = await supabaseAdmin
        .from('wallet_addresses')
        .select('user_id')
        .eq('address', normalizedUserAddress) 
        .eq('network', 'ethereum')
        .maybeSingle();

      let userId = walletData?.user_id;

      if (!userId) {
           const { data: walletDataRetry } = await supabaseAdmin
            .from('wallet_addresses')
            .select('user_id')
            .ilike('address', normalizedUserAddress)
            .maybeSingle();
            
           userId = walletDataRetry?.user_id;
           
           if (!userId) {
               console.log(`User not found for address ${userAddress}`);
               continue;
           }
      }

      // 3b. Check Welcome Bonus Eligibility
      const WELCOME_BONUS_AMOUNT = 10;
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('welcome_bonus_status')
        .eq('id', userId)
        .single();
      
      const bonusStatus = userData?.welcome_bonus_status;
      const bonusEligible = bonusStatus !== 'credited';
      console.log(`User ${userId} bonus status: ${bonusStatus}, eligible: ${bonusEligible}`);

      // 4. Normalize Amount
      const amountBig = BigInt(amountStr);
      const normalizedAmount = Number(ethers.formatUnits(amountBig, decimals));
      
      console.log(`Processing deposit: Token=${normalizedTokenAddress} Decimals=${decimals} Amount=${normalizedAmount}`);

      // 5. Insert Transaction
      const { error: txError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount: normalizedAmount,
          tx_hash: txHash,
          metadata: {
            token: tokenAddress, // Keep original input
            mapped_token: normalizedTokenAddress,
            network: 'ethereum',
            from: userAddress,
            raw_amount: amountStr,
            source: 'webhook'
          },
          game_type: 'wallet'
        });

      if (txError) {
        console.error('Error inserting transaction:', txError);
        continue;
      }

      // 6. Update Balance (deposit + bonus if eligible)
      const bonusAmount = bonusEligible ? WELCOME_BONUS_AMOUNT : 0;
      const totalCredit = normalizedAmount + bonusAmount;
      
      const { data: balanceRecord } = await supabaseAdmin
        .from('balances')
        .select('amount')
        .eq('user_id', userId)
        .maybeSingle();

      let newBalance = 0;
      if (balanceRecord) {
        newBalance = Number(balanceRecord.amount) + totalCredit;
        await supabaseAdmin
          .from('balances')
          .update({ amount: newBalance, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      } else {
        newBalance = totalCredit;
        await supabaseAdmin
          .from('balances')
          .insert({ user_id: userId, amount: newBalance });
      }

      // 7. If bonus was credited, record it and update user status
      if (bonusEligible) {
        // Record bonus transaction
        await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: userId,
            type: 'bonus',
            amount: WELCOME_BONUS_AMOUNT,
            tx_hash: null,
            metadata: {
              type: 'welcome_bonus',
              related_deposit_tx: txHash,
              source: 'webhook'
            },
            game_type: 'wallet'
          });
        
        // Update user status
        await supabaseAdmin
          .from('users')
          .update({
            first_deposit_at: new Date().toISOString(),
            welcome_bonus_status: 'credited',
            welcome_bonus_credited_at: new Date().toISOString()
          })
          .eq('id', userId);
        
        console.log(`Credited $${WELCOME_BONUS_AMOUNT} welcome bonus to user ${userId}`);
      }

      processedCount++;
      console.log(`Processed deposit ${txHash} for user ${userId}: deposit=${normalizedAmount}, bonus=${bonusAmount}, total=${totalCredit}`);
    }

    return new Response(
      JSON.stringify({ success: true, processed: processedCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
