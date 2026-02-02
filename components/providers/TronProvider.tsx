"use client";

import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import { WalletConnectAdapter } from '@tronweb3/tronwallet-adapter-walletconnect';
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapter-tronlink';
import { TrustAdapter } from '@tronweb3/tronwallet-adapter-trust';
import { useMemo } from 'react';
import { projectId, isMainnet } from '@/lib/config';

// TRON WalletConnect Chain IDs (from TRON documentation)
const TRON_MAINNET_CHAIN_ID = 'tron:0x2b6653dc';
const TRON_SHASTA_CHAIN_ID = 'tron:0x94a9059e';

export function TronProvider({ children }: { children: React.ReactNode }) {
    const adapters = useMemo(() => {
        const tronLink = new TronLinkAdapter();
        const trustWallet = new TrustAdapter();
        
        // Determine network configuration
        const network = isMainnet() ? 'Mainnet' : 'Shasta';
        const chainId = isMainnet() ? TRON_MAINNET_CHAIN_ID : TRON_SHASTA_CHAIN_ID;
        
        const walletConnect = new WalletConnectAdapter({
            network: network,
            options: {
                relayUrl: 'wss://relay.walletconnect.com',
                projectId: projectId,
                metadata: {
                    name: 'BlockWin Casino',
                    description: 'BlockWin - Web3 Casino Platform on TRON',
                    url: typeof window !== 'undefined' ? window.location.origin : 'https://blockwin.space',
                    icons: ['https://blockwin.space/logo.png'],
                },
            },
            themeMode: 'dark',
            debug: process.env.NODE_ENV === 'development',
            // Only show TronLink in WalletConnect modal (Trust Wallet should use in-app browser)
            allWallets: 'HIDE',
            // Feature TronLink for WalletConnect (best TRON support)
            featuredWalletIds: [
                '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f', // TronLink
            ],
            enableMobileDeepLink: true,
        });

        // Order: TronLink first (best TRON support), then TrustAdapter (for in-app browser), then WalletConnect
        return [tronLink, trustWallet, walletConnect];
    }, []);

    return (
        <WalletProvider adapters={adapters} disableAutoConnectOnLoad={false}>
            {children}
        </WalletProvider>
    );
}
