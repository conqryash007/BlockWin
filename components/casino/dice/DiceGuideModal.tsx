"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Dice1, Coins, Shield, TrendingUp, CheckCircle2, Info } from "lucide-react";

export function DiceGuideModal() {
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
            <Dice1 className="w-8 h-8 text-casino-brand" />
            Dice Game Guide
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 pt-4">
          
          {/* Section 1: How to Play */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-casino-brand/30">
              <div className="w-10 h-10 rounded-lg bg-casino-brand/10 border-2 border-casino-brand/30 flex items-center justify-center">
                <Dice1 className="w-6 h-6 text-casino-brand" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase">How to Play</h3>
            </div>
            
            <div className="space-y-4 text-gray-200 leading-relaxed">
              <p>
                The Dice game is a simple yet exciting game of chance where you predict whether a randomly generated number will fall within your chosen range.
              </p>
              
              <div className="bg-black/20 p-4 rounded-lg border-2 border-white/10">
                <h4 className="text-lg font-bold text-white mb-3">Game Mechanics:</h4>
                <ul className="space-y-2 list-none">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-casino-brand shrink-0 mt-0.5" />
                    <span><strong className="text-white">Choose Your Bet Amount:</strong> Select how much you want to wager on each roll.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-casino-brand shrink-0 mt-0.5" />
                    <span><strong className="text-white">Set Your Target:</strong> Use the slider to choose a target number between 1 and 98.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-casino-brand shrink-0 mt-0.5" />
                    <span><strong className="text-white">Pick Roll Over or Roll Under:</strong> Decide if you want the result to be over or under your target number.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-casino-brand shrink-0 mt-0.5" />
                    <span><strong className="text-white">Place Your Bet:</strong> Click the "Bet" button to roll the dice.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-casino-brand shrink-0 mt-0.5" />
                    <span><strong className="text-white">Win or Lose:</strong> If the rolled number falls in your predicted range, you win!</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-casino-brand/5 p-4 rounded-lg border-2 border-casino-brand/30">
                <h4 className="text-lg font-bold text-casino-brand mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Strategy Tips:
                </h4>
                <ul className="space-y-1 text-sm">
                  <li>• <strong>Higher Win Chance = Lower Multiplier:</strong> Setting a target closer to 50 gives you better odds but smaller payouts.</li>
                  <li>• <strong>Lower Win Chance = Higher Multiplier:</strong> Setting extreme targets (close to 0 or 100) offers huge payouts but lower odds.</li>
                  <li>• <strong>Balance Risk and Reward:</strong> Find your sweet spot between safety and potential profit.</li>
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
                Your payout is determined by your win chance percentage. The formula is simple: <strong className="text-white">Multiplier = 99 / Win Chance</strong>
              </p>
              
              <div className="bg-black/20 p-4 rounded-lg border-2 border-white/10">
                <h4 className="text-lg font-bold text-white mb-3">Payout Examples:</h4>
                <div className="space-y-3">
                  {[
                    { chance: '50%', multi: '1.98x', bet: '$10', win: '$19.80', risk: 'Low Risk', color: 'emerald' },
                    { chance: '25%', multi: '3.96x', bet: '$10', win: '$39.60', risk: 'Medium Risk', color: 'yellow' },
                    { chance: '10%', multi: '9.90x', bet: '$10', win: '$99.00', risk: 'High Risk', color: 'orange' },
                    { chance: '1%', multi: '99.00x', bet: '$10', win: '$990.00', risk: 'Very High Risk', color: 'red' }
                  ].map((item, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-${item.color}-500/10 to-transparent border-2 border-${item.color}-500/30`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full bg-${item.color}-500`} />
                        <div>
                          <p className="text-sm font-bold text-white">{item.chance} Win Chance</p>
                          <p className="text-xs text-gray-400">{item.risk}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-casino-brand">{item.multi}</p>
                        <p className="text-xs text-gray-400">{item.bet} → {item.win}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-yellow-500/5 p-4 rounded-lg border-2 border-yellow-500/30">
                <p className="text-sm text-yellow-400 font-semibold mb-2">Important Note:</p>
                <p className="text-sm text-gray-300">
                  The house edge is built into the multiplier calculation (99 instead of 100). This ensures fair gameplay while keeping the casino sustainable. Always bet responsibly and never wager more than you can afford to lose.
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
                Every roll in our Dice game is <strong className="text-white">100% provably fair</strong>. This means you can independently verify that each result was truly random and not manipulated in any way.
              </p>
              
              <div className="bg-black/20 p-4 rounded-lg border-2 border-white/10">
                <h4 className="text-lg font-bold text-white mb-3">How It Works:</h4>
                <ul className="space-y-3 list-none">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Server Seed:</strong>
                      <p className="text-sm text-gray-300 mt-1">The casino generates a random server seed before each game session. This seed is hashed and shown to you, so we can't change it later.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Client Seed:</strong>
                      <p className="text-sm text-gray-300 mt-1">You can provide your own client seed (or use a randomly generated one). This ensures you have control over the randomness.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Nonce:</strong>
                      <p className="text-sm text-gray-300 mt-1">A counter that increases with each bet, ensuring every roll is unique even with the same seeds.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Verification:</strong>
                      <p className="text-sm text-gray-300 mt-1">After each roll, you can verify the result by combining the server seed, client seed, and nonce. The hash will match the pre-disclosed hash, proving fairness.</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="bg-casino-brand/5 p-4 rounded-lg border-2 border-casino-brand/30">
                <p className="text-sm font-semibold text-casino-brand mb-2">Why This Matters:</p>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>✓ <strong className="text-white">Cannot Be Rigged:</strong> The server seed is locked before you bet, so outcomes can't be manipulated.</li>
                  <li>✓ <strong className="text-white">Fully Transparent:</strong> All game results can be independently verified by anyone.</li>
                  <li>✓ <strong className="text-white">Cryptographically Secure:</strong> Uses industry-standard hashing algorithms for maximum security.</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-400 italic text-center pt-2">
                Click the "Provably Fair" button in the game controls to view your current seeds and verify your bets.
              </p>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
