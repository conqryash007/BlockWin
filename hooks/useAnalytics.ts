import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export type EventType = 'PAGE_VIEW' | 'SECTION_JUMP' | 'CONNECT_CLICK' | 'WALLET_SELECTED' | 'WALLET_CONNECTED' | 'USDT_APPROVED';

export function useAnalytics() {
  const { user } = useAuth();

  const trackEvent = useCallback(async (eventType: EventType, eventData: Record<string, any> = {}) => {
    try {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        return;
      }

      // Automatically capture the domain and visitor ID
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
      
      let visitorId = 'unknown';
      if (typeof window !== 'undefined') {
        visitorId = localStorage.getItem('visitor_id') || '';
        if (!visitorId) {
          visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
          localStorage.setItem('visitor_id', visitorId);
        }
      }

      const enrichedData = { ...eventData, domain, visitor_id: visitorId };

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
