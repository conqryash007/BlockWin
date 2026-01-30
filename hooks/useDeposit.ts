'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  useReadContract, 
  useAccount,
  useSignMessage 
} from 'wagmi';
import { CONTRACTS, getActiveTronConfig } from '@/lib/contracts';
import { toast } from 'sonner';
import { maxUint256, formatUnits } from 'viem';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { createClient } from '@/lib/supabase';

// Hook for depositing tokens into CasinoDeposit contract
export function useDeposit() {
  const { address } = useAccount();
  const [approveHash, setApproveHash] = useState<`0x${string}` | undefined>();
  const [depositHash, setDepositHash] = useState<`0x${string}` | undefined>();
  const [tronTxHash, setTronTxHash] = useState<string | undefined>();
  const [tronTxStatus, setTronTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const { writeContractAsync, isPending } = useWriteContract();
  const { signMessageAsync, isPending: isSigningMessage } = useSignMessage();
  const { address: tronAddress, signMessage: signMessageTron, wallet } = useWallet();
  const supabase = createClient(); 

  // Track last deposit for EVM confirmation
  const [lastDeposit, setLastDeposit] = useState<{amount: bigint, tokenAddress: string, network: string, decimals: number} | null>(null);

  // Helper to record deposit in DB
  const recordDeposit = useCallback(async (txHash: string, amount: string, tokenAddress: string, network: string) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.error('Failed to record deposit: No active session');
            toast.error('Deposit confirmed but failed to record: Not logged in');
            return;
        }

        console.log('Recording deposit:', { txHash });
        const res = await fetch('/api/wallet/deposit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                txHash,
                amount,
                tokenAddress,
                network
            })
        });

        if (!res.ok) {
             const err = await res.json();
             console.error('API Error recording deposit:', err);
             // Don't toast error if it's "already processed" to avoid confusion on re-renders
             if (!err.error?.includes('already')) {
                toast.error('Failed to update balance record');
             }
        }
    } catch (e) {
        console.error('Failed to record deposit:', e);
        toast.error('Connection error while recording deposit');
    }
  }, [supabase]);

  const { isLoading: approvalConfirming, isSuccess: approvalSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: depositConfirming, isSuccess: evmDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Poll for Tron transaction confirmation
  useEffect(() => {
    if (!tronTxHash || tronTxStatus !== 'pending') return;

    let intervalId: NodeJS.Timeout;
    const checkTransaction = async () => {
      try {
        const tronWeb = (window as any).tronWeb;
        if (!tronWeb) return;

        // getTransactionInfo returns the receipt
        const receipt = await tronWeb.trx.getTransactionInfo(tronTxHash);
        
        // If receipt exists and has blockNumber, it's mined
        if (receipt && receipt.blockNumber) {
          // Check for success status (contractResult usually contains ["SUCCESS"] or similar for VM execution)
          // or receipt.result which is the top level transaction result
          // For now, if we have a receipt and it's not REVERT, we assume success or check 'receipt.result'
          
          if (receipt.result && receipt.result === 'FAILED') {
             setTronTxStatus('error');
             toast.error('Transaction failed on-chain');
          } else {
             setTronTxStatus('success');
          }
        }
      } catch (error) {
        console.error('Error checking Tron tx:', error);
      }
    };

    // Poll every 3 seconds
    intervalId = setInterval(checkTransaction, 3000);
    return () => clearInterval(intervalId);
  }, [tronTxHash, tronTxStatus]);

  const depositSuccess = evmDepositSuccess || tronTxStatus === 'success';

  // Trigger DB update on success (Effect)
  // Trigger DB update on success (Effect)
  useEffect(() => {
      const isTronSuccess = tronTxStatus === 'success';
      
      // Check if we have success AND pending deposit data to record
      if ((evmDepositSuccess || isTronSuccess) && lastDeposit) {
          const { amount, tokenAddress, network, decimals } = lastDeposit;
          
          // Determine hash based on network
          const txHash = network === 'tron' ? tronTxHash : depositHash;
          
          if (txHash) {
             const formattedAmount = formatUnits(amount, decimals); 
             recordDeposit(txHash, formattedAmount, tokenAddress, network);
             // Clear last deposit to prevent duplicate calls
             setLastDeposit(null);
          }
      }
  }, [evmDepositSuccess, tronTxStatus, depositHash, tronTxHash, lastDeposit, recordDeposit]);

  // Sign terms and conditions message
  const signTerms = useCallback(async (network: 'ethereum' | 'tron' = 'ethereum') => {
    // Tron Signing
    if (network === 'tron') {
      if (!tronAddress) {
        toast.error('Please connect your Tron wallet');
        return null;
      }

      try {
        const message = `BlockWin Casino - Terms Agreement

I agree to the following terms:
1. I am at least 18 years old
2. I understand gambling involves risk
3. I accept the platform's terms of service
4. This deposit is from my own funds

Wallet: ${tronAddress}
Timestamp: ${new Date().toISOString()}`;

        const signature = await signMessageTron(message);
        return signature;
      } catch (error: any) {
        console.error('Tron signing error:', error);
        toast.error('Failed to sign terms');
        return null;
      }
    }

    // EVM Signing
    if (!address) {
      toast.error('Please connect your wallet');
      return null;
    }

    try {
      const message = `BlockWin Casino - Terms Agreement

I agree to the following terms:
1. I am at least 18 years old
2. I understand gambling involves risk
3. I accept the platform's terms of service
4. This deposit is from my own funds

Wallet: ${address}
Timestamp: ${new Date().toISOString()}`;

      const signature = await signMessageAsync({ message });
      return signature;
    } catch (error: any) {
      console.error('Signing error:', error);
      toast.error('Failed to sign terms');
      return null;
    }
  }, [address, tronAddress, signMessageAsync, signMessageTron]);

  // Approve UNLIMITED token spending (one-time) - for USDT
  // Network-aware: uses wagmi for Ethereum, TronLink for Tron
  const approveUnlimited = useCallback(
    async (tokenAddress: `0x${string}`, network: 'ethereum' | 'tron') => {
      if (network === 'tron') {
        // Tron approval via TronLink / TronWeb
        try {
          if (typeof window === 'undefined') {
            toast.error('Tron approval is only available in the browser');
            return false;
          }

          // Trust Wallet and others inject tronWeb but might not be 'tronLink'
          const tronWeb = (wallet?.adapter as any)?.tronWeb || window.tronWeb || (window.tronLink as any)?.tronWeb;

          if (!tronWeb) {
             toast.error('Tron wallet not detected. Please install TronLink or Trust Wallet.');
             return false;
          }

          // Some adapters like Trust Wallet might not set 'ready' explicitly or immediately
          // We rely on the adapter connection state primarily. If it comes from adapter, we assume ready.
          if ((wallet?.adapter as any)?.tronWeb) {
              // Adapter provided tronWeb, usually ready
          } else if (tronWeb.ready === false) {
             // Only error if explicitly false. If undefined, we assume it might be ready (Trust Wallet)
             toast.error('Tron wallet not ready. Please unlock your wallet.');
             return false;
          }

          const tronConfig = getActiveTronConfig();
          const usdtAddress = tronConfig.usdt;
          const casinoAddress = tronConfig.casinoDepositAddress;

          const contract = await tronWeb.contract().at(usdtAddress);
          const txId = await contract
            .approve(casinoAddress, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
            .send();

          toast.info('Approval submitted. Waiting for confirmation...');

          // Poll for confirmation
          let attempts = 0;
          while (attempts < 20) { // Max 60 seconds
             await new Promise(r => setTimeout(r, 3000));
             try {
                 const receipt = await tronWeb.trx.getTransactionInfo(txId);
                 if (receipt && Object.keys(receipt).length > 0) {
                     if (receipt.result && receipt.result === 'FAILED') {
                         throw new Error('Approval failed on-chain');
                     }
                     // If we have blockNumber, it's included in a block
                     if (receipt.blockNumber) {
                        toast.success('Tron USDT unlimited approval confirmed.');
                        return true;
                     }
                 }
             } catch (e: any) {
                 if (e.message === 'Approval failed on-chain') throw e;
             }
             attempts++;
          }
          
          throw new Error('Approval confirmation timed out. Please check TronScan. If approved, try depositing again.');
        } catch (error: any) {
          console.error('Tron approval error:', error);
          toast.error(error?.message || 'Tron approval failed');
          return false;
        }
      }

      // Default EVM approval (existing behaviour)
      if (!address) {
        toast.error('Please connect your wallet');
        return false;
      }

      try {
        const hash = await writeContractAsync({
          address: tokenAddress,
          abi: CONTRACTS.ERC20.abi,
          functionName: 'approve',
          args: [CONTRACTS.CasinoDeposit.address, maxUint256],
        });

        setApproveHash(hash);
        toast.info('Approval submitted. Waiting for confirmation...');
        return true;
      } catch (error: any) {
        console.error('Approval error:', error);
        toast.error(error.shortMessage || error.message || 'Approval failed');
        return false;
      }
    },
    [address, writeContractAsync]
  );

  // Approve EXACT amount token spending - for USDC/DAI
  const approveExact = useCallback(async (tokenAddress: `0x${string}`, amount: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: CONTRACTS.ERC20.abi,
        functionName: 'approve',
        args: [CONTRACTS.CasinoDeposit.address, amount],
      });
      
      setApproveHash(hash);
      toast.info('Approval submitted. Waiting for confirmation...');
      return true;
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(error.shortMessage || error.message || 'Approval failed');
      return false;
    }
  }, [address, writeContractAsync]);

  // Deposit tokens
  const deposit = useCallback(async (
    tokenAddress: `0x${string}`,
    amount: bigint,
    network: 'ethereum' | 'tron' = 'ethereum',
    decimals: number = 6
  ) => {
    // Tron Deposit Logic
    if (network === 'tron') {
      try {
        if (typeof window === 'undefined') {
          toast.error('Tron deposit is only available in the browser');
          return false;
        }

        // Trust Wallet and others inject tronWeb but might not be 'tronLink'
        const tronWeb = (wallet?.adapter as any)?.tronWeb || window.tronWeb || (window.tronLink as any)?.tronWeb;

        if (!tronWeb) {
           toast.error('Tron wallet not detected. Please install TronLink or Trust Wallet.');
           return false;
        }

        if (tronWeb.ready === false && !(wallet?.adapter as any)?.tronWeb) {
           toast.error('Tron wallet not ready. Please unlock your wallet.');
           return false;
        }

        const tronConfig = getActiveTronConfig();
        const casinoAddress = tronConfig.casinoDepositAddress;
        
        // Use casino contract to deposit
        // Function signature: deposit(address token, uint256 amount)
        const contract = await tronWeb.contract().at(casinoAddress);
        
        // Note: For Tron, we pass the token address as a string
        const txId = await contract.deposit(tokenAddress, amount.toString()).send();
        
        setTronTxHash(txId);
        setTronTxStatus('pending');
        // Store details for the effect to pick up on success
        setLastDeposit({ amount, tokenAddress, network: 'tron', decimals });

        toast.info('Deposit submitted to Tron network. Waiting for confirmation...');
        
        // Polling is handled by the main useEffect (lines 67+) which updates tronTxStatus
        // The recording useEffect (lines 105+) listens to tronTxStatus === 'success'
        
        return true;
      } catch (error: any) {
        console.error('Tron deposit error:', error);
        toast.error(error?.message || 'Tron deposit failed');
        setTronTxStatus('error');
        return false;
      }
    }

    // Existing EVM Deposit Logic
    if (!address) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.CasinoDeposit.address,
        abi: CONTRACTS.CasinoDeposit.abi,
        functionName: 'deposit',
        args: [tokenAddress, amount],
        gas: BigInt(300000), 
      });

      setDepositHash(hash);
      // Store details for the effect to pick up on success
      setLastDeposit({ amount, tokenAddress, network: 'ethereum', decimals });
      toast.info('Deposit submitted. Waiting for confirmation...');
      return true;
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error.shortMessage || error.message || 'Deposit failed');
      return false;
    }
  }, [address, writeContractAsync]);

  return {
    signTerms,
    approveUnlimited,
    approveExact,
    deposit,
    isSigningMessage,
    isApproving: isPending || approvalConfirming,
    isDepositing: isPending || depositConfirming || tronTxStatus === 'pending',
    approvalSuccess,
    depositSuccess,
    approveHash,
    depositHash,
  };
}



