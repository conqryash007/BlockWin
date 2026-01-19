'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  RefreshCw, 
  Trophy, 
  XCircle, 
  RotateCcw, 
  CheckCircle2,
  Clock,
  DollarSign,
  Zap,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SportsBet {
  id: string;
  user_id: string;
  event_id: string;
  event_name: string;
  market_type: string;
  selection: string;
  odds: number;
  stake: number;
  bet_fee: number;
  potential_payout: number;
  status: 'pending' | 'won' | 'lost' | 'void';
  created_at: string;
  settled_at: string | null;
  users?: {
    wallet_address: string;
  };
}

type SettlementOutcome = 'won' | 'lost' | 'void';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  won: 'bg-green-500/20 text-green-400 border-green-500/30',
  lost: 'bg-red-500/20 text-red-400 border-red-500/30',
  void: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const MARKET_LABELS = {
  h2h: 'Moneyline',
  spreads: 'Spread',
  totals: 'Over/Under',
  parlay: 'Parlay',
};

export function SportsBetSettlement() {
  const { session } = useAuth();
  const [bets, setBets] = useState<SportsBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBets, setSelectedBets] = useState<Set<string>>(new Set());
  const [settlementOutcome, setSettlementOutcome] = useState<SettlementOutcome>('won');
  const [isSettling, setIsSettling] = useState(false);
  const [isAutoSettling, setIsAutoSettling] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalBets, setTotalBets] = useState(0);
  const BETS_PER_PAGE = 20;

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    won: 0,
    lost: 0,
    void: 0,
    totalPendingValue: 0,
  });

  const fetchBets = useCallback(async () => {
    if (!session?.access_token) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        status: statusFilter,
        limit: BETS_PER_PAGE.toString(),
        offset: (currentPage * BETS_PER_PAGE).toString(),
      });

      const response = await fetch(`/api/sports/settle-bet?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch bets');
      }

      setBets(data.bets || []);
      setTotalBets(data.total || 0);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, statusFilter, currentPage]);

  // Fetch stats for all statuses
  const fetchStats = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const statuses = ['pending', 'won', 'lost', 'void'];
      const results = await Promise.all(
        statuses.map(status => 
          fetch(`/api/sports/settle-bet?status=${status}&limit=1`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          }).then(r => r.json())
        )
      );

      setStats({
        pending: results[0]?.total || 0,
        won: results[1]?.total || 0,
        lost: results[2]?.total || 0,
        void: results[3]?.total || 0,
        totalPendingValue: 0, // Would need aggregate query
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSelectBet = (betId: string) => {
    setSelectedBets(prev => {
      const next = new Set(prev);
      if (next.has(betId)) {
        next.delete(betId);
      } else {
        next.add(betId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedBets.size === bets.filter(b => b.status === 'pending').length) {
      setSelectedBets(new Set());
    } else {
      setSelectedBets(new Set(bets.filter(b => b.status === 'pending').map(b => b.id)));
    }
  };

  const handleSettleSingle = async (betId: string, outcome: SettlementOutcome) => {
    if (!session?.access_token) return;

    setIsSettling(true);
    try {
      const response = await fetch('/api/sports/settle-bet', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ betId, outcome }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to settle bet');
      }

      toast.success(`Bet settled as ${outcome}`, {
        description: outcome !== 'lost' ? `Payout: $${data.payoutAmount.toFixed(2)}` : undefined,
      });

      // Refresh data
      fetchBets();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSettling(false);
    }
  };

  const handleBatchSettle = async () => {
    if (!session?.access_token || selectedBets.size === 0) return;

    setIsSettling(true);
    try {
      const settlements = Array.from(selectedBets).map(betId => ({
        betId,
        outcome: settlementOutcome,
      }));

      const response = await fetch('/api/sports/settle-bets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settlements }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to settle bets');
      }

      toast.success(data.message, {
        description: `${data.summary.success} succeeded, ${data.summary.failed} failed`,
      });

      setSelectedBets(new Set());
      fetchBets();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSettling(false);
    }
  };

  const handleAutoSettle = async (dryRun: boolean = false) => {
    if (!session?.access_token) return;

    setIsAutoSettling(true);
    try {
      const response = await fetch('/api/sports/auto-settle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Auto-settlement failed');
      }

      if (dryRun) {
        toast.info(`Preview: ${data.results.length} bets analyzed`, {
          description: `Would settle ${data.summary.settled} bets`,
          duration: 5000,
        });
      } else {
        toast.success(data.message);
        fetchBets();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAutoSettling(false);
    }
  };

  const filteredBets = bets.filter(bet => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      bet.event_name.toLowerCase().includes(query) ||
      bet.selection.toLowerCase().includes(query) ||
      bet.users?.wallet_address?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(totalBets / BETS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-casino-panel border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bets</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting settlement</p>
          </CardContent>
        </Card>
        <Card className="bg-casino-panel border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.won}</div>
            <p className="text-xs text-muted-foreground">Winning bets</p>
          </CardContent>
        </Card>
        <Card className="bg-casino-panel border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lost</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.lost}</div>
            <p className="text-xs text-muted-foreground">Losing bets</p>
          </CardContent>
        </Card>
        <Card className="bg-casino-panel border-gray-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voided</CardTitle>
            <RotateCcw className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">{stats.void}</div>
            <p className="text-xs text-muted-foreground">Refunded bets</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="bg-casino-panel border-white/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-casino-brand" />
              <div>
                <CardTitle>Sports Bet Settlement</CardTitle>
                <CardDescription>Manage and settle pending sports bets</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAutoSettle(true)}
                disabled={isAutoSettling}
                className="gap-2"
              >
                <Zap className="h-4 w-4" />
                Preview Auto-Settle
              </Button>
              <Button
                variant="casino"
                size="sm"
                onClick={() => handleAutoSettle(false)}
                disabled={isAutoSettling}
                className="gap-2"
              >
                {isAutoSettling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Auto-Settle
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchBets}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="bg-background/50">
                  <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500/20">
                    Pending ({stats.pending})
                  </TabsTrigger>
                  <TabsTrigger value="won" className="data-[state=active]:bg-green-500/20">
                    Won
                  </TabsTrigger>
                  <TabsTrigger value="lost" className="data-[state=active]:bg-red-500/20">
                    Lost
                  </TabsTrigger>
                  <TabsTrigger value="void" className="data-[state=active]:bg-gray-500/20">
                    Void
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events, selections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
            </div>
          </div>

          {/* Batch Actions */}
          {statusFilter === 'pending' && selectedBets.size > 0 && (
            <div className="flex items-center gap-4 p-4 bg-casino-brand/10 rounded-lg border border-casino-brand/30">
              <span className="text-sm font-medium">
                {selectedBets.size} bet{selectedBets.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Settle as:</span>
                <div className="flex gap-1">
                  <Button
                    variant={settlementOutcome === 'won' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSettlementOutcome('won')}
                    className={settlementOutcome === 'won' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    Won
                  </Button>
                  <Button
                    variant={settlementOutcome === 'lost' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSettlementOutcome('lost')}
                    className={settlementOutcome === 'lost' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    Lost
                  </Button>
                  <Button
                    variant={settlementOutcome === 'void' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSettlementOutcome('void')}
                    className={settlementOutcome === 'void' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                  >
                    Void
                  </Button>
                </div>
              </div>
              <Button
                variant="casino"
                size="sm"
                onClick={handleBatchSettle}
                disabled={isSettling}
                className="ml-auto"
              >
                {isSettling ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Apply Settlement
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBets(new Set())}
              >
                Clear
              </Button>
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-casino-brand" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <p className="text-red-400">{error}</p>
              <Button variant="outline" onClick={fetchBets}>Retry</Button>
            </div>
          ) : filteredBets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Trophy className="h-8 w-8 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No bets found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border border-white/5 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      {statusFilter === 'pending' && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedBets.size === bets.filter(b => b.status === 'pending').length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead>Event</TableHead>
                      <TableHead>Selection</TableHead>
                      <TableHead>Market</TableHead>
                      <TableHead className="text-right">Odds</TableHead>
                      <TableHead className="text-right">Stake</TableHead>
                      <TableHead className="text-right">Payout</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Placed</TableHead>
                      {statusFilter === 'pending' && (
                        <TableHead className="text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBets.map((bet) => (
                      <TableRow key={bet.id} className="border-white/5">
                        {statusFilter === 'pending' && (
                          <TableCell>
                            <Checkbox
                              checked={selectedBets.has(bet.id)}
                              onCheckedChange={() => handleSelectBet(bet.id)}
                              disabled={bet.status !== 'pending'}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="font-medium truncate">{bet.event_name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {bet.users?.wallet_address?.slice(0, 8)}...{bet.users?.wallet_address?.slice(-6)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-casino-brand">{bet.selection}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-secondary/50 text-xs">
                            {MARKET_LABELS[bet.market_type as keyof typeof MARKET_LABELS] || bet.market_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(bet.odds).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${Number(bet.stake).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-casino-brand">
                          ${Number(bet.potential_payout).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${STATUS_COLORS[bet.status]} border`}>
                            {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(bet.created_at), { addSuffix: true })}
                        </TableCell>
                        {statusFilter === 'pending' && bet.status === 'pending' && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-green-500/20 hover:text-green-400"
                                onClick={() => handleSettleSingle(bet.id, 'won')}
                                disabled={isSettling}
                                title="Settle as Won"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400"
                                onClick={() => handleSettleSingle(bet.id, 'lost')}
                                disabled={isSettling}
                                title="Settle as Lost"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-gray-500/20 hover:text-gray-400"
                                onClick={() => handleSettleSingle(bet.id, 'void')}
                                disabled={isSettling}
                                title="Void (Refund)"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {currentPage * BETS_PER_PAGE + 1} - {Math.min((currentPage + 1) * BETS_PER_PAGE, totalBets)} of {totalBets}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage === totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
