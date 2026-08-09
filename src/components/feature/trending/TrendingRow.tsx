import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  Minus,
  Pause,
  Play,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { TrendingEntry } from "@/services/music/itunesService";
import { cn } from "@/utils/cn";
import { PLACEHOLDER_IMAGE } from "@/constants";
import { useFavoritesStore, songToFavorite } from "@/store/favorites";
import { usePreviewPlayback } from "@/hooks/usePreviewPlayback";
import { playPreview, stopPreview } from "@/utils/audio";
import { toastSuccess } from "@/store/toast";

/**
 * Chart-position movement: ↑ n / ↓ n / —. Only rendered when a previous chart
 * actually exists for the region (the service never invents movement).
 */
function MovementBadge({ movement }: { movement?: number }) {
  if (movement === undefined) {
    return <span className="h-3" aria-hidden="true" />;
  }
  if (movement === 0) {
    return (
      <span
        className="flex items-center text-muted"
        title="No change"
        aria-label="No change"
      >
        <Minus className="h-2.5 w-2.5" />
      </span>
    );
  }
  if (movement > 0) {
    return (
      <span
        className="flex items-center gap-0.5 text-[10px] font-bold leading-none text-primary"
        title={`Up ${movement}`}
      >
        <TrendingUp className="h-2.5 w-2.5" />
        {movement}
      </span>
    );
  }
  return (
    <span
      className="flex items-center gap-0.5 text-[10px] font-bold leading-none text-muted"
      title={`Down ${Math.abs(movement)}`}
    >
      <TrendingDown className="h-2.5 w-2.5" />
      {Math.abs(movement)}
    </span>
  );
}

interface TrendingRowProps {
  song: TrendingEntry;
  index: number;
}

/** A single ranked chart row: rank, artwork, title/artist · album, actions. */
export function TrendingRow({ song, index }: TrendingRowProps) {
  const navigate = useNavigate();
  const { isPlaying } = usePreviewPlayback(song.previewUrl);
  const isFavorite = useFavoritesStore((s) => s.isFavorite(song.id, "song"));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      stopPreview();
    } else if (song.previewUrl) {
      playPreview(song.previewUrl);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(songToFavorite(song));
    toastSuccess(
      isFavorite ? "Removed from favorites" : "Added to favorites",
      song.title,
    );
  };

  const handleLyrics = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/song/${song.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: "easeOut" }}
      onClick={() => navigate(`/song/${song.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/song/${song.id}`);
      }}
      className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-200 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:gap-4 sm:px-4"
    >
      <div className="flex w-10 shrink-0 flex-col items-end gap-0.5 sm:w-11">
        <span className="text-sm font-semibold tabular-nums text-muted transition-colors duration-200 group-hover:text-secondary-text">
          {String(song.rank).padStart(2, "0")}
        </span>
        <MovementBadge movement={song.movement} />
      </div>

      <img
        src={
          song.coverSmall || song.coverMedium || song.cover || PLACEHOLDER_IMAGE
        }
        alt=""
        className="h-14 w-14 shrink-0 rounded-xl object-cover transition-[filter,transform] duration-200 group-hover:brightness-110"
        loading="lazy"
      />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">
            {song.title}
          </span>
          {isPlaying && (
            <span className="shrink-0 text-primary" aria-hidden="true">
              <span className="trending-eq">
                <span />
                <span />
                <span />
                <span />
              </span>
            </span>
          )}
        </span>
        <span className="block truncate text-xs text-secondary-text">
          {song.artist}
          {song.album ? ` · ${song.album}` : ""}
        </span>
      </span>

      <div className="flex shrink-0 items-center gap-1">
        {song.previewUrl && (
          <button
            onClick={handlePlay}
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
              isPlaying
                ? "bg-primary text-primary-foreground"
                : "text-secondary-text opacity-60 hover:opacity-100 group-hover:bg-primary group-hover:text-primary-foreground group-hover:opacity-100",
            )}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 translate-x-[1px] fill-current" />
            )}
          </button>
        )}
        <button
          onClick={handleLyrics}
          aria-label="View lyrics"
          title="View lyrics"
          className="hidden h-9 w-9 items-center justify-center rounded-full text-secondary-text opacity-60 transition-all duration-200 hover:text-foreground hover:opacity-100 group-hover:opacity-100 sm:flex"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          onClick={handleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
            isFavorite
              ? "text-primary"
              : "text-secondary-text opacity-60 hover:text-foreground hover:opacity-100 group-hover:opacity-100",
          )}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </button>
      </div>
    </motion.div>
  );
}
