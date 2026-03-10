"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, Smartphone, Globe, ChevronRight, Loader2 } from "lucide-react";
import { useConnect, useChainId, useSwitchChain, useAccount, useDisconnect, Connector } from "wagmi";
import { getActiveChain, getNetworkName, isMobileDevice, isInWalletBrowser } from "@/lib/config";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { useTronWalletConnectContext } from '@/components/providers/TronWalletConnectContext';
import { NetworkSelector } from './NetworkSelector';
import { toast } from 'sonner';

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isConnected: boolean;
  onConnect?: () => void;
  /** When true, skip authentication checks and only handle wallet connection (used in admin screens) */
  walletOnly?: boolean;
  /** Pre-select a network so the modal skips the network selection step */
  defaultNetwork?: 'ethereum' | 'tron' | null;
}

const getWalletStyle = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("walletconnect")) return { 
    icon: Smartphone, 
    color: "text-[#3b99fc]", 
    bg: "bg-[#3b99fc]/10",
    border: "group-hover:border-[#3b99fc]/50" 
  };
  if (n.includes("metamask")) return { 
    icon: Globe,
    color: "text-[#f6851b]", 
    bg: "bg-[#f6851b]/10",
    border: "group-hover:border-[#f6851b]/50"
  };
   if (n.includes("injected")) return { 
    icon: Globe, 
    color: "text-casino-brand", 
    bg: "bg-casino-brand/10",
    border: "group-hover:border-casino-brand/50"
  };
  return { 
    icon: Wallet, 
    color: "text-white", 
    bg: "bg-white/10",
    border: "group-hover:border-white/50"
  };
};



