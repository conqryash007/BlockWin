"use client";
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useAccount } from 'wagmi';

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { isAuthenticated, login, loading } = useAuth();
    const { isConnected } = useAccount();

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="relative w-full h-full min-h-[400px] flex items-center justify-center bg-black/40 rounded-xl border border-white/5 backdrop-blur-sm">
             <div className="absolute inset-0 bg-black/60 z-10" /> 
             <div className="relative z-20 flex flex-col items-center gap-6 p-8 text-center max-w-md">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center ring-1 ring-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <Lock className="w-10 h-10 text-white/40" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Authentication Required</h2>
                    <p className="text-muted-foreground">
                        {!isConnected 
                          ? "Please connect your wallet to access this game."
                          : "Please sign the message to verify your wallet and start playing."}
                    </p>
                </div>

                {!isConnected ? (
                     // Since connect is usually in header, we can just say "Connect Wallet" 
                     // Or provide a button if we import WalletModal trigger logic.
                     // For simplicity, request them to use Header or specialized button if we had global modal state.
                     <div className="px-4 py-2 bg-yellow-500/10 text-yellow-500 rounded-lg text-sm font-medium border border-yellow-500/20">
                        Connect Wallet in Header to Continue
                     </div>
                ): (
                    <Button 
                        onClick={() => login()} 
                        disabled={loading}
                        className="min-w-[160px] bg-casino-brand text-black hover:bg-casino-brand-hover font-bold shadow-[0_0_20px_rgba(0,255,163,0.3)] transition-all"
                    >
                        {loading ? "Signing..." : "Sign to Play"}
                    </Button>
                )}
             </div>
             
             {/* Blur the children slightly to hint at content behind? Or just hide. 
                 If we want to show the game UI but blurred/unclickable, we could render children with pointer-events-none and filter-blur.
                 But that might leak data or be heavy. Let's stick to full replacement or overlay.
             */}
        </div>
    );
}
