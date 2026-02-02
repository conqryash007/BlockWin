import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface TierCardProps {
  level: string;
  price: string;
  benefits: string[];
  iconPath: string;
  isPopular?: boolean;
  onBuy?: () => void;
  className?: string; // Add className prop
}

export function TierCard({ level, price, benefits, iconPath, isPopular, onBuy, className }: TierCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center p-6 rounded-2xl border transition-all duration-500 group h-full justify-between",
        "bg-casino-card/40 border-casino-border hover:border-casino-brand/50",
        isPopular ? "bg-casino-card border-casino-brand shadow-neon" : "hover:bg-casino-card",
        className
      )}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 bg-gradient-to-r from-casino-brand to-casino-accent text-black text-xs font-extrabold uppercase py-1 px-4 rounded-full shadow-lg tracking-wider">
          Most Popular
        </div>
      )}

      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-casino-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

      {/* Icon */}
      <div className="relative w-28 h-28 mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
        <div className="absolute inset-0 bg-casino-brand/20 blur-2xl rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
        <Image
          src={iconPath}
          alt={`${level} Tier`}
          fill
          className="object-contain drop-shadow-2xl"
        />
      </div>

      {/* Level Name */}
      <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">
        {level}
      </h3>

      {/* Price */}
      <div className="mb-6 text-center">
        <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          {price}
        </span>
        <span className="text-muted-foreground text-sm block mt-1">/ one-time</span>
      </div>

      {/* Buy Button */}
      <Button 
        className={cn(
          "w-full mb-8 font-bold text-lg h-12 transition-all duration-300",
          isPopular 
            ? "bg-casino-brand text-black hover:bg-casino-brand/80 shadow-[0_0_20px_-5px_var(--primary)] hover:shadow-[0_0_30px_-5px_var(--primary)]" 
            : "bg-white/10 text-white hover:bg-white/20 border border-white/5"
        )}
        onClick={onBuy}
      >
        Buy Pass
      </Button>

      {/* Benefits List */}
      <div className="w-full space-y-3 pt-6 border-t border-white/5">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-start gap-3 text-sm text-gray-300 group/item">
            <div className="mt-0.5 p-0.5 rounded-full bg-casino-brand/10 text-casino-brand group-hover/item:bg-casino-brand group-hover/item:text-black transition-colors">
              <Check size={12} strokeWidth={3} />
            </div>
            <span className="group-hover/item:text-white transition-colors">{benefit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
