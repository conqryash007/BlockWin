'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWelcomeBonus } from '@/hooks/useWelcomeBonus';
import { Gift, Wallet, ArrowRight, Sparkles, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { openDepositModal } from '@/lib/depositEvents';

export function WelcomeBonusPopup() {
  const { showPopup, dismissPopup, hasWalletConnected, bonusAmount, status } = useWelcomeBonus();

  if (!showPopup || status === 'credited') return null;

  const steps = [
    { 
      label: 'Sign Up', 
      description: 'Create your account',
      completed: true, // Always completed if they see this popup
      icon: Check,
    },
    { 
      label: 'Connect Wallet', 
      description: 'Link your crypto wallet',
      completed: hasWalletConnected,
      icon: Wallet,
    },
    { 
      label: 'Make First Deposit', 
      description: 'Deposit any amount',
      completed: false,
      icon: ArrowRight,
    },
  ];

  return (
    <Dialog open={showPopup} onOpenChange={(open) => !open && dismissPopup()}>
      <DialogContent className="w-[90vw] max-w-[420px] p-0 bg-transparent border-0 shadow-none rounded-2xl" hideCloseButton>
        {/* Main Card with Gradient Border */}
        <div className="relative rounded-2xl overflow-hidden">
          {/* Animated gradient border */}
          <div className="absolute inset-0 bg-gradient-to-r from-casino-brand via-emerald-400 to-casino-brand bg-[length:200%_100%] animate-gradient-x rounded-2xl" />
          
          {/* Inner content - scrollable when needed */}
          <div className="relative m-[2px] bg-[#0a0c0f] rounded-[14px] overflow-hidden max-h-[85vh] overflow-y-auto">
            {/* Close button */}
            <button 
              onClick={dismissPopup}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>

            {/* Sparkle decorations */}
            <div className="absolute top-4 left-6 text-casino-brand/40 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="absolute top-10 right-12 text-emerald-400/30 animate-pulse delay-300">
              <Sparkles className="w-4 h-4" />
            </div>

            {/* Header section with gradient background */}
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-casino-brand/10 to-transparent">
              {/* Gift icon with glow */}
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-casino-brand/30 blur-xl rounded-full scale-150" />
                  <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-casino-brand to-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(0,255,163,0.4)]">
                    <Gift className="w-8 h-8 text-black" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-center text-xl font-bold text-white mb-0.5">
                Welcome Bonus!
              </h2>
              <p className="text-center text-muted-foreground text-xs">
                Exclusive offer for new members
              </p>
            </div>

            {/* Bonus amount display */}
            <div className="px-6 py-3">
              <div className="relative rounded-xl bg-gradient-to-r from-casino-brand/10 via-emerald-500/10 to-casino-brand/10 border border-casino-brand/20 p-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-casino-brand to-emerald-400">
                    ${bonusAmount}
                  </span>
                  <span className="text-base font-medium text-casino-brand/80">FREE</span>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-1">
                  Credited instantly after your first deposit
                </p>
              </div>
            </div>

            {/* Steps section */}
            <div className="px-6 py-3">
              <h3 className="text-sm font-semibold text-white/70 mb-2 uppercase tracking-wide">
                How to Claim
              </h3>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div 
                    key={step.label}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg transition-all",
                      step.completed 
                        ? "bg-casino-brand/10 border border-casino-brand/30" 
                        : "bg-white/5 border border-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      step.completed 
                        ? "bg-casino-brand text-black" 
                        : "bg-white/10 text-white/60"
                    )}>
                      {step.completed ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm",
                        step.completed ? "text-casino-brand" : "text-white"
                      )}>
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {step.description}
                      </p>
                    </div>
                    {step.completed && (
                      <span className="text-xs font-medium text-casino-brand bg-casino-brand/10 px-2 py-1 rounded">
                        Done
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements/Terms */}
            <div className="px-6 py-3 bg-white/[0.02]">
              <div className="space-y-1 text-[11px] text-muted-foreground/70">
                <p>• One-time offer for new accounts only</p>
                <p>• Bonus credited automatically after first deposit</p>
                <p>• Minimum deposit: Any amount</p>
                <p>• Bonus is added to your playable balance</p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="p-6 pt-2 pb-5">
              <Button 
                onClick={() => {
                  dismissPopup();
                  openDepositModal();
                }}
                className="w-full h-12 bg-gradient-to-r from-casino-brand to-emerald-500 text-black font-bold text-base hover:opacity-90 transition-all shadow-[0_0_30px_rgba(0,255,163,0.3)] hover:shadow-[0_0_40px_rgba(0,255,163,0.5)]"
              >
                {hasWalletConnected ? 'Make Your First Deposit' : 'Connect Wallet to Start'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
