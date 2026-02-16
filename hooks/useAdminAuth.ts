'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  is_admin: boolean;
  admin_origin: string | null;
}

interface UseAdminAuthReturn {
  isAdmin: boolean;
  isLoading: boolean;
  adminUser: AdminUser | null;
  adminOrigin: string | null;
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

  // Track which user ID we've already checked to avoid repeated checks
  const checkedUserIdRef = useRef<string | null>(null);

  const checkAdminStatus = useCallback(async (force = false) => {
    const userId = session?.user?.id;

    if (!userId) {
      checkedUserIdRef.current = null;
      setIsAdmin(false);
      setAdminUser(null);
      setIsLoading(false);
      return;
    }

    // Skip if we already checked this user (unless forced via refetch)
    if (!force && checkedUserIdRef.current === userId) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('users')
        .select('id, email, is_admin, admin_origin')
        .eq('id', userId)
        .single();

      if (queryError || !data) {
        setIsAdmin(false);
        setAdminUser(null);
        setIsLoading(false);
        checkedUserIdRef.current = userId;
        return;
      }

      const isAdminFlag = data.is_admin === true;
      setIsAdmin(isAdminFlag);
      setAdminUser(isAdminFlag ? (data as AdminUser) : null);
      checkedUserIdRef.current = userId;
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
    const userId = session?.user?.id;

    if (!userId) {
      checkedUserIdRef.current = null;
      setIsAdmin(false);
      setAdminUser(null);
      setIsLoading(false);
      return;
    }

    // Only check if user ID changed (not on every session object change)
    if (checkedUserIdRef.current !== userId) {
      checkAdminStatus();
    }
  }, [session?.user?.id, checkAdminStatus]);

  return {
    isAdmin,
    isLoading,
    adminUser,
    adminOrigin: adminUser?.admin_origin ?? null,
    error,
    refetch: () => checkAdminStatus(true),
    isAuthenticated: !!session,
    user: authUser ? { id: authUser.id, email: authUser.email ?? undefined } : null,
  };
}
