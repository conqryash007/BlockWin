'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
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
}

export function useAdminAuth(): UseAdminAuthReturn {
  const { address, isConnected } = useAccount();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async () => {
    if (!isConnected || !address) {
      setIsAdmin(false);
      setAdminUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('users')
        .select('id, wallet_address, is_admin')
        .eq('wallet_address', address.toLowerCase())
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
  }, [address, isConnected]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  return {
    isAdmin,
    isLoading,
    adminUser,
    error,
    refetch: checkAdminStatus,
  };
}
