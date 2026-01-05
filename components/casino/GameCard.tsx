"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface GameCardProps {
  id: string;
  name: string;
  provider: string;
  image: string;
  rtp?: number;
  category?: string;
}

// Games that have dedicated pages under /casino/
const ORIGINALS_GAMES = ["crash"];

export function GameCard({ id, name, provider, image, rtp, category }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Route originals games to /casino/, others to /game/
  const href = ORIGINALS_GAMES.includes(id) ? `/casino/${id}` : `/game/${id}`;

  return (
    <Link href={href}>
      <Card
        className="group relative overflow-hidden border-0 bg-casino-card transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(0,255,163,0.3)]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Neon Border Gradient */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-casino-brand/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="aspect-[3/4] relative w-full overflow-hidden rounded-lg z-10">
          {/* Mock Image Placeholder since we don't have real images */}
          <Image
            src={image}
            alt={name}
            fill
            className={cn(
              "object-contain bg-black transition-transform duration-700 ease-out",
              isHovered ? "scale-110 blur-sm" : "scale-100"
            )}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          {/* Hover Overlay */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center transition-all duration-300",
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90"
            )}
          >
            <div className="rounded-full bg-casino-brand p-4 shadow-[0_0_20px_#00ffa3] text-black mb-2 animate-bounce">
              <Play className="h-8 w-8 ml-1 fill-black" />
            </div>
            <span className="font-bold text-casino-brand text-lg drop-shadow-[0_0_5px_rgba(0,255,163,0.8)]">PLAY NOW</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-transform duration-300 group-hover:translate-y-1">
             <h3 className="font-bold text-white truncate shadow-black drop-shadow-md text-lg group-hover:text-casino-brand transition-colors">{name}</h3>
             <p className="text-xs text-gray-400 group-hover:text-white transition-colors">{provider}</p>
          </div>

          {rtp && (
             <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-[10px] h-5 border-white/10 group-hover:border-casino-brand/50 transition-colors">
                    RTP {rtp}%
                </Badge>
             </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
