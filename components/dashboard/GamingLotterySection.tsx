"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Ticket, 
  Trophy, 
  Sparkles,
  ArrowRight,
  Zap,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";

const GAMING_ITEMS = [
  {
    id: "dice",
    title: "Dice",
    description: "Roll & multiply your wins",
    image: "/images/dice.png",
    href: "/casino/dice",
    color: "from-blue-500 to-cyan-400",
    shadowColor: "shadow-blue-500/30",
    badge: "HOT",
  },
  {
    id: "crash",
    title: "Crash",
    description: "Ride the multiplier wave",
    image: "/images/crash.png",
    href: "/casino/crash",
    color: "from-red-500 to-orange-400",
    shadowColor: "shadow-red-500/30",
    badge: "LIVE",
  },
  {
    id: "plinko",
    title: "Plinko",
    description: "Drop & win big prizes",
    image: "/images/plinko.png",
    href: "/casino/plinko",
    color: "from-purple-500 to-pink-400",
    shadowColor: "shadow-purple-500/30",
  },
  {
    id: "mines",
    title: "Mines",
    description: "Uncover gems, avoid mines",
    image: "/images/mines.png",
    href: "/casino/mines",
    color: "from-yellow-500 to-amber-400",
    shadowColor: "shadow-yellow-500/30",
    badge: "NEW",
  },
];

const LOTTERY_ITEMS = [
  {
    id: "daily-jackpot",
    title: "Daily Jackpot",
    prize: "₹5,00,000",
    description: "Draw in 4h 32m",
    icon: Trophy,
    href: "/lottery/daily-jackpot",
    color: "from-casino-brand to-emerald-400",
  },
  {
    id: "mega-draw",
    title: "Mega Weekly Draw",
    prize: "₹25,00,000",
    description: "Every Sunday 8 PM",
    icon: Gift,
    href: "/lottery/mega-draw",
    color: "from-amber-500 to-yellow-300",
  },
];

interface GamingLotterySectionProps {
  className?: string;
}

const BADGE_STYLES: Record<string, string> = {
  HOT: "bg-orange-500 text-white",
  LIVE: "bg-red-500 text-white animate-pulse",
  NEW: "bg-casino-brand text-black",
};

export function GamingLotterySection({ className }: GamingLotterySectionProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Gaming Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-casino-brand" />
            <h3 className="text-lg font-bold text-white">Quick Games</h3>
          </div>
          <Link href="/casino" className="text-sm text-muted-foreground hover:text-casino-brand transition-colors flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GAMING_ITEMS.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Link href={game.href}>
                <div className={cn(
                  "group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 aspect-[4/5]",
                  "bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10",
                  "hover:border-white/20 hover:shadow-lg",
                  game.shadowColor && `hover:${game.shadowColor}`
                )}>
                  {/* Background Image */}
                  <Image
                    src={game.image}
                    alt={game.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  
                  {/* Badge */}
                  {game.badge && (
                    <div className={cn(
                      "absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider z-10",
                      BADGE_STYLES[game.badge]
                    )}>
                      {game.badge}
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <h4 className="text-base font-bold text-white mb-1 group-hover:text-casino-brand transition-colors">
                      {game.title}
                    </h4>
                    <p className="text-xs text-gray-300 line-clamp-1">
                      {game.description}
                    </p>
                  </div>
                  
                  {/* Play Hover Indicator */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="w-12 h-12 rounded-full bg-casino-brand/90 flex items-center justify-center shadow-lg shadow-casino-brand/50">
                      <Zap className="w-6 h-6 text-black" />
                    </div>
                  </div>
                  
                  {/* Hover Glow */}
                  <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                    "border-2 border-casino-brand/50"
                  )} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Lottery Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-bold text-white">Lottery & Jackpots</h3>
          </div>
          <Link href="/lottery" className="text-sm text-muted-foreground hover:text-yellow-400 transition-colors flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LOTTERY_ITEMS.map((lottery, index) => (
            <motion.div
              key={lottery.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.4, duration: 0.3 }}
            >
              <Link href={lottery.href}>
                <div className={cn(
                  "group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300",
                  "bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10",
                  "hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/10"
                )}>
                  {/* Gradient Background */}
                  <div className={cn(
                    "absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity",
                    `bg-gradient-to-r ${lottery.color}`
                  )} />
                  
                  <div className="relative p-5 flex items-center gap-4">
                    {/* Icon */}
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                      `bg-gradient-to-br ${lottery.color}`,
                      "group-hover:scale-110 group-hover:shadow-lg"
                    )}>
                      <lottery.icon className="w-7 h-7 text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                        {lottery.title}
                      </h4>
                      <div className="text-xl font-black bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">
                        {lottery.prize}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lottery.description}
                      </p>
                    </div>
                    
                    {/* CTA */}
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-bold hover:shadow-lg hover:shadow-yellow-500/30 transition-all flex-shrink-0"
                    >
                      Enter Now
                    </Button>
                  </div>
                  
                  {/* Animated Shine */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
