// Lottery/Betting Rooms Types

export enum PayoutType {
  WINNER_TAKES_ALL = 0,
  SPLIT = 1, // TOP_3
}

export enum RoomStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  SETTLED = 'settled',
}

export interface BettingRoom {
  roomId: bigint;
  minStakeAmount: bigint;
  maxStakeAmount: bigint;
  settlementTimestamp: bigint;
  closed: boolean;
  settled: boolean;
  payoutType: PayoutType;
}

export interface WinnerInfo {
  address: `0x${string}`;
  prize: bigint;
  rank: number; // 1st, 2nd, 3rd
}

export interface RoomWithPlayers extends BettingRoom {
  players: `0x${string}`[];
  totalPool: bigint;
  winners?: WinnerInfo[];
}

export interface PlayerStake {
  player: `0x${string}`;
  stake: bigint;
}

export interface LotteryFilters {
  status: 'all' | RoomStatus;
  payoutType: 'all' | PayoutType;
}

// Helper to derive room status from room data
export function getRoomStatus(room: BettingRoom): RoomStatus {
  if (room.settled) return RoomStatus.SETTLED;
  if (room.closed) return RoomStatus.CLOSED;
  return RoomStatus.OPEN;
}

import { formatUnits } from 'viem';

// ... existing enums and interfaces ...

// Format token amount to USD (MockERC20 uses 6 decimals like USDT)
// Token decimals: 6 (verify with token.decimals() call)
export function formatTokenToUSD(amount: bigint, decimals: number = 6): string {
  const value = Number(amount) / Math.pow(10, decimals);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatTokenBalance(amount: bigint, decimals: number = 18): string {
  const value = formatUnits(amount, decimals);
  // Format to 2 decimal places
  const formatted = Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} mUSDT`;
}

// Shorten address for display
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
