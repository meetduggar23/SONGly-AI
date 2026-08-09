import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Music2, Pause, Play, X } from "lucide-react";
import type { Lyrics, Song } from "@/types";
import { cn } from "@/utils/cn";
import { getLyrics } from "@/services/lyrics";
import {
  parseLrcLines,
  parseLyricsToBlocks,
  isInstrumental,
} from "@/utils/lyrics";
import { useUI } from "@/context/useUI";
import { usePreviewPlayback } from "@/hooks/usePreviewPlayback";
import { useIsMobile } from "@/hooks/useMediaQuery";
import {
  pausePreview,
  playPreview,
  resumePreview,
  seekPreview,
} from "@/utils/audio";
import { useFavoritesStore, songToFavorite } from "@/store/favorites";
import { toastSuccess } from "@/store/toast";
import { PLACEHOLDER_IMAGE } from "@/constants";

/** Skeleton for lyric lines while lyrics load. */
function LyricsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl animate-pulse space-y-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "mx-auto h-4 rounded-full bg-border/40",
            i % 3 === 0 ? "w-40" : i % 3 === 1 ? "w-56" : "w-48",
          )}
        />
      ))}
    </div>
  );
}

function LyricsPanelInner({
  song,
  onClose,
}: {
  song: Song;
  onClose: () => void;
}) {
  const isMobile = useIsMobile();

  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pausedProgress, setPausedProgress] = useState<{
    current: number;
    duration: number;
  } | null>(null);

  const previewUrl = song.previewUrl;
  const { isPlaying, isPaused, progress } = usePreviewPlayback(previewUrl);

  const containerRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<Array<HTMLParagraphElement | null>>([]);
  const autoFollowRef = useRef(true);
  const followTimerRef = useRef<number | null>(null);
  const programmaticScrollRef = useRef(false);
  const lastScrollTargetRef = useRef(0);

  const isFavorite = useFavoritesStore((s) => s.isFavorite(song.id, "song"));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  // Fetch lyrics for the current song.
  useEffect(() => {
    let cancelled = false;
    setLyricsLoading(true);
    setLyrics(null);
    setActiveIndex(-1);
    setPausedProgress(null);
    autoFollowRef.current = true;
    if (followTimerRef.current) window.clearTimeout(followTimerRef.current);
    if (containerRef.current) containerRef.current.scrollTop = 0;

    getLyrics({
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
    })
      .then((result) => {
        if (cancelled) return;
        setLyrics(result);
        setLyricsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLyrics({ lyrics: "", source: "none", synced: false });
        setLyricsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [song]);

  // Remember the last progress snapshot so the paused state keeps its bar.
  useEffect(() => {
    if (progress) setPausedProgress(progress);
    else if (!isPaused) setPausedProgress(null);
  }, [progress, isPaused]);

  // Escape closes the panel; lock page scroll while open.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (followTimerRef.current) window.clearTimeout(followTimerRef.current);
    };
  }, []);

  const syncedLines = useMemo(() => {
    if (!lyrics?.syncedLyrics) return null;
    const parsed = parseLrcLines(lyrics.syncedLyrics);
    return parsed && parsed.length > 0 ? parsed : null;
  }, [lyrics]);

  const currentTime = progress?.current ?? null;
  const syncing = currentTime !== null;

  // Smoothly scroll the container so a given line lands centered, and mark the
  // resulting scroll as programmatic (so the onScroll handler never mistakes it
  // for a user gesture). The flag is force-cleared shortly after so a user who
  // interrupts the animation is still detected.
  const programmaticScrollTo = (target: number) => {
    const container = containerRef.current;
    if (!container) return;
    programmaticScrollRef.current = true;
    lastScrollTargetRef.current = target;
    container.scrollTo({ top: target, behavior: "smooth" });
    window.setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 700);
  };

  // Map audio.currentTime -> active line index.
  useEffect(() => {
    if (!syncedLines || currentTime === null) return;
    let idx = -1;
    for (let i = 0; i < syncedLines.length; i++) {
      const line = syncedLines[i];
      const next = syncedLines[i + 1];
      if (currentTime >= line.time && (!next || currentTime < next.time)) {
        idx = i;
        break;
      }
    }
    setActiveIndex(idx);
  }, [currentTime, syncedLines]);

  // Center the first line once lyrics arrive.
  useEffect(() => {
    if (lyricsLoading || !syncedLines) return;
    const line = linesRef.current[0];
    if (!line) return;
    const container = containerRef.current;
    if (!container) return;
    const target = Math.max(
      0,
      line.offsetTop - container.clientHeight / 2 + line.offsetHeight / 2,
    );
    programmaticScrollTo(target);
  }, [lyricsLoading, syncedLines]);

  // Smoothly keep the active line centered while audio plays.
  useEffect(() => {
    if (activeIndex < 0 || !syncing || !autoFollowRef.current) return;
    const line = linesRef.current[activeIndex];
    if (!line) return;
    const container = containerRef.current;
    if (!container) return;
    const target = Math.max(
      0,
      line.offsetTop - container.clientHeight / 2 + line.offsetHeight / 2,
    );
    programmaticScrollTo(target);
  }, [activeIndex, syncing, syncedLines]);

  // Manual scroll temporarily disables auto-follow, then resumes after 3s.
  const handleContainerScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    if (programmaticScrollRef.current) {
      if (Math.abs(container.scrollTop - lastScrollTargetRef.current) < 8) {
        programmaticScrollRef.current = false;
      }
      return;
    }
    autoFollowRef.current = false;
    if (followTimerRef.current) window.clearTimeout(followTimerRef.current);
    followTimerRef.current = window.setTimeout(() => {
      autoFollowRef.current = true;
    }, 3000);
  };

  const handleTogglePlay = () => {
    if (!previewUrl) return;
    if (isPlaying) {
      pausePreview();
    } else if (isPaused) {
      resumePreview();
    } else {
      playPreview(previewUrl);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progress || progress.duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seekPreview(ratio * progress.duration);
  };

  const handleFavorite = () => {
    toggleFavorite(songToFavorite(song));
    toastSuccess(
      isFavorite ? "Removed from favorites" : "Added to favorites",
      song.title,
    );
  };

  const bar = progress ?? (isPaused ? pausedProgress : null);
  const barPct =
    bar && bar.duration > 0
      ? Math.min(100, (bar.current / bar.duration) * 100)
      : 0;

  const art = song.coverLarge || song.coverMedium || song.cover || PLACEHOLDER_IMAGE;

  const blocks = useMemo(
    () => (lyrics?.lyrics ? parseLyricsToBlocks(lyrics.lyrics) : []),
    [lyrics],
  );
  const instrumental = useMemo(() => isInstrumental(lyrics?.lyrics), [lyrics]);
  const notAvailable =
    !lyricsLoading && (!lyrics || lyrics.source === "none" || !lyrics.lyrics);

  return (
    <motion.div
      className="fixed inset-0 z-[120]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "absolute inset-0 flex",
          isMobile ? "items-end" : "items-center justify-center p-4",
        )}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Lyrics for ${song.title}`}
          initial={{ opacity: 0, y: isMobile ? 40 : 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isMobile ? 40 : 24, scale: 0.98 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className={cn(
            "lyrics-panel flex flex-col overflow-hidden",
            isMobile
              ? "h-[92dvh] w-full rounded-t-3xl bg-card"
              : "max-h-[85vh] w-full max-w-3xl rounded-3xl border border-border bg-card shadow-2xl",
          )}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
            <img
              src={art}
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl object-cover"
              loading="lazy"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {song.title}
              </p>
              <p className="truncate text-xs text-secondary-text">
                {song.artist}
                {song.album ? ` · ${song.album}` : ""}
              </p>
            </div>
            <button
              onClick={handleFavorite}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              title="Favorite"
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                isFavorite
                  ? "text-primary"
                  : "text-secondary-text hover:text-foreground",
              )}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close lyrics"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-secondary-text transition-colors hover:bg-border/40 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Lyrics body */}
          <div
            ref={containerRef}
            onScroll={handleContainerScroll}
            className="lyrics-scroll relative flex-1 overflow-y-auto px-4 py-6 sm:px-8"
          >
            {lyricsLoading ? (
              <div className="flex min-h-full items-center">
                <LyricsSkeleton />
              </div>
            ) : notAvailable ? (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Music2 className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 text-base font-semibold text-foreground">
                  Lyrics aren&apos;t available for this song.
                </p>
                <p className="mt-1 text-sm text-secondary-text">
                  We couldn&apos;t find lyrics for this track in our sources.
                </p>
              </div>
            ) : instrumental ? (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
                <p className="text-lg font-medium text-foreground">Instrumental</p>
                <p className="mt-2 text-sm text-secondary-text">
                  This track appears to be instrumental.
                </p>
              </div>
            ) : syncedLines ? (
              <div className="mx-auto w-full max-w-xl space-y-3 py-[30vh]">
                {syncedLines.map((line, i) => {
                  const active = i === activeIndex;
                  const isPrev = activeIndex >= 0 && i < activeIndex;
                  return (
                    <p
                      key={i}
                      ref={(el) => {
                        linesRef.current[i] = el;
                      }}
                      className={cn(
                        "lyrics-line text-center text-lg leading-[1.9] sm:text-xl",
                        syncing &&
                          !active &&
                          (isPrev ? "opacity-40" : "opacity-55"),
                        active && "lyrics-line--active",
                      )}
                    >
                      {line.text}
                    </p>
                  );
                })}
              </div>
            ) : (
              <div className="mx-auto w-full max-w-xl">
                <p className="mb-6 text-center text-xs font-medium text-muted">
                  Synced lyrics aren&apos;t available for this song.
                </p>
                <div className="space-y-6">
                  {blocks.map((block, i) => (
                    <div key={i} className="space-y-1">
                      {block.map((line, j) => (
                        <p
                          key={j}
                          className="text-center text-lg leading-[1.9] text-foreground/90 sm:text-xl"
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Player footer */}
          {previewUrl && (
            <div className="shrink-0 border-t border-border px-4 py-3">
              <div className="mx-auto flex w-full max-w-xl items-center gap-3">
                <button
                  onClick={handleTogglePlay}
                  aria-label={
                    isPlaying
                      ? "Pause preview"
                      : isPaused
                        ? "Resume preview"
                        : "Play preview"
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="h-4 w-4 translate-x-[1px] fill-current" />
                  )}
                </button>
                <div
                  onClick={handleSeek}
                  role="slider"
                  aria-label="Preview progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(barPct)}
                  className={cn(
                    "h-1.5 flex-1 overflow-hidden rounded-full bg-border",
                    progress ? "cursor-pointer" : "cursor-default",
                  )}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-200 ease-linear"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                {syncedLines && (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-primary">
                    Synced
                  </span>
                )}
              </div>
              {syncedLines && !isPlaying && !isPaused && (
                <p className="mt-2 text-center text-[11px] text-muted">
                  Press Preview to follow along with the lyrics.
                </p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Global lyrics panel. Opens whenever any song surface calls `openLyrics`,
 * driven by the shared single-instance audio player so the highlighted line
 * follows `audio.currentTime` (pausing, resuming, and seeking stay in sync).
 * Full-screen on mobile, a centered panel on desktop.
 */
export function LyricsPanel() {
  const { lyricsSong, closeLyrics } = useUI();
  const [cachedSong, setCachedSong] = useState<Song | null>(lyricsSong);

  useEffect(() => {
    if (lyricsSong) setCachedSong(lyricsSong);
  }, [lyricsSong]);

  const open = lyricsSong !== null && cachedSong !== null;

  return (
    <AnimatePresence>
      {open && (
        <LyricsPanelInner song={cachedSong as Song} onClose={closeLyrics} />
      )}
    </AnimatePresence>
  );
}
