"use client";

import { Wallet, Search, LogOut, User, Copy, ExternalLink, X, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
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
import { LoginModal } from "@/components/auth/LoginModal";
import { WalletModal } from "@/components/wallet/WalletModal";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePlatformBalance } from "@/hooks/usePlatformBalance";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function Header() {
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Real Wagmi Hooks (Keep for disconnect, but use useAuth for state)
  const { disconnect } = useDisconnect();
  
  // Platform balance from Supabase
  const { balance: platformBalance, isLoading: isBalanceLoading } = usePlatformBalance();
  const { 
      logout, 
      login, 
      isAuthenticated,
      user,
      activeAddress: address, 
      isAnyConnected: isConnected, 
      loading
  } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Format balance for display
  const displayBalance = platformBalance.toFixed(2);
  const userEmail = user?.email;
  const userInitial = userEmail ? userEmail[0].toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-white/5 bg-background/60 backdrop-blur-md px-3 sm:px-6 transition-all">
      {/* ... Left side and Search ... */}
      {/* Left side - Mobile menu + Logo */}
      <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
        <MobileSidebar />
        <Link href="/">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-tr from-casino-brand to-emerald-400 flex items-center justify-center shadow-[0_0_10px_rgba(0,255,163,0.5)]">
              <span className="font-bold text-black text-sm sm:text-base">B</span>
            </div>
            <span className="font-bold text-white text-base sm:text-lg tracking-tight hidden xs:inline">BLOCKWIN</span>
          </div>
        </Link>
      </div>

      {/* Desktop Search */}
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

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-background/95 backdrop-blur-md">
          <div className="flex items-center gap-2 p-3 border-b border-white/5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search games, providers..."
                className="w-full bg-black/20 border-white/5 pl-10 focus-visible:ring-1 focus-visible:ring-casino-brand/50"
                autoFocus
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(false)}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-4 text-center text-muted-foreground text-sm">
            Start typing to search...
          </div>
        </div>
      )}

      {/* Right side - Actions */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>

        {isMounted && isAuthenticated ? (
          <>
             {/* Balance Display */}
            <div className="flex flex-col items-end bg-black/30 px-2 sm:px-3 py-1 rounded-lg border border-white/5">
              <span className="text-xs sm:text-sm font-bold text-casino-brand tracking-wide">
                ${isBalanceLoading ? '...' : displayBalance}
              </span>
              <span className="text-[8px] sm:text-[10px] text-muted-foreground font-mono hidden xs:block">USDT Balance</span>
            </div>

            {/* Wallet Address Display */}
            {isConnected && address && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <Wallet className="w-4 h-4 text-casino-brand" />
                <span className="text-sm font-mono text-white tracking-tight">
                  {`${address.slice(0, 6)}...${address.slice(-4)}`}
                </span>
              </div>
            )}

             {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-white/10 cursor-pointer hover:border-casino-brand/50 transition-colors">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
                  <AvatarFallback className="bg-casino-brand text-black font-bold text-xs sm:text-sm">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userEmail}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Logged in via Google
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/wallet" className="cursor-pointer">
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>My Wallet</span>
                  </Link>
                </DropdownMenuItem>
                
                {isConnected && (
                  <>
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
                            const isTron = address.startsWith('T');
                            const url = isTron 
                              ? `https://tronscan.org/#/address/${address}`
                              : `https://etherscan.io/address/${address}`;
                          window.open(url, '_blank');
                        }
                      }}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      <span>View on Explorer</span>
                    </DropdownMenuItem>
                  </>
                )}

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
          </>
        ) : (
          <Button
             onClick={() => setIsLoginModalOpen(true)}
             disabled={loading}
             className="bg-casino-brand text-black hover:bg-casino-brand/90 hover:shadow-[0_0_15px_rgba(0,255,163,0.4)] font-bold gap-2 transition-all hover:-translate-y-0.5"
          >
             Login
          </Button>
        )}
      </div>

      <WalletModal 
        open={isWalletOpen} 
        onOpenChange={setIsWalletOpen} 
        isConnected={isConnected}
      />
      
      <LoginModal 
        open={isLoginModalOpen} 
        onOpenChange={setIsLoginModalOpen}
      />
    </header>
  );
}

