'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';
import { useOnBonusUpdate } from '@/lib/depositEvents';

export interface WelcomeBonusState {
  status: 'pending' | 'credited' | 'expired' | 'loading';
  isEligible: boolean;
  showPopup: boolean;
  bonusAmount: number;
}

export function useWelcomeBonus() {
  const { isAuthenticated, user, isAnyConnected } = useAuth();
  const [state, setState] = useState<WelcomeBonusState>({
    status: 'loading',
    isEligible: false,
    showPopup: false,
    bonusAmount: 10,
  });
  const [dismissed, setDismissed] = useState(false);

  // Fetch bonus status from database
  const fetchBonusStatus = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setState(prev => ({ ...prev, status: 'loading', showPopup: false }));
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('users')
        .select('welcome_bonus_status, first_deposit_at')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('[useWelcomeBonus] Error fetching status:', error);
        return;
      }

      const bonusStatus = (data?.welcome_bonus_status as 'pending' | 'credited' | 'expired') || 'pending';
      const isEligible = bonusStatus === 'pending';
      
      setState({
        status: bonusStatus,
        isEligible,
        showPopup: isEligible && !dismissed,
        bonusAmount: 10,
      });
    } catch (err) {
      console.error('[useWelcomeBonus] Error:', err);
    }
  }, [isAuthenticated, user?.id, dismissed]);

  // Fetch status on auth change
  useEffect(() => {
    fetchBonusStatus();
  }, [fetchBonusStatus]);

  // Reset dismissed state on login (new session)
  useEffect(() => {
    if (isAuthenticated) {
      setDismissed(false);
    }
  }, [isAuthenticated]);

  // Dismiss popup for current session
  const dismissPopup = useCallback(() => {
    setDismissed(true);
    setState(prev => ({ ...prev, showPopup: false }));
  }, []);

  // Refresh status (call after deposit)
  const refreshStatus = useCallback(() => {
    fetchBonusStatus();
  }, [fetchBonusStatus]);

  // Listen for global bonus updates
  useOnBonusUpdate(() => {
    console.log('[useWelcomeBonus] Received update event, refreshing status...');
    fetchBonusStatus();
  });

  return {
    ...state,
    hasWalletConnected: isAnyConnected,
    dismissPopup,
    refreshStatus,
  };
}
