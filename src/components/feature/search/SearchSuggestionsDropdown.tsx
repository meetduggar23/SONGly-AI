import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import { stopPreview, playPreview } from "@/utils/audio";
import { SuggestionRow } from "@/components/feature/search/SuggestionRow";
import { DiscoverMoreFooter } from "@/components/feature/search/DiscoverMoreFooter";
import type { SearchSuggestion } from "@/types";

interface SearchSuggestionsDropdownProps {
  open: boolean;
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  activeIndex: number;
  onSelect: (suggestion: SearchSuggestion, index: number) => void;
  onActiveIndexChange: (index: number) => void;
  onLoadMore: () => void;
  onClose: () => void;
}

/**
 * Autocomplete dropdown rendered directly underneath the main search input.
 * Stays visually attached to the search bar (same width, warm dark/cream
 * surface, subtle border, soft shadow, 12px backdrop blur) with a thin green
 * accent on the active row. The list scrolls vertically only — it never
 * creates horizontal overflow. "Discover more music" appends the next page
 * without closing the dropdown or reloading the existing results.
 */
export function SearchSuggestionsDropdown({
  open,
  suggestions,
  isLoading,
  hasMore,
  isLoadingMore,
  activeIndex,
  onSelect,
  onActiveIndexChange,
  onLoadMore,
  onClose,
}: SearchSuggestionsDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef(false);

  // Close when the user clicks outside the search area.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, onClose]);

  // Track whether a preview started from this dropdown so we can stop it
  // when the dropdown unmounts (navigating away from the search page).
  useEffect(() => {
    return () => {
      if (playingRef.current) stopPreview();
    };
  }, []);

  const handleTogglePlay = (previewUrl: string, isPlaying: boolean) => {
    if (isPlaying) {
      stopPreview();
      playingRef.current = false;
    } else {
      playPreview(previewUrl);
      playingRef.current = true;
    }
  };

  const showEmpty = open && !isLoading && suggestions.length === 0;

  return (
    <div ref={rootRef} className="relative w-full max-w-full">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 w-full max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-search-border bg-search-surface/95 shadow-[0_16px_48px_var(--t-search-shadow)] backdrop-blur-[12px]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2.5 px-4 py-3 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Searching…
              </div>
            ) : (
              <>
                <div className="search-scroll max-h-[420px] w-full max-w-full overflow-y-auto overflow-x-hidden">
                  {suggestions.map((s, i) => (
                    <SuggestionRow
                      key={`${s.kind}-${s.id}`}
                      suggestion={s}
                      active={i === activeIndex}
                      onSelect={() => onSelect(s, i)}
                      onActiveChange={() => onActiveIndexChange(i)}
                      onTogglePlay={handleTogglePlay}
                    />
                  ))}

                  {showEmpty && (
                    <div className="flex items-center gap-2.5 px-4 py-3 text-sm text-muted">
                      <Search className="h-4 w-4" />
                      No matching songs
                    </div>
                  )}
                </div>

                {suggestions.length > 0 && (
                  <DiscoverMoreFooter
                    hasMore={hasMore}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={onLoadMore}
                  />
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
