"use client";

import { Wallet, Search, LogOut, User, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { MobileSidebar } from "@/components/layout/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccount, useDisconnect } from "wagmi";
import { WalletModal } from "@/components/wallet/WalletModal"; 
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePlatformBalance } from "@/hooks/usePlatformBalance";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function Header() {
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Real Wagmi Hooks
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  // Platform balance from Supabase
  const { balance: platformBalance, isLoading: isBalanceLoading } = usePlatformBalance();
  const { login, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Removed auto-login effect to prevent infinite loops and improve UX.
  // User must explicitly sign if they haven't yet.

  // Format balance for display
  const displayBalance = platformBalance.toFixed(2);

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
        {isMounted && isAuthenticated && (
             <div className="flex flex-col items-end mr-2 bg-black/30 px-3 py-1 rounded-lg border border-white/5">
                <span className="text-sm font-bold text-casino-brand tracking-wide">
                  ${isBalanceLoading ? '...' : displayBalance}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">USDT Balance</span>
             </div>
        )}

        {isMounted && (
          <Button 
              className={cn(
                  "gap-2 font-bold transition-all duration-300",
                  isConnected 
                      ? isAuthenticated 
                          ? "bg-secondary hover:bg-secondary/80 text-white" 
                          : "bg-yellow-500 hover:bg-yellow-600 text-black animate-pulse"
                      : "bg-casino-brand text-black hover:bg-casino-brand/90 hover:shadow-[0_0_20px_rgba(0,255,163,0.4)] hover:-translate-y-0.5"
              )}
              onClick={() => {
                if (isConnected && !isAuthenticated) {
                  // User connected but not signed in - trigger login directly
                  login();
                } else {
                  // Not connected or already authenticated - open wallet modal
                  setIsWalletOpen(true);
                }
              }}
          >
            <Wallet className="h-4 w-4" />
            {isConnected ? (
                isAuthenticated ? (
                    <span>{`${address?.slice(0, 6)}...${address?.slice(-4)}`}</span>
                ) : (
                    <span>Sign to Verify</span>
                )
            ) : (
                <>
                  <span className="hidden sm:inline">Connect Wallet</span>
                  <span className="inline sm:hidden">Connect</span>
                </>
            )}
          </Button>
        )}

        {isMounted && isAuthenticated && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 border border-white/10 cursor-pointer hover:border-casino-brand/50 transition-colors">
                <AvatarImage src="/images/avatar.png" alt="User" />
                <AvatarFallback className="bg-casino-brand text-black font-bold">
                  {address?.slice(2, 4).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Connected Wallet</p>
                  <p className="text-xs leading-none text-muted-foreground font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  if (address) {
                    navigator.clipboard.writeText(address);
                    toast.success('Address copied to clipboard');
                  }
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy Address</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  if (address) {
                    window.open(`https://etherscan.io/address/${address}`, '_blank');
                  }
                }}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>View on Explorer</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  logout();
                  disconnect();
                }}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
