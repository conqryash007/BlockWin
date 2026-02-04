'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useAccount,
  useSignMessage,
} from 'wagmi';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { CONTRACTS, getActiveTronConfig } from '@/lib/contracts';
import { toast } from 'sonner';
import { maxUint256 } from 'viem';
import { TronWeb } from 'tronweb';

/** Returns a TronWeb instance for read-only queries. Uses injected wallet TronWeb when available (e.g. extension), otherwise creates a standalone instance for WalletConnect/mobile. */
function getReadOnlyTronWeb(): any {
  if (typeof window === 'undefined') return null;
  const tronConfig = getActiveTronConfig();
  const injected = (window as any).tronWeb ?? (window as any).tronLink?.tronWeb;
  if (injected && injected.ready) {
    return injected;
  }
  return new TronWeb({
    fullHost: tronConfig.fullHost,
  });
}

/** Result type for Tron transaction check */
export type TronTxStatus = 'pending' | 'confirming' | 'success' | 'failed' | 'timeout';

export interface TronTxResult {
  status: TronTxStatus;
  blockNumber?: number;
  fee?: number;
}

/** Helper to check Tron transaction status via API (for mobile/WalletConnect users) */
async function checkTronTxViaApi(txId: string): Promise<{ found: boolean; confirmed: boolean; success: boolean; receipt?: any }> {
  try {
    const tronConfig = getActiveTronConfig();
    const isMainnet = tronConfig.fullHost.includes('api.trongrid.io') && !tronConfig.fullHost.includes('shasta');
    const apiBase = isMainnet ? 'https://api.trongrid.io' : 'https://api.shasta.trongrid.io';
    
    // First check if tx exists
    const txRes = await fetch(`${apiBase}/wallet/gettransactionbyid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: txId }),
    });
    const txData = await txRes.json();
    
    if (!txData || !txData.txID) {
      return { found: false, confirmed: false, success: false };
    }
    
    // Then check for confirmation info
    const infoRes = await fetch(`${apiBase}/wallet/gettransactioninfobyid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: txId }),
    });
    const infoData = await infoRes.json();
    
    if (infoData && infoData.receipt) {
      return {
        found: true,
        confirmed: true,
        success: infoData.receipt.result === 'SUCCESS',
        receipt: infoData.receipt,
      };
    }
    
    // Transaction exists but not yet confirmed
    return { found: true, confirmed: false, success: false };
  } catch (e) {
    console.warn('API check failed:', e);
    return { found: false, confirmed: false, success: false };
  }
}

/** 
 * Fast polling for Tron transaction confirmation 
 * @param txId - Transaction hash
 * @param onProgress - Optional callback for progress updates
 * @param maxWaitMs - Maximum time to wait (default 90 seconds)
 * @returns Result with status
 */
