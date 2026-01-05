import { useState, useEffect } from 'react';

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState(1250.50);
  const [address, setAddress] = useState<string | null>(null);

  const connect = () => {
    setIsConnected(true);
    setAddress("0x1234...5678");
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
  };

  return { isConnected, balance, address, connect, disconnect };
}
