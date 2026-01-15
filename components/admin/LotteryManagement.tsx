'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Ticket, 
  Plus, 
  Users, 
  Trophy, 
  Clock, 
  DollarSign,
  Loader2,
  Shuffle,
  CheckCircle,
  XCircle,
  Crown
} from 'lucide-react';
import { useLottery, CreateRoomParams, SettleRoomParams } from '@/hooks/useLottery';
import { useAllRooms } from '@/hooks/useBettingRooms';
import { createClient } from '@/lib/supabase';
import { formatTokenToUSD, shortenAddress, getRoomStatus, RoomStatus } from '@/types/lottery';

interface Participant {
  user_id: string;
  stake_amount: number;
  wallet_address?: string;
}

export function LotteryManagement() {
  const { rooms, isLoading: roomsLoading, refetch } = useAllRooms();
  const { createRoom, settleRoom, closeRoom, loading } = useLottery();
  const supabase = createClient();
  
  // Create Room Form State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [minStake, setMinStake] = useState('10');
  const [maxStake, setMaxStake] = useState('100');
  const [settlementDate, setSettlementDate] = useState('');
  const [settlementTime, setSettlementTime] = useState('');
  const [payoutType, setPayoutType] = useState<'winner_takes_all' | 'split'>('winner_takes_all');

  // Settle Room State
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);

  // Set default date/time to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSettlementDate(tomorrow.toISOString().split('T')[0]);
    setSettlementTime('12:00');
  }, []);

  const handleCreateRoom = async () => {
    if (!roomName || !minStake || !maxStake || !settlementDate || !settlementTime) {
      return;
    }

    const settlementDateTime = new Date(`${settlementDate}T${settlementTime}`);
    
    const params: CreateRoomParams = {
      name: roomName,
      minStake: Number(minStake),
      maxStake: Number(maxStake),
      settlementTime: settlementDateTime.toISOString(),
      payoutType
    };

    const result = await createRoom(params);
    if (result) {
      setCreateDialogOpen(false);
      setRoomName('');
      setMinStake('10');
      setMaxStake('100');
      setPayoutType('winner_takes_all');
      refetch();
    }
  };

  const fetchParticipants = useCallback(async (roomId: string) => {
    setLoadingParticipants(true);
    try {
      const { data: entries, error } = await supabase
        .from('lottery_entries')
        .select('user_id, stake_amount')
        .eq('room_id', roomId);

      if (error) throw error;

      // Get wallet addresses for participants
      if (entries && entries.length > 0) {
        const userIds = entries.map(e => e.user_id);
        const { data: users } = await supabase
          .from('users')
          .select('id, wallet_address')
          .in('id', userIds);

        const participantsWithWallets = entries.map(entry => ({
          ...entry,
          wallet_address: users?.find(u => u.id === entry.user_id)?.wallet_address
        }));

        setParticipants(participantsWithWallets);
      } else {
        setParticipants([]);
      }
    } catch (err) {
      console.error('Error fetching participants:', err);
    } finally {
      setLoadingParticipants(false);
    }
  }, [supabase]);

  const openSettleDialog = async (room: any) => {
    setSelectedRoom(room);
    setSelectedWinners([]);
    setSettleDialogOpen(true);
    await fetchParticipants(room.id);
  };

  const handleRandomSelect = async () => {
    if (!selectedRoom) return;

    const params: SettleRoomParams = {
      roomId: selectedRoom.id,
      randomSelect: true
    };

    const result = await settleRoom(params);
    if (result) {
      setSettleDialogOpen(false);
      setSelectedRoom(null);
      refetch();
    }
  };

  const handleManualSelect = async () => {
    if (!selectedRoom || selectedWinners.length === 0) return;

    const totalPool = participants.reduce((sum, p) => sum + Number(p.stake_amount), 0);
    const payouts = selectedRoom.payoutType === 'split' 
      ? [0.60, 0.30, 0.10] 
      : [1.0];

    const winners = selectedWinners.slice(0, payouts.length).map((userId, index) => ({
      address: userId,
      prize: Math.floor(totalPool * payouts[index] * 100) / 100,
      rank: index + 1
    }));

    const params: SettleRoomParams = {
      roomId: selectedRoom.id,
      winners
    };

    const result = await settleRoom(params);
    if (result) {
      setSettleDialogOpen(false);
      setSelectedRoom(null);
      refetch();
    }
  };

  const toggleWinnerSelection = (userId: string) => {
    const maxWinners = selectedRoom?.payoutType === 'split' ? 3 : 1;
    
    if (selectedWinners.includes(userId)) {
      setSelectedWinners(prev => prev.filter(id => id !== userId));
    } else if (selectedWinners.length < maxWinners) {
      setSelectedWinners(prev => [...prev, userId]);
    }
  };

  const getStatusBadge = (room: any) => {
    const status = getRoomStatus(room);
    switch (status) {
      case RoomStatus.OPEN:
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Open</Badge>;
      case RoomStatus.CLOSED:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Closed</Badge>;
      case RoomStatus.SETTLED:
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Settled</Badge>;
    }
  };

  const getTimeRemaining = (settlementTimestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = settlementTimestamp - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-casino-brand/10 border border-casino-brand/20">
            <Ticket className="w-5 h-5 text-casino-brand" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Lottery Management</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage lottery rooms
            </p>
          </div>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-casino-brand hover:bg-casino-brand/90 text-black">
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1c24] border-white/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-casino-brand" />
                Create Lottery Room
              </DialogTitle>
              <DialogDescription>
                Set up a new lottery room with custom configurations
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Room Name</Label>
                <Input
                  placeholder="e.g., Weekly Jackpot"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="bg-[#0f1115] border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Stake (mUSDT)</Label>
                  <Input
                    type="number"
                    value={minStake}
                    onChange={(e) => setMinStake(e.target.value)}
                    className="bg-[#0f1115] border-white/10"
                  />
                </div>
                <div>
                  <Label>Max Stake (mUSDT)</Label>
                  <Input
                    type="number"
                    value={maxStake}
                    onChange={(e) => setMaxStake(e.target.value)}
                    className="bg-[#0f1115] border-white/10"
                  />
                </div>
              </div>

              {/* Time Presets */}
              <div>
                <Label className="mb-2 block">Quick Presets</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-[#0f1115] border-white/10 hover:bg-casino-brand/10 hover:border-casino-brand/30"
                    onClick={() => {
                      const instant = new Date();
                      instant.setMinutes(instant.getMinutes() + 5);
                      setSettlementDate(instant.toISOString().split('T')[0]);
                      setSettlementTime(instant.toTimeString().slice(0, 5));
                    }}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Instant (5m)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-[#0f1115] border-white/10 hover:bg-casino-brand/10 hover:border-casino-brand/30"
                    onClick={() => {
                      const nextDay = new Date();
                      nextDay.setDate(nextDay.getDate() + 1);
                      nextDay.setHours(12, 0, 0, 0);
                      setSettlementDate(nextDay.toISOString().split('T')[0]);
                      setSettlementTime('12:00');
                    }}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Next Day
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-[#0f1115] border-white/10 hover:bg-casino-brand/10 hover:border-casino-brand/30"
                    onClick={() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      nextWeek.setHours(12, 0, 0, 0);
                      setSettlementDate(nextWeek.toISOString().split('T')[0]);
                      setSettlementTime('12:00');
                    }}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Next Week
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Settlement Date</Label>
                  <Input
                    type="date"
                    value={settlementDate}
                    onChange={(e) => setSettlementDate(e.target.value)}
                    className="bg-[#0f1115] border-white/10"
                  />
                </div>
                <div>
                  <Label>Settlement Time</Label>
                  <Input
                    type="time"
                    value={settlementTime}
                    onChange={(e) => setSettlementTime(e.target.value)}
                    className="bg-[#0f1115] border-white/10"
                  />
                </div>
              </div>

              <div>
                <Label>Payout Type</Label>
                <Select value={payoutType} onValueChange={(v: any) => setPayoutType(v)}>
                  <SelectTrigger className="bg-[#0f1115] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1c24] border-white/10">
                    <SelectItem value="winner_takes_all">Winner Takes All</SelectItem>
                    <SelectItem value="split">Top 3 Split (60/30/10)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-casino-brand hover:bg-casino-brand/90 text-black"
                onClick={handleCreateRoom}
                disabled={loading || !roomName}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Room'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-casino-panel border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ticket className="w-4 h-4 text-casino-brand" />
              Total Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-casino-panel border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Open Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {rooms.filter(r => getRoomStatus(r) === RoomStatus.OPEN).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-casino-panel border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Total Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {rooms.reduce((sum, r) => sum + r.players.length, 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-casino-panel border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              Total Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {formatTokenToUSD(rooms.reduce((sum, r) => sum + r.totalPool, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Table */}
      <Card className="bg-casino-panel border-white/5">
        <CardHeader>
          <CardTitle className="text-lg">All Lottery Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          {roomsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No lottery rooms yet</p>
              <p className="text-sm">Create your first room to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead>Room</TableHead>
                  <TableHead>Stake Range</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Pool</TableHead>
                  <TableHead>Time Left</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => {
                  const status = getRoomStatus(room);
                  const canSettle = status !== RoomStatus.SETTLED;
                  
                  return (
                    <TableRow key={room.id} className="border-white/5">
                      <TableCell>
                        <div>
                          <p className="font-medium">{room.name || `Room #${room.roomId.slice(0, 8)}`}</p>
                          <p className="text-xs text-muted-foreground">
                            {room.payoutType === 'split' ? 'Top 3 Split' : 'Winner Takes All'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatTokenToUSD(room.minStakeAmount)} - {formatTokenToUSD(room.maxStakeAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {room.players.length}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-casino-brand">
                        {formatTokenToUSD(room.totalPool)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {getTimeRemaining(room.settlementTimestamp)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(room)}</TableCell>
                      <TableCell className="text-right">
                        {canSettle && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:bg-casino-brand/10 hover:border-casino-brand/30"
                            onClick={() => openSettleDialog(room)}
                          >
                            <Trophy className="w-4 h-4 mr-1" />
                            Settle
                          </Button>
                        )}
                        {status === RoomStatus.SETTLED && room.winners && room.winners.length > 0 && (
                          <div className="flex items-center gap-1 text-purple-400">
                            <Crown className="w-4 h-4" />
                            <span className="text-sm">{room.winners.length} winner(s)</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Settle Room Dialog */}
      <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <DialogContent className="bg-[#1a1c24] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-casino-brand" />
              Settle Room: {selectedRoom?.name || 'Lottery'}
            </DialogTitle>
            <DialogDescription>
              Choose to randomly pick winner(s) or manually select them
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Room Info */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Pool</p>
                <p className="text-lg font-bold text-casino-brand">
                  {formatTokenToUSD(participants.reduce((sum, p) => sum + Number(p.stake_amount), 0))}
                </p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Participants</p>
                <p className="text-lg font-bold">{participants.length}</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Payout Type</p>
                <p className="text-lg font-bold">
                  {selectedRoom?.payoutType === 'split' ? 'Top 3' : '1 Winner'}
                </p>
              </div>
            </div>

            {/* Random Selection Button */}
            <Button
              className="w-full mb-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={handleRandomSelect}
              disabled={loading || participants.length === 0}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shuffle className="w-4 h-4 mr-2" />
              )}
              Random Winner Selection
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1a1c24] px-2 text-muted-foreground">or select manually</span>
              </div>
            </div>

            {/* Participants List for Manual Selection */}
            <div className="mt-4 max-h-60 overflow-y-auto">
              {loadingParticipants ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : participants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No participants in this room</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {participants.map((p, index) => {
                    const isSelected = selectedWinners.includes(p.user_id);
                    const rank = selectedWinners.indexOf(p.user_id) + 1;
                    
                    return (
                      <div
                        key={p.user_id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-casino-brand/10 border-casino-brand/30' 
                            : 'bg-black/20 border-white/5 hover:border-white/10'
                        }`}
                        onClick={() => toggleWinnerSelection(p.user_id)}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-casino-brand flex items-center justify-center text-black text-sm font-bold">
                              {rank}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm">
                              {index + 1}
                            </div>
                          )}
                          <div>
                            <p className="font-mono text-sm">
                              {shortenAddress(p.wallet_address || p.user_id)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Stake: {formatTokenToUSD(Number(p.stake_amount))}
                            </p>
                          </div>
                        </div>
                        {isSelected ? (
                          <CheckCircle className="w-5 h-5 text-casino-brand" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-white/20" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedWinners.length > 0 && (
              <p className="text-sm text-muted-foreground mt-3">
                Selected {selectedWinners.length} winner{selectedWinners.length > 1 ? 's' : ''}
                {selectedRoom?.payoutType === 'split' && selectedWinners.length < 3 && participants.length >= 3 && (
                  <span className="text-amber-400"> (select up to 3 for split payout)</span>
                )}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-casino-brand hover:bg-casino-brand/90 text-black"
              onClick={handleManualSelect}
              disabled={loading || selectedWinners.length === 0}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trophy className="w-4 h-4 mr-2" />
              )}
              Confirm Winners
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
