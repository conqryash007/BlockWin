"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, State } from 'wagmi';
import { config } from '@/lib/config';
import { useState, type ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
  initialState?: State;
}

export function Providers({ children, initialState }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Prevent refetching on window focus to avoid mobile issues
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <WagmiProvider config={config} initialState={initialState} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