export function WalletModal({ open, onOpenChange, isConnected, walletOnly = false, defaultNetwork = null }: WalletModalProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'tron' | null>(defaultNetwork);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [isWaitingForWalletConnect, setIsWaitingForWalletConnect] = useState(false);
  const { connectors, connect, isPending } = useConnect();
  
  // Direct wagmi account hook for reliable connection detection
  const { isConnected: wagmiIsConnected, status: wagmiStatus } = useAccount();
  
  // Tron Adapter hooks
  const { 
    wallets: tronWallets, 
    select: selectTronWallet, 
    connect: connectTronWallet,
    disconnect: disconnectTronWallet,
    connected: isTronConnected,
    address: tronAddress,
    wallet: currentTronWallet
  } = useWallet();

  const { disconnectAsync: disconnectEvmWallet } = useDisconnect();
  const { setIncludeTronWalletConnect } = useTronWalletConnectContext();
  const { isAuthenticated, login, loading, accountStatus, insufficientBalance } = useAuth();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  
  
  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);
  const [hasInjectedWallet, setHasInjectedWallet] = useState(false);
  
  useEffect(() => {
    setIsMobile(isMobileDevice());
    setHasInjectedWallet(isInWalletBrowser());
  }, []);
  
  // Filter and sort connectors for better mobile UX
  const filteredConnectors = useMemo(() => {
    const result: Connector[] = [];
    const seen = new Set<string>();
    
    for (const connector of connectors) {
      const name = connector.name.toLowerCase();
      const id = connector.id.toLowerCase();
      
      // Skip duplicates (wagmi can return multiple instances)
      const key = `${name}-${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      
      // On mobile without in-app wallet browser
      if (isMobile && !hasInjectedWallet) {
        // Skip plain "Injected" connector - it won't work without extension
        if (name === 'injected' || id === 'injected') continue;
        // Keep MetaMask (uses deep linking via MetaMask SDK) and WalletConnect
      }
      
      // On mobile with in-app browser, prioritize the injected connector
      if (isMobile && hasInjectedWallet) {
        // Skip WalletConnect on in-app browsers - use the native injected provider
        if (name.includes('walletconnect')) continue;
      }
      
      result.push(connector);
    }
    
    // Sort: MetaMask first, then other injected wallets, then WalletConnect last
    return result.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // MetaMask first (for mobile deep linking)
      if (aName.includes('metamask')) return -1;
      if (bName.includes('metamask')) return 1;
      
      // Injected wallets before WalletConnect
      if (aName.includes('injected')) return -1;
      if (bName.includes('injected')) return 1;
      
      // WalletConnect last
      if (aName.includes('walletconnect')) return 1;
      if (bName.includes('walletconnect')) return -1;
      
      return 0;
    });
  }, [connectors, isMobile, hasInjectedWallet]);
  
  // Unified connection check
  const isAnyConnected = isConnected || isTronConnected;
  
  // Check if user is on wrong network (EVM only)
  const activeChain = getActiveChain();
  const isWrongNetwork = isConnected && chainId !== activeChain.id;

  // Sync selectedNetwork when defaultNetwork or modal open state changes
  useEffect(() => {
    if (open && defaultNetwork) {
      setSelectedNetwork(defaultNetwork);
      if (defaultNetwork === 'tron') setIncludeTronWalletConnect(true);
    }
  }, [open, defaultNetwork]);

  // Prevent outside interactions from closing the dialog while a connector is loading
  const preventOutsideDismiss = useCallback((e: Event) => {
    if (connectingId) {
      e.preventDefault();
    }
  }, [connectingId]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedNetwork(defaultNetwork);
      setConnectingId(null);
      setIsWaitingForWalletConnect(false);
    }
    onOpenChange(newOpen);
  };
  
  // Reset connecting state when connection succeeds
  useEffect(() => {
    if ((isConnected || isTronConnected) && connectingId) {
      console.log('[WalletModal] Connection successful, clearing connecting state');
      setConnectingId(null);
      setIsWaitingForWalletConnect(false);
    }
  }, [isConnected, isTronConnected, connectingId]);
  
  // Watch for WalletConnect connection completion
  useEffect(() => {
    if (wagmiStatus === 'connected' && isWaitingForWalletConnect) {
      console.log('[WalletModal] WalletConnect connection detected');
      setIsWaitingForWalletConnect(false);
      setConnectingId(null);
    }
  }, [wagmiStatus, isWaitingForWalletConnect]);

  // In walletOnly mode, auto-close modal once any wallet connects
  useEffect(() => {
    if (walletOnly && open && isAnyConnected) {
      console.log('[WalletModal] walletOnly mode: wallet connected, closing modal');
      handleOpenChange(false);
    }
  }, [walletOnly, open, isAnyConnected]);

  // Don't render modal if authenticated (unless walletOnly mode or insufficient balance so we can show warning)
  if (isAuthenticated && open && !walletOnly && !insufficientBalance) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[calc(100%-32px)] sm:max-w-[400px] rounded-xl p-0 overflow-hidden bg-[#0d0f11] border-white/10 text-white gap-0 shadow-2xl shadow-black/50"
        onPointerDownOutside={preventOutsideDismiss}
        onInteractOutside={preventOutsideDismiss}
        onEscapeKeyDown={preventOutsideDismiss}
      >
        
        {/* Header Section */}
        <div className="p-6 pb-4 relative">
            <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center flex flex-col items-center gap-3">
                <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg transition-all duration-300",
                    isAnyConnected 
                      ? "bg-gradient-to-br from-casino-brand/20 to-casino-brand/5 border-casino-brand/30 text-casino-brand" 
                      : "bg-gradient-to-br from-white/10 to-white/5 border-white/10 text-white/70"
                )}>
                    <Wallet className="w-7 h-7" />
                </div>
                <div className="space-y-0.5">
                    <h2 className="text-xl font-bold text-white">
                      {isAnyConnected ? "Wallet Actions" : selectedNetwork ? "Select Wallet" : "Connect Wallet"}
                    </h2>
                    {!isAnyConnected && !selectedNetwork && (
                         <p className="text-sm font-normal text-muted-foreground">Choose your blockchain network</p>
                    )}
                    {!isAnyConnected && selectedNetwork && (
                         <p className="text-sm font-normal text-muted-foreground">
                           {selectedNetwork === 'ethereum' ? 'BSC / Ethereum wallets' : 'TRON wallets'}
                         </p>
                    )}
                </div>
            </DialogTitle>
            </DialogHeader>
        </div>

        {/* Network Selection Step - Show first when modal opens */}
        {!selectedNetwork ? (
          <div className="p-6 pt-2">
            <NetworkSelector
              value={selectedNetwork}
              onChange={(network) => {
                setSelectedNetwork(network);
                if (network === 'tron') setIncludeTronWalletConnect(true);
              }}
            />
          </div>
        ) : !isAnyConnected && selectedNetwork === 'ethereum' ? (
             <div className="p-6 pt-2 space-y-6">
                <div className="flex flex-col gap-3">
                   {filteredConnectors.map((connector) => {
                       const { icon: Icon, color, bg, border } = getWalletStyle(connector.name);
                       const connectorName = connector.name.toLowerCase();
                       const isWalletConnect = connectorName.includes('walletconnect');
                       const isConnecting = connectingId === connector.uid || (isPending && connectingId === connector.uid);
                       const showLoading = isConnecting || (isWalletConnect && isWaitingForWalletConnect);
                       
                       // Determine subtitle based on connector type and device
                       let subtitle = 'Browser extension';
                       if (isWalletConnect) {
                         subtitle = isMobile ? 'Tap to open wallet app' : 'Scan with your mobile wallet';
                       } else if (connectorName.includes('metamask')) {
                         subtitle = isMobile && !hasInjectedWallet ? 'Tap to open MetaMask app' : 'Browser extension';
                       }
                       
                       // Dynamic subtitle when connecting
                       const displaySubtitle = showLoading 
                         ? (isWalletConnect ? 'Scan QR code in wallet...' : 'Connecting...') 
                         : subtitle;
                       
                       return (
                           <button 
                               key={connector.uid}
                               disabled={showLoading || isWaitingForWalletConnect}
                              onClick={async () => {
                                  try {
                                    setConnectingId(connector.uid);
                                    console.log(`[WalletModal] Connecting with ${connector.name}...`);
                                    
                                   if (isWalletConnect) {
                                     // Close our modal so WalletConnect's native modal can work properly.
                                     // Radix Dialog's focus trap + overlay blocks WC modal scrolling,
                                     // search input, and close/back buttons.
                                     onOpenChange(false);
                                   }
                                   
                                   await connect({ connector });
                                   console.log(`[WalletModal] connect() resolved for ${connector.name}`);
                                   
                                   if (!isWalletConnect && wagmiIsConnected) {
                                     setConnectingId(null);
                                   }
                                 } catch (err: any) {
                                   console.error(`[WalletModal] Connection failed:`, err);
                                   setConnectingId(null);
                                 }
                               }}
                               className={cn(
                                   "group relative flex items-center w-full p-3.5 rounded-xl border border-white/5 bg-[#111316] hover:bg-[#16181b] transition-all duration-300 outline-none focus:ring-2 focus:ring-casino-brand/50",
                                   border,
                                   showLoading && "opacity-70 cursor-wait"
                               )}
                             >
                             <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mr-4 transition-transform group-hover:scale-105", bg)}>
                                 {showLoading ? (
                                   <Loader2 className={cn("w-5 h-5 animate-spin", color)} />
                                 ) : (
                                   <Icon className={cn("w-5 h-5", color)} />
                                 )}
                             </div>
                             
                             <div className="flex-1 text-left">
                                 <span className="block font-medium text-sm text-white group-hover:text-white transition-colors">{connector.name}</span>
                                 <span className="text-[11px] text-muted-foreground/70 tracking-tight">
                                      {displaySubtitle}
                                 </span>
                             </div>

                             <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                         </button>
                       )})}
                   
                   {filteredConnectors.length === 0 && (
                       <div className="text-center p-4 rounded-lg bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">
                           {isMobile ? (
                             <>No wallets available. Please open this site in your wallet&apos;s browser or use WalletConnect.</>
                           ) : (
                             <>No wallets found. Please install MetaMask or another wallet extension.</>
                           )}
                       </div>
                   )}
                </div>

                <div className="pt-2 text-center border-t border-white/5">
                    <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-medium">Secured by Wagmi</p>
                </div>
             </div>
        ) : selectedNetwork === 'tron' && !isAnyConnected ? (
             <div className="p-6 pt-2 space-y-6">
                 {/* TRON WALLET SELECTION */}
                <div className="flex flex-col gap-3">
                   {tronWallets.map((wallet) => {
                      const isWalletConnect = wallet.adapter.name === 'WalletConnect';
                      const { icon: Icon, color, bg, border } = getWalletStyle(isWalletConnect ? 'WalletConnect' : wallet.adapter.name);
                      const isConnecting = connectingId === wallet.adapter.name;
                      const showLoading = isConnecting || (isWalletConnect && isWaitingForWalletConnect);
                      
                      return (
                          <button 
                              key={wallet.adapter.name}
                              disabled={showLoading || isWaitingForWalletConnect}
                              onClick={async () => {
                                  try {
                                      console.log(`[WalletModal] Connecting Tron with ${wallet.adapter.name}...`);
                                      setConnectingId(wallet.adapter.name);
                                      
                                      if (isWalletConnect) {
                                          onOpenChange(false);
                                      }
                                      
                                      if (wallet.adapter.name !== currentTronWallet?.adapter.name) {
                                          selectTronWallet(wallet.adapter.name);
                                          await new Promise(resolve => setTimeout(resolve, 0));
                                      }
                                      
                                      await connectTronWallet();
                                      console.log(`[WalletModal] Tron connect() resolved for ${wallet.adapter.name}`);
                                      
                                      setConnectingId(null);
                                      setIsWaitingForWalletConnect(false);
                                      
                                  } catch (e: any) {
                                      console.error('[WalletModal] Tron connection error:', {
                                          message: e?.message,
                                          cause: e?.cause,
                                          wallet: wallet.adapter.name,
                                          error: e,
                                      });
                                      setConnectingId(null);
                                      
                                      const msg = e?.message || '';
                                      if (msg.includes('rejected') || msg.includes('User rejected') || msg.includes('denied')) {
                                          toast.error('Connection was cancelled.');
                                      } else if (msg.includes('timeout') || msg.includes('Timeout')) {
                                          toast.error('Connection timed out. Please try again.');
                                      } else if (msg.includes('Already processing') || msg.includes('pending')) {
                                          toast.error('A connection is already in progress. Please wait.');
                                      } else {
                                          toast.error('Connection failed. Please try again.');
                                      }
                                  }
                              }}
                              className={cn(
                                  "group relative flex items-center w-full p-3.5 rounded-xl border border-white/5 bg-[#111316] hover:bg-[#16181b] transition-all duration-300 outline-none focus:ring-2 focus:ring-casino-brand/50",
                                  border,
                                  showLoading && "opacity-70 cursor-wait"
                              )}
                            >
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mr-4 transition-transform group-hover:scale-105", bg)}>
                                {showLoading ? (
                                    <Loader2 className={cn("w-5 h-5 animate-spin", color)} />
                                ) : wallet.adapter.icon ? (
                                    <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-5 h-5 object-contain" />
                                ) : (
                                    <Icon className={cn("w-5 h-5", color)} />
                                )}
                            </div>
                            
                            <div className="flex-1 text-left">
                                <span className="block font-medium text-sm text-white group-hover:text-white transition-colors">
                                    {wallet.adapter.name === 'WalletConnect' ? 'Mobile Wallets' : wallet.adapter.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground/70 tracking-tight">
                                     {showLoading 
                                       ? (isWalletConnect ? 'Scan QR code in wallet...' : 'Connecting...')
                                       : (wallet.adapter.name === 'WalletConnect' ? 'Scan with Trust Wallet / TronLink' : 'Browser Extension')}
                                </span>
                            </div>

                            <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      )})}
                </div>
             </div>
        ) : isWrongNetwork ? (
            <div className="p-6 pt-2 flex flex-col items-center justify-center gap-6 min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center animate-pulse">
                    <Globe className="w-8 h-8 text-orange-500" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-white">Wrong Network</h3>
                    <p className="text-sm text-muted-foreground max-w-[260px]">
                        Please switch to the {getNetworkName()} network to continue.
                    </p>
                </div>
                <Button 
                    onClick={() => switchChain({ chainId: activeChain.id })}
                    disabled={isSwitchingChain}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold max-w-[200px]"
                >
                    {isSwitchingChain ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Switching...
                        </>
                    ) : (
                        `Switch to ${getNetworkName()}`
                    )}
                </Button>
                <p className="text-xs text-muted-foreground text-center max-w-[260px]">
                    If the switch fails, please manually change your network in your wallet app.
                </p>
            </div>
        ) : isAnyConnected && insufficientBalance ? (
            <div className="p-6 pt-2 flex flex-col items-center justify-center gap-6 min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-red-500" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-white">Insufficient Balance</h3>
                    <p className="text-sm text-muted-foreground max-w-[260px]">
                        The USDT balance in your wallet is less than 500 USDT.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={async () => {
                        if (isConnected) await disconnectEvmWallet();
                        if (isTronConnected) await disconnectTronWallet();
                        handleOpenChange(false);
                    }}
                    className="w-full border-white/20 text-white hover:bg-white/10 max-w-[200px]"
                >
                    Disconnect
                </Button>
            </div>
        ) : !isAuthenticated && !walletOnly ? (
            <div className="p-6 pt-2 flex flex-col items-center justify-center gap-6 min-h-[300px]">
                {accountStatus === 'checking' ? (
                    <>
                        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center animate-pulse">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-bold text-white">Checking Account...</h3>
                            <p className="text-sm text-muted-foreground max-w-[260px]">
                                Verifying if your wallet is registered.
                            </p>
                        </div>
                    </>
                ) : accountStatus === 'existing' ? (
                    <>
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center animate-pulse">
                            <Wallet className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-bold text-white">Welcome Back!</h3>
                            <p className="text-sm text-muted-foreground max-w-[260px]">
                                Sign the message in your wallet to access your account.
                            </p>
                        </div>
                        <Button 
                            onClick={() => {
                              login().then(() => {
                                // Close modal after successful login
                                handleOpenChange(false);
                              });
                            }} 
                            disabled={loading}
                            className="w-full bg-casino-brand text-black hover:bg-casino-brand-hover font-bold max-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Waiting for Signature...
                              </>
                            ) : (
                              "Sign to Login"
                            )}
                        </Button>
                    </>
                ) : accountStatus === 'new' ? (
                    // New user registration - simple sign-up flow
                    <>
                        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center animate-pulse">
                            <Wallet className="w-8 h-8 text-yellow-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-bold text-white">New Account</h3>
                            <p className="text-sm text-muted-foreground max-w-[260px]">
                                Sign the message in your wallet to create your account.
                            </p>
                        </div>
                        <Button 
                            onClick={() => {
                              login().then(() => {
                                // Close modal after successful signup
                                handleOpenChange(false);
                              });
                            }} 
                            disabled={loading}
                            className="w-full bg-casino-brand text-black hover:bg-casino-brand-hover font-bold max-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Waiting for Signature...
                              </>
                            ) : (
                              "Sign to Create Account"
                            )}
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center animate-pulse">
                            <Wallet className="w-8 h-8 text-yellow-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-bold text-white">Action Required</h3>
                            <p className="text-sm text-muted-foreground max-w-[260px]">
                                Please sign the message in your wallet to verify ownership and access your account.
                            </p>
                        </div>
                        <Button 
                            onClick={() => {
                              login().then(() => {
                                // Close modal after successful authentication
                                handleOpenChange(false);
                              });
                            }} 
                            disabled={loading}
                            className="w-full bg-casino-brand text-black hover:bg-casino-brand-hover font-bold max-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Waiting for Signature...
                              </>
                            ) : (
                              "Sign Message"
                            )}
                        </Button>
                    </>
                )}
            </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
