"use client";

import { QuickCta } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface ShortcutsGridProps {
  ctas: QuickCta[];
  className?: string;
}

const BADGE_COLORS: Record<string, string> = {
  LIVE: "bg-red-500/90 text-white",
  HOT: "bg-orange-500/90 text-white",
  VIP: "bg-yellow-500/90 text-black",
  NEW: "bg-casino-brand/90 text-black",
};

export function ShortcutsGrid({ ctas, className }: ShortcutsGridProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", className)}>
      {ctas.map((cta, index) => (
        <motion.div
          key={cta.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <Link href={cta.slug}>
            <div className="group relative overflow-hidden rounded-xl aspect-[16/9] cursor-pointer">
              {/* Background Image */}
              <Image
                src={cta.image}
                alt={cta.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              {/* Badge */}
              {cta.badge && (
                <div className={cn(
                  "absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                  BADGE_COLORS[cta.badge] || "bg-white/20 text-white"
                )}>
                  {cta.badge}
                </div>
              )}
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h4 className="text-lg font-bold text-white mb-1 group-hover:text-casino-brand transition-colors">
                  {cta.title}
                </h4>
                <p className="text-sm text-gray-300 mb-2">
                  {cta.subtitle}
                </p>
                <div className="flex items-center text-casino-brand text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-0 border border-casino-brand/30 rounded-xl" />
                <div className="absolute inset-0 bg-casino-brand/5" />
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
