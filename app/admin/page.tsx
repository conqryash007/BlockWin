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
import { Badge } from '@/components/ui/badge';

function AdminDashboardContent() {
  const { tronAddress } = useAdminAuth();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8 text-casino-brand" />
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="border-red-500/50 text-red-400">
            TRON
          </Badge>
          <p className="text-muted-foreground">
            Connected: {tronAddress?.slice(0, 8)}...{tronAddress?.slice(-6)}
          </p>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="withdrawals" className="space-y-4">
        <TabsList className="bg-casino-panel border border-white/5">
          <TabsTrigger value="withdrawals" className="data-[state=active]:bg-casino-brand/20">
            <CreditCard className="h-4 w-4 mr-2" />
            TRON Withdrawal Approvals
          </TabsTrigger>
          <TabsTrigger value="permits" className="data-[state=active]:bg-casino-brand/20">
            <Send className="h-4 w-4 mr-2" />
            TRON Admin Transfer
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

        <TabsContent value="withdrawals">
          <WithdrawalApproval />
        </TabsContent>

        <TabsContent value="permits">
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
