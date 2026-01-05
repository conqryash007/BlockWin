"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Coins, Shield, TrendingUp, CheckCircle2, Info } from "lucide-react";

export function PlinkoGuideModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          variant="casino"
          className="px-8 py-6 text-lg font-black uppercase tracking-wider shadow-[0_0_25px_rgba(0,212,139,0.4)] hover:shadow-[0_0_40px_rgba(0,212,139,0.6)] transition-all"
        >
          <Info className="w-6 h-6 mr-2" />
          How to Play & Win
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-casino-panel border-2 border-casino-brand/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black text-white uppercase tracking-wider flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-casino-brand" />
            Plinko Game Guide
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 pt-4">
          
          {/* Section 1: How to Play */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-casino-brand/30">
              <div className="w-10 h-10 rounded-lg bg-casino-brand/10 border-2 border-casino-brand/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-casino-brand" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase">How to Play</h3>
            </div>
            
            <div className="space-y-4 text-gray-200 leading-relaxed">
              <p>
                Plinko is an exciting game of chance where you drop a ball through a pyramid of pegs. Watch as it bounces unpredictably before landing in one of the multiplier buckets at the bottom!
              </p>
              
              <div className="bg-black/20 p-4 rounded-lg border-2 border-white/10">
                <h4 className="text-lg font-bold text-white mb-3">Game Mechanics:</h4>
                <ul className="space-y-2 list-none">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-casino-brand shrink-0 mt-0.5" />
                    <span><strong className="text-white">Choose Your Bet Amount:</strong> Select how much you want to wager on each drop.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-casino-brand shrink-0 mt-0.5" />
                    <span><strong className="text-white">Click Drop Ball:</strong> Launch the ball from the top of the Plinko board.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-casino-brand shrink-0 mt-0.5" />
                    <span><strong className="text-white">Watch It Bounce:</strong> The ball randomly bounces left or right off each peg as it falls.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-casino-brand shrink-0 mt-0.5" />
                    <span><strong className="text-white">Land in a Bucket:</strong> Your payout is determined by which multiplier bucket the ball lands in.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-casino-brand shrink-0 mt-0.5" />
                    <span><strong className="text-white">Win or Break Even:</strong> Center buckets have higher multipliers but are harder to hit!</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-casino-brand/5 p-4 rounded-lg border-2 border-casino-brand/30">
                <h4 className="text-lg font-bold text-casino-brand mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Strategy Tips:
                </h4>
                <ul className="space-y-1 text-sm">
                  <li>• <strong>Center = High Risk, High Reward:</strong> The 10x multiplier is rare but offers massive payouts.</li>
                  <li>• <strong>Edges = Lower Multipliers:</strong> The outer buckets (0.5x-1x) are easier to hit but offer lower returns.</li>
                  <li>• <strong>Pure Randomness:</strong> Each drop is independent and truly random—past results don't affect future drops.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: Winnings */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-yellow-500/30">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center">
                <Coins className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase">How Winnings Work</h3>
            </div>
            
            <div className="space-y-4 text-gray-200 leading-relaxed">
              <p>
                Your payout depends entirely on which bucket the ball lands in. The multipliers are: <strong className="text-white">0.5x, 1x, 2x, 5x, 10x, 5x, 2x, 1x, 0.5x</strong>
              </p>
              
              <div className="bg-black/20 p-4 rounded-lg border-2 border-white/10">
                <h4 className="text-lg font-bold text-white mb-3">Payout Examples:</h4>
                <div className="space-y-3">
                  {[
                    { bucket: 'Center (10x)', bet: '$10', win: '$100.00', chance: '~1%', color: 'yellow' },
                    { bucket: 'Near Center (5x)', bet: '$10', win: '$50.00', chance: '~10%', color: 'emerald' },
                    { bucket: 'Mid Range (2x)', bet: '$10', win: '$20.00', chance: '~25%', color: 'blue' },
                    { bucket: 'Outer (1x)', bet: '$10', win: '$10.00', chance: '~30%', color: 'gray' },
                    { bucket: 'Edge (0.5x)', bet: '$10', win: '$5.00', chance: '~34%', color: 'red' }
                  ].map((item, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-${item.color}-500/10 to-transparent border-2 border-${item.color}-500/30`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full bg-${item.color}-500`} />
                        <div>
                          <p className="text-sm font-bold text-white">{item.bucket}</p>
                          <p className="text-xs text-gray-400">{item.chance} chance</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-casino-brand">{item.win}</p>
                        <p className="text-xs text-gray-400">{item.bet} bet</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-yellow-500/5 p-4 rounded-lg border-2 border-yellow-500/30">
                <p className="text-sm text-yellow-400 font-semibold mb-2">Important Note:</p>
                <p className="text-sm text-gray-300">
                  Plinko is a game of pure chance. While the center buckets offer huge multipliers, they are statistically rare. Play responsibly and never bet more than you can afford to lose.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Fairness */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-500/30">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase">Provably Fair System</h3>
            </div>
            
            <div className="space-y-4 text-gray-200 leading-relaxed">
              <p>
                Every drop in Plinko is <strong className="text-white">100% provably fair</strong>. You can independently verify that each result was truly random and not manipulated.
              </p>
              
              <div className="bg-black/20 p-4 rounded-lg border-2 border-white/10">
                <h4 className="text-lg font-bold text-white mb-3">How It Works:</h4>
                <ul className="space-y-3 list-none">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Server Seed:</strong>
                      <p className="text-sm text-gray-300 mt-1">A random seed generated before each session, hashed and shown to you so it can't be changed.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Client Seed:</strong>
                      <p className="text-sm text-gray-300 mt-1">You can provide your own seed or use a randomly generated one for added control.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Nonce:</strong>
                      <p className="text-sm text-gray-300 mt-1">A counter ensuring every drop is unique, even with the same seeds.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Verification:</strong>
                      <p className="text-sm text-gray-300 mt-1">After each drop, verify the result using the seeds and nonce to confirm fairness.</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="bg-casino-brand/5 p-4 rounded-lg border-2 border-casino-brand/30">
                <p className="text-sm font-semibold text-casino-brand mb-2">Why This Matters:</p>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>✓ <strong className="text-white">Cannot Be Rigged:</strong> Seeds are locked before you bet, preventing manipulation.</li>
                  <li>✓ <strong className="text-white">Fully Transparent:</strong> All results can be verified independently by anyone.</li>
                  <li>✓ <strong className="text-white">Cryptographically Secure:</strong> Uses industry-standard hashing for maximum security.</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-400 italic text-center pt-2">
                Click the "Provably Fair" button in the game controls to view your current seeds and verify your drops.
              </p>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
