import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export type EventType = 'PAGE_VIEW' | 'SECTION_JUMP' | 'CONNECT_CLICK';

export function useAnalytics() {
  const { user } = useAuth();

  const trackEvent = useCallback(async (eventType: EventType, eventData: Record<string, any> = {}) => {
    try {
      const { error } = await supabase.from('analytics_events').insert([
        {
          event_type: eventType,
          event_data: eventData,
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
