"use client";

import { FeaturedGame } from "@/types/dashboard";
import { FeaturedGameCard } from "./FeaturedGameCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FeaturedGamesCarouselProps {
  games: FeaturedGame[];
  className?: string;
}

export function FeaturedGamesCarousel({ games, className }: FeaturedGamesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <section className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded bg-casino-brand" />
          <h3 className="font-bold text-white uppercase tracking-wider text-sm">
            Featured Events
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-casino-brand/20 text-casino-brand text-xs font-bold">
            {games.filter(g => g.status === 'live').length} LIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Scroll buttons - desktop only */}
          <div className="hidden md:flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full bg-white/5 hover:bg-white/10",
                !canScrollLeft && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full bg-white/5 hover:bg-white/10",
                !canScrollRight && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Link href="/sports">
            <Button variant="link" className="text-xs text-muted-foreground hover:text-casino-brand">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative group -mx-2">
        <ScrollArea className="w-full overflow-visible">
          <div 
            ref={scrollRef}
            className="flex gap-4 py-3 px-2"
            onScroll={checkScroll}
          >
            {games.map((game) => (
              <FeaturedGameCard key={game.eventId} game={game} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>
      </div>
    </section>
  );
}
