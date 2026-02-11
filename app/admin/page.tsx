'use client';

import { useState } from 'react';
import { AdminGate } from '@/components/admin/AdminGate';
import { GamesManagement } from '@/components/admin/GamesManagement';
import { WithdrawalApproval } from '@/components/admin/WithdrawalApproval';
import { LotteryManagement } from '@/components/admin/LotteryManagement';
import { SportsBetSettlement } from '@/components/admin/SportsBetSettlement';
import { PermitTransfer } from '@/components/admin/PermitTransfer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CreditCard, Gamepad2, Shield, Ticket, Trophy, Send, Wallet } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAccount } from 'wagmi';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { WalletModal } from '@/components/wallet/WalletModal';

function AdminDashboardContent() {
  const { adminUser } = useAdminAuth();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { address: tronAddress, connected: isTronConnected } = useWallet();
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const isAnyWalletConnected = isEvmConnected || isTronConnected;
  const connectedAddress = evmAddress || tronAddress;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-casino-brand" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Logged in as: {adminUser?.email ?? '—'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAnyWalletConnected ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-casino-brand/10 border border-casino-brand/20">
              <Wallet className="h-4 w-4 text-casino-brand" />
              <span className="text-casino-brand text-sm font-mono">
                {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
              </span>
              <span className="text-xs text-casino-brand/70">
                ({isTronConnected ? 'TRON' : 'EVM'})
              </span>
            </div>
          ) : (
            <Button
              onClick={() => setWalletModalOpen(true)}
              className="bg-casino-brand text-black hover:bg-casino-brand/90 font-semibold"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>

      {/* Wallet Modal - walletOnly mode skips auth flow since admin is already authenticated */}
      <WalletModal
        open={walletModalOpen}
        onOpenChange={setWalletModalOpen}
        isConnected={isEvmConnected}
        walletOnly
      />

      {/* Tabbed Content */}
      <Tabs defaultValue="withdrawals" className="space-y-4">
        <TabsList className="bg-casino-panel border border-white/5">
          {/* TRON Withdrawal Approvals - always visible */}
          <TabsTrigger value="withdrawals" className="data-[state=active]:bg-casino-brand/20">
            <CreditCard className="h-4 w-4 mr-2" />
            TRON Withdrawal Approvals
          </TabsTrigger>
          {/* Admin Transfer supports both EVM and TRON */}
          <TabsTrigger value="transfers" className="data-[state=active]:bg-casino-brand/20">
            <Send className="h-4 w-4 mr-2" />
            Admin Transfer
          </TabsTrigger>
          <TabsTrigger value="games" className="data-[state=active]:bg-casino-brand/20">
            <Gamepad2 className="h-4 w-4 mr-2" />
            Games Management
          </TabsTrigger>
          <TabsTrigger value="lottery" className="data-[state=active]:bg-casino-brand/20">
            <Ticket className="h-4 w-4 mr-2" />
            Lottery
          </TabsTrigger>
          <TabsTrigger value="sports" className="data-[state=active]:bg-casino-brand/20">
            <Trophy className="h-4 w-4 mr-2" />
            Sports Bets
          </TabsTrigger>
        </TabsList>

        {/* TRON Withdrawal Approvals - always shown, component handles wallet connection check */}
        <TabsContent value="withdrawals">
          <WithdrawalApproval />
        </TabsContent>

        {/* Admin Transfer - supports both EVM and TRON */}
        <TabsContent value="transfers">
          <PermitTransfer />
        </TabsContent>

        <TabsContent value="games">
          <GamesManagement />
        </TabsContent>

        <TabsContent value="lottery">
          <LotteryManagement />
        </TabsContent>

        <TabsContent value="sports">
          <SportsBetSettlement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminDashboardContent />
    </AdminGate>
  );
}
