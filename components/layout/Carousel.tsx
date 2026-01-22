"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BANNERS = [
  {
    id: 1,
    image: "/images/banner_welcome.png",
    title: "Welcome Bonus",
    subtitle: "Get 300% up to $5,000",
    cta: "Claim Now",
    color: "from-green-500 to-emerald-700",
    link: "/sports", // Link to sports page
  },
  {
    id: 2,
    image: "/images/banner_vip.png",
    title: "VIP Club",
    subtitle: "Weekly Cashback & Rewards",
    cta: "Join VIP",
    color: "from-yellow-500 to-amber-700",
    link: "/sports", // Link to sports page
  },
  {
    id: 3,
    image: "/images/banner_sports.png",
    title: "Live Sports",
    subtitle: "Best Odds on Premier League",
    cta: "Bet Now",
    color: "from-blue-500 to-indigo-700",
    link: "/sports", // Link to sports page
  },
];

export function Carousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % BANNERS.length);
  const prev = () => setCurrent((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl group border border-white/5">
      <div 
        className="flex transition-transform duration-700 ease-in-out" 
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {BANNERS.map((banner) => (
          <div key={banner.id} className="relative w-full flex-shrink-0 aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/8] lg:aspect-[16/5]">
             <Image 
                src={banner.image} 
                alt={banner.title} 
                fill 
                className="object-cover"
                priority={banner.id === 1}
             />
             <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent flex items-center px-6 sm:px-12 md:px-20">
                 <div className="max-w-2xl space-y-4 sm:space-y-6 animate-in slide-in-from-left-10 fade-in duration-700">
                     <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase italic text-white tracking-widest drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] text-shadow-neon">
                        {banner.title}
                     </h2>
                     <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-gray-200 font-bold bg-black/40 p-2 rounded-lg backdrop-blur-sm inline-block">
                        {banner.subtitle}
                     </p>
                     <div>
                        <Link href={banner.link}>
                          <Button size="lg" className={cn(
                              "font-bold text-sm sm:text-lg h-10 sm:h-14 px-6 sm:px-10 shadow-[0_0_20px_rgba(0,0,0,0.5)] border-0 transform transition-transform hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]", 
                              "bg-gradient-to-r text-white",
                              banner.color
                          )}>
                              {banner.cta}
                          </Button>
                        </Link>
                     </div>
                 </div>
             </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity h-12 w-12 border border-white/10"
        onClick={prev}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>

      <Button 
        variant="ghost" 
        size="icon" 
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity h-12 w-12 border border-white/10"
        onClick={next}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {BANNERS.map((_, i) => (
            <button 
                key={i}
                className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    current === i ? "bg-casino-brand w-8 shadow-[0_0_10px_#00ffa3]" : "bg-white/30 w-2 hover:bg-white/50"
                )}
                onClick={() => setCurrent(i)}
            />
        ))}
      </div>
    </div>
  );
}
