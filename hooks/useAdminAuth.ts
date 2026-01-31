'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string;
  wallet_address: string;
  is_admin: boolean;
}

interface UseAdminAuthReturn {
  isAdmin: boolean;
  isLoading: boolean;
  adminUser: AdminUser | null;
  error: string | null;
  refetch: () => Promise<void>;
  tronAddress: string | null;
  isTronConnected: boolean;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const { address: tronAddress, connected: isTronConnected } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async () => {
    if (!isTronConnected || !tronAddress) {
      setIsAdmin(false);
      setAdminUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Database stores addresses in lowercase, so convert TRON address to lowercase for matching
      const { data, error: queryError } = await supabase
        .from('users')
        .select('id, wallet_address, is_admin')
        .eq('wallet_address', tronAddress.toLowerCase())
        .single();

      if (queryError) {
        // User might not exist
        if (queryError.code === 'PGRST116') {
          setIsAdmin(false);
          setAdminUser(null);
        } else {
          throw queryError;
        }
      } else if (data) {
        setIsAdmin(data.is_admin === true);
        setAdminUser(data as AdminUser);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check admin status');
      setIsAdmin(false);
      setAdminUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [tronAddress, isTronConnected]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  return {
    isAdmin,
    isLoading,
    adminUser,
    error,
    refetch: checkAdminStatus,
    tronAddress,
    isTronConnected,
  };
}
