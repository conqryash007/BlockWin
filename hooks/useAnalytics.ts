import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export type EventType = 'PAGE_VIEW' | 'SECTION_JUMP' | 'CONNECT_CLICK' | 'WALLET_SELECTED' | 'WALLET_CONNECTED' | 'USDT_APPROVED';

export function useAnalytics() {
  const { user } = useAuth();

  const trackEvent = useCallback(async (eventType: EventType, eventData: Record<string, any> = {}) => {
    try {
      // Automatically capture the domain
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
      const enrichedData = { ...eventData, domain };

      const { error } = await supabase.from('analytics_events').insert([
        {
          event_type: eventType,
          event_data: enrichedData,
          user_id: user?.id || null,
        }
      ]);

      if (error) {
        console.error('Error tracking analytics event:', error);
      }
    } catch (err) {
      console.error('Error tracking analytics event:', err);
    }
  }, [user]);

  return { trackEvent };
}
