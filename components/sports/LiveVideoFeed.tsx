"use client";

import { useState } from "react";
import { useFeaturedVideos } from "@/hooks/useScorebatVideos";
import { VideoPlayer, VideoThumbnail } from "./VideoPlayer";
import { ScorebatMatch, getVideoType, formatMatchDate } from "@/lib/scorebatApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Loader2, 
  Video,
  X 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveVideoFeedProps {
  title?: string;
  limit?: number;
  className?: string;
  showRefresh?: boolean;
}

/**
 * Live Video Feed component for displaying football highlights
 * Shows a horizontal scrollable list of video thumbnails
 */
export function LiveVideoFeed({
  title = "Latest Football Highlights",
  limit = 8,
  className,
  showRefresh = true,
}: LiveVideoFeedProps) {
  const { featuredVideos, isLoading, error, refetch } = useFeaturedVideos(limit);
  const [selectedVideo, setSelectedVideo] = useState<ScorebatMatch | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleVideoClick = (video: ScorebatMatch) => {
    setSelectedVideo(video);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  const scrollLeft = () => {
    const container = document.getElementById('video-feed-container');
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' });
      setScrollPosition(container.scrollLeft - 300);
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('video-feed-container');
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' });
      setScrollPosition(container.scrollLeft + 300);
    }
  };

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-casino-brand" />
            {title}
          </h2>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
          <p className="text-muted-foreground mb-4">Unable to load video highlights</p>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Video className="w-5 h-5 text-casino-brand" />
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
              className="text-muted-foreground hover:text-white"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          )}
          {/* Navigation arrows for larger screens */}
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollLeft}
              className="w-8 h-8 text-muted-foreground hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollRight}
              className="w-8 h-8 text-muted-foreground hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Video feed container */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-casino-brand" />
        </div>
      ) : featuredVideos.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
          <Video className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-muted-foreground">No video highlights available</p>
        </div>
      ) : (
        <div className="relative">
          <div
            id="video-feed-container"
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featuredVideos.map((video, index) => (
              <VideoCard
                key={`${video.title}-${index}`}
                video={video}
                onClick={() => handleVideoClick(video)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && selectedVideo.videos.length > 0 && (
        <VideoModal video={selectedVideo} onClose={handleCloseVideo} />
      )}
    </div>
  );
}

/**
 * Individual video card in the feed
 */
interface VideoCardProps {
  video: ScorebatMatch;
  onClick: () => void;
}

function VideoCard({ video, onClick }: VideoCardProps) {
  const firstVideo = video.videos[0];
  const videoType = firstVideo ? getVideoType(firstVideo.title) : 'highlight';

  return (
    <div
      className="flex-shrink-0 w-[280px] cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10 transition-all hover:border-casino-brand/50 hover:shadow-lg hover:shadow-casino-brand/10">
        {/* Thumbnail */}
        <div className="aspect-video relative">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-casino-brand/90 flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-black ml-1" fill="currentColor" />
            </div>
          </div>

          {/* Video type badge */}
          <Badge
            className={cn(
              "absolute top-2 left-2",
              videoType === 'live' 
                ? "bg-red-500/90 text-white animate-pulse" 
                : videoType === 'goal'
                  ? "bg-green-500/90 text-white"
                  : "bg-blue-500/90 text-white"
            )}
          >
            {videoType === 'live' ? 'LIVE' : videoType === 'goal' ? 'Goal' : 'Highlights'}
          </Badge>

          {/* Video count badge */}
          {video.videos.length > 1 && (
            <Badge
              variant="outline"
              className="absolute top-2 right-2 bg-black/50 border-white/20 text-white"
            >
              {video.videos.length} videos
            </Badge>
          )}

          {/* Match info - bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-white font-semibold text-sm line-clamp-1">{video.title}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-white/70 text-xs line-clamp-1">{video.competition}</p>
              <p className="text-white/50 text-xs">{formatMatchDate(video.date)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal for playing selected video
 */
interface VideoModalProps {
  video: ScorebatMatch;
  onClose: () => void;
}

function VideoModal({ video, onClose }: VideoModalProps) {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const currentVideo = video.videos[selectedVideoIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal content */}
      <div className="relative z-10 w-full max-w-4xl">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Video title */}
        <div className="mb-4">
          <h3 className="text-white text-xl font-bold">{video.title}</h3>
          <p className="text-white/60 text-sm">{video.competition}</p>
        </div>

        {/* Main video player */}
        <div className="rounded-xl overflow-hidden">
          <VideoPlayer
            embedHtml={currentVideo.embed}
            title={currentVideo.title}
            autoPlay={true}
            showControls={false}
          />
        </div>

        {/* Video selector if multiple videos */}
        {video.videos.length > 1 && (
          <div className="mt-4">
            <p className="text-white/60 text-sm mb-2">More videos from this match:</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {video.videos.map((v, index) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVideoIndex(index)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-lg text-sm transition-colors",
                    index === selectedVideoIndex
                      ? "bg-casino-brand text-black font-medium"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  )}
                >
                  {v.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
