'use client';

import { useState, useEffect } from 'react';
import { useWalletData } from '@/hooks/useWalletData';
import { useGameHistory, GameSession } from '@/hooks/useGameHistory';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Gamepad2,
  Trophy,
  Clock,
  RefreshCcw,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WalletModal } from '@/components/wallet/WalletModal';

// Game type icons and colors
const GAME_CONFIG: Record<string, { label: string; color: string }> = {
  crash: { label: 'Crash', color: 'text-orange-400' },
  dice: { label: 'Dice', color: 'text-blue-400' },
  mines: { label: 'Mines', color: 'text-red-400' },
  plinko: { label: 'Plinko', color: 'text-purple-400' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  className,
}: {
  title: string;
  value: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}) {
  return (
    <Card className={cn(
      "relative overflow-hidden bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border-white/5",
      "hover:border-white/10 transition-all duration-300 group",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-tr from-casino-brand/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {trendValue && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                trend === 'up' && "text-green-400",
                trend === 'down' && "text-red-400",
                trend === 'neutral' && "text-muted-foreground"
              )}>
                {trend === 'up' && <TrendingUp className="w-3 h-3" />}
                {trend === 'down' && <TrendingDown className="w-3 h-3" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl",
            "bg-gradient-to-br from-white/5 to-white/0",
            "group-hover:scale-110 transition-transform duration-300"
          )}>
            <Icon className="w-6 h-6 text-casino-brand" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Game History Row Component
function GameHistoryRow({ game }: { game: GameSession }) {
  const config = GAME_CONFIG[game.game_type] || { label: game.game_type, color: 'text-gray-400' };
  // Use pre-calculated values from API, falling back to local calculation
  const isWin = (game as any).isWin ?? game.outcome?.win === true;
  const profit = (game as any).profit ?? (isWin ? game.payout - game.bet_amount : -game.bet_amount);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-transparent hover:border-white/5">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          "bg-gradient-to-br from-white/5 to-white/0"
        )}>
          <Gamepad2 className={cn("w-5 h-5", config.color)} />
        </div>
        <div>
          <p className={cn("font-medium", config.color)}>{config.label}</p>
          <p className="text-xs text-muted-foreground">{formatTimeAgo(game.created_at)}</p>
        </div>
      </div>
      
      <div className="text-right">
        <div className="flex items-center gap-2 justify-end">
          <span className="text-sm text-muted-foreground">Bet: {formatCurrency(game.bet_amount)}</span>
          <span className={cn(
            "px-2 py-0.5 rounded text-xs font-bold",
            isWin ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          )}>
            {isWin ? 'WIN' : 'LOSS'}
          </span>
        </div>
        <p className={cn(
          "text-sm font-medium mt-1",
          profit >= 0 ? "text-green-400" : "text-red-400"
        )}>
          {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
        </p>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { isConnected } = useAccount();
  const { stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useWalletData();
  const { games, isLoading: gamesLoading, hasMore, total: totalGames, loadMore, refetch: refetchGames } = useGameHistory({ limit: 20 });
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'wins' | 'losses'>('all');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoading = statsLoading || gamesLoading;

  const handleRefresh = () => {
    refetchStats();
    refetchGames();
  };

  const filteredGames = games.filter(game => {
    if (activeTab === 'wins') return game.outcome?.win === true;
    if (activeTab === 'losses') return game.outcome?.win === false;
    return true;
  });

  // Show loading state during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-casino-brand" />
          <p className="text-muted-foreground">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border-white/5">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-casino-brand/20 to-transparent flex items-center justify-center">
              <Wallet className="w-8 h-8 text-casino-brand" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Connect Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to view your balance, earnings, and game history.
            </p>
            <Button
              onClick={() => setWalletModalOpen(true)}
              className="w-full bg-gradient-to-r from-casino-brand to-emerald-500 text-black font-bold hover:opacity-90"
            >
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
        <WalletModal
          open={walletModalOpen}
          onOpenChange={setWalletModalOpen}
          isConnected={false}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-casino-brand to-emerald-500 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-black" />
            </div>
            My Wallet
          </h1>
          <p className="text-muted-foreground mt-1">Manage your balance and view game history</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-white/10 hover:bg-white/5"
          >
            <RefreshCcw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            onClick={() => setWalletModalOpen(true)}
            className="bg-gradient-to-r from-casino-brand to-emerald-500 text-black font-bold hover:opacity-90"
          >
            <ArrowDownToLine className="w-4 h-4 mr-2" />
            Deposit
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {statsError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{statsError}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Current Balance"
          value={formatCurrency(stats.balance)}
          icon={Wallet}
          className="sm:col-span-2 lg:col-span-1"
        />
        <StatsCard
          title="Total Earnings"
          value={formatCurrency(stats.totalEarnings)}
          icon={DollarSign}
          trend={stats.totalEarnings >= 0 ? 'up' : 'down'}
          trendValue={stats.totalEarnings >= 0 ? 'Profit' : 'Loss'}
        />
        <StatsCard
          title="Total Won"
          value={formatCurrency(stats.totalWon)}
          icon={TrendingUp}
          trend="up"
          trendValue={`${stats.gamesPlayed > 0 ? Math.round(stats.winRate) : 0}% win rate`}
        />
        <StatsCard
          title="Games Played"
          value={stats.gamesPlayed.toString()}
          icon={Trophy}
          trendValue={`${formatCurrency(stats.totalWagered)} wagered`}
          trend="neutral"
        />
      </div>

      {/* Quick Stats Bar */}
      <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-gradient-to-r from-white/[0.02] to-transparent border border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-sm text-muted-foreground">Wins:</span>
          <span className="text-sm font-medium text-white">{stats.wins ?? games.filter(g => g.outcome?.win).length}</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-sm text-muted-foreground">Losses:</span>
          <span className="text-sm font-medium text-white">{stats.losses ?? games.filter(g => !g.outcome?.win).length}</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-casino-brand" />
          <span className="text-sm text-muted-foreground">Win Rate:</span>
          <span className="text-sm font-medium text-white">{Math.round(stats.winRate)}%</span>
        </div>
      </div>

      {/* Game History */}
      <Card className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border-white/5">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-casino-brand" />
            Game History
            {totalGames > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({totalGames} total)</span>
            )}
          </CardTitle>
          <div className="flex gap-1 p-1 rounded-lg bg-white/5">
            {(['all', 'wins', 'losses'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeTab === tab
                    ? "bg-casino-brand text-black"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {gamesLoading && games.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-casino-brand mb-3" />
              <p className="text-muted-foreground">Loading game history...</p>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Gamepad2 className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No games found</p>
              <p className="text-sm text-muted-foreground/70">Play some games to see your history here!</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {filteredGames.map((game) => (
                  <GameHistoryRow key={game.id} game={game} />
                ))}
              </div>
              {hasMore && (
                <div className="pt-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={gamesLoading}
                    className="border-white/10 hover:bg-white/5"
                  >
                    {gamesLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Load More
                  </Button>
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Wallet Modal */}
      <WalletModal
        open={walletModalOpen}
        onOpenChange={setWalletModalOpen}
        isConnected={isConnected}
      />
    </div>
  );
}
