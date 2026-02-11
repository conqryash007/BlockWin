"use client";

import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapter-tronlink';
import { TrustAdapter } from '@tronweb3/tronwallet-adapter-trust';
import { useMemo, useState, useCallback } from 'react';
import { projectId, isMainnet } from '@/lib/config';
import { TronWalletConnectContext } from './TronWalletConnectContext';
import { useTronWalletConnectQRContext } from './TronWalletConnectQRContext';
import { TronWalletConnectCustomAdapter } from '@/lib/tronWalletConnectCustomAdapter';

export function TronProvider({ children }: { children: React.ReactNode }) {
    const [includeWalletConnect, setIncludeWalletConnect] = useState(false);
    const { onDisplayUri, onCloseModal } = useTronWalletConnectQRContext();
    const setIncludeTronWalletConnect = useCallback((include: boolean) => {
        setIncludeWalletConnect((prev) => (include ? true : prev));
    }, []);

    const adapters = useMemo(() => {
        const tronLink = new TronLinkAdapter();
        const trustWallet = new TrustAdapter();
        const list: (typeof tronLink | typeof trustWallet | TronWalletConnectCustomAdapter)[] = [tronLink, trustWallet];

        if (includeWalletConnect) {
            const walletConnect = new TronWalletConnectCustomAdapter({
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
                onDisplayUri,
                onCloseModal,
            });
            list.push(walletConnect);
        }

        return list;
    }, [includeWalletConnect, onDisplayUri, onCloseModal]);

    return (
        <WalletProvider adapters={adapters} disableAutoConnectOnLoad={false}>
            <TronWalletConnectContext.Provider value={{ setIncludeTronWalletConnect }}>
                {children}
            </TronWalletConnectContext.Provider>
        </WalletProvider>
    );
}
