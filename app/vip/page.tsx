"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { TierCard } from "@/components/vip/TierCard";
import { BenefitCard } from "@/components/vip/BenefitCard";
import { 
  Trophy, 
  Zap, 
  Gift, 
  Crown, 
  Headphones, 
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQItem } from "@/components/vip/FAQItem";
import { PromoCarousel } from "@/components/vip/PromoCarousel";
import { cn } from "@/lib/utils";

const VIP_PASSES = [
  {
    level: "Bronze",
    price: "$49",
    iconPath: "/assets/vip/vip_badge_bronze.png",
    benefits: [
      "Access to Bronze Tournaments",
      "5% Weekly Rakeback",
      "Bronze Level Chat Badge",
      "24/7 Standard Support"
    ],
  },
  {
    level: "Silver",
    price: "$149",
    iconPath: "/assets/vip/vip_badge_silver.png",
    benefits: [
      "All Bronze Benefits",
      "8% Weekly Rakeback",
      "Monthly Bonus Access",
      "Silver Level Chat Badge",
    ],
  },
  {
    level: "Gold",
    price: "$499",
    iconPath: "/assets/vip/vip_badge_gold.png",
    isPopular: true,
    benefits: [
      "All Silver Benefits",
      "12% Weekly Rakeback",
      "Weekly Reload Bonuses",
      "Gold Level Chat Badge",
      "Priority Withdrawals"
    ],
  },
  {
    level: "Platinum",
    price: "$1,499",
    iconPath: "/assets/vip/vip_badge_platinum.png",
    benefits: [
      "All Gold Benefits",
      "15% Weekly Rakeback",
      "Dedicated VIP Host",
      "Daily Surprise Bonuses",
      "Exclusive Platinum Events"
    ],
  },
  {
    level: "Diamond",
    price: "$4,999",
    iconPath: "/assets/vip/vip_badge_diamond.png",
    benefits: [
      "All Platinum Benefits",
      "20% Weekly Rakeback",
      "Custom Luxury Gifts",
      "Direct Line to Management",
      "Highest Betting Limits",
      "Invites to World Tours"
    ],
  },
];

const BENEFITS = [
  {
    title: "Instant Rakeback",
    description: "Get a percentage of the house edge back instantly on every bet you place.",
    icon: Trophy,
  },
  {
    title: "Weekly Boost",
    description: "Kickstart your week with a calculated bonus based on your recent activity activity.",
    icon: Zap,
  },
  {
    title: "Exclusive Events",
    description: "Access high-stakes tournaments and private parties reserved for VIP holders.",
    icon: Crown,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function VIPPage() {
  const handleBuy = (level: string) => {
    console.log(`Buying ${level} pass`);
    // Implement buy logic here
  };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative min-h-[850px] w-full flex items-center justify-center overflow-hidden pt-20 pb-48">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <Image
              src="/assets/vip/vip_hero_background.png"
              alt="VIP Club"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 to-background" />
          </motion.div>
        
          {/* Floating Particles/Elements (Simulated) */}
          <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-casino-brand/5 border border-casino-brand/20 rounded-full backdrop-blur-md">
              <Crown size={16} className="text-casino-brand" />
              <span className="text-casino-brand uppercase tracking-widest text-xs font-bold">
                Premium Membership
              </span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black text-white mb-6 uppercase tracking-tighter shadow-xl">
              Unlock the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-casino-brand via-white to-casino-accent animate-shimmer bg-[length:200%_auto]">
                VIP Experience
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Purchase your VIP Pass today to instantly access exclusive rewards, personal support, and higher limits.
            </p>
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
               <Button 
                size="lg" 
                className="bg-casino-brand text-black hover:bg-casino-brand/90 text-xl px-10 py-8 font-bold rounded-full shadow-[0_0_40px_-10px_var(--primary)] relative z-20"
                onClick={() => document.getElementById('vip-passes')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Choose Your Pass
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Featured Promotions Carousel */}
      <div className="container mx-auto px-4 -mt-32 relative z-30 mb-20">
        <PromoCarousel />
      </div>

      {/* Benefits Section - Animated */}
      <div className="container mx-auto px-4 relative z-20 mb-32">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {BENEFITS.map((benefit, index) => (
            <motion.div key={index} variants={itemVariants}>
              <BenefitCard {...benefit} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div id="vip-passes" className="container mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black text-white mb-6 uppercase"
          >
            Select Your Pass
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            One-time payment for lifetime benefits. Upgrade at any time by paying the difference.
          </motion.p>
        </div>
        
        <div className="flex flex-col xl:flex-row items-center justify-center gap-6 xl:gap-0 max-w-7xl mx-auto xl:h-[700px]">
          {VIP_PASSES.map((pass, index) => {
            // Logic for visual hierarchy (Podium effect)
            let scaleClass = "scale-100 z-0";
            let heightClass = "h-auto xl:h-[500px]";
            let opacityClass = "opacity-80 hover:opacity-100";
            
            // Middle (Gold)
            if (index === 2) {
              scaleClass = "xl:scale-110 z-20 shadow-2xl";
              heightClass = "h-auto xl:h-[560px]";
              opacityClass = "opacity-100";
            } 
            // Neighbors (Silver, Platinum)
            else if (index === 1 || index === 3) {
              scaleClass = "xl:scale-105 z-10";
              heightClass = "h-auto xl:h-[530px]";
              opacityClass = "opacity-90 hover:opacity-100";
            }
            // Ends (Bronze, Diamond) - default

            return (
              <motion.div 
                key={index} 
                className={cn(
                  "w-full max-w-sm xl:max-w-none transition-all duration-500",
                  scaleClass,
                  opacityClass
                )}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <TierCard 
                  {...pass} 
                  className={heightClass}
                  onBuy={() => handleBuy(pass.level)}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-20 bg-black/20 mt-20">
        <h2 className="text-3xl font-bold text-white mb-12 text-center uppercase tracking-wider">Common Questions</h2>
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {[
            {
              question: "Is this a monthly subscription?",
              answer: "No, all VIP Passes are a one-time purchase. Once you buy a pass, you keep the benefits for the lifetime of your account."
            },
            {
              question: "Can I upgrade my pass later?",
              answer: "Absolutely. If you want to move from Silver to Gold, you only pay the price difference between the two passes."
            },
            {
              question: "When do I get my Rakeback?",
              answer: "Rakeback is available to claim instantly after every bet. Weekly and monthly bonuses are distributed automatically."
            },
            {
              question: "Is the VIP status transferable?",
              answer: "VIP statuses are linked to your account and cannot be transferred to another player."
            }
          ].map((faq, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <FAQItem {...faq} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
