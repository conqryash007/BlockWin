"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { isAuthenticated, login, loading } = useAuth();
    const { isConnected } = useAccount();
    
    // Prevent hydration mismatch by only rendering after mount
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);

    // Show loading state until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="relative w-full h-full min-h-[400px] flex items-center justify-center bg-black/40 rounded-xl border border-white/5">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

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
        </div>
    );
}
