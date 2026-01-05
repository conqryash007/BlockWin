"use client";

import { useState, useEffect, useMemo } from "react";
import { searchTeam, TeamImageData } from "@/lib/theSportsDbApi";
import { cn } from "@/lib/utils";

interface TeamLogoProps {
  teamName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showFallback?: boolean;
}

const SIZE_MAP = {
  sm: { container: "w-6 h-6", text: "text-xs" },
  md: { container: "w-8 h-8", text: "text-sm" },
  lg: { container: "w-12 h-12", text: "text-xl" },
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
 * 1. Cached image
 * 2. TheSportsDB API image
 * 3. Team initials placeholder
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
        console.log(`[TeamLogo] Fetching logo for: ${teamName}`);
        const data = await searchTeam(teamName);
        console.log(`[TeamLogo] Result for ${teamName}:`, data);
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

  // Always show fallback (initials) during SSR and initial load for consistent hydration
  // This is the "base" state that matches on both server and client
  const showInitials = !mounted || isLoading || !imageUrl || hasError;

  if (showInitials) {
    if (!showFallback) return null;
    
    return (
      <div
        className={cn(
          sizeClasses.container,
          sizeClasses.text,
          "rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white shrink-0",
          // Only animate when actually loading on client
          mounted && isLoading && "animate-pulse",
          className
        )}
        aria-label={`${teamName} logo`}
      >
        {initials}
      </div>
    );
  }

  // Show image if available (only on client after mount)
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
    const uniqueNames = [...new Set(teamNames)];
    uniqueNames.forEach((name) => {
      searchTeam(name).catch(() => {
        // Silently fail - caching will handle this
      });
    });
  }, [teamNames, mounted]);
}
