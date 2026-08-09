import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  Music,
  Music2,
  Pause,
  Play,
  RefreshCw,
  Search,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useFavoritesStore } from "@/store/favorites";
import { getFeaturedSongs } from "@/services/itunes";
import { useUI } from "@/context/useUI";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import {
  playPreview,
  stopPreview,
  subscribePreview,
  getPreviewingUrl,
  getPreviewProgress,
} from "@/utils/audio";
import type { DetectedSong, Song } from "@/types";
import { PLACEHOLDER_IMAGE } from "@/constants";

/** Number of song cards dealt into the hero deck at once. */
const BATCH_SIZE = 5;

/** Auto-rotation waits between 20 and 30 seconds before advancing the deck. */
const ROTATION_MIN_MS = 20_000;
const ROTATION_JITTER_MS = 10_000;

/** Keep the featured pool fresh for 30 minutes. */
const CACHE_TTL_MS = 30 * 60 * 1000;
const MIN_USABLE_SONGS = 10;

let featuredCache: { songs: Song[]; fetchedAt: number } | null = null;

function shuffleSongs<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Alternate Hindi/English slot patterns; flips each batch for variety. */
const LANG_PATTERNS: Array<Array<"hindi" | "english">> = [
  ["hindi", "english", "hindi", "english", "hindi"],
  ["english", "hindi", "english", "hindi", "english"],
];

/** Tracks which songs were already shown so reuse only happens after a full cycle. */
interface ShownTracker {
  poolKey: string;
  hindi: Set<string>;
  english: Set<string>;
}

const normArtistKey = (artist: string) => artist.toLowerCase().replace(/[^a-z0-9]/g, "");

const artworkKey = (song: Song) => song.coverLarge || song.coverMedium || song.cover || "";

/**
 * Compose one 5-card batch on purpose:
 * - slots alternate Hindi/English (pattern flips every batch),
 * - no duplicate trackId, no repeated artist, no repeated artwork within
 *   the batch whenever possible,
 * - songs already shown are avoided until every song in that language pool
 *   has been displayed.
 */
function buildMixedBatch(
  pool: Song[],
  hindiIdx: number[],
  englishIdx: number[],
  pattern: Array<"hindi" | "english">,
  shown: ShownTracker,
): number[] {
  const batch: number[] = [];
  const batchArtwork = new Set<string>();
  const batchArtists = new Set<string>();

  const takeFrom = (lang: "hindi" | "english"): number | null => {
    const fresh = lang === "hindi" ? hindiIdx : englishIdx;
    const shownSet = shown[lang];
    const used = new Set(batch);

    const fits = (i: number) =>
      !used.has(i) &&
      !batchArtwork.has(artworkKey(pool[i])) &&
      !batchArtists.has(normArtistKey(pool[i].artist));

    let candidates = fresh.filter((i) => !shownSet.has(pool[i].id) && fits(i));
    if (candidates.length === 0) candidates = fresh.filter(fits);
    if (candidates.length === 0) candidates = fresh.filter((i) => !used.has(i));
    if (candidates.length === 0) return null;

    const idx = candidates[Math.floor(Math.random() * candidates.length)];
    shownSet.add(pool[idx].id);
    return idx;
  };

  for (const lang of pattern) {
    let idx = takeFrom(lang);
    // Fall back to the other language only when this one is exhausted.
    if (idx === null) idx = takeFrom(lang === "hindi" ? "english" : "hindi");
    if (idx !== null) {
      batch.push(idx);
      batchArtwork.add(artworkKey(pool[idx]));
      batchArtists.add(normArtistKey(pool[idx].artist));
    }
  }

  // Fill any remaining slots with untouched songs, avoiding artwork repeats.
  const used = new Set(batch);
  const rest = shuffleSongs(hindiIdx.concat(englishIdx).filter((i) => !used.has(i)));
  for (const i of rest) {
    if (batch.length >= BATCH_SIZE) break;
    if (batchArtwork.has(artworkKey(pool[i]))) continue;
    batch.push(i);
    batchArtwork.add(artworkKey(pool[i]));
  }
  for (const i of rest) {
    if (batch.length >= BATCH_SIZE) break;
    if (!batch.includes(i)) batch.push(i);
  }

  return batch;
}

/**
 * Loads the featured pool once, shuffles it per session, and reuses it for
 * 30 minutes so the hero cards don't visibly reload on every mount.
 */
