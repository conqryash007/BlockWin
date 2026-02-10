'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  is_admin: boolean;
}

interface UseAdminAuthReturn {
  isAdmin: boolean;
  isLoading: boolean;
  adminUser: AdminUser | null;
  error: string | null;
  refetch: () => Promise<void>;
  isAuthenticated: boolean;
  user: { id: string; email?: string } | null;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const { session, user: authUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async () => {
    if (!session?.user?.id) {
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
        .select('id, email, is_admin')
        .eq('id', session.user.id)
        .single();

      if (queryError || !data) {
        setIsAdmin(false);
        setAdminUser(null);
        setIsLoading(false);
        return;
      }

      const isAdminFlag = data.is_admin === true;
      setIsAdmin(isAdminFlag);
      setAdminUser(isAdminFlag ? (data as AdminUser) : null);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check admin status');
      setIsAdmin(false);
      setAdminUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      setAdminUser(null);
      setIsLoading(false);
      return;
    }
    checkAdminStatus();
  }, [session, checkAdminStatus]);

  return {
    isAdmin,
    isLoading,
    adminUser,
    error,
    refetch: checkAdminStatus,
    isAuthenticated: !!session,
    user: authUser ? { id: authUser.id, email: authUser.email ?? undefined } : null,
  };
}
