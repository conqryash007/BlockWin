"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAccount, useReadContract, useDisconnect, useWriteContract } from 'wagmi';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { maxUint256 } from 'viem';
import { CONTRACTS, SUPPORTED_TOKENS } from '@/lib/contracts';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { AuthContext, AuthContextType } from '@/hooks/useAuth';

const USDT_ADDRESS = SUPPORTED_TOKENS.USDT.address;

export function AuthProvider({ children }: { children: ReactNode }) {
  // 1. Wallet Connection State (Wagmi + Tron) - Purely for deposits/games
  const { address, isConnected } = useAccount();
  const { 
    address: tronAddress, 
    connected: isTronConnected, 
    disconnect: disconnectTron
  } = useWallet();
  const { disconnectAsync } = useDisconnect();

  // 2. Auth State (Supabase / Google)
  const [loading, setLoading] = useState(true); // Start loading to check session
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  
  // 3. Contract State (Allowances)
  const { writeContractAsync } = useWriteContract();
  
  // Read current USDT allowance (EVM)
  const { data: usdtAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDT_ADDRESS,
    abi: CONTRACTS.ERC20.abi,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.CasinoDeposit.address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // State for Tron allowance
  const [usdtAllowanceTron, setUsdtAllowanceTron] = useState<bigint | undefined>(undefined);

  // Fetch Tron Allowance
  const fetchTronAllowance = useCallback(async () => {
      if (!isTronConnected || !tronAddress) {
          setUsdtAllowanceTron(undefined);
          return;
      }
      // Simple optimistic check or API fallback could go here.
      // For now, keeping the logic lightweight or re-implementing if needed.
      // To match previous functionality, we'll just set it to undefined or implement basic check if requested.
      // Since 'existing features' must be preserved, we should check allowance if possible.
      
      try {
          // Try injected wallet first
          const injectedTronWeb = (window as any).tronWeb ?? (window as any).tronLink?.tronWeb;
          if (injectedTronWeb && injectedTronWeb.ready) {
             // Assuming contracts are available in current scope or hardcoded from config
             // For strict correctness, we imported CONTRACTS.
             const isProd = process.env.NEXT_PUBLIC_NETWORK_ENV === 'mainnet';
             const tronConfig = isProd ? CONTRACTS.TRON_CONFIG.mainnet : CONTRACTS.TRON_CONFIG.shasta;
             
             const usdtContract = await injectedTronWeb.contract().at(tronConfig.usdt);
             const allowance = await usdtContract.allowance(tronAddress, tronConfig.casinoDepositAddress).call();
             const allowValue = allowance?.toString ? BigInt(allowance.toString()) : BigInt(0);
             setUsdtAllowanceTron(allowValue);
          } else {
             // Fallback to API if implemented, or just 0
             setUsdtAllowanceTron(undefined); 
          }
      } catch (e) {
          console.warn("Failed to fetch Tron allowance:", e);
      }
  }, [isTronConnected, tronAddress]);

  useEffect(() => {
      fetchTronAllowance();
  }, [fetchTronAllowance]);

  // Register wallet addresses when user connects wallet while authenticated
  // This enables webhooks to match deposits to users
  // Security: Prevents wallet hijacking by checking if wallet is already registered to another user
  const registerWalletAddress = useCallback(async (walletAddress: string, network: 'ethereum' | 'tron') => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user) return;

      const userId = currentSession.user.id;

      // First, check if this wallet is already registered (case-insensitive for EVM addresses)
      const { data: existingWallet } = await supabase
        .from('wallet_addresses')
        .select('user_id')
        .ilike('address', walletAddress)  // Case-insensitive comparison
        .eq('network', network)
        .maybeSingle();

      if (existingWallet) {
        // Wallet already registered - check if it belongs to this user
        if (existingWallet.user_id === userId) {
          // Already registered to this user - no action needed
          console.log(`Wallet already registered to this user: ${walletAddress} (${network})`);
          return;
        } else {
          // Wallet registered to ANOTHER user - security risk, don't allow hijacking
          console.warn(`Wallet ${walletAddress} is already registered to another user. Cannot re-register.`);
          // Optionally show a toast warning to user
          // toast.warning('This wallet is already linked to another account');
          return;
        }
      }

      // Wallet not registered - insert new record (store in original format)
      const { error } = await supabase
        .from('wallet_addresses')
        .insert({
          user_id: userId,
          address: walletAddress,  // Store in original checksum format
          network: network,
          is_primary: true,
        });

      if (error) {
        // Handle race condition - might have been inserted by another process
        if (error.message?.includes('duplicate') || error.code === '23505') {
          console.log(`Wallet already registered (race condition): ${walletAddress}`);
        } else {
          console.warn('Failed to register wallet address:', error);
        }
      } else {
        console.log(`Wallet address registered: ${walletAddress} (${network})`);
      }
    } catch (e) {
      console.warn('Error registering wallet address:', e);
    }
  }, [supabase]);

  // Check if a wallet is owned by another user - returns email if so
  // This is called BEFORE deposit to warn users
  const checkWalletOwnership = useCallback(async (walletAddress: string, network: 'ethereum' | 'tron') => {
    console.log('[checkWalletOwnership] Checking wallet:', walletAddress, 'network:', network);
    
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user) {
        console.log('[checkWalletOwnership] No session, skipping check');
        return { isOwnedByOther: false };
      }

      const userId = currentSession.user.id;
      console.log('[checkWalletOwnership] Current user ID:', userId);

      // Check if this wallet is already registered (case-insensitive for EVM addresses)
      const { data: existingWallet, error: walletError } = await supabase
        .from('wallet_addresses')
        .select('user_id')
        .ilike('address', walletAddress)  // Case-insensitive comparison
        .eq('network', network)
        .maybeSingle();

      console.log('[checkWalletOwnership] Wallet lookup result:', existingWallet, 'error:', walletError);

      if (walletError) {
        console.warn('[checkWalletOwnership] Error fetching wallet:', walletError);
        return { isOwnedByOther: false };
      }

      if (existingWallet && existingWallet.user_id !== userId) {
        // Wallet belongs to another user - fetch their email from users table
        console.log('[checkWalletOwnership] Wallet belongs to different user:', existingWallet.user_id);
        
        const { data: ownerData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', existingWallet.user_id)
          .maybeSingle();
        
        console.log('[checkWalletOwnership] Owner lookup result:', ownerData, 'error:', userError);
        
        const ownerEmail = ownerData?.email || 'another account';
        console.log('[checkWalletOwnership] Returning conflict with email:', ownerEmail);
        return { isOwnedByOther: true, ownerEmail };
      }

      console.log('[checkWalletOwnership] No conflict found');
      return { isOwnedByOther: false };
    } catch (e) {
      console.warn('[checkWalletOwnership] Error:', e);
      return { isOwnedByOther: false };
    }
  }, [supabase]);

  // Auto-register wallet addresses when wallet connects while user is authenticated
  // This ensures webhooks can match deposits to users immediately on connection
  useEffect(() => {
    const registerOnConnect = async () => {
      // Only register if user is authenticated
      if (!session?.user) return;
      
      // Register EVM wallet if connected
      if (isConnected && address) {
        console.log('[AuthProvider] Auto-registering EVM wallet on connection:', address);
        await registerWalletAddress(address, 'ethereum');
      }
      
      // Register Tron wallet if connected
      if (isTronConnected && tronAddress) {
        console.log('[AuthProvider] Auto-registering Tron wallet on connection:', tronAddress);
        await registerWalletAddress(tronAddress, 'tron');
      }
    };
    
    registerOnConnect();
  }, [session, isConnected, address, isTronConnected, tronAddress, registerWalletAddress]);

  // Check unlimited approval
  const hasUnlimitedApproval = 
    (isConnected && usdtAllowance !== undefined && (usdtAllowance as bigint) >= maxUint256 / BigInt(2)) ||
    (isTronConnected && usdtAllowanceTron !== undefined && usdtAllowanceTron >= maxUint256 / BigInt(2));
  
  // 4. Auth Implementation
  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      
      // Use configured app URL for OAuth redirect to ensure it's whitelisted in Supabase/Google
      // This prevents issues with Netlify preview deploys having unwhitelisted URLs
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/auth/callback`,
        },
      });
      if (error) throw error;
      // Redirect happens automatically
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login with Google');
      setLoading(false);
    }
  };

  const logout = async () => {
     try {
         await supabase.auth.signOut();
         setSession(null);
         setUser(null);
         toast.success('Logged out');
         
         // Optional: Disconnect wallet on logout?
         // User said "Wallet connection is secondary".
         // Typically it's nice to keep them separate, but previous code disconnected wallet.
         // Let's Keep wallet connected to avoid annoyance, unless specifically asked.
         // Actually, let's disconnect to ensure a "clean exit" feeling.
         if (isConnected) await disconnectAsync();
         if (isTronConnected) await disconnectTron();
         
     } catch (e) {
         console.error("Logout error:", e);
     }
  };

  return (
    <AuthContext.Provider value={{
      login: loginWithGoogle, // Replaced signature login with Google Login
      logout,
      loading,
      session,
      user,
      isAuthenticated: !!session,
      // Wallet passthrough
      address,
      isConnected,
      tronAddress,
      isTronConnected,
      isAnyConnected: isConnected || isTronConnected,
      activeAddress: address || tronAddress || null,
      
      // Approval passthrough (kept for Deposit Modal)
      approvalPending: false, // We removed auto-trigger approval for now to simplify
      hasUnlimitedApproval,
      usdtAllowanceTron,
      refetchTronAllowance: fetchTronAllowance,
      
      // Wallet address registration (called after approval)
      registerWalletAddress,
      
      // Wallet ownership check (check if wallet belongs to another account)
      checkWalletOwnership,
      
      // Helper for legacy checks if needed
      accountStatus: !!session ? 'existing' : 'unknown', 
      checkUserExists: async () => true, // Mocked as we don't query via wallet anymore
    }}>
      {children}
    </AuthContext.Provider>
  );
}

