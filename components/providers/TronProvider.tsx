"use client";

import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import { WalletConnectAdapter } from '@tronweb3/tronwallet-adapter-walletconnect';
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapter-tronlink';
import { TrustAdapter } from '@tronweb3/tronwallet-adapter-trust';
import { useMemo } from 'react';
import { projectId, isMainnet } from '@/lib/config';

export function TronProvider({ children }: { children: React.ReactNode }) {
    const adapters = useMemo(() => {
        const tronLink = new TronLinkAdapter();
        const trustWallet = new TrustAdapter();
        
        const walletConnect = new WalletConnectAdapter({
            network: isMainnet() ? 'Mainnet' : 'Shasta',
            options: {
                relayUrl: 'wss://relay.walletconnect.com',
                projectId: projectId,
                metadata: {
                    name: 'BlockWin Casino',
                    description: 'BlockWin - Web3 Casino Platform',
                    url: typeof window !== 'undefined' ? window.location.origin : 'https://blockwin.space',
                    icons: ['https://blockwin.space/logo.png'],
                },
            },
            themeMode: 'dark',
            debug: true,
            // Show "All Wallets" button to allow searching for any wallet
            allWallets: 'SHOW',
            // Pin Trust Wallet to top for convenience
            featuredWalletIds: [
                '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
            ],
            enableMobileDeepLink: true,
        });

        return [tronLink, trustWallet, walletConnect];
    }, []);

    return (
        <WalletProvider adapters={adapters} disableAutoConnectOnLoad={true}>
            {children}
        </WalletProvider>
    );
}
