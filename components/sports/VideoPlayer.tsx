"use client";

import { useState } from "react";
import { X, Maximize2, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { extractIframeSrc } from "@/lib/scorebatApi";

interface VideoPlayerProps {
  embedHtml: string;
  title?: string;
  thumbnail?: string;
  className?: string;
  autoPlay?: boolean;
  onClose?: () => void;
  showControls?: boolean;
}

/**
 * Video player component for ScoreBat embedded videos
 * Renders the video iframe with optional thumbnail preview
 */
export function VideoPlayer({
  embedHtml,
  title,
  thumbnail,
  className,
  autoPlay = false,
  onClose,
  showControls = true,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const iframeSrc = extractIframeSrc(embedHtml);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Title */}
        {title && (
          <div className="absolute top-4 left-4 z-10">
            <h3 className="text-white text-lg font-semibold">{title}</h3>
          </div>
        )}

        {/* Video iframe */}
        <div className="w-full h-full max-w-[90vw] max-h-[90vh] aspect-video">
          {iframeSrc && (
            <iframe
              src={iframeSrc}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; fullscreen"
              onLoad={handleLoad}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full rounded-xl overflow-hidden bg-black",
        "aspect-video",
        className
      )}
    >
      {!isPlaying && thumbnail ? (
        // Thumbnail preview with play button
        <div className="relative w-full h-full group cursor-pointer" onClick={handlePlay}>
          {/* Thumbnail image */}
          <img
            src={thumbnail}
            alt={title || "Video thumbnail"}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-casino-brand/90 flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-casino-brand/30">
              <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
            </div>
          </div>

          {/* Title overlay */}
          {title && (
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white font-medium text-sm line-clamp-2">{title}</p>
            </div>
          )}
        </div>
      ) : (
        // Video iframe
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-casino-bg/80">
              <Loader2 className="w-8 h-8 animate-spin text-casino-brand" />
            </div>
          )}
          
          {iframeSrc && (
            <iframe
              src={iframeSrc}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; fullscreen"
              onLoad={handleLoad}
            />
          )}

          {/* Controls overlay */}
          {showControls && (
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Compact video thumbnail card for grids and carousels
 */
interface VideoThumbnailProps {
  thumbnail: string;
  title: string;
  duration?: string;
  type?: 'highlight' | 'goal' | 'live' | 'other';
  onClick?: () => void;
  className?: string;
}

export function VideoThumbnail({
  thumbnail,
  title,
  duration,
  type = 'highlight',
  onClick,
  className,
}: VideoThumbnailProps) {
  const typeLabel = {
    highlight: 'Highlights',
    goal: 'Goal',
    live: 'Live',
    other: 'Video',
  };

  const typeColor = {
    highlight: 'bg-blue-500',
    goal: 'bg-green-500',
    live: 'bg-red-500',
    other: 'bg-gray-500',
  };

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden cursor-pointer group",
        "transition-transform hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-video relative">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
        
        {/* Play icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-casino-brand/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Type badge */}
        <span className={cn(
          "absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium text-white",
          typeColor[type]
        )}>
          {typeLabel[type]}
        </span>

        {/* Duration */}
        {duration && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-xs text-white">
            {duration}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white text-sm font-medium line-clamp-1">{title}</p>
      </div>
    </div>
  );
}
