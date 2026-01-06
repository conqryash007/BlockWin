"use client";

import { UserInsights, TrendingLeague } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Trophy, 
  ArrowRight,
  Flame 
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface InsightsCardsProps {
  insights: UserInsights;
  trendingLeagues: TrendingLeague[];
  className?: string;
}

export function InsightsCards({ insights, trendingLeagues, className }: InsightsCardsProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {/* Daily Snapshot */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-casino-card to-black border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-casino-brand/10">
            <Target className="w-4 h-4 text-casino-brand" />
          </div>
          <h4 className="font-bold text-white text-sm">Today's Snapshot</h4>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Bets Placed</span>
            <span className="font-bold text-white">{insights.todayBets}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Win Rate</span>
            <span className="font-bold text-casino-brand">{insights.winRate}%</span>
          </div>
          
          <div className="pt-3 border-t border-white/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Est. Return</span>
              <span className={cn(
                "font-bold text-lg",
                insights.profitLoss >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {insights.profitLoss >= 0 ? '+' : ''}₹{insights.estReturn.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-500">+{insights.profitLoss.toLocaleString()}</span>
              <span>today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Leagues */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-casino-card to-black border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <h4 className="font-bold text-white text-sm">Trending Leagues</h4>
        </div>
        
        <div className="space-y-3">
          {trendingLeagues.map((league, index) => (
            <Link 
              key={league.id}
              href={`/sports/${league.id}`}
              className="flex items-center justify-between group hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{league.icon}</span>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-casino-brand transition-colors">
                    {league.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {league.eventCount} events
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded",
                  index === 0 && "bg-yellow-500/20 text-yellow-500",
                  index === 1 && "bg-gray-400/20 text-gray-400",
                  index === 2 && "bg-orange-500/20 text-orange-600"
                )}>
                  #{index + 1}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Promotions CTA */}
      <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-purple-500/20 via-casino-card to-black border border-purple-500/20">
        {/* Background decoration */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Trophy className="w-4 h-4 text-purple-400" />
            </div>
            <h4 className="font-bold text-white text-sm">Weekly Bonus</h4>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Get 10% cashback on all sports bets this week. No max limit!
          </p>
          
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-400">10%</span>
              <span className="text-sm text-muted-foreground">Cashback</span>
            </div>
            
            <Link href="/promotions">
              <Button 
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold"
              >
                Claim Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