function useFeaturedSongs() {
  const [pool, setPool] = useState<Song[]>(() => featuredCache?.songs ?? []);
  const [loading, setLoading] = useState(() => featuredCache === null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const valid =
      featuredCache &&
      Date.now() - featuredCache.fetchedAt < CACHE_TTL_MS &&
      featuredCache.songs.length >= MIN_USABLE_SONGS;
    if (valid) {
      setPool(featuredCache!.songs);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    getFeaturedSongs()
      .then((songs) => {
        if (cancelled) return;
        const usable = songs.length > 0 ? songs : [];
        const shuffled = shuffleSongs(usable);
        featuredCache = { songs: shuffled, fetchedAt: Date.now() };
        setPool(shuffled);
      })
      .catch(() => {
        // Keep whatever is already on screen on failures.
        if (!cancelled) setError("Couldn't load songs.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return { pool, loading, error, retry: () => setAttempt((a) => a + 1) };
}

const WAVE = [5, 9, 6, 12, 8, 15, 7, 13, 6, 10, 5, 8];

/** Green equalizer: static low bars at rest, animated bars while previewing. */
function Equalizer({ active, className }: { active: boolean; className?: string }) {
  return (
    <div className={cn("flex items-end gap-[3px]", className)} aria-hidden="true">
      {WAVE.map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-primary"
          style={{ height: active ? h : Math.max(3, h * 0.45) }}
          animate={active ? { height: [h * 0.5, h, h * 0.5] } : { height: Math.max(3, h * 0.45) }}
          transition={
            active
              ? {
                  repeat: Infinity,
                  duration: 1.1 + (i % 4) * 0.15,
                  ease: "easeInOut",
                  delay: i * 0.05,
                }
              : { duration: 0.2 }
          }
        />
      ))}
    </div>
  );
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Link a song to its lyrics page when possible, else a search query. */
function songHref(song: Song): string {
  return /^\d+$/.test(song.id)
    ? `/song/${song.id}`
    : `/search?q=${encodeURIComponent(`${song.title} ${song.artist}`)}`;
}

/** Desktop layout: a compact 5-card playing-card fan. */
const SLOTS = [
  { key: "center", x: 0, y: 0, rotate: 0, scale: 1, z: 20, dealDelay: 0.05 },
  { key: "top-right", x: 130, y: -60, rotate: 10, scale: 0.9, z: 10, dealDelay: 0.16 },
  { key: "top-left", x: -130, y: -60, rotate: -10, scale: 0.9, z: 10, dealDelay: 0.27 },
  { key: "bottom-left", x: -115, y: 80, rotate: -8, scale: 0.85, z: 8, dealDelay: 0.38 },
  { key: "bottom-right", x: 115, y: 80, rotate: 8, scale: 0.85, z: 8, dealDelay: 0.49 },
];

/** Tablet layout: a tighter 3-card fan. */
const SLOTS_MD = [
  { key: "center", x: 0, y: 0, rotate: 0, scale: 1, z: 20, dealDelay: 0.05 },
  { key: "left", x: -120, y: 0, rotate: -8, scale: 0.9, z: 10, dealDelay: 0.18 },
  { key: "right", x: 120, y: 0, rotate: 8, scale: 0.9, z: 10, dealDelay: 0.31 },
];

interface DetectedOverlayProps {
  title: string;
  artist: string;
  cover: string | null;
  phase: string;
  onLyrics: () => void;
}

function DetectedOverlay({ title, artist, cover, phase, onLyrics }: DetectedOverlayProps) {
  return (
<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-accent/90 p-4 text-center backdrop-blur-[2px]">
      <img
        src={cover || PLACEHOLDER_IMAGE}
        alt={title}
        className="h-16 w-16 rounded-xl object-cover"
        loading="lazy"
      />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-accent-foreground">Detected: {title}</p>
        <p className="text-xs text-accent-foreground/70">{artist}</p>
        <p className="text-xs text-primary">{phase}</p>
      </div>
      <button
        onClick={onLyrics}
        className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        <Search className="h-3.5 w-3.5" />
        View Lyrics
      </button>
    </div>
  );
}

/** Keeps a card's preview button in sync with the shared audio element. */
function usePreviewPlayback(previewUrl?: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState<{ current: number; duration: number } | null>(null);

  useEffect(() => {
    if (!previewUrl) return;
    const sync = () => {
      const expected = new URL(previewUrl, window.location.href).href;
      const actual = getPreviewingUrl();
      const playing = actual !== null && actual === expected;
      setIsPlaying(playing);
      setProgress(playing ? getPreviewProgress() : null);
    };
    sync();
    const unsubscribe = subscribePreview(sync);
    return unsubscribe;
  }, [previewUrl]);

  return { isPlaying, progress };
}

interface CardFaceProps {
  song: Song;
  isCenter?: boolean;
  isFavorite: boolean;
  isPlaying: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onPlay: (e: React.MouseEvent) => void;
  onLyrics: (e: React.MouseEvent) => void;
}

function CardFace({
  song,
  isCenter = false,
  isFavorite,
  isPlaying,
  onToggleFavorite,
  onPlay,
  onLyrics,
}: CardFaceProps) {
  const [coverIdx, setCoverIdx] = useState(0);
  const covers = [
    song.coverLarge,
    song.coverMedium,
    song.cover,
    PLACEHOLDER_IMAGE,
  ].filter(Boolean) as string[];
  const cover = covers[coverIdx] || PLACEHOLDER_IMAGE;

  return (
    <div
className={cn(
        "flex h-full w-full select-none flex-col overflow-hidden rounded-2xl border border-border bg-card text-left",
        isCenter
          ? "border-border shadow-[0_0_60px_var(--t-shadow-accent),0_10px_40px_var(--t-shadow-deep)]"
          : "shadow-xl shadow-[var(--t-shadow-deep)]",
      )}
    >
      {/* Full square album artwork */}
      <div className="relative aspect-square w-full shrink-0 overflow-hidden">
        <img
          src={cover}
          alt={song.title}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => {
            if (coverIdx < covers.length - 1) setCoverIdx((i) => i + 1);
          }}
        />
<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-accent/70 via-transparent to-transparent" />

        {/* NOW PLAYING label (center card, when playing) */}
        {isCenter && isPlaying && (
          <span className="pointer-events-none absolute bottom-12 left-3 text-[10px] font-bold uppercase tracking-widest text-accent-foreground drop-shadow-lg">
            NOW PLAYING
          </span>
        )}

        {/* Play button overlay on artwork (center card) */}
        {isCenter && (
          <button
            onClick={onPlay}
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 fill-current" />
            )}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col gap-1 p-3">
<p
          className={cn(
            "line-clamp-2 font-bold leading-snug text-foreground",
            isCenter ? "text-[15px]" : "text-sm",
          )}
        >
          {song.title}
        </p>
        <p className="line-clamp-1 text-xs text-secondary-text">{song.artist}</p>
        {isCenter && (
          <p className="line-clamp-1 text-[11px] text-secondary-text/70">{song.album}</p>
        )}
        <Equalizer active={isPlaying} className="mt-auto pt-1" />
      </div>

      {/* Actions: View Lyrics + Heart (center) or just Heart (side) */}
      <div className="flex items-center gap-2 px-3 pb-3">
{isCenter && (
          <button
            onClick={onLyrics}
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Search className="h-3.5 w-3.5" />
            View Lyrics
          </button>
        )}
        <button
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={onToggleFavorite}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface transition-colors hover:bg-border/40",
            isFavorite && "text-primary",
          )}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </button>
      </div>
    </div>
  );
}

interface PlayingCardProps {
  song: Song;
  slot: { x: number; y: number; rotate: number; scale: number; z: number; dealDelay: number; key?: string };
  index: number;
  hovered: boolean;
  pushX: number;
  pushY: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onSelect: () => void;
  onCenterLyrics: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  isCenter: boolean;
  isDimmed: boolean;
  detected: boolean;
  detectedSong: DetectedSong | null;
  phase: string;
}

function PlayingCard({
  song,
  slot,
  index,
  hovered,
  pushX,
  pushY,
  onMouseEnter,
  onMouseLeave,
  onSelect,
  onCenterLyrics,
  onToggleFavorite,
  isFavorite,
  isCenter,
  isDimmed,
  detected,
  detectedSong,
  phase,
}: PlayingCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dealed, setDealed] = useState(false);
  const { isPlaying } = usePreviewPlayback(song.previewUrl);

  const rotateFinal = hovered || (detected && isCenter) ? 0 : slot.rotate;
  const scale = hovered ? 1.03 : slot.scale;

  const opacity = isDimmed ? 0.45 : hovered ? 1 : isCenter ? 1 : 0.92;
  const blur = isDimmed ? "blur(4px)" : "blur(0px)";

  const handlePlay = () => {
    if (!song.previewUrl) return;
    const expected = new URL(song.previewUrl, window.location.href).href;
    if (getPreviewingUrl() === expected) stopPreview();
    else playPreview(song.previewUrl);
  };

  return (
    <motion.div
      ref={ref}
      className="absolute left-1/2 top-[14%] will-change-transform"
      style={{ zIndex: hovered ? 90 : slot.z, perspective: 900, cursor: "pointer" }}
      initial={{ x: 0, y: 0, rotate: 0, scale: 0.35, z: 60, opacity: 0.6 }}
      animate={{
        x: slot.x + pushX,
        y: slot.y + pushY + (hovered ? -22 : 0),
        rotate: rotateFinal,
        scale,
        opacity,
        filter: blur,
      }}
      exit={{
        x: slot.x + (slot.x < 0 ? -70 : slot.x > 0 ? 70 : 0),
        y: slot.y - 90,
        rotate: slot.rotate + (slot.rotate > 0 ? 30 : slot.rotate < 0 ? -30 : 0),
        scale: 0.4,
        opacity: 0,
        filter: "blur(6px)",
        transition: { type: "spring", stiffness: 200, damping: 26, mass: 0.9 },
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 24,
        mass: 0.9,
        delay: dealed ? 0 : slot.dealDelay,
      }}
      onAnimationComplete={() => setDealed(true)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onSelect}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{
          repeat: Infinity,
          duration: 4 + (index % 3) * 0.7,
          ease: "easeInOut",
          delay: index * 0.4,
        }}
      >
        <motion.div
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateX: pushY * -0.08, rotateY: pushX * 0.08 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <div
            className={cn(
              "rounded-2xl",
              isCenter ? "w-[240px] lg:w-[260px]" : "w-[170px] lg:w-[190px]",
            )}
          >
            <CardFace
              song={song}
              isCenter={isCenter}
              isFavorite={isFavorite}
              isPlaying={isPlaying}
              onToggleFavorite={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              onPlay={(e) => { e.stopPropagation(); handlePlay(); }}
              onLyrics={(e) => { e.stopPropagation(); onCenterLyrics(); }}
            />
          </div>
          {detected && (
            <DetectedOverlay
              title={detectedSong?.title || song.title}
              artist={detectedSong?.artist || song.artist}
              cover={detectedSong?.coverUrl || null}
              phase={phase}
              onLyrics={onCenterLyrics}
            />
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

interface MobileCardProps {
  song: Song;
  onSelect: () => void;
  onLyrics: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

function MobileCard({ song, onSelect, onLyrics, onToggleFavorite, isFavorite }: MobileCardProps) {
  const { isPlaying } = usePreviewPlayback(song.previewUrl);
  const [coverIdx, setCoverIdx] = useState(0);
  const covers = [
    song.coverLarge,
    song.coverMedium,
    song.cover,
    PLACEHOLDER_IMAGE,
  ].filter(Boolean) as string[];

  const handlePlay = () => {
    if (!song.previewUrl) return;
    const expected = new URL(song.previewUrl, window.location.href).href;
    if (getPreviewingUrl() === expected) stopPreview();
    else playPreview(song.previewUrl);
  };

  return (
<div className="w-52 shrink-0 snap-center" onClick={onSelect}>
      <div className="rounded-2xl border border-border bg-card p-3 shadow-xl shadow-[var(--t-shadow-deep)]">
        <div className="flex items-center gap-3">
          <img
            src={covers[coverIdx] || PLACEHOLDER_IMAGE}
            alt={song.title}
            className="h-14 w-14 rounded-xl object-cover"
            loading="lazy"
            onError={() => {
              if (coverIdx < covers.length - 1) setCoverIdx((i) => i + 1);
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-bold text-foreground">{song.title}</p>
            <p className="line-clamp-1 text-xs text-secondary-text">{song.artist}</p>
            <p className="line-clamp-1 text-[11px] text-secondary-text/70">{song.album}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button
            aria-label="Toggle favorite"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-border/40",
              isFavorite && "text-primary",
            )}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
          </button>
          <button
            aria-label="Lyrics"
            onClick={(e) => {
              e.stopPropagation();
              onLyrics();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground transition-colors hover:bg-border/40"
          >
            <Music2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface MusicShowcaseProps {
  detectedTrack?: Song | null;
  listening?: boolean;
  analyzing?: boolean;
  phase?: string;
  detected?: DetectedSong | null;
  onLyrics?: () => void;
  onSelect?: () => void;
}

export function MusicShowcase({
  detectedTrack,
  listening,
  analyzing,
  phase,
  detected,
  onLyrics,
  onSelect,
}: MusicShowcaseProps) {
  const navigate = useNavigate();
  const { searchOpen } = useUI();
  const { pool, loading, error, retry } = useFeaturedSongs();
  const isDesktop = useIsDesktop();
  const favoriteSongIds = useFavoritesStore((s) => s.songIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const [currentBatch, setCurrentBatch] = useState(0);
  const [deck, setDeck] = useState<number[]>([]);
  const [hoveredSlotKey, setHoveredSlotKey] = useState<string | null>(null);
  const [areaHovered, setAreaHovered] = useState(false);
  const [manualSearchFocused, setManualSearchFocused] = useState(false);
  const [clearedDetection, setClearedDetection] = useState(false);

  const shownRef = useRef<ShownTracker>({ poolKey: "", hindi: new Set(), english: new Set() });

  const numBatches = Math.max(1, Math.ceil(pool.length / BATCH_SIZE));
  const slots = isDesktop ? SLOTS : SLOTS_MD;

  // (Re)build the deck whenever the pool or the batch changes.
  useEffect(() => {
    if (pool.length === 0) return;

    // A freshly fetched pool restarts the shown-tracking cycle.
    const poolKey = pool[0].id;
    if (shownRef.current.poolKey !== poolKey) {
      shownRef.current = { poolKey, hindi: new Set(), english: new Set() };
    }

    const hindiIdx: number[] = [];
    const englishIdx: number[] = [];
    const unknownIdx: number[] = [];
    pool.forEach((s, i) => {
      if (s.language === "hindi") hindiIdx.push(i);
      else if (s.language === "english") englishIdx.push(i);
      else unknownIdx.push(i);
    });
    // Untagged songs (fallback data) join whichever pool is smaller.
    for (const i of unknownIdx) {
      if (hindiIdx.length <= englishIdx.length) hindiIdx.push(i);
      else englishIdx.push(i);
    }

    setDeck(
      buildMixedBatch(
        pool,
        shuffleSongs(hindiIdx),
        shuffleSongs(englishIdx),
        LANG_PATTERNS[currentBatch % LANG_PATTERNS.length],
        shownRef.current,
      ),
    );
  }, [pool, currentBatch]);

  const visibleSongs = useMemo(
    () => deck.map((i) => pool[i]).filter((s): s is Song => Boolean(s)),
    [deck, pool],
  );

  const activeDetection = clearedDetection ? null : (detected ?? null);

  // Pause rotation while the user or the app is busy.
  const isPaused =
    areaHovered ||
    searchOpen ||
    manualSearchFocused ||
    listening ||
    analyzing ||
    Boolean(activeDetection);

  // Auto-rotate the deck every 20-30 seconds.
  useEffect(() => {
    if (isPaused) return;
    if (numBatches <= 1) return;
    const delay = ROTATION_MIN_MS + Math.floor(Math.random() * ROTATION_JITTER_MS);
    const t = window.setTimeout(() => {
      setCurrentBatch((b) => (b + 1) % numBatches);
    }, delay);
    return () => window.clearTimeout(t);
  }, [isPaused, currentBatch, numBatches]);

  // A new detection re-enables the overlay in case it was dismissed before.
  useEffect(() => {
    setClearedDetection(false);
  }, [detected]);

  // Bring the detected song to the center card once identified.
  useEffect(() => {
    const target = detected ? detected.title : detectedTrack?.title;
    if (!target) return;
    const idx = pool.findIndex((s) => norm(s.title) === norm(target));
    if (idx === -1) return;
    setDeck((w) => {
      if (w[0] === idx) return w;
      return [idx, ...w.filter((i) => i !== idx)].slice(0, BATCH_SIZE);
    });
  }, [detected, detectedTrack, pool]);

  // Pause auto-rotation while typing in the manual search box.
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if ((e.target as HTMLElement)?.closest("#manual-search")) setManualSearchFocused(true);
    };
    const onFocusOut = (e: FocusEvent) => {
      if ((e.target as HTMLElement)?.closest("#manual-search")) setManualSearchFocused(false);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  /** Move the clicked card into the center slot. */
  const handleSelect = (slotIndex: number) => {
    stopPreview();
    setClearedDetection(true);
    onSelect?.();
    setDeck((w) => {
      if (slotIndex >= w.length) return w;
      const target = w[slotIndex];
      return [target, ...w.filter((_, i) => i !== slotIndex)];
    });
  };

  const centerSong = visibleSongs[0];

  const favId = activeDetection ? `detected-${activeDetection.title}` : centerSong?.id ?? "";
  const isCenterFavorite = favoriteSongIds.includes(favId);

  const handleFavorite = () => {
    if (activeDetection) {
      toggleFavorite({
        id: favId,
        type: "song",
        title: activeDetection.title,
        subtitle: activeDetection.artist,
        image: activeDetection.coverUrl,
      });
    } else if (centerSong) {
      toggleFavorite({
        id: centerSong.id,
        type: "song",
        title: centerSong.title,
        subtitle: centerSong.artist,
        image: centerSong.cover,
      });
    }
  };

  const handleCenterLyrics = () => {
    if (activeDetection) {
      onLyrics?.();
    } else if (centerSong) {
      navigate(songHref(centerSong));
    }
  };

  const detectionPhase = phase && phase !== "Ready" ? phase : "Identified";

  if (loading && pool.length === 0) {
    return (
      <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-2xl border border-border bg-card/60"
          />
        ))}
      </div>
    );
  }

  if (error && pool.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-border bg-card/60 p-8 text-center">
        <Search className="h-8 w-8 text-muted" />
        <p className="text-sm text-secondary-text">{error}</p>
        <button
          onClick={retry}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (pool.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2 rounded-2xl border border-border bg-card/60 p-8 text-center">
        <Music className="h-8 w-8 text-muted" />
        <p className="text-sm text-secondary-text">No songs available right now.</p>
      </div>
    );
  }

  return (
    <section className="relative flex flex-col items-center">
      {/* Desktop / tablet deck */}
      <div
        className="relative hidden h-[440px] w-full md:block lg:h-[480px]"
        style={{ perspective: 1400 }}
        onMouseEnter={() => setAreaHovered(true)}
        onMouseLeave={() => setAreaHovered(false)}
        onTouchStart={() => setAreaHovered(true)}
        onTouchEnd={() => setAreaHovered(false)}
        onTouchCancel={() => setAreaHovered(false)}
      >
        <AnimatePresence>
          {visibleSongs.slice(0, slots.length).map((song, i) => {
            const slot = slots[i];
            const isCenter = i === 0;
            const isHoveredCard = hoveredSlotKey === String(i);
            const anyHovered = hoveredSlotKey !== null;
            const pushX = isHoveredCard ? 0 : anyHovered ? (slot.x < 0 ? 8 : slot.x > 0 ? -8 : 0) : 0;
            const pushY = isHoveredCard ? 0 : anyHovered ? (slot.y < 0 ? 8 : slot.y > 0 ? -8 : 0) : 0;
            const isDimmed = Boolean(activeDetection) && !isCenter;

            return (
              <PlayingCard
                key={song.id}
                song={song}
                slot={slot}
                index={i}
                hovered={isHoveredCard}
                pushX={pushX}
                pushY={pushY}
                onMouseEnter={() => setHoveredSlotKey(String(i))}
                onMouseLeave={() => setHoveredSlotKey(null)}
                onSelect={() => handleSelect(i)}
                onCenterLyrics={handleCenterLyrics}
                onToggleFavorite={handleFavorite}
                isFavorite={isCenterFavorite}
                isCenter={isCenter}
                isDimmed={isDimmed}
                detected={Boolean(activeDetection) && isCenter}
                detectedSong={activeDetection}
                phase={detectionPhase}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Mobile carousel */}
      <div
        className="-mx-4 flex w-[calc(100%+2rem)] snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 pt-4 md:hidden"
        onTouchStart={() => setAreaHovered(true)}
        onTouchEnd={() => setAreaHovered(false)}
        onTouchCancel={() => setAreaHovered(false)}
      >
        {visibleSongs.map((song) => (
          <MobileCard
            key={song.id}
            song={song}
            onSelect={() => navigate(songHref(song))}
            onLyrics={() => navigate(songHref(song))}
            onToggleFavorite={() => {
              toggleFavorite({
                id: song.id,
                type: "song",
                title: song.title,
                subtitle: song.artist,
                image: song.cover,
              });
            }}
            isFavorite={favoriteSongIds.includes(song.id)}
          />
        ))}
      </div>
    </section>
  );
}
