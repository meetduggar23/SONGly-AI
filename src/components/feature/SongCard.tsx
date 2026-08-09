import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Pause, Heart, Clock, FileText } from "lucide-react";
import type { Song } from "@/types";
import { cn } from "@/utils/cn";
import { formatDuration } from "@/utils/format";
import { PLACEHOLDER_IMAGE } from "@/constants";
import { useFavoritesStore, songToFavorite } from "@/store/favorites";
import { playPreview, stopPreview, subscribePreview, getPreviewingUrl } from "@/utils/audio";
import { toastSuccess } from "@/store/toast";
import { useUI } from "@/context/useUI";

interface SongCardProps {
  song: Song;
  index?: number;
}

export function SongCard({ song, index = 0 }: SongCardProps) {
  const isFavorite = useFavoritesStore((s) =>
    s.isFavorite(song.id, "song"),
  );
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const { openLyrics } = useUI();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!song.previewUrl) return;
    const previewUrl = song.previewUrl;
    const unsubscribe = subscribePreview(() => {
      setIsPlaying(
        getPreviewingUrl() === new URL(previewUrl, window.location.href).href,
      );
    });
    return unsubscribe;
  }, [song.previewUrl]);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPlaying) {
      stopPreview();
    } else if (song.previewUrl) {
      playPreview(song.previewUrl);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(songToFavorite(song));
    toastSuccess(
      isFavorite ? "Removed from favorites" : "Added to favorites",
      song.title,
    );
  };

  const handleLyrics = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openLyrics(song);
  };

  // Only Deezer tracks have numeric ids that /song/:id can load.
  const href = /^\d+$/.test(song.id)
    ? `/song/${song.id}`
    : `/search?q=${encodeURIComponent(`${song.title} ${song.artist}`)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <Link
        to={href}
        className="block rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
      >
        <div className="relative mb-3 overflow-hidden rounded-xl">
          <img
            src={song.coverMedium || song.cover || PLACEHOLDER_IMAGE}
            alt={song.title}
            className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          {song.previewUrl && (
            <button
              onClick={handlePlay}
              className={cn(
"absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all duration-300",
                isPlaying
                  ? "opacity-100 scale-100"
                  : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0",
              )}
              aria-label={isPlaying ? "Pause preview" : "Play preview"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 translate-x-0.5" />
              )}
            </button>
          )}
        </div>
        <div className="space-y-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {song.title}
          </p>
          <p className="truncate text-xs text-secondary-text">{song.artist}</p>
          <div className="flex items-center justify-between pt-1">
            {song.duration ? (
              <span className="flex items-center gap-1 text-xs text-muted">
                <Clock className="h-3 w-3" />
                {formatDuration(song.duration)}
              </span>
            ) : (
              <span />
            )}
            <button
              onClick={handleFavorite}
              className={cn(
                "rounded-full p-1 transition-colors",
                isFavorite
                  ? "text-primary"
                  : "text-muted opacity-0 group-hover:opacity-100 hover:text-primary",
              )}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </button>
            <button
              onClick={handleLyrics}
              className={cn(
                "rounded-full p-1 transition-colors",
                "text-muted opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-primary",
              )}
              aria-label="View lyrics"
              title="View lyrics"
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
