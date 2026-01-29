import { createContext, useContext } from 'react';

// Types
export type AccountStatus = 'unknown' | 'checking' | 'existing' | 'new';

export interface AuthContextType {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  session: any;
  user: any;
  isAuthenticated: boolean;
  accountStatus: AccountStatus;
  checkUserExists: (walletAddress: string) => Promise<boolean>;
  approvalPending: boolean;
  hasUnlimitedApproval: boolean;
  address?: string;
  isConnected: boolean;
  tronAddress: string | null;
  isTronConnected: boolean;
  isAnyConnected: boolean;
  activeAddress: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
