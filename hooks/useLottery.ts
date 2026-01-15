import { createClient } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useState, useCallback } from "react";

export interface LotteryRoom {
  id: string;
  name: string;
  min_stake: number;
  max_stake: number;
  payout_type: string;
  settlement_time: string;
  status: 'open' | 'closed' | 'settled';
  created_by: string;
  winners?: any[];
}

export interface CreateRoomParams {
  name: string;
  minStake: number;
  maxStake: number;
  settlementTime: string; // ISO date string
  payoutType: 'winner_takes_all' | 'split';
}

export interface SettleRoomParams {
  roomId: string;
  randomSelect?: boolean;
  winners?: { address: string; prize: number; rank: number }[];
}

export function useLottery() {
    const supabase = createClient();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const getAuthHeaders = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        return {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
        };
    }, [supabase]);

    const createRoom = useCallback(async (params: CreateRoomParams) => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            if (!headers) {
                toast.error("Please login first");
                await login();
                return null;
            }

            const response = await fetch('/api/lottery', {
                method: 'POST',
                headers,
                body: JSON.stringify(params)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create room');
            
            toast.success("Room created successfully!");
            return data;
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to create room");
            return null;
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders, login]);

    const joinRoom = useCallback(async (roomId: string, stakeAmount: number) => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            if (!headers) {
                toast.error("Please login first");
                await login();
                return null;
            }

            const response = await fetch('/api/lottery/join', {
                method: 'POST',
                headers,
                body: JSON.stringify({ roomId, stakeAmount })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to join room');

            toast.success("Joined room successfully!");
            return data;
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to join room");
            return null;
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders, login]);

    const settleRoom = useCallback(async (params: SettleRoomParams) => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            if (!headers) {
                toast.error("Please login first");
                return null;
            }

            const response = await fetch('/api/lottery', {
                method: 'PUT',
                headers,
                body: JSON.stringify({ 
                    roomId: params.roomId, 
                    action: 'settle',
                    randomSelect: params.randomSelect,
                    winners: params.winners
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to settle room');

            toast.success(data.winners?.length ? `Room settled! ${data.winners.length} winner(s)` : "Room closed (no entries)");
            return data;
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to settle room");
            return null;
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    const closeRoom = useCallback(async (roomId: string) => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            if (!headers) {
                toast.error("Please login first");
                return null;
            }

            const response = await fetch('/api/lottery', {
                method: 'PUT',
                headers,
                body: JSON.stringify({ roomId, action: 'close' })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to close room');

            toast.success("Room closed successfully!");
            return data;
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to close room");
            return null;
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    return {
        createRoom,
        joinRoom,
        settleRoom,
        closeRoom,
        loading
    };
}
