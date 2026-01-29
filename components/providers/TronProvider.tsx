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
        });

        return [tronLink, trustWallet, walletConnect];
    }, []);

    return (
        <WalletProvider adapters={adapters} disableAutoConnectOnLoad={true}>
            {children}
        </WalletProvider>
    );
}
