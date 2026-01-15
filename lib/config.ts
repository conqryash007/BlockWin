import { http, createConfig, createStorage, cookieStorage } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

// Sepolia RPC URL with Alchemy
export const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/yLWUqQNU-o2A3CDy3FjA0';

export const projectId = '8409c5ec71253f99c76c781324b10720'

// WalletConnect metadata for mobile wallet display
const metadata = {
  name: 'BlockWin Casino',
  description: 'BlockWin - Web3 Casino Platform',
  url: 'https://blockwin.netlify.app',
  icons: ['https://blockwin.netlify.app/logo.png'],
}

export const config = createConfig({
  chains: [sepolia],
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
