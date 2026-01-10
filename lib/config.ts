import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

// Sepolia RPC URL with Alchemy
export const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/yLWUqQNU-o2A3CDy3FjA0';

export const projectId = '8409c5ec71253f99c76c781324b10720'

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC_URL),
  },
  connectors: [
    injected(),
    walletConnect({ projectId, showQrModal: true }),
  ],
})
