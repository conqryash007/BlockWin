
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export interface PlatformConfig {
  min_deposit: { amount: number };
  max_bet: { amount: number };
  house_edge: {
    dice: number;
    crash: number;
    mines: number;
    plinko: number;
    [key: string]: number;
  };
  platform_fees: { withdrawal_percent: number };
  [key: string]: any;
}

const defaultConfig: PlatformConfig = {
  min_deposit: { amount: 10 },
  max_bet: { amount: 1000 },
  house_edge: {
    dice: 0.02,
    crash: 0.03,
    mines: 0.03,
    plinko: 0.02
  },
  platform_fees: { withdrawal_percent: 0.05 }
};

export function usePlatformConfig() {
  const [config, setConfig] = useState<PlatformConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data, error } = await supabase
          .from('platform_config')
          .select('key, value');

        if (error) {
          console.error('Error fetching config:', error);
          return;
        }

        if (data) {
          const newConfig = { ...defaultConfig };
          data.forEach((item) => {
             // @ts-ignore
             newConfig[item.key] = item.value;
          });
          setConfig(newConfig);
        }
      } catch (err) {
        console.error('Failed to load platform config', err);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, [supabase]);

  return { config, loading };
}
