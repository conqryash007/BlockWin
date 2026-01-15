'use client';

import React, { useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Wallet, AlertTriangle, Loader2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminGateProps {
  children: React.ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const { isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { isAdmin, isLoading, error } = useAdminAuth();
  const [showConnectors, setShowConnectors] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md bg-casino-panel border-white/10">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-casino-brand mb-4" />
            <p className="text-muted-foreground">Verifying admin access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md bg-casino-panel border-white/10">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-casino-brand/20 flex items-center justify-center mb-4">
              <Wallet className="h-8 w-8 text-casino-brand" />
            </div>
            <CardTitle className="text-2xl">Admin Access Required</CardTitle>
            <CardDescription>
              Connect your admin wallet to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {!showConnectors ? (
              <Button
                variant="casino"
                size="lg"
                className="w-full"
                onClick={() => setShowConnectors(true)}
              >
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet
              </Button>
            ) : (
              <div className="w-full space-y-2">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    className={cn(
                      "group relative flex items-center w-full p-3 rounded-xl border border-white/5 bg-[#111316] hover:bg-[#16181b] transition-all duration-300"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 bg-white/10">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-sm text-white">{connector.name}</span>
                    <ChevronRight className="ml-auto w-5 h-5 text-white/30" />
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Only authorized admin wallets can access this area
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md bg-casino-panel border-red-500/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-red-400">Error</CardTitle>
            <CardDescription className="text-red-300/70">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not admin state
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md bg-casino-panel border-red-500/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-red-400">Access Denied</CardTitle>
            <CardDescription className="text-red-300/70">
              Your wallet is not authorized to access the admin dashboard.
              Please contact the platform administrator if you believe this is an error.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authorized admin - render children
  return <>{children}</>;
}

