"use client";

import { Dice1, Dice6, Sparkles, Coins, Shield, TrendingUp, CheckCircle2 } from "lucide-react";

export function DiceEducation() {
  return (
    <div className="relative py-16 px-4 max-w-[1440px] mx-auto">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <Dice1 className="absolute top-10 left-10 w-24 h-24 text-casino-brand/30 animate-spin-slow" style={{ animationDuration: '20s' }} />
        <Dice6 className="absolute bottom-20 right-20 w-32 h-32 text-casino-brand/20 animate-spin-slow" style={{ animationDuration: '25s' }} />
      </div>

      {/* Section Header */}
      <div className="text-center mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-casino-brand/10 border border-casino-brand/30 shadow-[0_0_20px_rgba(0,255,163,0.2)] mb-6">
          <Sparkles className="w-5 h-5 text-casino-brand" />
          <span className="text-base font-bold text-casino-brand uppercase tracking-wide">Learn & Win</span>
        </div>
        <h2 className="text-5xl md:text-6xl font-black text-white mb-4">How to Play & Win</h2>
        <p className="text-base text-gray-300 max-w-2xl mx-auto">
          Simple rules, big rewards. Everything you need to know about the Dice game.
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-12 relative z-10">
        
        {/* Section 1: How to Play */}
        <div className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] rounded-2xl border-2 border-casino-brand/20 shadow-[0_0_15px_rgba(0,255,163,0.15)] p-8">
          <div className="flex items-center gap-3 pb-6 border-b-2 border-casino-brand/30">
            <div className="w-12 h-12 rounded-lg bg-casino-brand/10 border-2 border-casino-brand/30 flex items-center justify-center">
              <Dice1 className="w-7 h-7 text-casino-brand" />
            </div>
            <h3 className="text-3xl font-black text-white uppercase">How to Play</h3>
          </div>
          
          <div className="space-y-6 pt-6 text-gray-200 leading-relaxed">
            <p className="text-lg">
              The Dice game is a simple yet exciting game of chance where you predict whether a randomly generated number will fall within your chosen range.
            </p>
            
            <div className="bg-black/20 p-6 rounded-lg border-2 border-white/10">
              <h4 className="text-xl font-bold text-white mb-4">Game Mechanics:</h4>
              <ul className="space-y-3 list-none">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-casino-brand shrink-0 mt-0.5" />
                  <span><strong className="text-white">Choose Your Bet Amount:</strong> Select how much you want to wager on each roll.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-casino-brand shrink-0 mt-0.5" />
                  <span><strong className="text-white">Set Your Target:</strong> Use the slider to choose a target number between 1 and 98.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-casino-brand shrink-0 mt-0.5" />
                  <span><strong className="text-white">Pick Roll Over or Roll Under:</strong> Decide if you want the result to be over or under your target number.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-casino-brand shrink-0 mt-0.5" />
                  <span><strong className="text-white">Place Your Bet:</strong> Click the "Bet" button to roll the dice.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-casino-brand shrink-0 mt-0.5" />
                  <span><strong className="text-white">Win or Lose:</strong> If the rolled number falls in your predicted range, you win!</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-casino-brand/5 p-5 rounded-lg border-2 border-casino-brand/30">
              <h4 className="text-lg font-bold text-casino-brand mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Strategy Tips:
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Higher Win Chance = Lower Multiplier:</strong> Setting a target closer to 50 gives you better odds but smaller payouts.</li>
                <li>• <strong>Lower Win Chance = Higher Multiplier:</strong> Setting extreme targets (close to 0 or 100) offers huge payouts but lower odds.</li>
                <li>• <strong>Balance Risk and Reward:</strong> Find your sweet spot between safety and potential profit.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 2: Winnings */}
        <div className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] rounded-2xl border-2 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.15)] p-8">
          <div className="flex items-center gap-3 pb-6 border-b-2 border-yellow-500/30">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center">
              <Coins className="w-7 h-7 text-yellow-400" />
            </div>
            <h3 className="text-3xl font-black text-white uppercase">How Winnings Work</h3>
          </div>
          
          <div className="space-y-6 pt-6 text-gray-200 leading-relaxed">
            <p className="text-lg">
              Your payout is determined by your win chance percentage. The formula is simple: <strong className="text-white">Multiplier = 99 / Win Chance</strong>
            </p>
            
            <div className="bg-black/20 p-6 rounded-lg border-2 border-white/10">
              <h4 className="text-xl font-bold text-white mb-4">Payout Examples:</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { chance: '50%', multi: '1.98x', bet: '$10', win: '$19.80', risk: 'Low Risk', color: 'emerald' },
                  { chance: '25%', multi: '3.96x', bet: '$10', win: '$39.60', risk: 'Medium Risk', color: 'yellow' },
                  { chance: '10%', multi: '9.90x', bet: '$10', win: '$99.00', risk: 'High Risk', color: 'orange' },
                  { chance: '1%', multi: '99.00x', bet: '$10', win: '$990.00', risk: 'Very High Risk', color: 'red' }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-${item.color}-500/10 to-transparent border-2 border-${item.color}-500/30`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-${item.color}-500`} />
                      <div>
                        <p className="text-sm font-bold text-white">{item.chance} Win Chance</p>
                        <p className="text-xs text-gray-400">{item.risk}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-casino-brand">{item.multi}</p>
                      <p className="text-xs text-gray-400">{item.bet} → {item.win}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-yellow-500/5 p-5 rounded-lg border-2 border-yellow-500/30">
              <p className="text-sm text-yellow-400 font-semibold mb-2">Important Note:</p>
              <p className="text-sm text-gray-300">
                The house edge is built into the multiplier calculation (99 instead of 100). This ensures fair gameplay while keeping the casino sustainable. Always bet responsibly and never wager more than you can afford to lose.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Fairness */}
        <div className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] rounded-2xl border-2 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] p-8">
          <div className="flex items-center gap-3 pb-6 border-b-2 border-purple-500/30">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center">
              <Shield className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-3xl font-black text-white uppercase">Provably Fair System</h3>
          </div>
          
          <div className="space-y-6 pt-6 text-gray-200 leading-relaxed">
            <p className="text-lg">
              Every roll in our Dice game is <strong className="text-white">100% provably fair</strong>. This means you can independently verify that each result was truly random and not manipulated in any way.
            </p>
            
            <div className="bg-black/20 p-6 rounded-lg border-2 border-white/10">
              <h4 className="text-xl font-bold text-white mb-4">How It Works:</h4>
              <ul className="space-y-4 list-none">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-lg">Server Seed:</strong>
                    <p className="text-sm text-gray-300 mt-1">The casino generates a random server seed before each game session. This seed is hashed and shown to you, so we can't change it later.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-lg">Client Seed:</strong>
                    <p className="text-sm text-gray-300 mt-1">You can provide your own client seed (or use a randomly generated one). This ensures you have control over the randomness.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-lg">Nonce:</strong>
                    <p className="text-sm text-gray-300 mt-1">A counter that increases with each bet, ensuring every roll is unique even with the same seeds.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-lg">Verification:</strong>
                    <p className="text-sm text-gray-300 mt-1">After each roll, you can verify the result by combining the server seed, client seed, and nonce. The hash will match the pre-disclosed hash, proving fairness.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-casino-brand/5 p-5 rounded-lg border-2 border-casino-brand/30">
              <p className="text-base font-semibold text-casino-brand mb-3">Why This Matters:</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-casino-brand">✓</span>
                  <span><strong className="text-white">Cannot Be Rigged:</strong> The server seed is locked before you bet, so outcomes can't be manipulated.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-casino-brand">✓</span>
                  <span><strong className="text-white">Fully Transparent:</strong> All game results can be independently verified by anyone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-casino-brand">✓</span>
                  <span><strong className="text-white">Cryptographically Secure:</strong> Uses industry-standard hashing algorithms for maximum security.</span>
                </li>
              </ul>
            </div>
            
            <p className="text-sm text-gray-400 italic text-center pt-2">
              Click the "Provably Fair" button in the game controls to view your current seeds and verify your bets.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
