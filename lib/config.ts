import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

// Sepolia RPC URL with Alchemy
export const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/yLWUqQNU-o2A3CDy3FjA0';

export const projectId = '8409c5ec71253f99c76c781324b10720'

// WalletConnect metadata for mobile wallet display
const metadata = {
  name: 'BlockWin Casino',
  description: 'BlockWin - Web3 Casino Platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://blockwin.netlify.app',
  icons: ['https://blockwin.netlify.app/logo.png'],
}

export const config = createConfig({
  chains: [sepolia],
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
      // Ensure we only request the chains we support
      qrModalOptions: {
        themeMode: 'dark',
      },
    }),
  ],
})
