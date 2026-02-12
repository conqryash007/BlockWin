'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle2, XCircle, Inbox } from 'lucide-react';
import { toast } from 'sonner';

interface WithdrawalRequestRow {
  id: string;
  user_id: string;
  wallet_address: string;
  network: string;
  requested_amount: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export function AdminWithdrawalRequests() {
  const { session } = useAuth();
  const [requests, setRequests] = useState<WithdrawalRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/withdrawal-requests', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!session?.access_token) return;
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/withdrawal-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Update failed');
      toast.success(status === 'approved' ? 'Request approved' : 'Request rejected (user refunded)');
      fetchRequests();
    } catch (e: any) {
      toast.error(e?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-casino-panel border-white/5">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-casino-brand" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-casino-panel border-white/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-casino-brand" />
            <CardTitle>Withdrawal Requests</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          Approve or reject user withdrawal requests. Rejected requests refund the user&apos;s platform balance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No withdrawal requests</p>
        ) : (
          <div className="rounded-md border border-white/5">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead>Network</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id} className="border-white/5">
                    <TableCell>
                      <Badge variant="outline" className={req.network === 'tron' ? 'border-red-500/50 text-red-400' : 'border-[#627EEA]/50 text-[#627EEA]'}>
                        {req.network === 'tron' ? 'TRON' : 'Ethereum'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {req.wallet_address?.slice(0, 8)}...{req.wallet_address?.slice(-6)}
                    </TableCell>
                    <TableCell>{Number(req.requested_amount).toFixed(2)} USDT</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          req.status === 'pending'
                            ? 'border-yellow-500/50 text-yellow-400'
                            : req.status === 'approved'
                              ? 'border-green-500/50 text-green-400'
                              : 'border-red-500/50 text-red-400'
                        }
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(req.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === 'pending' && (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-400 border-green-500/50 hover:bg-green-500/10"
                            disabled={updatingId !== null}
                            onClick={() => updateStatus(req.id, 'approved')}
                          >
                            {updatingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-400 border-red-500/50 hover:bg-red-500/10"
                            disabled={updatingId !== null}
                            onClick={() => updateStatus(req.id, 'rejected')}
                          >
                            {updatingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
