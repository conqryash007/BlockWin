"use client";

import { 
  Gem, 
  Bomb, 
  TrendingUp, 
  Shield, 
  Sparkles, 
  MousePointerClick,
  Coins,
  BadgeCheck,
  ArrowRight,
  DollarSign,
  Target,
  Zap,
  Lock,
  RefreshCw,
  CheckCircle2
} from "lucide-react";

export function MinesEducation() {
  return (
    <div className="relative py-16 px-4 max-w-[1440px] mx-auto">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <Gem className="absolute top-10 left-10 w-24 h-24 text-casino-brand/30 animate-pulse" style={{ animationDuration: '3s' }} />
        <Bomb className="absolute bottom-20 right-20 w-32 h-32 text-red-500/20 animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      {/* Section Header */}
      <div className="text-center mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-casino-brand/10 border border-casino-brand/30 shadow-[0_0_20px_rgba(0,255,163,0.2)] mb-6">
          <Sparkles className="w-5 h-5 text-casino-brand" />
          <span className="text-base font-bold text-casino-brand uppercase tracking-wide">Learn & Win</span>
        </div>
        <h2 className="text-5xl md:text-6xl font-black text-white mb-4">How to Play & Win</h2>
        <p className="text-base text-gray-300 max-w-2xl mx-auto">
          Simple rules, massive rewards. Everything you need to know about Mines.
        </p>
      </div>

      {/* Content Sections - Full Width Stacked */}
      <div className="space-y-12 relative z-10">
        
        {/* Section 1: HOW TO PLAY */}
        <div className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] rounded-2xl border-2 border-casino-brand/20 shadow-[0_0_15px_rgba(0,255,163,0.15)] p-8">
          <div className="flex items-center gap-3 pb-6 border-b-2 border-casino-brand/30">
            <div className="w-12 h-12 rounded-lg bg-casino-brand/10 border-2 border-casino-brand/30 flex items-center justify-center">
              <MousePointerClick className="w-7 h-7 text-casino-brand" />
            </div>
            <h3 className="text-3xl font-black text-white uppercase">How to Play</h3>
          </div>
          
          <div className="space-y-6 pt-6 text-gray-200 leading-relaxed">
            <p className="text-lg">
              Mines is a thrilling game of risk and reward. Navigate through a minefield to collect gems and multiply your winnings!
            </p>
            
            <div className="bg-black/20 p-6 rounded-lg border-2 border-white/10">
              <h4 className="text-xl font-bold text-white mb-4">Game Mechanics:</h4>
              <ul className="space-y-3 list-none">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-casino-brand shrink-0 mt-0.5" />
                  <span><strong className="text-white">Choose Your Bet Amount:</strong> Select how much you want to wager on each round.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-casino-brand shrink-0 mt-0.5" />
                  <span><strong className="text-white">Set Number of Mines:</strong> More mines means higher risk but bigger multipliers.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-casino-brand shrink-0 mt-0.5" />
                  <span><strong className="text-white">Click to Reveal Tiles:</strong> Each safe tile you find increases your multiplier.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-casino-brand shrink-0 mt-0.5" />
                  <span><strong className="text-white">Cash Out Anytime:</strong> Secure your winnings before hitting a mine.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Bomb className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                  <span><strong className="text-red-400">Hit a Mine = Game Over:</strong> Revealing a mine ends the round and you lose your bet.</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-casino-brand/5 p-5 rounded-lg border-2 border-casino-brand/30">
              <h4 className="text-lg font-bold text-casino-brand mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Strategy Tips:
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Low Mines (1-5):</strong> Safer gameplay with smaller but consistent multipliers.</li>
                <li>• <strong>High Mines (10-20):</strong> Risky but massive potential payouts with each tile.</li>
                <li>• <strong>Know When to Cash Out:</strong> Greed is the enemy—secure profits before it's too late!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 2: HOW MULTIPLIERS WORK */}
        <div className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] rounded-2xl border-2 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.15)] p-8">
          <div className="flex items-center gap-3 pb-6 border-b-2 border-yellow-500/30">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-yellow-400" />
            </div>
            <h3 className="text-3xl font-black text-white uppercase">How Multipliers Work</h3>
          </div>
          
          <div className="pt-6 space-y-6">
            <p className="text-lg text-gray-200">
              Each safe tile increases the multiplier based on the number of mines. <strong className="text-white">More mines = higher risk = bigger rewards.</strong>
            </p>
            
            {/* Multiplier Examples Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { mines: 3, tiles: 5, multi: '2.15x', risk: 'Low Risk', color: 'emerald', bgColor: 'bg-emerald-500' },
                { mines: 5, tiles: 5, multi: '3.42x', risk: 'Medium Risk', color: 'yellow', bgColor: 'bg-yellow-500' },
                { mines: 10, tiles: 5, multi: '9.18x', risk: 'High Risk', color: 'orange', bgColor: 'bg-orange-500' },
                { mines: 20, tiles: 3, multi: '36.52x', risk: 'Extreme Risk', color: 'red', bgColor: 'bg-red-500' },
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="flex flex-col items-center p-5 bg-black/20 rounded-xl border border-white/5 text-center"
                >
                  <div className={`w-4 h-4 rounded-full ${item.bgColor} mb-3`} />
                  <div className="text-3xl font-black text-white mb-1">{item.multi}</div>
                  <div className="text-sm text-gray-400 mb-2">{item.mines} Mines · {item.tiles} Tiles</div>
                  <div className={`text-xs font-bold uppercase tracking-wider text-${item.color}-400`}>{item.risk}</div>
                </div>
              ))}
            </div>

            {/* Formula Box */}
            <div className="bg-yellow-500/10 p-6 rounded-xl border-2 border-yellow-500/30 flex flex-col md:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-3 text-xl">
                <span className="text-gray-300 font-bold">Your Payout</span>
                <span className="text-yellow-400 font-black">=</span>
                <span className="px-4 py-2 bg-black/30 rounded-lg text-white font-bold">Bet Amount</span>
                <span className="text-yellow-400 font-black text-2xl">×</span>
                <span className="px-4 py-2 bg-casino-brand/20 rounded-lg text-casino-brand font-bold">Final Multiplier</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: SECURITY & AUTOMATION */}
        <div className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] rounded-2xl border-2 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] p-8">
          <div className="flex items-center gap-3 pb-6 border-b-2 border-purple-500/30">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center">
              <Shield className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-3xl font-black text-white uppercase">Security & Automation</h3>
          </div>
          
          <div className="pt-6">
            {/* Security Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center text-center p-6 bg-black/20 rounded-xl border border-white/5">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border-2 border-purple-500/30 flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-purple-400" />
                </div>
                <h4 className="text-white font-bold mb-1">Automated</h4>
                <p className="text-gray-500 text-xs">No manual control</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-black/20 rounded-xl border border-white/5">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border-2 border-purple-500/30 flex items-center justify-center mb-4">
                  <Lock className="w-7 h-7 text-purple-400" />
                </div>
                <h4 className="text-white font-bold mb-1">Tamper-Proof</h4>
                <p className="text-gray-500 text-xs">Cannot be altered</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-black/20 rounded-xl border border-white/5">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border-2 border-purple-500/30 flex items-center justify-center mb-4">
                  <RefreshCw className="w-7 h-7 text-purple-400" />
                </div>
                <h4 className="text-white font-bold mb-1">Consistent</h4>
                <p className="text-gray-500 text-xs">Fair every time</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-black/20 rounded-xl border border-white/5">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border-2 border-purple-500/30 flex items-center justify-center mb-4">
                  <BadgeCheck className="w-7 h-7 text-purple-400" />
                </div>
                <h4 className="text-white font-bold mb-1">Reliable</h4>
                <p className="text-gray-500 text-xs">Built for trust</p>
              </div>
            </div>

            {/* Trust Statement */}
            <div className="mt-6 bg-casino-brand/5 p-5 rounded-xl border-2 border-casino-brand/30 flex items-center justify-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-casino-brand" />
              <span className="text-base font-bold text-white">Outcomes are handled programmatically and designed for fairness, consistency, and reliability.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
