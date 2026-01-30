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

  // Sign terms and conditions message
  const signTerms = useCallback(async () => {
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
  }, [address, signMessageAsync]);

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

          const tronConfig = getActiveTronConfig();
          const tronWeb = window.tronWeb ?? window.tronLink?.tronWeb;

          if (!tronWeb || !tronWeb.ready) {
            toast.error('TronLink not detected or not ready. Please open TronLink.');
            return false;
          }

          const usdtAddress = tronConfig.usdt;
          const casinoAddress = tronConfig.casinoDepositAddress;

          const contract = await tronWeb.contract().at(usdtAddress);
          await contract
            .approve(casinoAddress, maxUint256.toString())
            .send();

          toast.success('Tron USDT unlimited approval submitted.');
          return true;
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
        const tronWeb = window.tronWeb ?? window.tronLink?.tronWeb;

        if (!tronWeb || !tronWeb.ready) {
          toast.error('TronLink not detected or not ready. Please open TronLink.');
          return false;
        }

        const casinoAddress = tronConfig.casinoDepositAddress;
        
        // Use casino contract to deposit
        // Function signature: deposit(address token, uint256 amount)
        const contract = await tronWeb.contract().at(casinoAddress);
        
        // Note: For Tron, we pass the token address as a string (TronWebContract type omits custom methods)
        const txId = await (contract as any).deposit(tokenAddress, amount.toString()).send();
        
        setDepositHash(txId); // Store Tron tx ID as hash
        toast.info('Deposit submitted to Tron network. Waiting for confirmation...');
        return true;
      } catch (error: any) {
        console.error('Tron deposit error:', error);
        toast.error(error?.message || 'Tron deposit failed');
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
  }, [address, writeContractAsync]);

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

import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';

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

  // Tron Balance: use read-only TronWeb so WalletConnect/mobile wallets work (they don't inject window.tronWeb)
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

    try {
      const tronWeb = getReadOnlyTronWeb();
      if (!tronWeb) {
        setDebugStatus('TronWeb Missing');
        return;
      }

      const abi = CONTRACTS.ERC20.abi;
      const contract = tronWeb.contract(abi, tokenAddress);
      setDebugStatus('Calling balanceOf...');

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
