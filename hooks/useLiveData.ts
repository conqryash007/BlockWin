import { useState, useEffect } from 'react';
import { LIVE_BETS } from '@/lib/mockData';

export function useLiveData() {
  const [liveBets, setLiveBets] = useState(LIVE_BETS);

  useEffect(() => {
    const interval = setInterval(() => {
      // Logic to cycle/update bets would go here
      // For now, just a placeholder
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return { liveBets };
}
