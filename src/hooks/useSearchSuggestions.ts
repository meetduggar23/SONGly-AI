import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { searchSuggestions } from "@/services/music/itunesService";
import type { SearchSuggestion } from "@/types";

/** Deduplicate by unique id (trackId-based for songs). */
function dedupe(items: SearchSuggestion[]): SearchSuggestion[] {
  const seen = new Set<string>();
  return items.filter((s) => {
    const key = `${s.kind}:${s.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Autocomplete suggestions for the main search input.
 * - Waits ~300ms after the user stops typing before calling the API.
 * - Requires at least 2 characters.
 * - Shows `pageSize` results initially; `loadMore` appends the next page
 *   without reloading the existing list (deduplicated by trackId).
 * - Ignores responses that arrive after the query changed (no flicker).
 * - Repeated queries are served from the service-level cache.
 */
export function useSearchSuggestions(query: string, pageSize = 5) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const requestSeq = useRef(0);
  const loadingMoreRef = useRef(false);
  const suggestionsRef = useRef<SearchSuggestion[]>([]);
  suggestionsRef.current = suggestions;

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      requestSeq.current += 1;
      loadingMoreRef.current = false;
      setSuggestions([]);
      setTotal(0);
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    const seq = ++requestSeq.current;
    loadingMoreRef.current = false;
    setIsLoading(true);
    setIsLoadingMore(false);

    searchSuggestions(q, 0, pageSize).then(({ items, total: t }) => {
      if (requestSeq.current !== seq) return;
      setSuggestions(items);
      setTotal(t);
      setIsLoading(false);
    });
  }, [debouncedQuery, pageSize]);

  const loadMore = useCallback(async () => {
    const q = debouncedQuery.trim();
    if (q.length < 2 || loadingMoreRef.current) return;
    const seq = requestSeq.current;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const { items, total: t } = await searchSuggestions(
        q,
        suggestionsRef.current.length,
        pageSize,
      );
      if (requestSeq.current !== seq) return;
      setSuggestions((prev) => dedupe([...prev, ...items]));
      setTotal(t);
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [debouncedQuery, pageSize]);

  const clearSuggestions = useCallback(() => {
    requestSeq.current += 1;
    loadingMoreRef.current = false;
    setSuggestions([]);
    setTotal(0);
    setIsLoading(false);
    setIsLoadingMore(false);
  }, []);

  const hasMore = suggestions.length < total;

  return {
    suggestions,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    clearSuggestions,
  };
}
