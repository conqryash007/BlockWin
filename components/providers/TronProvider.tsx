"use client";

import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import { WalletConnectAdapter } from '@tronweb3/tronwallet-adapter-walletconnect';
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapter-tronlink';
import { TrustAdapter } from '@tronweb3/tronwallet-adapter-trust';
import { useMemo, useState, useCallback } from 'react';
import { projectId, isMainnet } from '@/lib/config';
import { TronWalletConnectContext } from './TronWalletConnectContext';

export function TronProvider({ children }: { children: React.ReactNode }) {
    const [includeWalletConnect, setIncludeWalletConnect] = useState(false);
    const setIncludeTronWalletConnect = useCallback((include: boolean) => {
        setIncludeWalletConnect((prev) => (include ? true : prev));
    }, []);

    const adapters = useMemo(() => {
        const tronLink = new TronLinkAdapter();
        const trustWallet = new TrustAdapter();
        const list: (typeof tronLink | typeof trustWallet | InstanceType<typeof WalletConnectAdapter>)[] = [tronLink, trustWallet];

        if (includeWalletConnect) {
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
                themeVariables: {
                    '--w3m-z-index': 9999,
                },
                allWallets: 'SHOW',
                debug: true,
                featuredWalletIds: [
                    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
                    '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f', // TronLink
                ],
            });
            list.push(walletConnect);
        }

        return list;
    }, [includeWalletConnect]);

    return (
        <WalletProvider adapters={adapters} disableAutoConnectOnLoad={false}>
            <TronWalletConnectContext.Provider value={{ setIncludeTronWalletConnect }}>
                {children}
            </TronWalletConnectContext.Provider>
        </WalletProvider>
    );
}
