"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroSlide, FeaturedGame } from "@/types/dashboard";

interface HeroSectionProps {
  slides: HeroSlide[];
  featuredGames?: FeaturedGame[];
  className?: string;
}

// Helper to format match info for banner overlay
function getMatchOverlay(game: FeaturedGame): { title: string; subtitle: string; isLive: boolean } {
  const isLive = game.status === 'live';
  const homeScore = game.home.score !== null ? ` ${game.home.score}` : '';
  const awayScore = game.away.score !== null ? ` ${game.away.score}` : '';
  
  const title = `${game.home.name}${homeScore} vs ${game.away.name}${awayScore}`;
  
  let subtitle = '';
  if (isLive && game.period) {
    subtitle = `🔴 LIVE • ${game.league} • ${game.period}`;
  } else if (game.status === 'upcoming') {
    const date = new Date(game.startTime);
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    subtitle = `⏰ Starting at ${timeStr} • ${game.league}`;
  } else {
    subtitle = `${game.league}`;
  }
  
  return { title, subtitle, isLive };
}

export function HeroSection({ slides, featuredGames = [], className }: HeroSectionProps) {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Create dynamic slides: keep original images but update title/subtitle with current matches
  const dynamicSlides = useMemo(() => {
    // Get live games first, then upcoming games
    const liveGames = featuredGames.filter(g => g.status === 'live');
    const upcomingGames = featuredGames.filter(g => g.status === 'upcoming');
    const matchesToShow = [...liveGames, ...upcomingGames];

    // If we have matches, create slides with match info overlaid on banner images
    if (matchesToShow.length > 0) {
      return matchesToShow.slice(0, slides.length).map((game, index) => {
        const originalSlide = slides[index % slides.length];
        const overlay = getMatchOverlay(game);
        
        return {
          ...originalSlide,
          id: `match-${game.eventId}`,
          title: overlay.title,
          subtitle: overlay.subtitle,
          eventId: game.eventId,
          streamUrl: overlay.isLive ? originalSlide.streamUrl : null,
        };
      });
    }
    
    // Fallback to original slides if no matches
    return slides;
  }, [slides, featuredGames]);

  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % dynamicSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [dynamicSlides.length, isHovered]);

  const next = () => setCurrent((prev) => (prev + 1) % dynamicSlides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + dynamicSlides.length) % dynamicSlides.length);

  const currentSlide = dynamicSlides[current];

  return (
    <div 
      className={cn(
        "relative w-full overflow-hidden rounded-2xl shadow-2xl group border border-white/5",
        "h-full",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentSlide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/8] lg:aspect-auto lg:h-full"
        >
          <Image 
            src={currentSlide.image} 
            alt={currentSlide.title} 
            fill 
            className="object-cover"
            priority
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
          
          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="absolute inset-0 flex items-center px-6 sm:px-12 md:px-16"
          >
            <div className="max-w-2xl space-y-4 sm:space-y-5">
              {/* Live Badge */}
              {currentSlide.streamUrl && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold">
                    <Radio className="w-3 h-3 animate-pulse" />
                    LIVE
                  </span>
                </motion.div>
              )}

              {/* Headline */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase text-white tracking-wide drop-shadow-lg">
                {currentSlide.title}
              </h2>
              
              {/* Subtitle */}
              <p className="text-sm sm:text-base md:text-lg text-gray-300 font-medium">
                {currentSlide.subtitle}
              </p>
              
              {/* CTAs */}
              <div className="flex items-center gap-3 pt-2">
                <Link href="/sports">
                  <Button 
                    size="lg" 
                    className={cn(
                      "font-bold text-sm sm:text-base h-11 sm:h-12 px-6 sm:px-8",
                      "bg-gradient-to-r text-white shadow-lg",
                      "hover:scale-105 hover:shadow-xl transition-all duration-300",
                      currentSlide.color
                    )}
                  >
                    {currentSlide.cta}
                  </Button>
                </Link>
                
                {currentSlide.secondaryCta && (
                  <Link href="/sports">
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="font-bold text-sm sm:text-base h-11 sm:h-12 px-6 sm:px-8 border-white/20 hover:bg-white/10 hover:border-white/30"
                    >
                      {currentSlide.streamUrl && <Play className="w-4 h-4 mr-2" />}
                      {currentSlide.secondaryCta}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 border border-white/10"
        onClick={prev}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button 
        variant="ghost" 
        size="icon" 
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 border border-white/10"
        onClick={next}
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {dynamicSlides.map((_, i) => (
          <button 
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              current === i 
                ? "bg-casino-brand w-8 shadow-[0_0_10px_#00ffa3]" 
                : "bg-white/30 w-2 hover:bg-white/50"
            )}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
