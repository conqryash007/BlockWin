'use client';

import { AdminGate } from '@/components/admin/AdminGate';
import { GamesManagement } from '@/components/admin/GamesManagement';
import { WithdrawalApproval } from '@/components/admin/WithdrawalApproval';
import { LotteryManagement } from '@/components/admin/LotteryManagement';
import { SportsBetSettlement } from '@/components/admin/SportsBetSettlement';
import { PermitTransfer } from '@/components/admin/PermitTransfer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Gamepad2, Shield, Ticket, Trophy, Send } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

function AdminDashboardContent() {
  const { adminUser } = useAdminAuth();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8 text-casino-brand" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Logged in as: {adminUser?.email ?? '—'}
        </p>
      </div>

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
