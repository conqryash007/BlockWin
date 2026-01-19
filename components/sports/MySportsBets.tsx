'use client';

import { useState, useEffect } from 'react';
import { useSportsBets, SportsBet, BetStatus } from '@/hooks/useSportsBets';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCcw,
  Ticket,
  AlertCircle,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Timer,
  RotateCcw,
} from 'lucide-react';

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

function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

const STATUS_CONFIG: Record<BetStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: typeof CheckCircle2;
}> = {
  pending: { 
    label: 'Pending', 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500/20',
    icon: Timer,
  },
  won: { 
    label: 'Won', 
    color: 'text-green-400', 
    bgColor: 'bg-green-500/20',
    icon: CheckCircle2,
  },
  lost: { 
    label: 'Lost', 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/20',
    icon: XCircle,
  },
  void: { 
    label: 'Void', 
    color: 'text-gray-400', 
    bgColor: 'bg-gray-500/20',
    icon: RotateCcw,
  },
  cashed_out: { 
    label: 'Cashed Out', 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/20',
    icon: TrendingUp,
  },
};

// Individual bet row component
function SportsBetRow({ bet }: { bet: SportsBet }) {
  const statusConfig = STATUS_CONFIG[bet.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const isParlay = bet.market_type === 'parlay';
  
  // Calculate actual outcome
  const getOutcomeDisplay = () => {
    switch (bet.status) {
      case 'won':
        return { 
          amount: bet.potential_payout, 
          prefix: '+', 
          color: 'text-green-400' 
        };
      case 'lost':
        return { 
          amount: bet.stake, 
          prefix: '-', 
          color: 'text-red-400' 
        };
      case 'void':
        return { 
          amount: bet.stake, 
          prefix: '+', 
          color: 'text-gray-400' 
        };
      default:
        return null;
    }
  };

  const outcome = getOutcomeDisplay();

  return (
    <div className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-200 border border-transparent hover:border-white/5 group">
      {/* Top row: Selection and Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isParlay && (
              <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                PARLAY
              </Badge>
            )}
            <p className="font-semibold text-white truncate">{bet.selection}</p>
          </div>
          <p className="text-sm text-muted-foreground truncate">{bet.event_name}</p>
        </div>
        
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0",
          statusConfig.bgColor,
          statusConfig.color
        )}>
          <StatusIcon className="w-3 h-3" />
          {statusConfig.label}
        </div>
      </div>

      {/* Middle row: Bet details */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Stake:</span>
          <span className="text-white font-medium">{formatCurrency(bet.stake)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Odds:</span>
          <span className="text-casino-brand font-medium">{formatOdds(bet.odds)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">
            {bet.status === 'pending' ? 'Potential:' : 'Payout:'}
          </span>
          <span className={cn(
            "font-medium",
            bet.status === 'pending' ? 'text-casino-brand' : 'text-white'
          )}>
            {formatCurrency(bet.potential_payout)}
          </span>
        </div>
      </div>

      {/* Bottom row: Time and outcome */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTimeAgo(bet.created_at)}
        </span>
        
        {outcome && (
          <span className={cn("text-sm font-bold", outcome.color)}>
            {outcome.prefix}{formatCurrency(outcome.amount)}
          </span>
        )}
      </div>
    </div>
  );
}

// Summary stats bar
function BetsSummaryBar({ 
  pending, 
  totalPendingStake, 
  totalPotentialPayout 
}: { 
  pending: number; 
  totalPendingStake: number; 
  totalPotentialPayout: number;
}) {
  if (pending === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-gradient-to-r from-casino-brand/10 via-casino-brand/5 to-transparent border border-casino-brand/20">
      <div className="flex items-center gap-2">
        <Timer className="w-4 h-4 text-casino-brand" />
        <span className="text-sm text-muted-foreground">Active Bets:</span>
        <span className="text-sm font-semibold text-white">{pending}</span>
      </div>
      <div className="w-px h-4 bg-white/10 hidden sm:block" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">At Stake:</span>
        <span className="text-sm font-semibold text-yellow-400">{formatCurrency(totalPendingStake)}</span>
      </div>
      <div className="w-px h-4 bg-white/10 hidden sm:block" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Potential Win:</span>
        <span className="text-sm font-semibold text-green-400">{formatCurrency(totalPotentialPayout)}</span>
      </div>
    </div>
  );
}

// Main component
interface MySportsBetsProps {
  className?: string;
  showSummary?: boolean;
  maxHeight?: string;
}

export function MySportsBets({ 
  className, 
  showSummary = true,
  maxHeight = '600px',
}: MySportsBetsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'settled'>('all');
  const { isAuthenticated, session } = useAuth();
  const { 
    bets, 
    total, 
    hasMore, 
    summary,
    isLoading, 
    error, 
    loadMore, 
    refetch 
  } = useSportsBets({ 
    status: activeTab === 'settled' ? 'all' : activeTab === 'pending' ? 'pending' : 'all',
    limit: 20,
    autoRefresh: true, // Auto-refresh to show new bets
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  // Listen for bet placement events to trigger refresh
  useEffect(() => {
    const handleBetPlaced = () => {
      // Small delay to ensure the bet is saved in the database
      setTimeout(() => {
        refetch();
      }, 1000);
    };

    window.addEventListener('sports-bet-placed', handleBetPlaced);
    return () => {
      window.removeEventListener('sports-bet-placed', handleBetPlaced);
    };
  }, [refetch]);

  // Filter bets based on active tab
  const filteredBets = bets.filter(bet => {
    if (activeTab === 'pending') return bet.status === 'pending';
    if (activeTab === 'settled') return ['won', 'lost', 'void', 'cashed_out'].includes(bet.status);
    return true;
  });

  // Debug logging
  useEffect(() => {
    console.log('MySportsBets Debug:', {
      isAuthenticated,
      hasSession: !!session,
      betsCount: bets.length,
      filteredCount: filteredBets.length,
      total,
      isLoading,
      error,
      activeTab,
    });
  }, [isAuthenticated, session, bets.length, filteredBets.length, total, isLoading, error, activeTab]);

  return (
    <Card className={cn(
      "bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border-white/5",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <div className="p-2 rounded-lg bg-casino-brand/20">
              <Ticket className="w-5 h-5 text-casino-brand" />
            </div>
            My Sports Bets
            {total > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({total} total)
              </span>
            )}
            {!isAuthenticated && (
              <Badge variant="outline" className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                Sign in required
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 rounded-lg bg-white/5">
              {(['all', 'pending', 'settled'] as const).map((tab) => (
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
              className="border-white/10 hover:bg-white/5"
            >
              <RefreshCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Authentication Warning */}
        {!isAuthenticated && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Please sign in to view your bet history</p>
          </div>
        )}

        {/* Summary Bar */}
        {showSummary && summary.pending > 0 && (
          <BetsSummaryBar
            pending={summary.pending}
            totalPendingStake={summary.totalPendingStake}
            totalPotentialPayout={summary.totalPotentialPayout}
          />
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={refetch}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                Retry
              </Button>
            </div>
            <p className="text-xs text-red-400/70">
              Check the browser console for more details. Make sure you're signed in and have placed bets.
            </p>
          </div>
        )}

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
            <p>Debug: Auth={isAuthenticated ? 'Yes' : 'No'}, Bets={bets.length}, Filtered={filteredBets.length}, Total={total}, Loading={isLoading ? 'Yes' : 'No'}, Error={error || 'None'}</p>
          </div>
        )}

        {/* Bets List */}
        {isLoading && bets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-casino-brand mb-3" />
            <p className="text-muted-foreground">Loading your bets...</p>
            <p className="text-xs text-muted-foreground/50 mt-2">
              {isAuthenticated ? 'Fetching from database...' : 'Please sign in to view your bets'}
            </p>
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Ticket className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium mb-1">No bets found</p>
            <p className="text-sm text-muted-foreground/70 mb-4 text-center">
              {!isAuthenticated 
                ? "Please sign in to view your bet history"
                : activeTab === 'pending' 
                ? "You don't have any pending bets"
                : activeTab === 'settled'
                ? "No settled bets yet"
                : "Place your first bet to see it here!"
              }
            </p>
            {total > 0 && (
              <p className="text-xs text-muted-foreground/50 mb-2">
                Total bets in database: {total} (filtered: {bets.length})
              </p>
            )}
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={isLoading}
                className="mt-4"
              >
                <RefreshCcw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea style={{ maxHeight }}>
            <div className="space-y-2 pr-2">
              {filteredBets.map((bet) => (
                <SportsBetRow key={bet.id} bet={bet} />
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="pt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  disabled={isLoading}
                  className="border-white/10 hover:bg-white/5 gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  Load More
                </Button>
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for sidebar or sports page
export function PendingBetsWidget({ className }: { className?: string }) {
  const { bets, summary, isLoading, refetch } = useSportsBets({ 
    status: 'pending', 
    limit: 5,
    autoRefresh: true,
    refreshInterval: 60000,
  });

  if (!isLoading && bets.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "p-4 rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Timer className="w-4 h-4 text-casino-brand" />
          Active Bets
          {summary.pending > 0 && (
            <Badge variant="outline" className="bg-casino-brand/20 text-casino-brand border-casino-brand/30">
              {summary.pending}
            </Badge>
          )}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={refetch}
          disabled={isLoading}
          className="h-7 w-7 p-0 hover:bg-white/5"
        >
          <RefreshCcw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
        </Button>
      </div>

      {isLoading && bets.length === 0 ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-casino-brand" />
        </div>
      ) : (
        <div className="space-y-2">
          {bets.slice(0, 5).map((bet) => (
            <div 
              key={bet.id}
              className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{bet.selection}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(bet.stake)} @ {formatOdds(bet.odds)}
                </p>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-sm font-semibold text-casino-brand">
                  {formatCurrency(bet.potential_payout)}
                </p>
              </div>
            </div>
          ))}
          
          {summary.pending > 5 && (
            <p className="text-xs text-center text-muted-foreground pt-1">
              +{summary.pending - 5} more bets
            </p>
          )}
        </div>
      )}

      {summary.pending > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-sm">
          <span className="text-muted-foreground">Total Potential:</span>
          <span className="font-semibold text-green-400">
            {formatCurrency(summary.totalPotentialPayout)}
          </span>
        </div>
      )}
    </div>
  );
}
