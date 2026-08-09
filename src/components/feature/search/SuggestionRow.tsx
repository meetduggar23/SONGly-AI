import { motion } from "framer-motion";
import { Music2, Play, Pause, FileText } from "lucide-react";
import { cn } from "@/utils/cn";
import { usePreviewPlayback } from "@/hooks/usePreviewPlayback";
import type { SearchSuggestion, Song } from "@/types";

/** Tiny animated equalizer shown next to the title of the playing song. */
export function MiniEqualizer() {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[2px] rounded-full bg-primary"
          animate={{ height: [3, 9, 3] }}
          transition={{
            repeat: Infinity,
            duration: 0.6,
            delay: i * 0.12,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

interface SuggestionRowProps {
  suggestion: SearchSuggestion;
  active?: boolean;
  /** When true, the play button stays visible without hover. */
  alwaysShowPlay?: boolean;
  onSelect: () => void;
  onActiveChange?: () => void;
  onTogglePlay: (previewUrl: string, isPlaying: boolean) => void;
  /** Opens the lyrics panel for a song suggestion without navigating. */
  onViewLyrics?: (song: Song) => void;
}

/**
 * One autocomplete suggestion row: artwork, title, artist/album, and a small
 * circular play/pause button that previews the song through the shared
 * single-instance audio manager. Clicking the row selects the suggestion;
 * clicking the play button only toggles preview.
 */
export function SuggestionRow({
  suggestion,
  active = false,
  alwaysShowPlay = false,
  onSelect,
  onActiveChange,
  onTogglePlay,
  onViewLyrics,
}: SuggestionRowProps) {
  const previewUrl = suggestion.song?.previewUrl;
  const { isPlaying, progress } = usePreviewPlayback(previewUrl);

  const handlePlay = (e: React.MouseEvent) => {
    // Play toggles preview only — never select the row.
    e.stopPropagation();
    e.preventDefault();
    if (!previewUrl) return;
    onTogglePlay(previewUrl, isPlaying);
  };

  const handleViewLyrics = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (suggestion.song && onViewLyrics) onViewLyrics(suggestion.song);
  };

  const progressPct =
    progress && progress.duration > 0
      ? Math.min(100, (progress.current / progress.duration) * 100)
      : 0;

  return (
    <div
      role="button"
      tabIndex={-1}
      onMouseEnter={onActiveChange}
      onMouseDown={(e) => {
        // Fire before blur/outside-click closes the dropdown.
        e.preventDefault();
        onSelect();
      }}
      className={cn(
        "group relative flex w-full min-w-0 max-w-full items-center gap-3 overflow-hidden border-l-2 border-transparent px-3 py-2.5 text-left transition-colors",
        active ? "border-primary bg-primary/[0.07]" : "hover:bg-primary/[0.04]",
      )}
    >
      {suggestion.cover ? (
        <img
          src={suggestion.cover}
          alt=""
          className={cn(
            "h-10 w-10 shrink-0 rounded-lg object-cover transition-shadow",
            isPlaying &&
              "shadow-[0_0_0_2px_rgba(29,69,51,0.45),0_0_14px_rgba(29,69,51,0.35)]",
          )}
          loading="lazy"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface">
          <Music2 className="h-4 w-4 text-primary/60" />
        </span>
      )}

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              "min-w-0 break-words text-sm font-semibold text-foreground",
              isPlaying && "text-primary",
            )}
          >
            {suggestion.title}
          </span>
          {isPlaying && <MiniEqualizer />}
        </span>
        <span className="min-w-0 break-words text-xs text-secondary-text">
          {suggestion.subtitle}
        </span>
      </span>

      {/* Play / pause preview — only for songs that have a preview URL */}
      {suggestion.kind === "song" && previewUrl && (
        <button
          type="button"
          aria-label={isPlaying ? "Pause preview" : "Play preview"}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onClick={handlePlay}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200",
            "hover:bg-primary-hover hover:shadow-primary/40",
            isPlaying || alwaysShowPlay
              ? "opacity-100"
              : "opacity-100 md:opacity-0 md:group-hover:opacity-100",
          )}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
        </button>
      )}

      {/* View lyrics — opens the panel without re-searching the song */}
      {suggestion.kind === "song" && suggestion.song && onViewLyrics && (
        <button
          type="button"
          aria-label="View lyrics"
          title="View lyrics"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onClick={handleViewLyrics}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-secondary-text opacity-100 transition-all duration-200 hover:bg-primary/10 hover:text-primary md:opacity-0 md:group-hover:opacity-100"
        >
          <FileText className="h-4 w-4" />
        </button>
      )}

      {/* Slim progress bar under the row while playing */}
      {isPlaying && (
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden rounded-b-2xl bg-border"
          aria-hidden="true"
        >
          <span
            className="block h-full bg-primary transition-[width] duration-300 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </span>
      )}
    </div>
  );
}
