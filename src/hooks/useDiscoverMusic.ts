import { useCallback, useEffect, useRef, useState } from "react";
import { discoverSongs } from "@/services/music/itunesService";
import type { Song } from "@/types";

/**
 * Live music discovery for the homepage.
 * - Loads real top songs immediately (no search query).
 * - Auto-advances to the next set every `rotateMs` (20–30s) in a loop.
 * - Rotation pauses while `paused` (e.g. while the user hovers the cards).
 * - `goNext` / `goPrev` / `retry` move through the pool manually.
 * - Pages come from the service deduped by trackId, so songs never repeat.
 */
export function useDiscoverMusic(pageSize = 5, rotateMs = 25000) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const seqRef = useRef(0);

  const loadPage = useCallback(
    async (offset: number) => {
      const seq = ++seqRef.current;
      setIsLoading(true);
      try {
        const { items, total: t } = await discoverSongs(offset, pageSize);
        if (seqRef.current !== seq) return;
        setSongs(items);
        setTotal(t);
        setCursor(offset);
      } finally {
        if (seqRef.current === seq) setIsLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    void loadPage(0);
  }, [loadPage]);

  const goNext = useCallback(() => {
    if (total === 0) return;
    const next = (cursor + pageSize) % total;
    void loadPage(next);
  }, [cursor, pageSize, total, loadPage]);

  const goPrev = useCallback(() => {
    if (total === 0) return;
    const prev = (cursor - pageSize + total) % total;
    void loadPage(prev);
  }, [cursor, pageSize, total, loadPage]);

  useEffect(() => {
    if (paused || isLoading) return;
    const id = setTimeout(goNext, rotateMs);
    return () => clearTimeout(id);
  }, [paused, isLoading, goNext, rotateMs]);

  const retry = useCallback(() => {
    void loadPage(cursor);
  }, [cursor, loadPage]);

  return {
    songs,
    total,
    cursor,
    isLoading,
    paused,
    setPaused,
    goNext,
    goPrev,
    retry,
  };
}
