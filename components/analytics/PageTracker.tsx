'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';

export function PageTracker() {
  const pathname = usePathname();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (pathname) {
      trackEvent('PAGE_VIEW', { path: pathname });
    }
  }, [pathname, trackEvent]);

  return null;
}
