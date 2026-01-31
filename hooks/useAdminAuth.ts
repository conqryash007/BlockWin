'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string;
  wallet_address: string;
  is_admin: boolean;
}

type WalletNetwork = 'tron' | 'evm' | null;

interface UseAdminAuthReturn {
  isAdmin: boolean;
  isLoading: boolean;
  adminUser: AdminUser | null;
  error: string | null;
  refetch: () => Promise<void>;
  // TRON wallet info
  tronAddress: string | null;
  isTronConnected: boolean;
  // EVM wallet info
  evmAddress: string | null;
  isEvmConnected: boolean;
  // Active wallet info (whichever is connected and is admin)
  activeAddress: string | null;
  activeNetwork: WalletNetwork;
  isAnyWalletConnected: boolean;
}

// Helper to check if address is a TRON address
const isTronAddress = (address: string): boolean => {
  return !!address && (address.startsWith('T') || address.startsWith('t')) && address.length === 34;
};

export function useAdminAuth(): UseAdminAuthReturn {
  const { address: tronAddress, connected: isTronConnected } = useWallet();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeNetwork, setActiveNetwork] = useState<WalletNetwork>(null);

  const isAnyWalletConnected = isTronConnected || isEvmConnected;

  const checkAdminStatus = useCallback(async () => {
    // If no wallet is connected, reset state
    if (!isTronConnected && !isEvmConnected) {
      setIsAdmin(false);
      setAdminUser(null);
      setActiveNetwork(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let foundAdmin = false;
      let foundUser: AdminUser | null = null;
      let foundNetwork: WalletNetwork = null;

      // Check TRON wallet first if connected
      if (isTronConnected && tronAddress) {
        const { data, error: queryError } = await supabase
          .from('users')
          .select('id, wallet_address, is_admin')
          .eq('wallet_address', tronAddress)
          .single();

        if (!queryError && data && data.is_admin === true) {
          foundAdmin = true;
          foundUser = data as AdminUser;
          foundNetwork = 'tron';
        }
      }

      // Check EVM wallet if connected and not already found admin
      if (!foundAdmin && isEvmConnected && evmAddress) {
        // EVM addresses are stored lowercase
        const { data, error: queryError } = await supabase
          .from('users')
          .select('id, wallet_address, is_admin')
          .eq('wallet_address', evmAddress.toLowerCase())
          .single();

        if (!queryError && data && data.is_admin === true) {
          foundAdmin = true;
          foundUser = data as AdminUser;
          foundNetwork = 'evm';
        }
      }

      setIsAdmin(foundAdmin);
      setAdminUser(foundUser);
      setActiveNetwork(foundNetwork);

    } catch (err) {
      console.error('Error checking admin status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check admin status');
      setIsAdmin(false);
      setAdminUser(null);
      setActiveNetwork(null);
    } finally {
      setIsLoading(false);
    }
  }, [tronAddress, isTronConnected, evmAddress, isEvmConnected]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  // Determine the active address based on which network is the admin
  const activeAddress = activeNetwork === 'tron' 
    ? tronAddress 
    : activeNetwork === 'evm' 
      ? evmAddress 
      : null;

  return {
    isAdmin,
    isLoading,
    adminUser,
    error,
    refetch: checkAdminStatus,
    // TRON wallet info
    tronAddress: tronAddress || null,
    isTronConnected,
    // EVM wallet info
    evmAddress: evmAddress || null,
    isEvmConnected,
    // Active wallet info
    activeAddress: activeAddress || null,
    activeNetwork,
    isAnyWalletConnected,
  };
}
