import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'
import { SEPOLIA_RPC_URL } from './contracts'

export const projectId = '8409c5ec71253f99c76c781324b10720'

export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(SEPOLIA_RPC_URL),
  },
  connectors: [
    injected(),
    walletConnect({ projectId, showQrModal: true }),
  ],
})
