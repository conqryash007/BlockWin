"use client";

import { useState, useEffect, useMemo } from "react";
import { searchTeam, TeamImageData } from "@/lib/theSportsDbApi";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface TeamLogoProps {
  teamName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallback?: boolean;
}

const SIZE_MAP = {
  sm: { container: "w-6 h-6", text: "text-xs", icon: "w-3 h-3" },
  md: { container: "w-8 h-8", text: "text-sm", icon: "w-4 h-4" },
  lg: { container: "w-12 h-12", text: "text-xl", icon: "w-5 h-5" },
  xl: { container: "w-20 h-20", text: "text-3xl", icon: "w-8 h-8" },
};

/**
 * Get team initials for fallback display
 */
function getTeamInitials(name: string): string {
  if (!name) return "?";
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * TeamLogo Component
 * 
 * Displays team logo with fallback hierarchy:
 * 1. TheSportsDB API image
 * 2. Team initials placeholder with loading spinner
 */
export function TeamLogo({
  teamName,
  size = "md",
  className,
  showFallback = true,
}: TeamLogoProps) {
  const [mounted, setMounted] = useState(false);
  const [imageData, setImageData] = useState<TeamImageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const sizeClasses = SIZE_MAP[size];
  const initials = useMemo(() => getTeamInitials(teamName), [teamName]);

  // Handle mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only fetch after component is mounted on client
    if (!mounted) return;
    
    let isMounted = true;

    async function fetchLogo() {
      if (!teamName) {
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        const data = await searchTeam(teamName);
        if (isMounted) {
          setImageData(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`[TeamLogo] Error fetching ${teamName}:`, error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    fetchLogo();

    return () => {
      isMounted = false;
    };
  }, [teamName, mounted]);

  // Get the best available image URL
  const imageUrl = imageData?.badge || imageData?.logo || null;

  // Show loading spinner while fetching
  if (mounted && isLoading) {
    return (
      <div
        className={cn(
          sizeClasses.container,
          "rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0",
          className
        )}
        aria-label={`Loading ${teamName} logo`}
      >
        <Loader2 className={cn(sizeClasses.icon, "animate-spin text-casino-brand")} />
      </div>
    );
  }

  // Show image if available
  if (mounted && imageUrl && !hasError) {
    return (
      <div
        className={cn(
          sizeClasses.container,
          "rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0",
          className
        )}
      >
        <img
          src={imageUrl}
          alt={`${teamName} logo`}
          className="w-full h-full object-contain p-0.5"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Show fallback (initials)
  if (showFallback) {
    return (
      <div
        className={cn(
          sizeClasses.container,
          sizeClasses.text,
          "rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white shrink-0",
          className
        )}
        aria-label={`${teamName} logo`}
      >
        {initials}
      </div>
    );
  }

  return null;
}

/**
 * Hook for prefetching team logos
 * Useful for MainEventsStrip to prefetch visible cards
 */
export function usePrefetchTeamLogos(teamNames: string[]) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only prefetch on client
    if (!mounted) return;
    if (!teamNames || teamNames.length === 0) return;

    // Prefetch in background
    const uniqueNames = Array.from(new Set(teamNames));
    uniqueNames.forEach((name) => {
      searchTeam(name).catch(() => {
        // Silently fail - caching will handle this
      });
    });
  }, [teamNames, mounted]);
}
