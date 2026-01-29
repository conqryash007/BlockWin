'use client';

import { cn } from '@/lib/utils';

type NetworkOption = 'ethereum' | 'tron';

interface NetworkSelectorProps {
  value: NetworkOption | null;
  onChange: (network: NetworkOption) => void;
}

export function NetworkSelector({ value, onChange }: NetworkSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold">Select Network</h3>
        <p className="text-xs text-muted-foreground">
          Choose which network to use for USDT approval.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange('ethereum')}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border px-3 py-4 text-xs transition-all',
            'bg-[#111316] border-white/10 hover:border-emerald-400/60 hover:bg-[#171a1f]',
            value === 'ethereum' && 'border-emerald-400 bg-[#161b20] shadow-[0_0_0_1px_rgba(16,185,129,0.4)]'
          )}
        >
          <span className="text-sm font-semibold">Ethereum</span>
          <span className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wide">
            EVM (MetaMask / WalletConnect)
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChange('tron')}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border px-3 py-4 text-xs transition-all',
            'bg-[#111316] border-white/10 hover:border-casino-brand/60 hover:bg-[#171a1f]',
            value === 'tron' && 'border-casino-brand bg-[#161b20] shadow-[0_0_0_1px_rgba(250,204,21,0.5)]'
          )}
        >
          <span className="text-sm font-semibold">Tron</span>
          <span className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wide">
            TronLink / TronWeb
          </span>
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        You can change this choice next time you open the wallet modal.
      </p>
    </div>
  );
}
