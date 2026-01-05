"use client";

import { Wallet, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { MobileSidebar } from "@/components/layout/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAccount, useDisconnect, useBalance } from "wagmi";
// import { useWeb3Modal } from '@web3modal/wagmi/react' // Commented: module not installed
// Actually, since we are using walletConnect connector directly, we might need a custom connect UI or use the web3modal.
// The user asked to use Native SDK, which usually implies building the UI or using the connector directly.
// But standard WalletConnect usually pairs with Web3Modal for the UI.
// However, I previously built a "WalletModal.tsx". I should wire THAT to the connectors.

import { WalletModal } from "@/components/wallet/WalletModal"; 
import { useState } from "react";
import Link from "next/link"; // Re-added link import

export function Header() {
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  
  // Real Wagmi Hooks
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({
    address: address,
  });

  // Mock balance for display if on testnet with no funds, or use real data
  const displayBalance = balanceData ? parseFloat(balanceData.formatted).toFixed(4) : "0.0000";
  const displaySymbol = balanceData?.symbol || "ETH";

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-background/60 backdrop-blur-md px-6 transition-all">
      <div className="flex items-center gap-4 lg:hidden">
        <MobileSidebar />
        <Link href="/">
            <div className="flex items-center gap-2">
             <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-casino-brand to-emerald-400 flex items-center justify-center shadow-[0_0_10px_rgba(0,255,163,0.5)]">
                <span className="font-bold text-black">B</span>
             </div>
             <span className="font-bold text-white text-lg tracking-tight">BLOCKWIN</span>
            </div>
        </Link>
      </div>

      <div className="hidden lg:flex w-full max-w-md items-center gap-2">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-casino-brand transition-colors" />
          <Input
            type="search"
            placeholder="Search games, providers..."
            className="w-full bg-black/20 border-white/5 pl-10 focus-visible:ring-1 focus-visible:ring-casino-brand/50 focus-visible:border-casino-brand/50 transition-all rounded-full hover:bg-black/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {isConnected && (
             <div className="hidden md:flex flex-col items-end mr-2 bg-black/30 px-3 py-1 rounded-lg border border-white/5">
                <span className="text-sm font-bold text-casino-brand tracking-wide">$ {displayBalance}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{displayBalance} {displaySymbol}</span>
             </div>
        )}

        <Button 
            className={cn(
                "gap-2 font-bold transition-all duration-300",
                isConnected 
                    ? "bg-secondary hover:bg-secondary/80 text-white" 
                    : "bg-casino-brand text-black hover:bg-casino-brand/90 hover:shadow-[0_0_20px_rgba(0,255,163,0.4)] hover:-translate-y-0.5"
            )}
            onClick={() => isConnected ? disconnect() : setIsWalletOpen(true)}
        >
          <Wallet className="h-4 w-4" />
          {isConnected ? (
              <span>{`${address?.slice(0, 6)}...${address?.slice(-4)}`}</span>
          ) : (
              <>
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="inline sm:hidden">Connect</span>
              </>
          )}
        </Button>

        {isConnected && (
             <Avatar className="h-9 w-9 border border-white/10 cursor-pointer">
                <AvatarImage src="/images/avatar.png" alt="User" />
                <AvatarFallback className="bg-casino-brand text-white font-bold">U</AvatarFallback>
             </Avatar>
        )}
      </div>

      <WalletModal 
        open={isWalletOpen} 
        onOpenChange={setIsWalletOpen} 
        isConnected={isConnected}
      />
    </header>
  );
}