export async function waitForTronTransaction(
  txId: string, 
  onProgress?: (status: TronTxStatus, attempt: number) => void,
  maxWaitMs = 90000
): Promise<TronTxResult> {
  const startTime = Date.now();
  const tronWeb = getReadOnlyTronWeb();
  
  console.log(`[TronTx] Starting confirmation check for: ${txId}`);
  
  // Phase 1: Quick check to confirm tx was broadcast (max 5 seconds)
  // This uses getTransaction which is available almost immediately
  let txFound = false;
  for (let i = 0; i < 5; i++) {
    onProgress?.('pending', i);
    
    try {
      // Try TronWeb first
      if (tronWeb) {
        const tx = await tronWeb.trx.getTransaction(txId);
        if (tx && tx.txID) {
          txFound = true;
          console.log(`[TronTx] Transaction found in ${i + 1} attempts`);
          break;
        }
      }
      
      // Fallback to API
      if (!txFound) {
        const apiCheck = await checkTronTxViaApi(txId);
        if (apiCheck.found) {
          txFound = true;
          console.log(`[TronTx] Transaction found via API in ${i + 1} attempts`);
          // If already confirmed via API, return immediately
          if (apiCheck.confirmed) {
            console.log(`[TronTx] Already confirmed:`, apiCheck.receipt);
            return {
              status: apiCheck.success ? 'success' : 'failed',
              receipt: apiCheck.receipt,
            } as TronTxResult;
          }
          break;
        }
      }
    } catch (e) {
      console.warn(`[TronTx] Phase 1 attempt ${i + 1} error:`, e);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (!txFound) {
    console.warn('[TronTx] Transaction not found after broadcast check');
    // Continue anyway - sometimes there's network delay
  }
  
  // Phase 2: Poll for confirmation
  // Tron blocks are ~3 seconds, so poll every 3 seconds
  const pollInterval = 3000;
  let attempt = 0;
  
  while (Date.now() - startTime < maxWaitMs) {
    attempt++;
    onProgress?.('confirming', attempt);
    
    try {
      // Try TronWeb first (faster if available)
      if (tronWeb) {
        const result = await tronWeb.trx.getTransactionInfo(txId);
        
        if (result && result.receipt) {
          console.log(`[TronTx] Confirmed in ${attempt} attempts, ${Date.now() - startTime}ms`);
          console.log('[TronTx] Receipt:', result.receipt);
          
          if (result.receipt.result === 'SUCCESS') {
            return { 
              status: 'success', 
              blockNumber: result.blockNumber,
              fee: result.fee 
            };
          } else {
            return { 
              status: 'failed',
              blockNumber: result.blockNumber,
              fee: result.fee 
            };
          }
        }
      }
      
      // Fallback to API (for mobile users)
      const apiCheck = await checkTronTxViaApi(txId);
      if (apiCheck.confirmed) {
        console.log(`[TronTx] Confirmed via API in ${attempt} attempts, ${Date.now() - startTime}ms`);
        return {
          status: apiCheck.success ? 'success' : 'failed',
        };
      }
      
    } catch (e) {
      console.warn(`[TronTx] Poll attempt ${attempt} error:`, e);
    }
    
    // Log progress every 5 attempts
    if (attempt % 5 === 0) {
      console.log(`[TronTx] Still waiting... attempt ${attempt}, elapsed ${Date.now() - startTime}ms`);
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  console.warn(`[TronTx] Timeout after ${maxWaitMs}ms`);
  return { status: 'timeout' };
}

/** Legacy wrapper for backward compatibility - returns boolean */
export async function waitForTronTransactionLegacy(txId: string, maxAttempts = 40): Promise<boolean> {
  const result = await waitForTronTransaction(txId, undefined, maxAttempts * 2000);
  return result.status === 'success';
}

// Hook for depositing tokens into CasinoDeposit contract
export function useDeposit() {
  const { address } = useAccount();
  const { address: tronAddress, signMessage: signMessageTron, signTransaction } = useWallet();
  const [approveHash, setApproveHash] = useState<`0x${string}` | undefined>();
  const [depositHash, setDepositHash] = useState<`0x${string}` | undefined>();

  const { writeContractAsync, isPending } = useWriteContract();
  const { signMessageAsync, isPending: isSigningMessage } = useSignMessage();

  const { isLoading: approvalConfirming, isSuccess: approvalSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: depositConfirming, isSuccess: depositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Sign terms and conditions message (EVM via wagmi, Tron via adapter)
  const signTerms = useCallback(
    async (network: 'ethereum' | 'tron' = 'ethereum') => {
      const activeAddress = network === 'tron' ? tronAddress : address;
      if (!activeAddress) {
        toast.error('Please connect your wallet');
        return null;
      }

      const message = `BlockWin Casino - Terms Agreement

I agree to the following terms:
1. I am at least 18 years old
2. I understand gambling involves risk
3. I accept the platform's terms of service
4. This deposit is from my own funds

Wallet: ${activeAddress}
Timestamp: ${new Date().toISOString()}`;

      try {
        if (network === 'tron') {
          const signature = await signMessageTron(message);
          return signature ?? null;
        }
        const signature = await signMessageAsync({ message });
        return signature;
      } catch (error: any) {
        console.error('Signing error:', error);
        if (error?.message?.includes('rejected') || error?.message?.includes('cancelled') || error?.message?.includes('denied')) {
          toast.error('Signature was rejected or cancelled');
        } else {
          toast.error('Failed to sign terms');
        }
        return null;
      }
    },
    [address, tronAddress, signMessageAsync, signMessageTron]
  );

  // Approve UNLIMITED token spending (one-time) - for USDT
  // Network-aware: uses wagmi for Ethereum; for Tron uses injected TronWeb when available, else adapter (WalletConnect/mobile)
  const approveUnlimited = useCallback(
    async (tokenAddress: `0x${string}`, network: 'ethereum' | 'tron') => {
      if (network === 'tron') {
        try {
          if (typeof window === 'undefined') {
            toast.error('Tron approval is only available in the browser');
            return false;
          }

          const tronConfig = getActiveTronConfig();
          const usdtAddress = tronConfig.usdt;
          const casinoAddress = tronConfig.casinoDepositAddress;

          const injected = (window as any).tronWeb ?? (window as any).tronLink?.tronWeb;
          if (injected?.ready) {
            // Use injected TronWeb (extension / in-app browser)
            const contract = await injected.contract().at(usdtAddress);
            await contract.approve(casinoAddress, maxUint256.toString()).send();
            toast.success('Tron USDT unlimited approval submitted.');
            return true;
          }

          // No injected TronWeb (e.g. Trust Wallet via WalletConnect on mobile): build tx, sign via adapter, broadcast
          if (!tronAddress) {
            toast.error('Please connect your Tron wallet');
            return false;
          }

          const tronWeb = getReadOnlyTronWeb();
          if (!tronWeb) {
            toast.error('Unable to build transaction');
            return false;
          }

          const wrapper = await tronWeb.transactionBuilder.triggerSmartContract(
            usdtAddress,
            'approve(address,uint256)',
            { feeLimit: 100_000_000 },
            [
              { type: 'address', value: casinoAddress },
              { type: 'uint256', value: maxUint256.toString() },
            ],
            tronAddress
          );

          if (wrapper.Error || !wrapper.transaction) {
            throw new Error(wrapper.Error || 'Failed to build approval transaction');
          }

          const signedTx = await signTransaction(wrapper.transaction);
          await tronWeb.trx.sendRawTransaction(signedTx);

          toast.success('Tron USDT unlimited approval submitted.');
          return true;
        } catch (error: any) {
          console.error('Tron approval error:', error);
          if (error?.message?.includes('rejected') || error?.message?.includes('cancelled') || error?.message?.includes('denied')) {
            toast.error('Approval was rejected or cancelled');
          } else {
            toast.error(error?.message || 'Tron approval failed');
          }
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
    [address, tronAddress, signTransaction, writeContractAsync]
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
    network: 'ethereum' | 'tron' = 'ethereum'
  ) => {
    // Tron Deposit Logic
    if (network === 'tron') {
      try {
        if (typeof window === 'undefined') {
          toast.error('Tron deposit is only available in the browser');
          return false;
        }

        const tronConfig = getActiveTronConfig();
        const casinoAddress = tronConfig.casinoDepositAddress;

        const injected = (window as any).tronWeb ?? (window as any).tronLink?.tronWeb;
        if (injected?.ready) {
          const contract = await injected.contract().at(casinoAddress);
          const txIdRaw = await (contract as any).deposit(tokenAddress, amount.toString()).send();
          const txId = typeof txIdRaw === 'string' ? txIdRaw : (txIdRaw?.txid ?? (txIdRaw as any)?.transaction?.txID);
          if (txId) setDepositHash(txId.startsWith('0x') ? (txId as `0x${string}`) : (`0x${txId}` as `0x${string}`));
          toast.info('Deposit submitted to Tron network. Waiting for confirmation...');
          return (typeof txId === 'string' ? txId : undefined) ?? true;
        }

        // No injected TronWeb (e.g. Trust Wallet via WalletConnect): build tx, sign via adapter, broadcast
        if (!tronAddress) {
          toast.error('Please connect your Tron wallet');
          return false;
        }

        const tronWeb = getReadOnlyTronWeb();
        if (!tronWeb) {
          toast.error('Unable to build transaction');
          return false;
        }

        const wrapper = await tronWeb.transactionBuilder.triggerSmartContract(
          casinoAddress,
          'deposit(address,uint256)',
          { feeLimit: 100_000_000 },
          [
            { type: 'address', value: tokenAddress },
            { type: 'uint256', value: amount.toString() },
          ],
          tronAddress
        );

        if (wrapper.Error || !wrapper.transaction) {
          throw new Error(wrapper.Error || 'Failed to build deposit transaction');
        }

        const signedTx = await signTransaction(wrapper.transaction);
        const result = await tronWeb.trx.sendRawTransaction(signedTx);
        const txId = (result as { txid?: string })?.txid;
        if (txId) setDepositHash(txId.startsWith('0x') ? (txId as `0x${string}`) : (`0x${txId}` as `0x${string}`));
        toast.info('Deposit submitted to Tron network. Waiting for confirmation...');
        return txId ?? true;
      } catch (error: any) {
        console.error('Tron deposit error:', error);
        if (error?.message?.includes('rejected') || error?.message?.includes('cancelled') || error?.message?.includes('denied')) {
          toast.error('Deposit was rejected or cancelled');
        } else {
          toast.error(error?.message || 'Tron deposit failed');
        }
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
        gas: BigInt(300000), // Explicit gas limit to prevent estimation errors
      });

      setDepositHash(hash);
      toast.info('Deposit submitted. Waiting for confirmation...');
      return true;
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error.shortMessage || error.message || 'Deposit failed');
      return false;
    }
  }, [address, tronAddress, signTransaction, writeContractAsync]);

  return {
    signTerms,
    approveUnlimited,
    approveExact,
    deposit,
    isSigningMessage,
    isApproving: isPending || approvalConfirming,
    isDepositing: isPending || depositConfirming,
    approvalSuccess,
    depositSuccess,
    approveHash,
    depositHash,
  };
}

// Hook to read token balance
export function useTokenBalance(tokenAddress: string | undefined, network: 'ethereum' | 'tron' = 'ethereum') {
  const { address } = useAccount();
  const { address: tronAddress, connected: isTronConnected } = useWallet();
  const [tronBalance, setTronBalance] = useState<bigint | undefined>(undefined);
  const [isTronLoading, setIsTronLoading] = useState(false);
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

  // Tron Balance: try injected TronWeb first (fastest), then API proxy (for mobile)
  const fetchTronBalance = useCallback(async () => {
    if (network !== 'tron') {
      setDebugStatus('Not Tron');
      return;
    }
    if (!tokenAddress) {
      setDebugStatus('No Token Addr');
      return;
    }

    let activeAddress = tronAddress;
    const injected = typeof window !== 'undefined' 
      ? ((window as any).tronWeb ?? (window as any).tronLink?.tronWeb) 
      : null;
    
    if (!activeAddress && injected?.ready && injected.defaultAddress?.base58) {
      activeAddress = injected.defaultAddress.base58;
    }
    setActiveDebugAddress(activeAddress || 'None');

    if (!activeAddress) {
      setDebugStatus('No User Addr');
      setTronBalance(undefined);
      return;
    }

    // Only show loading on first fetch (when balance is undefined)
    if (tronBalance === undefined) {
      setIsTronLoading(true);
    }
    setDebugStatus('Fetching...');

    // 1) Try injected TronWeb FIRST (fastest - wallet is already connected)
    if (injected?.ready) {
      try {
        setDebugStatus('Wallet...');
        const contract = await injected.contract().at(tokenAddress);
        const balanceResult = await contract.balanceOf(activeAddress).call();
        const finalBalance = balanceResult?.toString ? BigInt(balanceResult.toString()) : BigInt(0);
        setTronBalance(finalBalance);
        setDebugStatus(`Done: ${finalBalance.toString()}`);
        setError(null);
        setIsTronLoading(false);
        return;
      } catch (injectedErr: any) {
        console.warn('Injected TronWeb balance failed, trying API:', injectedErr?.message);
      }
    }

    // 2) Fall back to API proxy (for mobile/WalletConnect users without injected TronWeb)
    try {
      setDebugStatus('API...');
      const res = await fetch('/api/proxy/tron-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: activeAddress, token: tokenAddress }),
      });
      const data = await res.json();
      if (res.ok && data != null && typeof data.balance !== 'undefined') {
        const finalBalance = BigInt(data.balance);
        setTronBalance(finalBalance);
        setDebugStatus(`Done: ${finalBalance.toString()}`);
        setError(null);
        setIsTronLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error(data?.error || `API ${res.status}`);
      }
    } catch (apiErr: any) {
      console.error('Tron balance fetch failed:', apiErr?.message);
      setError(apiErr?.message || 'Failed to fetch balance');
      setDebugStatus(`Err: ${(apiErr?.message || '').slice(0, 15)}...`);
      setTronBalance(undefined);
    } finally {
      setIsTronLoading(false);
    }
  }, [network, isTronConnected, tronAddress, tokenAddress, tronBalance]);

  // Effect to fetch Tron balance on mount/connection change (no polling)
  useEffect(() => {
    if (network === 'tron') {
      fetchTronBalance();
    }
  }, [network, fetchTronBalance]);

  const currentHost =
    (typeof window !== 'undefined' && ((window as any).tronWeb?.fullNode?.host ?? (window as any).tronLink?.tronWeb?.fullNode?.host)) ||
    (network === 'tron' ? getActiveTronConfig().fullHost : 'unknown') ||
    'unknown';

  return {
    balance: network === 'tron' ? tronBalance : (evmBalance as bigint | undefined),
    isLoading: network === 'tron' ? isTronLoading : isEvmLoading,
    refetch: network === 'tron' ? fetchTronBalance : refetchEvm,
    error: network === 'tron' ? error : null,
    debugInfo: { status: debugStatus, userAddr: activeDebugAddress, node: currentHost },
  };
}

// Hook to read token allowance (EVM)
export function useTokenAllowance(tokenAddress: `0x${string}` | undefined) {
  const { address } = useAccount();
  
  const { data: allowance, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: CONTRACTS.ERC20.abi,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.CasinoDeposit.address] : undefined,
    query: {
      enabled: !!address && !!tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  return { allowance: allowance as bigint | undefined, isLoading, refetch };
}

// Hook to read Tron token allowance
export function useTronTokenAllowance(tokenAddress: string | undefined) {
  const { address: tronAddress, connected: isTronConnected } = useWallet();
  const [allowance, setAllowance] = useState<bigint | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllowance = useCallback(async () => {
    if (!tokenAddress || !isTronConnected) {
      setAllowance(undefined);
      return;
    }

    // Get the active address (from adapter or injected)
    let activeAddress = tronAddress;
    if (typeof window !== 'undefined') {
      const injected = (window as any).tronWeb ?? (window as any).tronLink?.tronWeb;
      if (!activeAddress && injected?.ready && injected.defaultAddress?.base58) {
        activeAddress = injected.defaultAddress.base58;
      }
    }

    if (!activeAddress) {
      setAllowance(undefined);
      return;
    }

    const tronConfig = getActiveTronConfig();
    const spenderAddress = tronConfig.casinoDepositAddress;

    setIsLoading(true);
    setError(null);

    // 1) Try injected TronWeb first (faster, no network call to our server)
    try {
      const injected = (window as any).tronWeb ?? (window as any).tronLink?.tronWeb;
      if (injected?.ready) {
        const contract = await injected.contract().at(tokenAddress);
        const result = await contract.allowance(activeAddress, spenderAddress).call();
        const allowanceValue = result?.toString ? BigInt(result.toString()) : BigInt(0);
        setAllowance(allowanceValue);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Injected TronWeb allowance check failed, falling back to API:', e);
    }

    // 2) Fallback to API proxy (works for WalletConnect/mobile users)
    try {
      const res = await fetch('/api/proxy/tron-allowance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: activeAddress,
          spender: spenderAddress,
          token: tokenAddress,
        }),
      });
      const data = await res.json();
      
      if (res.ok && data?.allowance !== undefined) {
        setAllowance(BigInt(data.allowance));
      } else {
        throw new Error(data?.error || `API returned ${res.status}`);
      }
    } catch (apiErr: any) {
      console.error('Tron allowance API error:', apiErr);
      setError(apiErr?.message || 'Failed to fetch allowance');
      setAllowance(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, tronAddress, isTronConnected]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchAllowance();
  }, [fetchAllowance]);

  return { allowance, isLoading, refetch: fetchAllowance, error };
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
