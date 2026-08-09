import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Calendar, Heart, Mic, Music2, Play, Pause, RotateCcw } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useSongRecognition } from "@/hooks/useSongRecognition";
import { usePreviewPlayback } from "@/hooks/usePreviewPlayback";
import { useFavoritesStore } from "@/store/favorites";
import { playPreview, stopPreview } from "@/utils/audio";
import { HeroBackground } from "@/components/feature/hero/HeroBackground";
import { ListeningModule } from "@/components/feature/hero/ListeningModule";
import { PLACEHOLDER_IMAGE } from "@/constants";
import { cn } from "@/utils/cn";
import type { DetectedSong, Song } from "@/types";

interface DetectionResult {
  detected: DetectedSong;
  track: Song | null;
}

function formatReleaseDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DetectPage() {
  useDocumentTitle("Detect a Song");
  const navigate = useNavigate();
  const [result, setResult] = useState<DetectionResult | null>(null);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const onDetected = useCallback((detected: DetectedSong, track: Song | null) => {
    setResult({ detected, track });
  }, []);

  const {
    phase,
    error,
    progress,
    seconds,
    startListening,
    cancelListening,
  } = useSongRecognition(onDetected, { holdMs: 1100 });

  const previewUrl = result?.track?.previewUrl || result?.detected.previewUrl || null;
  const { isPlaying } = usePreviewPlayback(previewUrl || undefined);

  const handlePreview = () => {
    if (!previewUrl) return;
    if (isPlaying) {
      stopPreview();
    } else {
      playPreview(previewUrl);
    }
  };

  const handleViewLyrics = () => {
    if (!result) return;
    const trackId = result.track?.id;
    if (trackId && /^(\d+|it-\d+)$/.test(trackId)) {
      navigate(`/song/${trackId}`);
    } else {
      navigate(
        `/search?q=${encodeURIComponent(
          `${result.detected.title} ${result.detected.artist}`,
        )}`,
      );
    }
  };

  const handleFavorite = () => {
    if (!result) return;
    toggleFavorite({
      id:
        result.track?.id ||
        result.detected.songId ||
        `detected-${result.detected.title}`,
      type: "song",
      title: result.detected.title,
      subtitle: result.detected.artist,
      image: result.detected.coverUrl || result.track?.cover,
    });
  };

  const resultId = result
    ? result.track?.id ||
      result.detected.songId ||
      `detected-${result.detected.title}`
    : "";
  const isResultFavorite = useFavoritesStore((s) =>
    s.isFavorite(resultId, "song"),
  );

  const handleListenAgain = () => {
    setResult(null);
    stopPreview();
    void startListening();
  };

  const releaseText =
    formatReleaseDate(result?.detected.releaseDate) ||
    (result?.track?.releaseYear ? String(result.track.releaseYear) : null);

  return (
    <div className="relative overflow-hidden">
      <HeroBackground />

      <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <div className="flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl font-black leading-[1.08] tracking-tight text-foreground sm:text-5xl"
          >
            Identify the Song Playing{" "}
            <span className="text-gradient-green">Around You</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 max-w-md text-base text-secondary-text sm:text-lg"
          >
            Tap the microphone and let AI identify the music playing near you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-10"
          >
            <ListeningModule
              phase={phase}
              seconds={seconds}
              progress={progress}
              onStart={startListening}
              onCancel={cancelListening}
            />
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {phase === "error" && error && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-8 w-full max-w-md rounded-2xl border border-error/30 bg-error/5 p-5"
              >
                <p className="text-left text-sm text-secondary-text">{error}</p>
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    onClick={startListening}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                  >
                    <Mic className="h-4 w-4" />
                    Try Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Detected result */}
          <AnimatePresence>
            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                className="mt-10 w-full max-w-sm overflow-hidden rounded-3xl border border-primary/20 bg-card/80 p-5 text-left shadow-[0_0_60px_rgba(29,69,51,0.12)] backdrop-blur-xl"
              >
                <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-primary">
                  ✨ Song Detected
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={
                      result.detected.coverUrl ||
                      result.track?.cover ||
                      PLACEHOLDER_IMAGE
                    }
                    alt={`${result.detected.title} cover`}
                    className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-foreground">
                      {result.detected.title}
                    </p>
                    <p className="truncate text-sm text-secondary-text">
                      {result.detected.artist}
                    </p>
                    {result.detected.album && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                        <Music2 className="h-3 w-3 shrink-0" />
                        {result.detected.album}
                      </p>
                    )}
                  </div>
                </div>

                {releaseText && (
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
                    <Calendar className="h-3.5 w-3.5" />
                    Released {releaseText}
                  </p>
                )}

                <div className="mt-5 flex items-center gap-2">
                  <button
                    onClick={handleViewLyrics}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
                  >
                    View Lyrics
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handlePreview}
                    disabled={!previewUrl}
                    aria-label={isPlaying ? "Pause preview" : "Play preview"}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
                      previewUrl
                        ? "border-border text-secondary-text hover:border-primary/40 hover:text-primary"
                        : "cursor-not-allowed border-border/50 text-muted",
                    )}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={handleFavorite}
                    aria-label="Add to favorites"
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
                      isResultFavorite
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border text-secondary-text hover:border-primary/40 hover:text-primary",
                    )}
                  >
                    <Heart className={cn("h-4 w-4", isResultFavorite && "fill-current")} />
                  </button>
                  <button
                    onClick={handleListenAgain}
                    aria-label="Listen again"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-secondary-text transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
