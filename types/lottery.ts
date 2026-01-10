// Lottery/Betting Rooms Types
import { formatUnits } from 'viem';

export enum PayoutType {
  WINNER_TAKES_ALL = 'winner_takes_all',
  SPLIT = 'split',
}

export enum RoomStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  SETTLED = 'settled',
}

export interface LotteryFilters {
  status: RoomStatus | 'all';
  payoutType: PayoutType | 'all';
}

export interface BettingRoom {
  id: string; // UUID from Supabase
  roomId: string; // Display ID? Or just use name
  name: string;
  minStakeAmount: number;
  maxStakeAmount: number;
  settlementTimestamp: number; // Unix timestamp (seconds or ms?) Backend uses ISO string usually, but we can convert.
  // Backend returns "settlement_time" ISO string. Frontend usually wants number for calc.
  // I'll map it.
  closed: boolean;
  settled: boolean;
  payoutType: PayoutType;
  created_by: string;
}

export interface WinnerInfo {
  address: string; // User ID or wallet address
  prize: number;
  rank: number; 
}

export interface RoomWithPlayers extends BettingRoom {
  players: string[]; // User IDs (UUIDs)
  totalPool: number;
  winners?: WinnerInfo[];
}

export interface PlayerStake {
  player: string;
  stake: number;
}

// Helper to derive room status from room data
export function getRoomStatus(room: BettingRoom): RoomStatus {
  if (room.settled) return RoomStatus.SETTLED;
  if (room.closed) return RoomStatus.CLOSED;
  
  const now = Math.floor(Date.now() / 1000);
  if (now >= room.settlementTimestamp) return RoomStatus.CLOSED;
  
  return RoomStatus.OPEN;
}

// Format token amount to USD
// Input amount is Number (USDT usually)
export function formatTokenToUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatTokenBalance(amount: number): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} mUSDT`;
}

// Shorten address for display
export function shortenAddress(address: string): string {
  if (!address) return '';
  if (address.length < 10) return address; // Usernames?
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
