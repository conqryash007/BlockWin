'use client';

import { useWithdrawalRequests } from '@/hooks/useWithdrawal';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowUpRight, Clock, History } from 'lucide-react';

export function WithdrawalStats() {
  const { requests, loading } = useWithdrawalRequests();
  
  // Calculate stats
  const totalWithdrawn = requests
    .filter(r => r.status === 'completed' || r.status === 'approved')
    .reduce((acc, curr) => acc + (Number(curr.requested_amount) || 0), 0);
    
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  
  const lastWithdrawal = requests.length > 0 ? requests[0] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="bg-black/20 border-white/5 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Withdrawn</p>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">
                    ${totalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-muted-foreground">USDT</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/20 border-white/5 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
              ) : (
                <p className="text-2xl font-bold text-white">{pendingCount}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/20 border-white/5 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <History className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Withdrawal</p>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
              ) : lastWithdrawal ? (
                <div>
                  <p className="text-lg font-semibold text-white capitalize">{lastWithdrawal.status}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(lastWithdrawal.created_at).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-lg font-semibold text-muted-foreground">No history</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
