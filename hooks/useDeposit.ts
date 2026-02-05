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

          console.log('[Tron Approval] Built transaction, requesting signature...');
          toast.info('Please confirm the approval in your wallet...');
          
          let signedTx: any;
          try {
            signedTx = await signTransaction(wrapper.transaction);
          } catch (signError: any) {
            console.error('[Tron Approval] Sign error:', signError);
            const msg = signError?.message?.toLowerCase() || '';
            if (msg.includes('reject') || msg.includes('cancel') || msg.includes('denied') || msg.includes('user rejected') || msg.includes('user denied')) {
              throw new Error('Approval was rejected by user');
            }
            throw new Error(signError?.message || 'Failed to sign approval');
          }
          
          // Validate signed transaction
          if (!signedTx) {
            throw new Error('Approval signing was cancelled or failed');
          }
          
          console.log('[Tron Approval] Signed tx result type:', typeof signedTx);
          
          const txIdFromSigned = (signedTx as any)?.txID || (signedTx as any)?.txid;
          console.log('[Tron Approval] TxID from signed:', txIdFromSigned);
          
          // Always try to broadcast
          console.log('[Tron Approval] Attempting to broadcast...');
          toast.info('Broadcasting approval...');
          
          let broadcastSuccess = false;
          let finalTxId = txIdFromSigned;
          
          try {
            const result = await tronWeb.trx.sendRawTransaction(signedTx);
            console.log('[Tron Approval] Broadcast result:', JSON.stringify(result).slice(0, 300));
            
            const broadcastResult = result as { result?: boolean; txid?: string; code?: string; message?: string };
            
            if (broadcastResult.result === true) {
              broadcastSuccess = true;
              finalTxId = broadcastResult.txid || txIdFromSigned;
            } else if (broadcastResult.result === false) {
              const code = broadcastResult.code || '';
              const msg = broadcastResult.message || '';
              
              if (code.includes('DUP') || msg.includes('DUP') || code.includes('ALREADY') || msg.includes('ALREADY')) {
                broadcastSuccess = true;
              } else {
                throw new Error(msg || code || 'Approval broadcast failed');
              }
            } else if (broadcastResult.txid) {
              broadcastSuccess = true;
              finalTxId = broadcastResult.txid;
            }
          } catch (broadcastError: any) {
            const errMsg = broadcastError?.message || '';
            console.error('[Tron Approval] Broadcast error:', errMsg);
            
            if (errMsg.includes('ALREADY_EXIST') || errMsg.includes('DUP_TRANSACTION') || errMsg.includes('Transaction already exists')) {
              broadcastSuccess = true;
            } else {
              throw new Error(errMsg || 'Failed to broadcast approval');
            }
          }
          
          if (!finalTxId) {
            throw new Error('No transaction ID available for approval');
          }
          
          // Verify the approval transaction exists on-chain
          console.log('[Tron Approval] Verifying on-chain:', finalTxId);
          toast.info('Verifying approval...');
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          let verified = false;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const txInfo = await tronWeb.trx.getTransaction(finalTxId);
              if (txInfo && txInfo.txID) {
                verified = true;
                console.log('[Tron Approval] Transaction verified!');
                break;
              }
            } catch (verifyErr) {
              console.log('[Tron Approval] Verify attempt', attempt + 1, 'failed');
            }
            
            if (attempt < 2) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          
          if (!verified) {
            console.error('[Tron Approval] Transaction NOT found on-chain');
            throw new Error('Approval transaction could not be verified. It may have been rejected. Please try again.');
          }

          console.log('[Tron Approval] Success! Verified');
          toast.success('Tron USDT approval confirmed!');
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
          
          if (!txId || typeof txId !== 'string') {
            throw new Error('Transaction was submitted but no transaction ID was returned. Please check your wallet for the transaction status.');
          }
          
          setDepositHash(txId.startsWith('0x') ? (txId as `0x${string}`) : (`0x${txId}` as `0x${string}`));
          toast.info('Deposit submitted to Tron network. Waiting for confirmation...');
          return txId;
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

        console.log('[Tron Deposit] Built transaction, requesting signature...');
        toast.info('Please confirm the transaction in your wallet...');
        
        let signedTx: any;
        try {
          signedTx = await signTransaction(wrapper.transaction);
        } catch (signError: any) {
          console.error('[Tron Deposit] Sign error:', signError);
          // User rejected or wallet error
          const msg = signError?.message?.toLowerCase() || '';
          if (msg.includes('reject') || msg.includes('cancel') || msg.includes('denied') || msg.includes('user rejected') || msg.includes('user denied')) {
            throw new Error('Transaction was rejected by user');
          }
          throw new Error(signError?.message || 'Failed to sign transaction');
        }
        
        // Validate signed transaction
        if (!signedTx) {
          throw new Error('Transaction signing was cancelled or failed');
        }
        
        console.log('[Tron Deposit] Signed tx result type:', typeof signedTx);
        console.log('[Tron Deposit] Signed tx keys:', signedTx ? Object.keys(signedTx) : 'null');
        
        // Get the transaction ID from the signed transaction
        // Note: txID exists even before broadcast - it's just the hash of the transaction
        const txIdFromSigned = (signedTx as any)?.txID || (signedTx as any)?.txid;
        console.log('[Tron Deposit] TxID from signed:', txIdFromSigned);
        
        // Always try to broadcast - the wallet might have only signed, not broadcast
        console.log('[Tron Deposit] Attempting to broadcast transaction...');
        toast.info('Broadcasting transaction...');
        
        let broadcastSuccess = false;
        let finalTxId = txIdFromSigned;
        
        try {
          const result = await tronWeb.trx.sendRawTransaction(signedTx);
          console.log('[Tron Deposit] Broadcast result:', JSON.stringify(result).slice(0, 300));
          
          const broadcastResult = result as { result?: boolean; txid?: string; code?: string; message?: string };
          
          if (broadcastResult.result === true) {
            broadcastSuccess = true;
            finalTxId = broadcastResult.txid || txIdFromSigned;
            console.log('[Tron Deposit] Broadcast successful, txId:', finalTxId);
          } else if (broadcastResult.result === false) {
            const code = broadcastResult.code || '';
            const msg = broadcastResult.message || '';
            console.log('[Tron Deposit] Broadcast returned false:', code, msg);
            
            // Check if it's because the tx was already broadcast (duplicate)
            if (code.includes('DUP') || msg.includes('DUP') || code.includes('ALREADY') || msg.includes('ALREADY')) {
              console.log('[Tron Deposit] Transaction already broadcast by wallet');
              broadcastSuccess = true; // Already broadcast is fine
            } else {
              throw new Error(msg || code || 'Transaction broadcast failed');
            }
          } else {
            // Some wallets return the txid directly
            if (broadcastResult.txid) {
              broadcastSuccess = true;
              finalTxId = broadcastResult.txid;
            }
          }
        } catch (broadcastError: any) {
          const errMsg = broadcastError?.message || '';
          console.error('[Tron Deposit] Broadcast error:', errMsg);
          
          // Check if already broadcast
          if (errMsg.includes('ALREADY_EXIST') || errMsg.includes('DUP_TRANSACTION') || errMsg.includes('Transaction already exists')) {
            console.log('[Tron Deposit] Transaction already exists on network');
            broadcastSuccess = true;
          } else {
            throw new Error(errMsg || 'Failed to broadcast transaction');
          }
        }
        
        if (!finalTxId) {
          throw new Error('No transaction ID available');
        }
        
        // CRITICAL: Verify the transaction actually exists on-chain
        // Wait a moment for propagation, then check
        console.log('[Tron Deposit] Verifying transaction on-chain:', finalTxId);
        toast.info('Verifying transaction...');
        
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        
        let verified = false;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const txInfo = await tronWeb.trx.getTransaction(finalTxId);
            if (txInfo && txInfo.txID) {
              verified = true;
              console.log('[Tron Deposit] Transaction verified on-chain!');
              break;
            }
          } catch (verifyErr) {
            console.log('[Tron Deposit] Verify attempt', attempt + 1, 'failed:', verifyErr);
          }
          
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 more seconds
          }
        }
        
        if (!verified) {
          console.error('[Tron Deposit] Transaction NOT found on-chain after verification attempts');
          throw new Error('Transaction could not be verified on the blockchain. It may have been rejected or not broadcast. Please check your wallet.');
        }
        
        console.log('[Tron Deposit] Success! Verified txId:', finalTxId);
        setDepositHash(finalTxId.startsWith('0x') ? (finalTxId as `0x${string}`) : (`0x${finalTxId}` as `0x${string}`));
        toast.info('Deposit confirmed on Tron network!');
        return finalTxId;
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
  console.log('HOOK_TRACE: useTokenBalance entered', { tokenAddress, network });
  const { address } = useAccount();
  const { address: tronAddress, connected: isTronConnected } = useWallet();
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

  // Tron Balance: try API proxy first (works on mobile, no CORS), then fall back to client-side TronWeb
  const fetchTronBalance = useCallback(async () => {
    setDebugStatus('Fetching...');
    if (network !== 'tron') {
      setDebugStatus('Not Tron');
      return;
    }
    if (!tokenAddress) {
      setDebugStatus('No Token Addr');
      return;
    }

    let activeAddress = tronAddress;
    if (typeof window !== 'undefined') {
      const injected = (window as any).tronWeb ?? (window as any).tronLink?.tronWeb;
      if (!activeAddress && injected?.ready && injected.defaultAddress?.base58) {
        activeAddress = injected.defaultAddress.base58;
      }
    }
    setActiveDebugAddress(activeAddress || 'None');

    if (!activeAddress) {
      setDebugStatus('No User Addr');
      setTronBalance(undefined);
      return;
    }

    // 1) Try same-origin API first (reliable on mobile, no CORS)
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
        return;
      }
      if (!res.ok) {
        throw new Error(data?.error || `API ${res.status}`);
      }
    } catch (apiErr: any) {
      console.warn('Tron balance API failed, trying client:', apiErr?.message);
    }

    // 2) Fall back to client-side TronWeb (can fail on mobile due to CORS)
    try {
      const tronWeb = getReadOnlyTronWeb();
      if (!tronWeb) {
        setDebugStatus('TronWeb Missing');
        return;
      }
      setDebugStatus('Calling balanceOf...');
      const abi = CONTRACTS.ERC20.abi;
      const contract = tronWeb.contract(abi, tokenAddress);
      let balanceResult: { toString(): string };
      if (typeof contract.balanceOf === 'function') {
        balanceResult = await contract.balanceOf(activeAddress).call();
      } else if (contract.methods && typeof contract.methods.balanceOf === 'function') {
        balanceResult = await contract.methods.balanceOf(activeAddress).call();
      } else {
        throw new Error('balanceOf method not found on contract object');
      }
      const finalBalance = BigInt(balanceResult.toString());
      setTronBalance(finalBalance);
      setDebugStatus(`Done: ${finalBalance.toString()}`);
      setError(null);
    } catch (error: any) {
      console.error('HOOK_TRACE: Error fetching Tron balance:', error);
      const errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      setError(errorMessage);
      setDebugStatus(`Err: ${errorMessage.slice(0, 15)}...`);
      setTronBalance(undefined);
    }
  }, [network, isTronConnected, tronAddress, tokenAddress]);

  // Effect to fetch Tron balance
  useEffect(() => {
    if (network === 'tron') {
      fetchTronBalance();
      const interval = setInterval(fetchTronBalance, 5000); // Poll faster for debugging
      return () => clearInterval(interval);
    }
  }, [network, fetchTronBalance]);

  const currentHost =
    (typeof window !== 'undefined' && ((window as any).tronWeb?.fullNode?.host ?? (window as any).tronLink?.tronWeb?.fullNode?.host)) ||
    (network === 'tron' ? getActiveTronConfig().fullHost : 'unknown') ||
    'unknown';

  return {
    balance: network === 'tron' ? tronBalance : (evmBalance as bigint | undefined),
    isLoading: network === 'tron' ? false : isEvmLoading,
    refetch: network === 'tron' ? fetchTronBalance : refetchEvm,
    error: network === 'tron' ? error : null,
    debugInfo: { status: debugStatus, userAddr: activeDebugAddress, node: currentHost },
  };
}

// Hook to read token allowance
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
