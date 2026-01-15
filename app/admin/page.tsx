'use client';

import { useState } from 'react';
import { AdminGate } from '@/components/admin/AdminGate';
import { GamesManagement } from '@/components/admin/GamesManagement';
import { WithdrawalApproval } from '@/components/admin/WithdrawalApproval';
import { LotteryManagement } from '@/components/admin/LotteryManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, CreditCard, Users, DollarSign, Gamepad2, Shield, Ticket } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAdminAuth } from '@/hooks/useAdminAuth';

function AdminDashboardContent() {
  const { address } = useAccount();
  const { adminUser } = useAdminAuth();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-casino-brand" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
        <Button variant="outline">Export Reports</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-casino-panel border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-casino-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-casino-panel border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-xs text-muted-foreground">+180.1% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-casino-panel border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Games</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Dice, Crash, Mines, Plinko</p>
          </CardContent>
        </Card>
        <Card className="bg-casino-panel border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="games" className="space-y-4">
        <TabsList className="bg-casino-panel border border-white/5">
          <TabsTrigger value="games" className="data-[state=active]:bg-casino-brand/20">
            <Gamepad2 className="h-4 w-4 mr-2" />
            Games Management
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="data-[state=active]:bg-casino-brand/20">
            <CreditCard className="h-4 w-4 mr-2" />
            Withdrawal Approvals
          </TabsTrigger>
          <TabsTrigger value="lottery" className="data-[state=active]:bg-casino-brand/20">
            <Ticket className="h-4 w-4 mr-2" />
            Lottery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="games">
          <GamesManagement />
        </TabsContent>

        <TabsContent value="withdrawals">
          <WithdrawalApproval />
        </TabsContent>

        <TabsContent value="lottery">
          <LotteryManagement />
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
