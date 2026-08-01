import { CONTRACTS } from '@/lib/contracts';
import type { BalanceReader } from '@/lib/balanceGate';

// ============================================
// Network-specific token balance readers for the minimum-balance gate.
//
// Each reader either resolves a raw balance or THROWS. It must never resolve a
// fallback value such as 0n on error — the gate treats an unreadable balance as
// a refusal, and a silent 0 would be indistinguishable from an empty wallet.
// ============================================

/** Minimal shape we need from viem's PublicClient; keeps this module free of viem generics. */
interface ReadContractClient {
  readContract: (args: any) => Promise<unknown>;
}

function createEvmBalanceReader(
  publicClient: ReadContractClient | undefined,
  tokenAddress: `0x${string}`,
  owner: `0x${string}`
): BalanceReader {
  return async () => {
    if (!publicClient) throw new Error('No RPC client available');
    const result = await publicClient.readContract({
      address: tokenAddress,
      abi: CONTRACTS.ERC20.abi,
      functionName: 'balanceOf',
      args: [owner],
    });
    if (result === null || result === undefined) throw new Error('Empty balance response');
    return BigInt(result as string | number | bigint);
  };
}

function createTronBalanceReader(tokenAddress: string, owner: string): BalanceReader {
  return async () => {
    // Prefer the injected wallet — no round trip through our server.
    const injected = typeof window !== 'undefined'
      ? ((window as any).tronWeb ?? (window as any).tronLink?.tronWeb)
      : null;

    if (injected?.ready) {
      try {
        const contract = await injected.contract().at(tokenAddress);
        const result = await contract.balanceOf(owner).call();
        if (result === null || result === undefined) throw new Error('Empty balance response');
        return BigInt(result.toString());
      } catch (e) {
        console.warn('[balanceReaders] Injected TronWeb read failed, falling back to proxy:', e);
      }
    }

    const res = await fetch('/api/proxy/tron-balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: owner, token: tokenAddress }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data == null || typeof data.balance === 'undefined') {
      throw new Error(data?.error || `Balance proxy returned ${res.status}`);
    }
    return BigInt(data.balance);
  };
}

/** Build the right balance reader for the selected network. */
export function createTokenBalanceReader(params: {
  network: 'ethereum' | 'tron';
  tokenAddress: string;
  owner: string;
  publicClient?: ReadContractClient;
}): BalanceReader {
  const { network, tokenAddress, owner, publicClient } = params;
  if (network === 'tron') {
    return createTronBalanceReader(tokenAddress, owner);
  }
  return createEvmBalanceReader(publicClient, tokenAddress as `0x${string}`, owner as `0x${string}`);
}
