"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const BANNER_height = "h-[400px]";

interface PromoSlide {
  id: number;
  imagePath: string;
  title: string;
  subtitle: string;
  ctaText: string;
}

const SLIDES: PromoSlide[] = [
  {
    id: 1,
    imagePath: "/assets/vip/vip_banner_tournament.png",
    title: "$1,000,000 High Roller Race",
    subtitle: "Compete against the best. Top 10 players share the massive prize pool this month.",
    ctaText: "Join Race",
  },
  {
    id: 2,
    imagePath: "/assets/vip/vip_banner_luxury.png",
    title: "Luxury Lifestyle Rewards",
    subtitle: "From private yachts to Rolex watches. Your points unlock real-world luxury.",
    ctaText: "View Catalog",
  },
  {
    id: 3,
    imagePath: "/assets/vip/vip_banner_supercar.png",
    title: "Win a 2024 Supercar",
    subtitle: "Every Diamond Tier ticket earns you an entry into our annual supercar giveaway.",
    ctaText: "Get Tickets",
  },
];

export function PromoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(timer);
  }, [currentIndex]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  return (
    <div className={`relative w-full ${BANNER_height} overflow-hidden rounded-3xl border border-white/10 shadow-2xl group`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="absolute inset-0 bg-gray-900">
             <Image
              src={SLIDES[currentIndex].imagePath}
              alt={SLIDES[currentIndex].title}
              fill
              className="object-cover opacity-80"
              priority
            />
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent" />
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-center px-12 md:px-20 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest text-black bg-casino-brand rounded-full uppercase">
                Exclusive Event
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight uppercase">
                {SLIDES[currentIndex].title}
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {SLIDES[currentIndex].subtitle}
              </p>
              <Button size="lg" className="bg-white text-black hover:bg-gray-200 font-bold px-8">
                {SLIDES[currentIndex].ctaText}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons (Visible on Hover) */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 backdrop-blur-sm"
      >
        <ChevronLeft size={24} />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 backdrop-blur-sm"
      >
        <ChevronRight size={24} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? "w-8 bg-casino-brand" : "w-2 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
