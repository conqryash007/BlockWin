import { http, createConfig, createStorage, cookieStorage } from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

// ============================================
// Network Configuration Helpers
// ============================================

/**
 * Check if the app is configured for mainnet
 */
export const isMainnet = () => 
  process.env.NEXT_PUBLIC_NETWORK_ENV === 'mainnet'

/**
 * Get the active chain based on environment
 */
export const getActiveChain = () => 
  isMainnet() ? mainnet : sepolia

/**
 * Get the current network name
 */
export const getNetworkName = () => 
  isMainnet() ? 'mainnet' : 'sepolia'

// ============================================
// RPC Configuration
// ============================================

// Sepolia RPC URL
const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 
  'https://eth-sepolia.g.alchemy.com/v2/yLWUqQNU-o2A3CDy3FjA0';

// Mainnet RPC URL
const MAINNET_RPC_URL = process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 
  'https://eth-mainnet.g.alchemy.com/v2/demo';

// Export the active RPC URL based on environment
export const ACTIVE_RPC_URL = isMainnet() ? MAINNET_RPC_URL : SEPOLIA_RPC_URL;

// Legacy export for backward compatibility
export const SEPOLIA_RPC_URL_EXPORT = SEPOLIA_RPC_URL;

// ============================================
// WalletConnect Configuration
// ============================================

export const projectId = 'b4c9b9c116c4403cdf65244eaffe6d91'

// Get the app URL dynamically for WalletConnect metadata
const getAppUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for SSR - use production URL
  return process.env.NEXT_PUBLIC_APP_URL || 'https://blockwin.space';
};

// WalletConnect metadata for mobile wallet display
const metadata = {
  name: 'BlockWin Casino',
  description: 'BlockWin - Web3 Casino Platform',
  url: getAppUrl(),
  icons: ['https://blockwin.space/logo.png'],
}

// ============================================
// Wagmi Configuration
// ============================================

// Get the active chain for configuration
const activeChain = getActiveChain()

export const config = createConfig({
  chains: [activeChain],
  // Enable SSR support for Next.js
  ssr: true,
  // Use cookie storage for SSR compatibility
  storage: createStorage({
    storage: cookieStorage,
  }),
  // Enable multiInjectedProviderDiscovery for better mobile wallet detection
  multiInjectedProviderDiscovery: true,
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC_URL),
    [mainnet.id]: http(MAINNET_RPC_URL),
  },
  connectors: [
    injected({
      // Shimming helps with mobile in-app browsers (MetaMask, Trust Wallet, etc.)
      shimDisconnect: true,
    }),
    walletConnect({ 
      projectId, 
      showQrModal: true,
      metadata,
      // Explicitly set the required chains for WalletConnect v2
      // This ensures mobile wallets know which chains to connect with
      qrModalOptions: {
        themeMode: 'dark',
      },
    }),
  ],
})

// Log network configuration on initialization (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log(`🌐 BlockWin Network: ${getNetworkName().toUpperCase()}`)
  console.log(`   Chain ID: ${activeChain.id}`)
}
