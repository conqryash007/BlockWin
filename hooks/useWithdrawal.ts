'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { createClient } from '@/lib/supabase';
import { CONTRACTS, getActiveTronConfig, SUPPORTED_TOKENS } from '@/lib/contracts';
import { triggerBalanceRefresh } from '@/hooks/usePlatformBalance';
import { useAuth } from '@/hooks/useAuth';

export interface WithdrawalAllowanceResult {
  allowance: string;
  contractBalance: string;
  decimals: number;
}

export interface WithdrawalRequestRow {
  id: string;
  wallet_address: string;
  network: string;
  requested_amount: number;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

export function useWithdrawal() {
  const { user } = useAuth();
  const { address: evmAddress } = useAccount();
  const { address: tronAddress } = useWallet();
  const [allowanceLoading, setAllowanceLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const { writeContractAsync, isPending: isWritePending, data: withdrawHash } = useWriteContract();
  const { isLoading: isConfirmLoading, isPending: isConfirmPending, isFetching: isConfirmFetching, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });
  // In wagmi v2 / TanStack Query v5, when hash is undefined the query is disabled:
  // isPending=true (no data) but isFetching=false. Use isFetching to detect active confirmation.
  const isWithdrawConfirming = withdrawHash ? (isConfirmLoading || isConfirmFetching) : false;
  const isWithdrawPending = isWritePending || isWithdrawConfirming;

  const checkAllowance = useCallback(
    async (walletAddress: string, network: 'ethereum' | 'tron'): Promise<WithdrawalAllowanceResult | null> => {
      setAllowanceLoading(true);
      try {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams({
          wallet_address: walletAddress,
          network,
        });
        const res = await fetch(`/api/withdrawal/allowance?${params}`, { headers });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to fetch allowance');
        }
        const data = await res.json();
        return data as WithdrawalAllowanceResult;
      } catch (e) {
        console.error('[useWithdrawal] checkAllowance', e);
        return null;
      } finally {
        setAllowanceLoading(false);
      }
    },
    []
  );

  const requestApproval = useCallback(
    async (
      walletAddress: string,
      network: 'ethereum' | 'tron',
      amount: number
    ): Promise<{ success: boolean; request?: any; error?: string }> => {
      setRequestLoading(true);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/withdrawal/request', {
          method: 'POST',
          headers,
          body: JSON.stringify({ wallet_address: walletAddress, network, amount }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { success: false, error: data.error || 'Request failed' };
        }
        triggerBalanceRefresh();
        return { success: true, request: data.request };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Request failed';
        return { success: false, error: msg };
      } finally {
        setRequestLoading(false);
      }
    },
    []
  );

  const executeWithdraw = useCallback(
    async (network: 'ethereum' | 'tron'): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      if (network === 'ethereum') {
        if (!evmAddress) return { success: false, error: 'Connect your Ethereum wallet' };
        const usdtAddress = SUPPORTED_TOKENS.USDT.address;
        try {
          const hash = await writeContractAsync({
            address: CONTRACTS.CasinoDeposit.address,
            abi: CONTRACTS.CasinoDeposit.abi,
            functionName: 'withdraw',
            args: [usdtAddress],
          });
          return { success: true, txHash: hash };
        } catch (e: any) {
          const msg = e?.message?.includes('rejected') ? 'Transaction rejected' : e?.message || 'Withdrawal failed';
          return { success: false, error: msg };
        }
      } else {
        if (typeof window === 'undefined') return { success: false, error: 'Tron is only available in the browser' };
        const tronWeb = (window as any).tronWeb ?? (window as any).tronLink?.tronWeb;
        if (!tronWeb?.ready) return { success: false, error: 'Connect your Tron wallet' };
        const tronConfig = getActiveTronConfig();
        try {
          const contract = await tronWeb.contract().at(tronConfig.casinoDepositAddress);
          const tx = await contract.withdraw(tronConfig.usdt).send();
          const txId = tx?.transaction?.txID ?? tx?.txid ?? tx;
          return { success: true, txHash: typeof txId === 'string' ? txId : undefined };
        } catch (e: any) {
          const msg = e?.message?.includes('rejected') ? 'Transaction rejected' : e?.message || 'Withdrawal failed';
          return { success: false, error: msg };
        }
      }
    },
    [evmAddress, writeContractAsync]
  );

  return {
    checkAllowance,
    requestApproval,
    executeWithdraw,
    allowanceLoading,
    requestLoading,
    isWithdrawPending,
    isWithdrawSuccess,
    withdrawHash,
  };
}

export function useWithdrawalRequests() {
  const { user, isAuthenticated } = useAuth();
  const [requests, setRequests] = useState<WithdrawalRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchRequests = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/withdrawal/requests', { headers });
      if (!res.ok) return;
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchRequests();
  }, [isAuthenticated, user?.id, fetchRequests]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`withdrawal_requests_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchRequests]);

  return { requests, loading, refetch: fetchRequests };
}
