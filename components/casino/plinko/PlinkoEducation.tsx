"use client";

import { Sparkles, Coins, Shield, TrendingUp, CheckCircle2 } from "lucide-react";
import { PlinkoGuideModal } from "./PlinkoGuideModal";

export function PlinkoEducation() {
  return (
    <div className="relative py-16 px-4 max-w-[1440px] mx-auto">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <Sparkles className="absolute top-10 left-10 w-24 h-24 text-casino-brand/30 animate-pulse" style={{ animationDuration: '3s' }} />
        <Sparkles className="absolute bottom-20 right-20 w-32 h-32 text-casino-brand/20 animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      {/* Section Header */}
      <div className="text-center mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-casino-brand/10 border border-casino-brand/30 shadow-[0_0_20px_rgba(0,255,163,0.2)] mb-6">
          <Sparkles className="w-5 h-5 text-casino-brand" />
          <span className="text-base font-bold text-casino-brand uppercase tracking-wide">Learn & Win</span>
        </div>
        <h2 className="text-5xl md:text-6xl font-black text-white mb-4">How to Play & Win</h2>
        <p className="text-base text-gray-300 max-w-2xl mx-auto mb-8">
          Drop the ball, watch it bounce, and win big! Everything you need to know about Plinko.
        </p>
        <PlinkoGuideModal />
      </div>

      {/* Content Sections */}
      <div className="space-y-12 relative z-10">
        
        {/* Section 1: How to Play */}
        <div className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] rounded-2xl border-2 border-casino-brand/20 shadow-[0_0_15px_rgba(0,255,163,0.15)] p-8">
          <div className="flex items-center gap-3 pb-6 border-b-2 border-casino-brand/30">
            <div className="w-12 h-12 rounded-lg bg-casino-brand/10 border-2 border-casino-brand/30 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-casino-brand" />
            </div>
            <h3 className="text-3xl font-black text-white uppercase">How to Play</h3>
          </div>
          
          <div className="space-y-6 pt-6 text-gray-200 leading-relaxed">
            <p className="text-lg">
              Plinko is a thrilling game of chance where you drop a ball through a pyramid of pegs. The ball bounces unpredictably before landing in one of nine multiplier buckets at the bottom!
            </p>
            
            <div className="bg-black/20 p-6 rounded-lg border-2 border-white/10">
              <h4 className="text-xl font-bold text-white mb-4">Game Mechanics:</h4>
              <ul className="space-y-3 list-none">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-casino-brand shrink-0 mt-0.5" />
                  <span><strong className="text-white">Choose Your Bet Amount:</strong> Select how much you want to wager on each drop.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-casino-brand shrink-0 mt-0.5" />
                  <span><strong className="text-white">Click Drop Ball:</strong> Launch the ball from the top of the Plinko board.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-casino-brand shrink-0 mt-0.5" />
                  <span><strong className="text-white">Watch It Bounce:</strong> The ball randomly bounces left or right off each peg as it descends.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-casino-brand shrink-0 mt-0.5" />
                  <span><strong className="text-white">Land in a Bucket:</strong> Your payout is determined by which multiplier bucket the ball lands in.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-casino-brand shrink-0 mt-0.5" />
                  <span><strong className="text-white">Win Big or Break Even:</strong> Center buckets offer higher multipliers but are statistically harder to hit!</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-casino-brand/5 p-5 rounded-lg border-2 border-casino-brand/30">
              <h4 className="text-lg font-bold text-casino-brand mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Strategy Tips:
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>High Risk, High Reward:</strong> The 10x center bucket is rare but offers massive payouts when hit.</li>
                <li>• <strong>Edge Buckets Are Safer:</strong> Outer buckets (0.5x-1x) are hit more frequently but return less profit.</li>
                <li>• <strong>True Randomness:</strong> Each drop is completely independent—past results have no impact on future drops.</li>
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
              Your payout depends on which bucket the ball lands in. The multipliers from left to right are: <strong className="text-white">0.5x, 1x, 2x, 5x, 10x, 5x, 2x, 1x, 0.5x</strong>
            </p>
            
            <div className="bg-black/20 p-6 rounded-lg border-2 border-white/10">
              <h4 className="text-xl font-bold text-white mb-4">Payout Examples:</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { bucket: 'Center (10x)', bet: '$10', win: '$100.00', chance: '~1% chance', color: 'yellow' },
                  { bucket: 'Near Center (5x)', bet: '$10', win: '$50.00', chance: '~10% chance', color: 'emerald' },
                  { bucket: 'Mid Range (2x)', bet: '$10', win: '$20.00', chance: '~25% chance', color: 'blue' },
                  { bucket: 'Outer (1x)', bet: '$10', win: '$10.00', chance: '~30% chance', color: 'gray' },
                  { bucket: 'Edge (0.5x)', bet: '$20', win: '$10.00', chance: '~34% chance', color: 'red' }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-${item.color}-500/10 to-transparent border-2 border-${item.color}-500/30`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-${item.color}-500`} />
                      <div>
                        <p className="text-sm font-bold text-white">{item.bucket}</p>
                        <p className="text-xs text-gray-400">{item.chance}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-casino-brand">{item.win}</p>
                      <p className="text-xs text-gray-400">{item.bet} bet</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-yellow-500/5 p-5 rounded-lg border-2 border-yellow-500/30">
              <p className="text-sm text-yellow-400 font-semibold mb-2">Important Note:</p>
              <p className="text-sm text-gray-300">
                Plinko is a game of pure chance. The center buckets offer high multipliers but are statistically rare. Always bet responsibly and never wager more than you can afford to lose.
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
              Every drop in Plinko is <strong className="text-white">100% provably fair</strong>. You can independently verify that each result was truly random and not manipulated in any way.
            </p>
            
            <div className="bg-black/20 p-6 rounded-lg border-2 border-white/10">
              <h4 className="text-xl font-bold text-white mb-4">How It Works:</h4>
              <ul className="space-y-4 list-none">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-lg">Server Seed:</strong>
                    <p className="text-sm text-gray-300 mt-1">A random seed generated before each session, hashed and shown to you so it can't be changed later.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-lg">Client Seed:</strong>
                    <p className="text-sm text-gray-300 mt-1">You can provide your own client seed or use a randomly generated one for added control over randomness.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-lg">Nonce:</strong>
                    <p className="text-sm text-gray-300 mt-1">A counter that increases with each drop, ensuring every result is unique even with the same seeds.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-lg">Verification:</strong>
                    <p className="text-sm text-gray-300 mt-1">After each drop, verify the result by combining the seeds and nonce. The hash will match the pre-disclosed hash, proving fairness.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-casino-brand/5 p-5 rounded-lg border-2 border-casino-brand/30">
              <p className="text-base font-semibold text-casino-brand mb-3">Why This Matters:</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-casino-brand">✓</span>
                  <span><strong className="text-white">Cannot Be Rigged:</strong> Seeds are locked before you bet, so outcomes can't be manipulated.</span>
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
              Click the "Provably Fair" button in the game controls to view your current seeds and verify your drops.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
