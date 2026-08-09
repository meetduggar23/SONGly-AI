import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Music2 } from "lucide-react";
import type { Lyrics } from "@/types";
import { cn } from "@/utils/cn";
import { parseLyricsToBlocks, isInstrumental } from "@/utils/lyrics";
import { usePreviewPlayback } from "@/hooks/usePreviewPlayback";
import { Button } from "@/components/ui/button";

interface LyricsViewerProps {
  lyrics: Lyrics;
  loading?: boolean;
  /** Preview URL used to drive the active-line highlight on synced lyrics. */
  previewUrl?: string;
}

/** A synced lyric line with its timestamp (seconds). */
interface SyncedLine {
  time: number;
  text: string;
}

/**
 * Parse LRC-style timestamped lyrics (e.g. `[00:27.93] Swim, swim`).
 * Returns null as soon as any line isn't timestamped, so plain lyrics never
 * get a fake synchronization.
 */
function parseSyncedLyrics(text: string): SyncedLine[] | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const regex = /^\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]\s*(.*)$/;
  const entries: SyncedLine[] = [];
  for (const line of lines) {
    const match = line.match(regex);
    if (!match) return null;
    const text = match[4].trim();
    if (!text) return null;
    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const fraction = Number(match[3] ?? 0);
    entries.push({ time: minutes * 60 + seconds + fraction / 1000, text });
  }
  return entries;
}

/**
 * Synced lyrics with an active-line highlight driven by the shared preview
 * playback progress. When nothing is playing every line stays readable.
 */
function SyncedLyrics({
  entries,
  previewUrl,
}: {
  entries: SyncedLine[];
  previewUrl?: string;
}) {
  const { progress } = usePreviewPlayback(previewUrl);
  const activeRef = useRef<HTMLParagraphElement>(null);

  const currentTime = progress?.current ?? null;
  let activeIndex = -1;
  if (currentTime !== null) {
    activeIndex = entries.findIndex((entry, i) => {
      const next = entries[i + 1];
      return currentTime >= entry.time && (!next || currentTime < next.time);
    });
  }

  useEffect(() => {
    if (activeIndex >= 0) {
      activeRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex]);

  const syncing = currentTime !== null;

  return (
    <div className="mx-auto max-w-3xl space-y-1.5 px-2">
      {entries.map((entry, i) => {
        const active = i === activeIndex;
        return (
          <p
            key={i}
            ref={active ? activeRef : undefined}
            className={cn(
              "text-center text-xl leading-[1.9] text-foreground/90 transition-all duration-300 sm:text-2xl sm:leading-[2]",
              syncing &&
                (active
                  ? "scale-[1.04] font-medium text-foreground"
                  : "text-secondary-text/70"),
            )}
          >
            {entry.text}
          </p>
        );
      })}
    </div>
  );
}

/** Centered, flowing plain lyrics — clean and musical, not document-like. */
function PlainLyrics({ text }: { text: string }) {
  const blocks = parseLyricsToBlocks(text);
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-2">
      {blocks.map((block, i) => (
        <div key={i} className="space-y-1.5">
          {block.map((line, j) => (
            <p
              key={j}
              className="text-center text-xl leading-[1.9] text-foreground/90 sm:text-2xl sm:leading-[2]"
            >
              {line}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton for 5–8 lyric lines while lyrics load. */
function LyricsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-4 px-2">
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

export function LyricsViewer({
  lyrics,
  loading,
  previewUrl,
}: LyricsViewerProps) {
  const navigate = useNavigate();

  if (loading) {
    return <LyricsSkeleton />;
  }

  if (!lyrics.lyrics || lyrics.source === "none") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center py-8 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Music2 className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-foreground">
          Lyrics aren&apos;t available for this song.
        </h3>
        <p className="mt-1.5 text-sm text-secondary-text">
          We couldn&apos;t find lyrics for this track in our sources.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="mt-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Song
        </Button>
      </motion.div>
    );
  }

  if (isInstrumental(lyrics.lyrics)) {
    return (
      <div className="py-10 text-center">
        <p className="text-xl font-medium text-foreground">Instrumental</p>
        <p className="mt-2 text-sm text-secondary-text">
          This track appears to be instrumental.
        </p>
      </div>
    );
  }

  const synced = lyrics.synced ? parseSyncedLyrics(lyrics.lyrics) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {synced ? (
        <SyncedLyrics entries={synced} previewUrl={previewUrl} />
      ) : (
        <PlainLyrics text={lyrics.lyrics} />
      )}
    </motion.div>
  );
}
