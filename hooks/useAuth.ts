import { createContext, useContext } from 'react';

export interface WalletOwnershipResult {
  isOwnedByOther: boolean;
  ownerEmail?: string;
}

export interface AuthContextType {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  session: any;
  user: any;
  isAuthenticated: boolean;
  
  // Wallet Connection (Pass-through for building UI)
  address?: string; // Wagmi address
  isConnected: boolean;
  tronAddress: string | null;
  isTronConnected: boolean;
  isAnyConnected: boolean;
  activeAddress: string | null;
  
  // Allowances (Pass-through for Deposit)
  approvalPending: boolean;
  hasUnlimitedApproval: boolean;
  usdtAllowanceTron: bigint | undefined;
  refetchTronAllowance: () => void;
  
  // Wallet address registration (called after approval)
  registerWalletAddress: (address: string, network: 'ethereum' | 'tron') => Promise<void>;
  
  // Wallet ownership check (check if wallet belongs to another account)
  checkWalletOwnership: (address: string, network: 'ethereum' | 'tron') => Promise<WalletOwnershipResult>;
  
  // Legacy/Mocked helpers to prevent breaking big refactors immediately
  accountStatus: 'unknown' | 'checking' | 'existing' | 'new';
  checkUserExists: (walletAddress: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export type for compatibility if imported elsewhere
export type AccountStatus = 'unknown' | 'checking' | 'existing' | 'new';

