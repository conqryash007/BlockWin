"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Wallet, Smartphone, Globe, ChevronRight, Loader2 } from "lucide-react";
import { useConnect, useChainId, useSwitchChain } from "wagmi";
import { getActiveChain, getNetworkName } from "@/lib/config";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { triggerBalanceRefresh } from '@/hooks/usePlatformBalance';
import { DepositForm } from './DepositForm';

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isConnected: boolean;
  onConnect?: () => void;
  onDepositSuccess?: () => void;
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



export function WalletModal({ open, onOpenChange, isConnected, onDepositSuccess }: WalletModalProps) {
  const { connectors, connect } = useConnect();
  const { isAuthenticated, login, loading, accountStatus } = useAuth();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  
  // Check if user is on wrong network
  const activeChain = getActiveChain();
  const isWrongNetwork = isConnected && chainId !== activeChain.id;
  


  // Note: Modal stays open after authentication to allow immediate deposit.
  // User can close it manually or proceed to deposit.
  // Auto-login is now handled in useAuth hook globally, so no need for it here.

  // Main deposit handler - chains all wallet popups


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-32px)] sm:max-w-[400px] rounded-xl p-0 overflow-hidden bg-[#0d0f11] border-white/10 text-white gap-0 shadow-2xl shadow-black/50">
        
        {/* Header Section */}
        <div className="p-6 pb-2 relative">
            <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center flex flex-col items-center gap-4">
                <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner",
                    isConnected ? "bg-casino-brand/10 text-casino-brand" : "bg-white/5 text-white/50"
                )}>
                    <Wallet className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white">{isConnected ? "Wallet Actions" : "Connect Wallet"}</h2>
                    {!isConnected && (
                         <p className="text-sm font-normal text-muted-foreground">Select your preferred method</p>
                    )}
                </div>
            </DialogTitle>
            </DialogHeader>
        </div>

        {!isConnected ? (
             <div className="p-6 pt-2 space-y-6">
                <div className="flex flex-col gap-3">
                   {[...connectors]
                     .sort((a, b) => {
                       const aName = a.name.toLowerCase();
                       const bName = b.name.toLowerCase();
                       if (aName.includes('injected') || aName.includes('metamask')) return -1;
                       if (bName.includes('injected') || bName.includes('metamask')) return 1;
                       if (aName.includes('walletconnect')) return 1;
                       if (bName.includes('walletconnect')) return -1;
                       return 0;
                     })
                     .map((connector) => {
                       const { icon: Icon, color, bg, border } = getWalletStyle(connector.name);
                       return (
                           <button 
                               key={connector.uid}
                               onClick={() => {
                                   connect({ connector });
                                   // Keep modal open - auth flow continues automatically
                               }}
                               className={cn(
                                   "group relative flex items-center w-full p-3.5 rounded-xl border border-white/5 bg-[#111316] hover:bg-[#16181b] transition-all duration-300 outline-none focus:ring-2 focus:ring-casino-brand/50",
                                   border
                               )}
                             >
                             <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mr-4 transition-transform group-hover:scale-105", bg)}>
                                 <Icon className={cn("w-5 h-5", color)} />
                             </div>
                             
                             <div className="flex-1 text-left">
                                 <span className="block font-medium text-sm text-white group-hover:text-white transition-colors">{connector.name}</span>
                                 <span className="text-[11px] text-muted-foreground/70 tracking-tight">
                                      {connector.name.toLowerCase().includes('walletconnect') ? 'Scan with your mobile wallet' : 'Browser extension & more'}
                                 </span>
                             </div>

                             <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                         </button>
                       )})}
                   
                   {connectors.length === 0 && (
                       <div className="text-center p-4 rounded-lg bg-red-500/10 text-red-400 text-xs border border-red-500/20">
                           No wallets found. Check configuration.
                       </div>
                   )}
                </div>

                <div className="pt-2 text-center border-t border-white/5">
                    <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-medium">Secured by Wagmi</p>
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
        ) : !isAuthenticated ? (
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
                            onClick={() => login()} 
                            disabled={loading}
                            className="w-full bg-casino-brand text-black hover:bg-casino-brand-hover font-bold max-w-[200px]"
                        >
                            {loading ? "Waiting for Signature..." : "Sign to Login"}
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
                            onClick={() => login()} 
                            disabled={loading}
                            className="w-full bg-casino-brand text-black hover:bg-casino-brand-hover font-bold max-w-[200px]"
                        >
                            {loading ? "Waiting for Signature..." : "Sign to Create Account"}
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
                            onClick={() => login()} 
                            disabled={loading}
                            className="w-full bg-casino-brand text-black hover:bg-casino-brand-hover font-bold max-w-[200px]"
                        >
                            {loading ? "Waiting for Signature..." : "Sign Message"}
                        </Button>
                    </>
                )}
            </div>
        ) : (
            <div className="p-6 pt-0">
                <Tabs defaultValue="deposit" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-[#191b1d] p-1 h-12 mb-6 border border-white/5 rounded-lg">
                        <TabsTrigger 
                            value="deposit"
                            className="h-full data-[state=active]:bg-[#2a2d31] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all text-muted-foreground"
                        >Deposit</TabsTrigger>
                        <TabsTrigger 
                            value="withdraw"
                            className="h-full data-[state=active]:bg-[#2a2d31] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all text-muted-foreground"
                        >Withdraw</TabsTrigger>
                    </TabsList>

                    <TabsContent value="deposit" className="space-y-4 animate-in fade-in-50 zoom-in-95 duration-200">
                    <TabsContent value="deposit" className="space-y-4 animate-in fade-in-50 zoom-in-95 duration-200">
                        <DepositForm 
                            onSuccess={() => {
                                // Trigger global balance refresh
                                triggerBalanceRefresh();
                                if (onDepositSuccess) {
                                    onDepositSuccess();
                                }
                            }}
                        />
                    </TabsContent>
                    </TabsContent>

                    <TabsContent value="withdraw" className="space-y-4 animate-in fade-in-50 zoom-in-95 duration-200">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Destination Address</Label>
                        <Input placeholder="Enter BTC address" className="bg-black/20 border-white/10 h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</Label>
                        <div className="relative">
                            <Input placeholder="0.00" type="number" className="bg-black/20 border-white/10 h-11 pr-14" />
                            <Button size="sm" variant="ghost" className="absolute right-1 top-1.5 text-casino-brand text-xs h-8 hover:bg-casino-brand/10 hover:text-casino-brand">MAX</Button>
                        </div>
                    </div>
                    <div className="pt-4">
                        <Button className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold" variant="destructive">
                            Withdraw Funds
                        </Button>
                    </div>
                    </TabsContent>
                </Tabs>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
