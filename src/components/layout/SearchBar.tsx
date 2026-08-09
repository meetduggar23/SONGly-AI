import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, X, TrendingUp } from "lucide-react";
import { useUI } from "@/context/useUI";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { stopPreview, playPreview } from "@/utils/audio";
import { navigateToSuggestion } from "@/utils/suggestionNavigation";
import { SuggestionRow } from "@/components/feature/search/SuggestionRow";
import { DiscoverMoreFooter } from "@/components/feature/search/DiscoverMoreFooter";
import type { SearchSuggestion } from "@/types";

export function SearchBar() {
  const { searchOpen, closeSearch, openLyrics } = useUI();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { suggestions, hasMore, isLoading, isLoadingMore, loadMore, clearSuggestions } =
    useSearchSuggestions(query);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const playingRef = useRef(false);

  // Stop previews started from this modal when it unmounts (closes).
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

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    closeSearch();
    navigateToSuggestion(navigate, suggestion);
    clearSuggestions();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    closeSearch();
    navigate(`/search?q=${encodeURIComponent(query)}`);
    clearSuggestions();
  };

  useKeyboardNavigation({
    items: suggestions,
    activeIndex,
    onActiveChange: setActiveIndex,
    onSelect: (item) => selectSuggestion(item),
    enabled: searchOpen && suggestions.length > 0,
  });

  if (!searchOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeSearch}
        aria-hidden="true"
      />
      <motion.div
        initial={{ y: -20, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -20, opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <form onSubmit={handleSubmit} className="group flex items-center gap-3 border-b border-border p-4">
          <Search className="h-4 w-4 shrink-0 text-muted/80 transition-colors group-focus-within:text-primary" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
placeholder="Search songs or artists…"
            className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted focus:outline-none"
            aria-label="Search"
          />
          {isLoading && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          )}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveIndex(-1);
              }}
              className="text-secondary-text hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={closeSearch}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-secondary-text hover:text-foreground"
          >
            ESC
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden p-2">
          {!query && (
            <div className="flex items-center gap-3 p-4 text-sm text-secondary-text">
              <TrendingUp className="h-4 w-4 text-primary" />
              Type to search across songs, artists, and albums.
            </div>
          )}

          {query && suggestions.length === 0 && !isLoading && (
            <div className="p-4 text-sm text-secondary-text">
              No results for “{query}”. Press Enter to search all.
            </div>
          )}

          {suggestions.map((s, i) => (
            <SuggestionRow
              key={`${s.kind}-${s.id}`}
              suggestion={s}
              active={i === activeIndex}
              onSelect={() => selectSuggestion(s)}
              onActiveChange={() => setActiveIndex(i)}
              onTogglePlay={handleTogglePlay}
              onViewLyrics={openLyrics}
            />
          ))}

          {!isLoading && suggestions.length > 0 && (
            <DiscoverMoreFooter
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMore}
              className="mt-1"
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
