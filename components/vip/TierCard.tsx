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
        "relative flex flex-col items-center p-6 rounded-3xl border transition-all duration-500 group h-full justify-between",
        "bg-casino-card border-white/5 hover:border-casino-brand/50 shadow-2xl",
        isPopular ? "bg-casino-card border-casino-brand shadow-[0_0_30px_-10px_rgba(0,255,163,0.3)]" : "hover:bg-[#15181e]",
        className
      )}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-5 bg-casino-brand text-black text-xs font-black uppercase py-2 px-6 rounded-full shadow-[0_0_20px_rgba(0,255,163,0.5)] tracking-widest z-10">
          Most Popular
        </div>
      )}

      {/* Glow Effect */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-b from-casino-brand/5 to-transparent transition-opacity duration-500 rounded-3xl pointer-events-none",
        isPopular ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )} />

      {/* Basic content container for z-index */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Fixed Header Content */}
        <div className="flex flex-col items-center flex-shrink-0">
          {/* Icon */}
          <div className="relative w-24 h-24 mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            <div className={cn(
              "absolute inset-0 bg-casino-brand/20 blur-2xl rounded-full transition-opacity duration-500",
              isPopular ? "opacity-80" : "opacity-0 group-hover:opacity-60"
            )} />
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
            <span className="text-5xl font-black text-white tracking-tight">
              {price}
            </span>
            <span className="text-gray-500 text-sm font-medium block mt-2 uppercase tracking-wide">/ one-time</span>
          </div>

          {/* Buy Button */}
          <Button 
            className={cn(
              "w-full mb-6 font-bold text-lg h-14 rounded-xl transition-all duration-300",
              isPopular 
                ? "bg-casino-brand text-black hover:bg-[#00e390] hover:scale-[1.02] shadow-[0_0_20px_-5px_var(--primary)]" 
                : "bg-[#1F2937] text-white hover:bg-[#2a3749] hover:text-white border border-transparent hover:border-white/10"
            )}
            onClick={onBuy}
          >
            Buy Pass
          </Button>
        </div>

        {/* Scrollable Benefits List */}
        <div className="w-full flex-1 overflow-y-auto pr-2 space-y-4 pt-4 border-t border-white/5 text-left custom-scrollbar">
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.05);
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.3);
            }
          `}</style>
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-4 group/item">
              <div className={cn(
                "mt-0.5 min-w-[20px] h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                isPopular 
                  ? "bg-casino-brand/20 text-casino-brand" 
                  : "bg-[#1F2937] text-gray-400 group-hover/item:text-casino-brand group-hover/item:bg-casino-brand/10"
              )}>
                <Check size={12} strokeWidth={4} />
              </div>
              <span className="text-sm font-medium text-gray-400 group-hover/item:text-white transition-colors leading-tight">
                {benefit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
