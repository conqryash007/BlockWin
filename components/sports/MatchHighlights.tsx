"use client";

import { useState } from "react";
import { useMatchVideos } from "@/hooks/useScorebatVideos";
import { VideoPlayer } from "./VideoPlayer";
import { getVideoType, formatMatchDate } from "@/lib/scorebatApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Video, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  ExternalLink 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchHighlightsProps {
  homeTeam: string;
  awayTeam: string;
  className?: string;
  defaultExpanded?: boolean;
}

/**
 * Match Highlights component for event detail page
 * Shows video highlights for a specific match if available
 */
export function MatchHighlights({
  homeTeam,
  awayTeam,
  className,
  defaultExpanded = true,
}: MatchHighlightsProps) {
  const { matchVideos, isLoading, error } = useMatchVideos(homeTeam, awayTeam);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);

  // Don't render anything while loading or if there's an error
  if (isLoading) {
    return (
      <div className={cn("bg-white/5 rounded-xl border border-white/10 p-4", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Looking for video highlights...</span>
        </div>
      </div>
    );
  }

  // No videos found - show subtle message
  if (!matchVideos || matchVideos.videos.length === 0) {
    return (
      <div className={cn("bg-white/5 rounded-xl border border-white/10 p-4", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Video className="w-4 h-4" />
          <span className="text-sm">No video highlights available for this match</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white/5 rounded-xl border border-white/10 overflow-hidden", className)}>
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-casino-brand/20 flex items-center justify-center">
            <Video className="w-5 h-5 text-casino-brand" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-semibold">Match Highlights</h3>
            <p className="text-muted-foreground text-sm">
              {matchVideos.videos.length} video{matchVideos.videos.length > 1 ? 's' : ''} available
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-casino-brand/50 text-casino-brand">
            {matchVideos.competition}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Selected video player */}
          {selectedVideoIndex !== null && (
            <div className="space-y-2">
              <VideoPlayer
                embedHtml={matchVideos.videos[selectedVideoIndex].embed}
                title={matchVideos.videos[selectedVideoIndex].title}
                autoPlay={true}
                showControls={true}
                onClose={() => setSelectedVideoIndex(null)}
              />
              <div className="flex items-center justify-between">
                <p className="text-white text-sm font-medium">
                  {matchVideos.videos[selectedVideoIndex].title}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVideoIndex(null)}
                  className="text-muted-foreground"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Video list */}
          {selectedVideoIndex === null && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {matchVideos.videos.map((video, index) => {
                const videoType = getVideoType(video.title);
                
                return (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideoIndex(index)}
                    className="group relative rounded-lg overflow-hidden bg-black/50 aspect-video hover:ring-2 hover:ring-casino-brand/50 transition-all"
                  >
                    {/* Thumbnail placeholder (using match thumbnail) */}
                    <img
                      src={matchVideos.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Play icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-casino-brand transition-colors">
                        <Play className="w-4 h-4 text-white group-hover:text-black ml-0.5" fill="currentColor" />
                      </div>
                    </div>

                    {/* Type badge */}
                    <Badge
                      className={cn(
                        "absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0",
                        videoType === 'goal' 
                          ? "bg-green-500/90" 
                          : videoType === 'live'
                            ? "bg-red-500/90"
                            : "bg-blue-500/90"
                      )}
                    >
                      {videoType === 'goal' ? 'Goal' : videoType === 'live' ? 'Live' : 'Highlights'}
                    </Badge>

                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-xs font-medium line-clamp-1">{video.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* View on ScoreBat link */}
          <div className="pt-2 border-t border-white/10">
            <a
              href={matchVideos.matchviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-casino-brand text-sm transition-colors"
            >
              <span>View on ScoreBat</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for sidebars or smaller spaces
 */
interface CompactMatchHighlightsProps {
  homeTeam: string;
  awayTeam: string;
  className?: string;
}

export function CompactMatchHighlights({
  homeTeam,
  awayTeam,
  className,
}: CompactMatchHighlightsProps) {
  const { matchVideos, isLoading } = useMatchVideos(homeTeam, awayTeam);
  const [showVideo, setShowVideo] = useState(false);

  if (isLoading || !matchVideos || matchVideos.videos.length === 0) {
    return null;
  }

  const firstVideo = matchVideos.videos[0];

  if (showVideo) {
    return (
      <div className={cn("space-y-2", className)}>
        <VideoPlayer
          embedHtml={firstVideo.embed}
          title={firstVideo.title}
          autoPlay={true}
          onClose={() => setShowVideo(false)}
        />
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowVideo(true)}
      className={cn("gap-2 border-casino-brand/50 text-casino-brand hover:bg-casino-brand/10", className)}
    >
      <Play className="w-4 h-4" />
      Watch Highlights
    </Button>
  );
}
