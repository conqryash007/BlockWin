import { useState, useCallback, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';

export function useAuth() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

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
      if (existingSession) {
         setSession(existingSession);
         setUser(existingSession.user);
         setLoading(false);
         return;
      }

      // 2. Generate Nonce
      const nonce = Math.floor(Math.random() * 1000000).toString(); // Stringify to strictly handle 0
      const message = `Sign this message to login to BlockWin Casino. Nonce: ${nonce}`;
      
      // 3. Sign Message
      const signature = await signMessageAsync({ message });

      console.log("Sending auth request:", { address, signature, nonce });

      // 4. Verify & Get Session via Edge Function
      const { data, error } = await supabase.functions.invoke('auth-wallet', {
        body: JSON.stringify({ address, signature, nonce }),
        headers: { "Content-Type": "application/json" }
      });

      if (error) {
          console.error("Auth Wallet Error Payload:", error);
          // Try to parse the error context if it's embedded in the message
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
          // State will update via the onAuthStateChange listener
          toast.success('Logged in successfully');
      }
      
    } catch (err: any) {
      console.error(err);
      toast.error(typeof err === 'object' ? (err.message || JSON.stringify(err)) : 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [address, signMessageAsync, supabase]);

  const logout = async () => {
     await supabase.auth.signOut();
     setSession(null);
     setUser(null);
     toast.success('Logged out');
  };

  return { 
    login, 
    logout, 
    loading, 
    session, 
    user,
    isAuthenticated: !!session 
  };
}
