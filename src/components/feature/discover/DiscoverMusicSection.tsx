import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useDiscoverMusic } from "@/hooks/useDiscoverMusic";
import { SongCard } from "@/components/feature/SongCard";
import { SongCardSkeleton } from "@/components/feature/Loaders";
import { cn } from "@/utils/cn";

const GRID_CLASSES =
  "grid w-full min-w-0 grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

/**
 * "Discover Music" — a live, search-free music discovery section.
 * Shows real top songs (India + international charts) immediately, then
 * smoothly auto-rotates to a new set every ~25s. Rotation pauses while the
 * user hovers the cards, and the ‹ › controls + "Discover more →" allow
 * manual navigation. Preview playback is managed by the shared audio manager,
 * so rotating cards never interrupt a song that's playing.
 */
export function DiscoverMusicSection() {
  const {
    songs,
    cursor,
    isLoading,
    paused,
    setPaused,
    goNext,
    goPrev,
    retry,
  } = useDiscoverMusic();

  const showSkeletons = isLoading && songs.length === 0;
  const rotating = isLoading && songs.length > 0;

  return (
    <section className="mx-auto mt-12 w-full max-w-7xl px-4 sm:px-6">
      {/* Header */}
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Discover Music
          </h2>
          <p className="mt-1 text-sm text-secondary-text">
            Find something new to listen to.
          </p>
        </div>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={isLoading}
            aria-label="Previous songs"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/70 text-secondary-text transition-colors hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={isLoading}
            aria-label="Next songs"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/70 text-secondary-text transition-colors hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={isLoading}
            className="group flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-40"
          >
            {rotating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading…
              </>
            ) : (
              <>
                Discover more
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cards */}
      <div
        className="min-w-0"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {showSkeletons ? (
          <div className={GRID_CLASSES}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SongCardSkeleton key={i} />
            ))}
          </div>
        ) : songs.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={cursor}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={GRID_CLASSES}
            >
              {songs.map((song, i) => (
                <SongCard key={song.id} song={song} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div
            className={cn(
              GRID_CLASSES,
              "col-span-full flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/50 px-6 py-10",
            )}
          >
            <p className="text-sm text-secondary-text">
              Couldn&rsquo;t load trending music right now.
            </p>
            <button
              type="button"
              onClick={retry}
              className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted/70">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            paused ? "bg-border" : "animate-pulse bg-primary",
          )}
          aria-hidden="true"
        />
        {paused ? "Rotation paused" : "Live · auto-refreshes"}
      </p>
    </section>
  );
}
