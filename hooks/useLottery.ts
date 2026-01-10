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

export function useLottery() {
    const supabase = createClient();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const createRoom = useCallback(async (params: { name: string, minStake: number, maxStake: number, duration: number }) => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("Please login first");
                await login();
                return null;
            }

            const { data, error } = await supabase.functions.invoke('lottery-manager', {
                body: { action: 'create', ...params }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);
            
            toast.success("Room created successfully!");
            return data;
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to create room");
            return null;
        } finally {
            setLoading(false);
        }
    }, [supabase, login]);

    const joinRoom = useCallback(async (roomId: string, stakeAmount: number) => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("Please login first");
                await login();
                return null;
            }

            const { data, error } = await supabase.functions.invoke('lottery-manager', {
                body: { action: 'join', roomId, stakeAmount }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            toast.success("Joined room successfully!");
            return data;
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to join room");
            return null;
        } finally {
            setLoading(false);
        }
    }, [supabase, login]);

    const settleRoom = useCallback(async (roomId: string) => {
        setLoading(true);
        try {
             const { data, error } = await supabase.functions.invoke('lottery-manager', {
                body: { action: 'settle', roomId }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            toast.success(data.winner ? `Room settled! Winner: ${data.winner}` : "Room closed (no entries)");
            return data;
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to settle room");
            return null;
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    return {
        createRoom,
        joinRoom,
        settleRoom,
        loading
    };
}
