"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { TronWalletConnectQRModal } from "@/components/wallet/TronWalletConnectQRModal";

type TronWalletConnectQRContextValue = {
  onDisplayUri: (uri: string) => void;
  onCloseModal: () => void;
};

const TronWalletConnectQRContext = createContext<TronWalletConnectQRContextValue | null>(null);

export function useTronWalletConnectQRContext(): TronWalletConnectQRContextValue {
  const ctx = useContext(TronWalletConnectQRContext);
  if (!ctx) {
    return {
      onDisplayUri: () => {},
      onCloseModal: () => {},
    };
  }
  return ctx;
}

export function TronWalletConnectQRProvider({ children }: { children: React.ReactNode }) {
  const [uri, setUri] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const onDisplayUri = useCallback((u: string) => {
    setUri(u);
    setOpen(true);
  }, []);

  const onCloseModal = useCallback(() => {
    setOpen(false);
    setUri(null);
  }, []);

  const value: TronWalletConnectQRContextValue = {
    onDisplayUri,
    onCloseModal,
  };

  return (
    <TronWalletConnectQRContext.Provider value={value}>
      {children}
      <TronWalletConnectQRModal
        open={open}
        uri={uri}
        onClose={onCloseModal}
      />
    </TronWalletConnectQRContext.Provider>
  );
}