// Hook to read token balance
export function useTokenBalance(tokenAddress: string | undefined, network: 'ethereum' | 'tron' = 'ethereum') {
  console.log('HOOK_TRACE: useTokenBalance entered', { tokenAddress, network });
  const { address } = useAccount();
  const { address: tronAddress, connected: isTronConnected, wallet } = useWallet();
  console.log('HOOK_TRACE: useTokenBalance wallet state', { tronAddress, isTronConnected });
  const [tronBalance, setTronBalance] = useState<bigint | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  
  // EVM Balance (Wagmi)
  const { data: evmBalance, isLoading: isEvmLoading, refetch: refetchEvm } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: CONTRACTS.ERC20.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: network === 'ethereum' && !!address && !!tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Debug state
  const [debugStatus, setDebugStatus] = useState<string>('Init');
  const [activeDebugAddress, setActiveDebugAddress] = useState<string>('');

  // Tron Balance
  const fetchTronBalance = useCallback(async (retryCount = 0) => {
    setDebugStatus(`Fetching... (${retryCount})`);
    
    // Limits retries
    if (retryCount > 10) {
        setDebugStatus('Timeout');
        return;
    }

    if (network !== 'tron') {
      setDebugStatus('Not Tron');
      return;
    }

    if (!tokenAddress) {
       setDebugStatus('No Token Addr');
       return;
    }

    try {
      let activeAddress = tronAddress;
      // Access tronWeb safely
      const tronWeb = (wallet?.adapter as any)?.tronWeb || window.tronWeb || (window.tronLink as any)?.tronWeb;
      
      // Fallback: Try to get address from tronWeb directly if adapter is not ready
      if (!activeAddress && tronWeb && tronWeb.ready && tronWeb.defaultAddress?.base58) {
         activeAddress = tronWeb.defaultAddress.base58;
      }
      
      setActiveDebugAddress(activeAddress || 'None');

      if (!activeAddress) {
        // If we have a wallet connected but no address yet, retry
        if (isTronConnected) {
             console.log('HOOK_TRACE: Connected but no address, retrying...', retryCount);
             setTimeout(() => fetchTronBalance(retryCount + 1), 1000);
             return;
        }
        setDebugStatus('No User Addr');
        setTronBalance(undefined);
        return;
      }

      if (!tronWeb || !tronWeb.ready) {
        console.warn('HOOK_TRACE: TronWeb not ready/missing, retrying...', retryCount);
        // Mobile often needs more time
        setTimeout(() => fetchTronBalance(retryCount + 1), 1000);
        return;
      }

      console.log('HOOK_TRACE: Fetching contract at:', tokenAddress);
      
      // Log connection details
      try {
          const host = tronWeb.fullNode.host;
          console.log('HOOK_TRACE: Connected to node:', host);
      } catch (e) {
          console.warn('HOOK_TRACE: Could not read fullNode host');
      }

      let balanceVal: bigint | undefined;
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Contract Load Timeout')), 4000));
      
      // METHOD 1: High-level Contract Object (Standard)
      // Skip Method 1 if no fullNode host is detected (common on mobile injections causing hang)
      let skipMethod1 = false;
      try {
           if (!tronWeb.fullNode?.host) {
               console.warn('HOOK_TRACE: No fullNode host detected, skipping Method 1 to avoid hang.');
               skipMethod1 = true;
           }
      } catch (e) { skipMethod1 = true; }

      try {
          if (!skipMethod1) {
            setDebugStatus(`Try M1 std...`);
            // RACE: Contract load vs Timeout
            const contract: any = await Promise.race([
                tronWeb.contract().at(tokenAddress),
                timeoutPromise
            ]);

            if (typeof contract.balanceOf === 'function') {
                const res = await contract.balanceOf(activeAddress).call();
                balanceVal = BigInt(res.toString());
                console.log('HOOK_TRACE: Method 1 success:', balanceVal.toString());
            } else if (contract.methods?.balanceOf) {
                const res = await contract.methods.balanceOf(activeAddress).call();
                balanceVal = BigInt(res.toString());
                console.log('HOOK_TRACE: Method 1 (alt) success:', balanceVal.toString());
            }
          }
      } catch (err: any) {
          console.warn('HOOK_TRACE: Method 1 failed or timed out:', err);
          setDebugStatus(`M1 Failed: ${err.message?.slice(0, 10)}`);
      }

      // METHOD 2: Low-level triggerConstantContract (Fallback)
      if (balanceVal === undefined) {
          setDebugStatus(`Try M2 (Low)...`);
          console.log('HOOK_TRACE: Attempting Method 2 (triggerConstantContract)...');
          try {
              const parameter = [{ type: 'address', value: activeAddress }];
              const res = await tronWeb.transactionBuilder.triggerConstantContract(
                  tokenAddress,
                  'balanceOf(address)',
                  {},
                  parameter,
                  activeAddress
              );
              
              if (res && res.constant_result && res.constant_result[0]) {
                  // Result is hex string
                  const hexVal = res.constant_result[0];
                  // Parse hex to BigInt
                  balanceVal = BigInt('0x' + hexVal);
                  console.log('HOOK_TRACE: Method 2 success:', balanceVal.toString());
              } else {
                  throw new Error('Invalid response from triggerConstantContract');
              }
          } catch (err: any) {
              console.error('HOOK_TRACE: Method 2 failed:', err);
              throw new Error('All fetch methods failed: ' + (err.message || 'Unknown error'));
          }
      }

      if (balanceVal !== undefined) {
          setTronBalance(balanceVal);
          setDebugStatus(`Done: ${balanceVal.toString()}`);
          setError(null);
      } else {
          throw new Error('Balance could not be determined');
      }

    } catch (error: any) {
      console.error('HOOK_TRACE: Error fetching Tron balance:', error);
      const errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      
      // Retry logic
      if (retryCount < 5) {
          console.log(`HOOK_TRACE: Error occurred, retrying... (${retryCount})`);
          setTimeout(() => fetchTronBalance(retryCount + 1), 2000);
          return;
      }

      // Readable error for user
      let userError = "Failed to fetch balance.";
      if (errorMessage.includes('Network')) userError = "Network Error: Check connection.";
      if (errorMessage.includes('contract')) userError = "Contract Error: Token not found.";
      if (errorMessage.includes('node')) userError = "Node Error: RPC unreachable.";
      
      setError(`${userError} (${errorMessage.slice(0, 20)}...)`);
      setDebugStatus(`Err: ${errorMessage.slice(0, 15)}...`);
      setTronBalance(undefined); 
    }
  }, [network, isTronConnected, tronAddress, tokenAddress, wallet]);

  // Effect to fetch Tron balance
  useEffect(() => {
    if (network === 'tron') {
      fetchTronBalance();
      const interval = setInterval(() => fetchTronBalance(0), 10000); // Poll slower, let retries handle initial
      
      // Listen for TronLink injection/ready events
      const handleTronReady = () => {
          console.log('HOOK_TRACE: Tron event received, refetching...');
          fetchTronBalance(0);
      };

      window.addEventListener('tronLink#initialized', handleTronReady);
      window.addEventListener('message', (e) => {
          if (e.data.message && e.data.message.action == "tabReply") {
              handleTronReady();
          }
      });

      return () => {
          clearInterval(interval);
          window.removeEventListener('tronLink#initialized', handleTronReady);
      };
    }
  }, [network, fetchTronBalance]);

  const currentHost = (window as any).tronWeb?.fullNode?.host || 'unknown';

  return { 
    balance: network === 'tron' ? tronBalance : (evmBalance as bigint | undefined), 
    isLoading: network === 'tron' ? false : isEvmLoading, 
    refetch: network === 'tron' ? fetchTronBalance : refetchEvm,
    error: network === 'tron' ? error : null,
    debugInfo: { status: debugStatus, userAddr: activeDebugAddress, node: currentHost }
  };
}

