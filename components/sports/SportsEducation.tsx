"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Coins, 
  Shield, 
  TrendingUp, 
  CheckCircle2, 
  Radio,
  Calculator,
  Layers,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const EDUCATION_ACCORDION_KEY = "sports_education_open";

export function SportsEducation() {
  const [isOpen, setIsOpen] = useState(true);

  // Load accordion state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(EDUCATION_ACCORDION_KEY);
    if (stored !== null) {
      setIsOpen(stored === "true");
    }
  }, []);

  // Save accordion state to localStorage
  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem(EDUCATION_ACCORDION_KEY, String(newState));
  };

  return (
    <div className="relative py-16 px-4 max-w-[1440px] mx-auto">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <Sparkles className="absolute top-10 left-10 w-24 h-24 text-casino-brand/30 animate-pulse" style={{ animationDuration: '3s' }} />
        <Sparkles className="absolute bottom-20 right-20 w-32 h-32 text-casino-brand/20 animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      {/* Section Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-casino-brand/10 border border-casino-brand/30 shadow-[0_0_20px_rgba(0,255,163,0.2)] mb-6">
          <Sparkles className="w-5 h-5 text-casino-brand" />
          <span className="text-base font-bold text-casino-brand uppercase tracking-wide">Learn & Win</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">How to Play & Place a Bet</h2>
        <p className="text-base text-gray-300 max-w-2xl mx-auto mb-6">
          Master sports betting with our simple guide. From understanding odds to placing winning bets!
        </p>
        
        {/* Accordion Toggle */}
        <Button
          variant="ghost"
          onClick={toggleOpen}
          className="text-casino-brand hover:text-casino-brand/80 hover:bg-casino-brand/10"
        >
          {isOpen ? (
            <>
              <ChevronUp className="w-5 h-5 mr-2" />
              Hide Guide
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5 mr-2" />
              Show Guide
            </>
          )}
        </Button>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-top-4 duration-500">
          
          {/* Section 1: What is a Bet? */}
          <div className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] rounded-2xl border-2 border-casino-brand/20 shadow-[0_0_15px_rgba(0,255,163,0.15)] p-8">
            <div className="flex items-center gap-3 pb-6 border-b-2 border-casino-brand/30">
              <div className="w-12 h-12 rounded-lg bg-casino-brand/10 border-2 border-casino-brand/30 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-casino-brand" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white uppercase">What is a Bet?</h3>
            </div>
            
            <div className="space-y-6 pt-6 text-gray-200 leading-relaxed">
              <p className="text-lg">
                A bet is a prediction on the outcome of a sporting event. You stake money on your prediction, and if you're correct, you win based on the odds!
              </p>
              
              <div className="bg-black/20 p-6 rounded-lg border-2 border-white/10">
                <h4 className="text-xl font-bold text-white mb-4">Main Betting Markets:</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-casino-brand/10 to-transparent border border-casino-brand/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-casino-brand" />
                      <span className="font-bold text-white">Match Winner (H2H)</span>
                    </div>
                    <p className="text-sm text-gray-400">Pick who wins the match</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-5 h-5 text-blue-400" />
                      <span className="font-bold text-white">Totals (Over/Under)</span>
                    </div>
                    <p className="text-sm text-gray-400">Predict total goals/points</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-5 h-5 text-purple-400" />
                      <span className="font-bold text-white">Spread (Handicap)</span>
                    </div>
                    <p className="text-sm text-gray-400">Bet with point advantages</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Step-by-Step Guide */}
          <div className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] rounded-2xl border-2 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.15)] p-8">
            <div className="flex items-center gap-3 pb-6 border-b-2 border-yellow-500/30">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center">
                <Coins className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white uppercase">Step-by-Step Guide</h3>
            </div>
            
            <div className="space-y-6 pt-6 text-gray-200 leading-relaxed">
              {/* Steps */}
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: "Choose a Market",
                    desc: "Select the type of bet you want to place (H2H, Totals, or Spread)",
                    example: "Example: H2H - Arsenal to win",
                  },
                  {
                    step: 2,
                    title: "Select Odds",
                    desc: "Click on the odds button to add your selection to the bet slip",
                    example: "Click on odds '2.45' to select Arsenal",
                  },
                  {
                    step: 3,
                    title: "Enter Your Stake",
                    desc: "Type how much you want to bet or use quick stake buttons",
                    example: null,
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 border-2 border-yellow-500/40 flex items-center justify-center shrink-0">
                      <span className="text-yellow-400 font-bold">{item.step}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-lg">{item.title}</h4>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                      {item.example && (
                        <p className="text-xs text-casino-brand mt-1">💡 {item.example}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculation Example Box */}
              <div className="bg-casino-brand/5 p-6 rounded-lg border-2 border-casino-brand/30">
                <h4 className="text-lg font-bold text-casino-brand mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Example Calculation:
                </h4>
                <div className="bg-black/30 p-4 rounded-lg font-mono text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Stake:</span>
                    <span className="text-white">$100</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Odds:</span>
                    <span className="text-white">1.85</span>
                  </div>
                  <div className="h-px bg-white/20 my-3" />
                  <div className="flex justify-between">
                    <span className="text-white font-bold">Potential Return:</span>
                    <span className="text-casino-brand font-bold text-lg">$185.00</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Formula: Stake × Odds = Return</p>
                </div>
              </div>

              {/* Step 4: Single vs Parlay */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 border-2 border-yellow-500/40 flex items-center justify-center shrink-0">
                  <span className="text-yellow-400 font-bold">4</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-lg">Single vs Parlay</h4>
                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <h5 className="font-bold text-white mb-2">Single Bet</h5>
                      <p className="text-sm text-gray-400">One selection per bet. Lower risk, consistent returns.</p>
                      <p className="text-xs text-casino-brand mt-2">$100 @ 1.85 = $185</p>
                    </div>
                    <div className="p-4 rounded-lg bg-casino-brand/5 border border-casino-brand/30">
                      <h5 className="font-bold text-white mb-2">Parlay Bet</h5>
                      <p className="text-sm text-gray-400">Multiple selections combined. Higher risk, bigger wins!</p>
                      <p className="text-xs text-casino-brand mt-2">$100 @ (1.85 × 2.10) = $388.50</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5: Place Bet */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 border-2 border-yellow-500/40 flex items-center justify-center shrink-0">
                  <span className="text-yellow-400 font-bold">5</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-lg">Place Your Bet</h4>
                  <p className="text-gray-400 text-sm">Click the "Place Bet" button to confirm. You'll see a success message when your bet is submitted.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Live Betting Notes */}
          <div className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] rounded-2xl border-2 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)] p-8">
            <div className="flex items-center gap-3 pb-6 border-b-2 border-orange-500/30">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 border-2 border-orange-500/30 flex items-center justify-center">
                <Radio className="w-7 h-7 text-orange-400" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white uppercase">Live Betting Notes</h3>
            </div>
            
            <div className="space-y-4 pt-6">
              <ul className="space-y-3">
                {[
                  { icon: TrendingUp, text: "Odds change frequently during live matches based on game events" },
                  { icon: AlertCircle, text: "You may be asked to accept updated odds if they change while betting" },
                  { icon: Radio, text: "Live scores update every 20-30 seconds for real-time info" },
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <item.icon className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <span className="text-gray-300">{item.text}</span>
                  </li>
                ))}
              </ul>
              
              <div className="bg-orange-500/5 p-4 rounded-lg border border-orange-500/30 mt-4">
                <p className="text-sm text-orange-400">
                  <strong>Tip:</strong> Keep an eye on the bet slip for odds change notifications. Accept new odds to continue with your bet.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Important Notes */}
          <div className="bg-gradient-to-br from-[#1a1c24] to-[#0f1115] rounded-2xl border-2 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] p-8">
            <div className="flex items-center gap-3 pb-6 border-b-2 border-purple-500/30">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center">
                <Shield className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white uppercase">Important Notes</h3>
            </div>
            
            <div className="space-y-4 pt-6">
              <ul className="space-y-3">
                {[
                  "Odds shown are sourced from licensed bookmakers via The Odds API",
                  "Bet settlements and payouts are handled server-side (not implemented in this demo)",
                  "Always check your selections and stake before placing a bet",
                  "Past performance does not guarantee future results",
                ].map((text, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <span className="text-gray-300">{text}</span>
                  </li>
                ))}
              </ul>
              
              <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/30 mt-4">
                <p className="text-sm text-purple-400 font-semibold mb-2">🔞 Responsible Gambling</p>
                <p className="text-sm text-gray-400">
                  Gambling should be entertaining, not a way to make money. Only bet what you can afford to lose. If gambling becomes a problem, seek help.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
