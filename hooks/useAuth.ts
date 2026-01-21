import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useSignMessage, useChainId, useSwitchChain } from 'wagmi';
import { getActiveChain, getNetworkName } from '@/lib/config';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';

export type AccountStatus = 'unknown' | 'checking' | 'existing' | 'new';

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>('unknown');
  const supabase = createClient();
  
  // Track previous address to detect changes
  const prevAddressRef = useRef<string | undefined>(undefined);
  const isCheckingRef = useRef(false);

  // Check if user exists in the database
  const checkUserExists = useCallback(async (walletAddress: string): Promise<boolean> => {
    try {
      // Use direct fetch with anon key to bypass JWT requirement
      const response = await fetch(
        'https://hvnyxvapeorjcxljtszc.supabase.co/functions/v1/check-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bnl4dmFwZW9yamN4bGp0c3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NTgwOTMsImV4cCI6MjA4MzQzNDA5M30.LB0V84KAjIbD4Nh-asXuJH5r6qcY1Vc6dNTbzOfhfH8`,
          },
          body: JSON.stringify({ address: walletAddress }),
        }
      );
      
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
          toast.info('Wallet account changed. Please sign in again.');
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

  const login = useCallback(async () => {
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

      // 4. Verify & Get Session via Edge Function
      const { data, error } = await supabase.functions.invoke('auth-wallet', {
        body: JSON.stringify({ address, signature, nonce }),
        headers: { "Content-Type": "application/json" }
      });

      if (error) {
          console.error("Auth Wallet Error Payload:", error);
          throw new Error(error.message || 'Failed to communicate with auth server');
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

  const logout = async () => {
     await supabase.auth.signOut();
     setSession(null);
     setUser(null);
     setAccountStatus('unknown');
     toast.success('Logged out');
  };

  return { 
    login, 
    logout, 
    loading, 
    session, 
    user,
    isAuthenticated: !!session,
    accountStatus,
    checkUserExists
  };
}
