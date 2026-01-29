// Minimal TronWeb / TronLink type declarations for client-side usage

interface TronWebContract {
  approve(spender: string, amount: string | number | bigint): {
    send(options?: unknown): Promise<unknown>;
  };
}

interface TronWebInstance {
  ready: boolean;
  defaultAddress: {
    base58: string;
    hex: string;
  };
  contract(abi?: unknown, address?: string): {
    at(address: string): Promise<TronWebContract>;
  };
}

interface TronLinkInterface {
  ready: boolean;
  tronWeb?: TronWebInstance;
}

declare global {
  interface Window {
    tronWeb?: TronWebInstance;
    tronLink?: TronLinkInterface;
  }
}

export {};
