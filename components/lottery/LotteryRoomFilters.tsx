'use client';

import { Badge } from '@/components/ui/badge';
import { RoomStatus, PayoutType, LotteryFilters } from '@/types/lottery';
import { Filter, ListFilter } from 'lucide-react';

interface LotteryRoomFiltersProps {
  filters: LotteryFilters;
  onFiltersChange: (filters: LotteryFilters) => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Rooms' },
  { value: RoomStatus.OPEN, label: 'Open' },
  { value: RoomStatus.CLOSED, label: 'Closed' },
  { value: RoomStatus.SETTLED, label: 'Settled' },
] as const;

const PAYOUT_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: PayoutType.WINNER_TAKES_ALL, label: 'Winner Takes All' },
  { value: PayoutType.SPLIT, label: 'Split Pool' },
] as const;

export function LotteryRoomFilters({ filters, onFiltersChange }: LotteryRoomFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Status Filter */}
      <div className="flex-1">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
          <ListFilter className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wider font-medium">Status</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <Badge
              key={option.value}
              variant="outline"
              className={`cursor-pointer transition-all ${
                filters.status === option.value
                  ? 'bg-casino-brand text-black border-casino-brand hover:bg-casino-brand/90'
                  : 'hover:bg-white/10 hover:border-white/20'
              }`}
              onClick={() => onFiltersChange({ ...filters, status: option.value })}
            >
              {option.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Payout Type Filter */}
      <div className="flex-1">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
          <Filter className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wider font-medium">Payout Type</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PAYOUT_OPTIONS.map((option) => (
            <Badge
              key={String(option.value)}
              variant="outline"
              className={`cursor-pointer transition-all ${
                filters.payoutType === option.value
                  ? 'bg-purple-500 text-white border-purple-500 hover:bg-purple-500/90'
                  : 'hover:bg-white/10 hover:border-white/20'
              }`}
              onClick={() => onFiltersChange({ ...filters, payoutType: option.value })}
            >
              {option.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
