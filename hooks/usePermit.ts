'use client';

import { useCallback, useState } from 'react';
import { useAccount, useSignTypedData, useReadContract } from 'wagmi';
import { CONTRACTS, SUPPORTED_TOKENS, TokenSymbol } from '@/lib/contracts';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { maxUint256 } from 'viem';

// 10 years in seconds for permit deadline
const PERMIT_DEADLINE = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 10;

// EIP-712 domain type
const PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export interface PermitSignature {
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
  deadline: bigint;
  nonce: bigint;
  value: bigint;
}

export function usePermit(tokenSymbol: TokenSymbol) {
  const { address } = useAccount();
  const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();
  const [isStoring, setIsStoring] = useState(false);
  const supabase = createClient();
  
  const token = SUPPORTED_TOKENS[tokenSymbol];
  const tokenAddress = token.address;
  
  // Read nonce from token contract
  const { data: nonce, refetch: refetchNonce } = useReadContract({
    address: tokenAddress,
    abi: CONTRACTS.ERC20Permit.abi,
    functionName: 'nonces',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && token.supportsPermit,
    },
  });
  
  // Read token name for EIP-712 domain
  const { data: tokenName } = useReadContract({
    address: tokenAddress,
    abi: CONTRACTS.ERC20Permit.abi,
    functionName: 'name',
    query: {
      enabled: token.supportsPermit,
    },
  });

  // Sign an EIP-2612 permit for unlimited approval
  const signPermit = useCallback(async (): Promise<PermitSignature | null> => {
    if (!address) {
      toast.error('Please connect your wallet');
      return null;
    }
    
    if (!token.supportsPermit) {
      toast.error(`${tokenSymbol} does not support EIP-2612 permit`);
      return null;
    }
    
    if (nonce === undefined) {
      toast.error('Unable to fetch nonce');
      return null;
    }

    try {
      const deadline = BigInt(PERMIT_DEADLINE);
      const value = maxUint256; // Unlimited approval
      
      const signature = await signTypedDataAsync({
        domain: {
          name: tokenName as string || tokenSymbol,
          version: '1',
          chainId: CONTRACTS.network.chainId,
          verifyingContract: tokenAddress,
        },
        types: PERMIT_TYPES,
        primaryType: 'Permit',
        message: {
          owner: address,
          spender: CONTRACTS.CasinoDeposit.address,
          value,
          nonce,
          deadline,
        },
      });
      
      // Parse signature into v, r, s components
      const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
      const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
      const v = parseInt(signature.slice(130, 132), 16);
      
      return {
        v,
        r,
        s,
        deadline,
        nonce,
        value,
      };
    } catch (error: any) {
      console.error('Permit signing error:', error);
      if (error.code === 4001 || error.message?.includes('rejected')) {
        toast.error('Permit signature was rejected');
      } else {
        toast.error('Failed to sign permit');
      }
      return null;
    }
  }, [address, nonce, signTypedDataAsync, token.supportsPermit, tokenAddress, tokenName, tokenSymbol]);

  // Store permit signature in database
  const storePermitSignature = useCallback(async (permit: PermitSignature): Promise<boolean> => {
    if (!address) return false;
    
    setIsStoring(true);
    try {
      // First get the user_id from wallet address
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address.toLowerCase())
        .single();
      
      if (userError || !userData) {
        console.error('Error fetching user:', userError);
        toast.error('User not found');
        return false;
      }

      const { error } = await supabase.from('permit_signatures').insert({
        user_id: userData.id,
        wallet_address: address.toLowerCase(),
        token_address: tokenAddress.toLowerCase(),
        spender_address: CONTRACTS.CasinoDeposit.address.toLowerCase(),
        value: permit.value.toString(),
        deadline: Number(permit.deadline),
        v: permit.v,
        r: permit.r,
        s: permit.s,
        nonce: Number(permit.nonce),
      });
      
      if (error) {
        console.error('Error storing permit:', error);
        toast.error('Failed to store permit signature');
        return false;
      }
      
      toast.success('Permit signed and stored');
      return true;
    } catch (error) {
      console.error('Error storing permit:', error);
      toast.error('Failed to store permit signature');
      return false;
    } finally {
      setIsStoring(false);
    }
  }, [address, supabase, tokenAddress]);

  // Check if user has a stored permit for this token
  const checkStoredPermit = useCallback(async (): Promise<boolean> => {
    if (!address) return false;
    
    try {
      const { data, error } = await supabase
        .from('permit_signatures')
        .select('id')
        .eq('wallet_address', address.toLowerCase())
        .eq('token_address', tokenAddress.toLowerCase())
        .eq('is_used', false)
        .limit(1);
      
      if (error) {
        console.error('Error checking permit:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking permit:', error);
      return false;
    }
  }, [address, supabase, tokenAddress]);

  // Sign and store permit in one step
  const signAndStorePermit = useCallback(async (): Promise<boolean> => {
    const permit = await signPermit();
    if (!permit) return false;
    
    const stored = await storePermitSignature(permit);
    if (stored) {
      await refetchNonce();
    }
    return stored;
  }, [signPermit, storePermitSignature, refetchNonce]);

  return {
    signPermit,
    storePermitSignature,
    checkStoredPermit,
    signAndStorePermit,
    isSigning,
    isStoring,
    isPending: isSigning || isStoring,
    supportsPermit: token.supportsPermit,
  };
}
