"use client";

import { createContext, useContext, useCallback } from 'react';

type TronWalletConnectContextValue = {
  /** Call when user selects TRON network to lazy-load the WalletConnect adapter and avoid conflicts with EVM WC */
  setIncludeTronWalletConnect: (include: boolean) => void;
};

const TronWalletConnectContext = createContext<TronWalletConnectContextValue | null>(null);

export function useTronWalletConnectContext(): TronWalletConnectContextValue {
  const ctx = useContext(TronWalletConnectContext);
  if (!ctx) {
    return {
      setIncludeTronWalletConnect: () => {},
    };
  }
  return ctx;
}

export { TronWalletConnectContext };
