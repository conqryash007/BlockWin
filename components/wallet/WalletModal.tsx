"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Wallet, Smartphone, Globe, ChevronRight } from "lucide-react";
import { useConnect } from "wagmi";
import { cn } from "@/lib/utils";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isConnected: boolean;
  onConnect?: () => void;
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

export function WalletModal({ open, onOpenChange, isConnected }: WalletModalProps) {
  const { connectors, connect } = useConnect();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-32px)] sm:max-w-[400px] rounded-xl p-0 overflow-hidden bg-[#0d0f11] border-white/10 text-white gap-0 shadow-2xl shadow-black/50">
        
        {/* Header Section */}
        <div className="p-6 pb-2">
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
                                  onOpenChange(false);
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
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Currency</Label>
                        <div className="flex gap-2">
                            <Button size="sm" className="flex-1 bg-casino-brand text-black hover:bg-casino-brand-hover font-bold border-0">BTC</Button>
                            <Button size="sm" variant="outline" className="flex-1 border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white">ETH</Button>
                            <Button size="sm" variant="outline" className="flex-1 border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white">USDT</Button>
                        </div>
                    </div>
                    
                    <div className="p-5 bg-black/40 rounded-xl border border-white/10 flex flex-col items-center gap-5 mt-4">
                        <div className="w-40 h-40 bg-white p-2.5 rounded-xl shadow-lg shadow-black/20">
                            {/* QR Code Placeholder - In a real app use a QR library */}
                            <div className="w-full h-full bg-black pattern-dots pattern-white/10 pattern-bg-white pattern-size-4 pattern-opacity-100">
                                {/* Use a real QR code component here */}
                            </div>
                        </div>
                        <div className="w-full space-y-2">
                            <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Deposit Address</Label>
                            <div className="flex gap-2 group">
                                <Input 
                                    readOnly 
                                    value="1A1zP1e...divfNa" 
                                    className="font-mono text-xs bg-black/20 border-white/10 text-white/80 focus-visible:ring-1 focus-visible:ring-casino-brand/50 h-10" 
                                />
                                <Button size="icon" variant="outline" className="h-10 w-10 border-white/10 bg-transparent hover:bg-white/5 hover:text-white shrink-0">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 text-center font-medium">
                        Min deposit: 0.0001 BTC • 1 Confirmation
                    </p>
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
