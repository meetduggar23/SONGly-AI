import { motion } from "framer-motion";
import { Pause, Play, Heart, FileText, Flame } from "lucide-react";
import type { TrendingEntry } from "@/services/music/itunesService";
import { cn } from "@/utils/cn";
import { PLACEHOLDER_IMAGE } from "@/constants";
import { useFavoritesStore, songToFavorite } from "@/store/favorites";
import { usePreviewPlayback } from "@/hooks/usePreviewPlayback";
import { playPreview, stopPreview } from "@/utils/audio";
import { toastSuccess } from "@/store/toast";
import { useUI } from "@/context/useUI";

/**
 * Featured #1 song — the top of the chart as an editorial hero. Large square
 * artwork with a very subtle blurred backdrop of the same cover, a rank badge
 * and the full set of actions (preview, favorite, lyrics). Stacks vertically
 * on small screens, horizontal on larger ones.
 */
export function FeaturedSongCard({ song }: { song: TrendingEntry }) {
  const { isPlaying } = usePreviewPlayback(song.previewUrl);
  const isFavorite = useFavoritesStore((s) => s.isFavorite(song.id, "song"));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const { openLyrics } = useUI();

  const art =
    song.coverLarge || song.coverMedium || song.cover || PLACEHOLDER_IMAGE;

  const handlePreview = () => {
    if (isPlaying) {
      stopPreview();
    } else if (song.previewUrl) {
      playPreview(song.previewUrl);
    }
  };

  const handleFavorite = () => {
    toggleFavorite(songToFavorite(song));
    toastSuccess(
      isFavorite ? "Removed from favorites" : "Added to favorites",
      song.title,
    );
  };

  const handleLyrics = () => openLyrics(song);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl bg-card"
    >
      {/* Blurred artwork backdrop — kept very subtle so the page stays calm. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <img
          src={art}
          alt=""
          className="h-full w-full scale-125 object-cover opacity-15 blur-[35px]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-background/70" />
      </div>

      <div className="relative flex flex-col items-center gap-8 p-6 sm:flex-row sm:gap-10 sm:p-10">
        <div className="relative shrink-0">
          <img
            src={art}
            alt={`${song.title} cover`}
            className="h-60 w-60 rounded-3xl object-cover shadow-[0_24px_60px_rgba(0,0,0,0.5)] ring-1 ring-foreground/10 sm:h-72 sm:w-72 lg:h-80 lg:w-80"
            loading="lazy"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center text-center sm:items-start sm:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            <Flame className="h-3.5 w-3.5" />
            #1 Trending
          </span>

          <div className="mt-4 flex items-center gap-2">
            <h2 className="text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
              {song.title}
            </h2>
            {isPlaying && (
              <span className="text-primary" aria-hidden="true">
                <span className="trending-eq">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            )}
          </div>
          <p className="mt-2 text-base font-medium text-secondary-text sm:text-lg">
            {song.artist}
          </p>
          {song.album && (
            <p className="mt-1 text-sm text-muted">{song.album}</p>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
            {song.previewUrl && (
              <button
                onClick={handlePreview}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
                {isPlaying ? "Pause" : "Preview"}
              </button>
            )}
            <button
              onClick={handleFavorite}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                isFavorite
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent/25 text-secondary-text hover:bg-accent/40 hover:text-foreground",
              )}
            >
              <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
            </button>
            <button
              onClick={handleLyrics}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-accent/25 px-5 text-sm font-semibold text-secondary-text transition-colors hover:bg-accent/40 hover:text-foreground"
            >
              <FileText className="h-4 w-4" />
              View Lyrics
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
