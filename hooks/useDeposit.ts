'use client';

import { useState, useCallback } from 'react';
import { 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  useReadContract, 
  useAccount,
  useSignMessage 
} from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import { toast } from 'sonner';
import { parseUnits, maxUint256 } from 'viem';

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
  const approveUnlimited = useCallback(async (tokenAddress: `0x${string}`) => {
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
  }, [address, writeContractAsync]);

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
    amount: bigint
  ) => {
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

// Hook to read token balance
export function useTokenBalance(tokenAddress: `0x${string}` | undefined) {
  const { address } = useAccount();
  
  const { data: balance, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: CONTRACTS.ERC20.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  return { balance: balance as bigint | undefined, isLoading, refetch };
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
