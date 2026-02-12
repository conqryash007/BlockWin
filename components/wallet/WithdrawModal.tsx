'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function WithdrawModal() {
  return (
    <Link href="/withdraw">
      <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-white">
        Withdraw
      </Button>
    </Link>
  );
}
