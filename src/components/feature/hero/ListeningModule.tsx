import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Play, Pause, Heart } from "lucide-react";
import { cn } from "@/utils/cn";
import type { RecognitionPhase } from "@/hooks/useSongRecognition";
import type { DetectedSong } from "@/types";

export type HeroPhase = RecognitionPhase;

interface ListeningModuleProps {
  phase: HeroPhase;
  seconds: number;
  progress: number;
  onStart: () => void;
  onCancel: () => void;
  detected?: DetectedSong | null;
  onLyrics?: () => void;
  previewUrl?: string | null;
  isPreviewPlaying?: boolean;
  onPreview?: () => void;
  isFavorite?: boolean;
  onFavorite?: () => void;
}

const WAVE_BARS = 34;
const BAR_ACCENT = "#F9D2BA";

interface WaveBar {
  base: number;
  amp: number;
  delay: number;
  duration: number;
}

/**
 * Bell-shaped envelope so the center bars are taller and the outer bars
 * shorter. Heights, delays, and durations are randomized so bars never move
 * in unison — the result looks like a live audio waveform, not an equalizer.
 */
function useWaveBars(): WaveBar[] {
  return useMemo(
    () =>
      Array.from({ length: WAVE_BARS }, (_, i) => {
        const center = Math.abs(Math.sin((i / (WAVE_BARS - 1)) * Math.PI));
        const envelope = 0.35 + 0.65 * center;
        return {
          base: 5 + Math.random() * 5 * envelope,
          amp: (14 + Math.random() * 16) * envelope,
          delay: Math.random() * 1.3,
          duration: 0.5 + Math.random() * 0.5,
        };
      }),
    [],
  );
}

/** Live animated waveform shown while AudD is analyzing. */
function LiveWaveform({ slow = false }: { slow?: boolean }) {
  const bars = useWaveBars();
  return (
    <div className="flex h-16 items-center justify-center gap-[2px]" aria-hidden="true">
      {bars.map((b, i) => (
        <motion.span
          key={i}
          className="w-[2px] rounded-full"
style={{
            backgroundColor: BAR_ACCENT,
            boxShadow: `0 0 6px ${BAR_ACCENT}66`,
          }}
          animate={{ height: [b.base, b.base + b.amp, b.base] }}
          transition={{
            repeat: Infinity,
            repeatType: "mirror",
            duration: slow ? b.duration * 2.6 : b.duration,
            delay: slow ? b.delay * 2.5 : b.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/** SONGly note mark, reused as the idle state of the detection control. */
function NoteMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
className="h-11 w-11 text-primary-foreground sm:h-12 sm:w-12"
      aria-hidden="true"
    >
      <path
        d="M9 18V5l12-2v13"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="18" r="3" fill="currentColor" />
      <circle cx="18" cy="16" r="3" fill="currentColor" />
    </svg>
  );
}

export function ListeningModule({
  phase,
  seconds,
  progress,
  onStart,
  onCancel,
  detected,
  onLyrics,
  previewUrl,
  isPreviewPlaying,
  onPreview,
  isFavorite,
  onFavorite,
}: ListeningModuleProps) {
  const listening = phase === "listening";
  const analyzing = phase === "analyzing";
  const active = listening || analyzing;

return (
    <div className="flex flex-col items-center gap-4">
      {/* Detection control: logo when idle, live waveform while analyzing */}
      <div className="relative flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56">
        {/* Soft breathing ring */}
        <motion.div
          className="absolute inset-4 rounded-full border border-primary/15 sm:inset-5"
          animate={{ scale: [1, 1.08], opacity: [0.35, 0.8] }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 3.5,
            ease: "easeInOut",
          }}
          aria-hidden="true"
        />

        {/* Radar ripples (only while listening) */}
        {[0, 1].map((ring) => (
          <motion.span
            key={ring}
            className="absolute inset-0 rounded-full border border-primary/20"
            animate={
              listening
                ? { scale: [1, 1.18], opacity: [0.5, 0] }
                : { scale: 1, opacity: 0 }
            }
            transition={
              listening
                ? { repeat: Infinity, duration: 2.4, delay: ring * 0.8, ease: "easeOut" }
                : { duration: 0.3 }
            }
            aria-hidden="true"
          />
        ))}

        {/* Main button */}
        <motion.button
          onClick={listening ? onCancel : onStart}
          disabled={analyzing}
          aria-label={listening ? "Stop listening" : "Start listening"}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          className={cn(
            "relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full transition-colors duration-300 sm:h-36 sm:w-36",
active
              ? "bg-accent shadow-[0_0_45px_var(--t-accent-glow)]"
              : "bg-primary shadow-[0_0_35px_var(--t-shadow-accent)] hover:shadow-[0_0_55px_var(--t-shadow-accent)]",
            analyzing && "cursor-wait opacity-95",
          )}
        >
          <AnimatePresence mode="wait">
            {active ? (
              <motion.span
                key="wave"
                initial={{ scale: 0.65, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.65, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex w-full items-center justify-center"
              >
                {detected ? (
                  // Brief success pulse before settling into the reveal.
                  <motion.div
                    key="pulse"
                    initial={false}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 0.9, ease: "easeInOut" }}
                  >
                    <LiveWaveform slow={analyzing} />
                  </motion.div>
                ) : (
                  <LiveWaveform slow={analyzing} />
                )}
              </motion.span>
            ) : (
              <motion.span
                key="logo"
                initial={{ scale: 0.65, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.65, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex items-center justify-center"
              >
                <NoteMark />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Status */}
      <div className="flex flex-col items-center gap-2">
        {phase !== "idle" && !(analyzing && detected) && (
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 backdrop-blur">
            {listening && (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-sm font-medium text-foreground">
                  Listening… {seconds}s
                </span>
              </>
            )}
            {analyzing && !detected && (
              <>
                <span className="text-sm leading-none">✨</span>
                <span className="text-sm font-medium text-foreground">
                  Analyzing audio…
                </span>
              </>
            )}
            {phase === "error" && (
              <>
                <span className="h-2 w-2 rounded-full bg-error" />
                <span className="text-sm text-secondary-text">Something went wrong</span>
              </>
            )}
          </div>
        )}

{/* Success reveal: detected song + preview/favorite/lyrics actions */}
        {analyzing && detected && (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
              <span>✓</span> Song Found
            </p>
            <p className="max-w-[240px] truncate text-sm font-semibold text-foreground">
              {detected.title}
            </p>
            <p className="text-xs text-secondary-text">{detected.artist}</p>
            {detected.album && (
              <p className="max-w-[240px] truncate text-xs text-muted">
                {detected.album}
              </p>
            )}
            <div className="mt-1 flex items-center gap-2">
              {previewUrl && (
                <button
                  onClick={onPreview}
className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
                  aria-label={isPreviewPlaying ? "Pause preview" : "Play preview"}
                >
                  {isPreviewPlaying ? (
                    <Pause className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  Preview
                </button>
              )}
              <button
                onClick={onFavorite}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                  isFavorite
                    ? "border-primary/40 bg-primary/10 text-primary"
: "border-border text-foreground hover:border-accent/40 hover:text-accent",
                )}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
              </button>
              <button
                onClick={onLyrics}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-xs font-bold text-secondary-text transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Search className="h-3.5 w-3.5" />
                View Lyrics
              </button>
            </div>
          </div>
        )}

        {/* Recognition progress */}
        {analyzing && (
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.25 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