// Hook to read token allowance
export function useTokenAllowance(tokenAddress: `0x${string}` | undefined, network: 'ethereum' | 'tron' = 'ethereum') {
  const { address } = useAccount();
  const { address: tronAddress, connected: isTronConnected, wallet } = useWallet();
  const [tronAllowance, setTronAllowance] = useState<bigint | undefined>(undefined);
  
  // EVM Allowance
  const { data: evmAllowance, isLoading: isEvmLoading, refetch: refetchEvm } = useReadContract({
    address: tokenAddress,
    abi: CONTRACTS.ERC20.abi,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.CasinoDeposit.address] : undefined,
    query: {
      enabled: network === 'ethereum' && !!address && !!tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Tron Allowance Logic
  const fetchTronAllowance = useCallback(async () => {
    if (network !== 'tron' || !isTronConnected || !tronAddress || !tokenAddress) {
      setTronAllowance(undefined);
      return;
    }

    try {
      // Trust Wallet and others inject tronWeb but might not be 'tronLink'
      const tronWeb = (wallet?.adapter as any)?.tronWeb || window.tronWeb || (window.tronLink as any)?.tronWeb;
      
      if (!tronWeb) return;
      
      // Relaxed ready check
      if (tronWeb.ready === false) {
         return;
      }

      const tronConfig = getActiveTronConfig();
      const contract = await tronWeb.contract().at(tokenAddress);
      
      // Check allowance: usage might vary, usually allowace(owner, spender)
      // For some TRC20 it might be just .allowance(spender) if connected? No, standard is (owner, spender)
      let currentAllowance;
      
      // Try calling allowance
      try {
         currentAllowance = await contract.allowance(tronAddress, tronConfig.casinoDepositAddress).call();
      } catch (e) {
         console.warn('Failed to fetch Tron allowance direct, trying methods', e);
         if (contract.methods?.allowance) {
            currentAllowance = await contract.methods.allowance(tronAddress, tronConfig.casinoDepositAddress).call();
         }
      }

      if (currentAllowance !== undefined) {
         setTronAllowance(BigInt(currentAllowance.toString()));
      }

    } catch (error) {
      console.error('Error fetching Tron allowance:', error);
      setTronAllowance(undefined);
    }
  }, [network, isTronConnected, tronAddress, tokenAddress]);

  // Poll Tron Allowance
  useEffect(() => {
    if (network === 'tron') {
      fetchTronAllowance();
      const interval = setInterval(fetchTronAllowance, 5000);
      return () => clearInterval(interval);
    }
  }, [network, fetchTronAllowance]);

  return { 
    allowance: network === 'tron' ? tronAllowance : (evmAllowance as bigint | undefined), 
    isLoading: network === 'tron' ? false : isEvmLoading, 
    refetch: network === 'tron' ? fetchTronAllowance : refetchEvm 
  };
}

// Hook to check if token is supported
export function useIsTokenSupported(tokenAddress: `0x${string}` | undefined) {
  const { data: isSupported, isLoading } = useReadContract({
    address: CONTRACTS.CasinoDeposit.address,
    abi: CONTRACTS.CasinoDeposit.abi,
    functionName: 'isTokenSupported',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  return { isSupported: isSupported as boolean | undefined, isLoading };
}

// Hook to get minimum deposit for a token
export function useMinDeposit(tokenAddress: `0x${string}` | undefined) {
  const { data: minDeposit, isLoading } = useReadContract({
    address: CONTRACTS.CasinoDeposit.address,
    abi: CONTRACTS.CasinoDeposit.abi,
    functionName: 'minDeposit',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  return { minDeposit: minDeposit as bigint | undefined, isLoading };
}

// Hook to get token decimals from contract
export function useTokenDecimals(tokenAddress: `0x${string}` | undefined) {
  const { data: decimals, isLoading } = useReadContract({
    address: tokenAddress,
    abi: CONTRACTS.ERC20.abi,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  return { decimals: decimals as number | undefined, isLoading };
}

// Hook to get token symbol from contract
export function useTokenSymbol(tokenAddress: `0x${string}` | undefined) {
  const { data: symbol, isLoading } = useReadContract({
    address: tokenAddress,
    abi: CONTRACTS.ERC20.abi,
    functionName: 'symbol',
    query: {
      enabled: !!tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  return { symbol: symbol as string | undefined, isLoading };
}
