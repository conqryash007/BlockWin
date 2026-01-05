"use client";

import { useState, useEffect, ReactNode } from "react";
import { getLeagueImages, LeagueImageData } from "@/lib/theSportsDbApi";
import { extractSportName } from "@/lib/teamNameNormalizer";
import { cn } from "@/lib/utils";

interface LeagueBannerProps {
  leagueName: string;
  sportKey: string;
  children?: ReactNode;
  className?: string;
  height?: "sm" | "md" | "lg" | "full";
  overlay?: boolean;
}

const HEIGHT_MAP = {
  sm: "min-h-[120px]",
  md: "min-h-[180px]",
  lg: "min-h-[240px]",
  full: "min-h-full",
};

/**
 * LeagueBanner Component
 * 
 * Displays a league banner background with:
 * 1. TheSportsDB league fanart
 * 2. Gradient fallback using casino theme colors
 */
export function LeagueBanner({
  leagueName,
  sportKey,
  children,
  className,
  height = "md",
  overlay = true,
}: LeagueBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [imageData, setImageData] = useState<LeagueImageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Handle mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only fetch after component is mounted on client
    if (!mounted) return;
    
    let isMounted = true;

    async function fetchBanner() {
      if (!leagueName || !sportKey) {
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        const sportName = extractSportName(sportKey);
        const data = await getLeagueImages(leagueName, sportName);
        if (isMounted) {
          setImageData(data);
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    fetchBanner();

    return () => {
      isMounted = false;
    };
  }, [leagueName, sportKey, mounted]);

  const bannerUrl = imageData?.fanart || null;
  // Only show image after mount and when we have data
  const hasImage = mounted && bannerUrl && !hasError;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        HEIGHT_MAP[height],
        className
      )}
    >
      {/* Background Image or Gradient */}
      {hasImage ? (
        <>
          <img
            src={bannerUrl}
            alt={`${leagueName} banner`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={() => setHasError(true)}
          />
          {/* Dark overlay for readability */}
          {overlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-casino-bg via-casino-bg/70 to-transparent" />
          )}
        </>
      ) : (
        // Gradient fallback - always shown during SSR and initial load
        <div
          className={cn(
            "absolute inset-0",
            "bg-gradient-to-br from-casino-card via-casino-bg to-casino-accent/20"
          )}
        >
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,255,163,0.3),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(124,58,237,0.2),transparent_50%)]" />
          </div>
        </div>
      )}

      {/* Loading shimmer - only on client */}
      {mounted && isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      )}

      {/* Content */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

/**
 * Simple LeagueBadge component for inline usage
 */
interface LeagueBadgeProps {
  leagueName: string;
  sportKey: string;
  size?: "sm" | "md";
  className?: string;
}

export function LeagueBadge({
  leagueName,
  sportKey,
  size = "sm",
  className,
}: LeagueBadgeProps) {
  const [mounted, setMounted] = useState(false);
  const [imageData, setImageData] = useState<LeagueImageData | null>(null);
  const [hasError, setHasError] = useState(false);

  const sizeClass = size === "sm" ? "h-4 w-auto" : "h-6 w-auto";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    let isMounted = true;

    async function fetchBadge() {
      if (!leagueName || !sportKey) return;

      try {
        const sportName = extractSportName(sportKey);
        const data = await getLeagueImages(leagueName, sportName);
        if (isMounted) {
          setImageData(data);
        }
      } catch {
        // Silently fail
      }
    }

    fetchBadge();
    return () => {
      isMounted = false;
    };
  }, [leagueName, sportKey, mounted]);

  const badgeUrl = imageData?.badge || imageData?.logo || null;

  // Don't render anything during SSR or if no badge
  if (!mounted || !badgeUrl || hasError) {
    return null;
  }

  return (
    <img
      src={badgeUrl}
      alt={`${leagueName} badge`}
      className={cn(sizeClass, "object-contain", className)}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}
