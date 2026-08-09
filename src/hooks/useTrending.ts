import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchTrendingSongs,
  type TrendingChart,
  type TrendingRegion,
} from "@/services/music/itunesService";

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Trending chart data for a region.
 * - Fetches Apple's real top-songs feed (cached 30 min in the service).
 * - Switching regions loads the new chart without a page reload.
 * - Auto-refreshes every 30 minutes while mounted and again when the tab
 *   regains focus, so the page always opens with fresh data. Existing data
 *   stays visible during background refreshes (no skeleton flicker).
 */
export function useTrending(region: TrendingRegion) {
  const [chart, setChart] = useState<TrendingChart | null>(null);
  const [regionLoaded, setRegionLoaded] = useState<TrendingRegion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const seqRef = useRef(0);
  const loadedRegionRef = useRef<TrendingRegion | null>(null);

  const load = useCallback(
    async (target: TrendingRegion, opts?: { refreshing?: boolean }) => {
      const seq = ++seqRef.current;
      // Skeletons only for the initial load / a region switch — background
      // refreshes keep the existing chart visible.
      const fresh = loadedRegionRef.current !== target;
      if (fresh) setIsLoading(true);
      if (opts?.refreshing) setIsRefreshing(true);
      try {
        const result = await fetchTrendingSongs(target);
        if (seqRef.current !== seq) return;
        setChart(result);
        setRegionLoaded(target);
        loadedRegionRef.current = target;
        setError(false);
      } catch {
        if (seqRef.current !== seq) return;
        // Keep showing existing data; only surface an error when nothing loaded.
        if (loadedRegionRef.current !== target) setError(true);
      } finally {
        if (seqRef.current === seq && fresh) setIsLoading(false);
        if (seqRef.current === seq && opts?.refreshing) setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(region);
  }, [region, load]);

  // Periodic refresh (sensible cadence for a chart — not a live animation).
  useEffect(() => {
    const id = window.setInterval(() => void load(region), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [region, load]);

  // Re-fetch whenever the page is opened/focused again (TTL-guarded in service).
  useEffect(() => {
    const onFocus = () => void load(region);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [region, load]);

  const retry = useCallback(() => void load(region), [region, load]);
  const refresh = useCallback(
    () => void load(region, { refreshing: true }),
    [region, load],
  );

  return {
    chart,
    regionLoaded,
    isLoading,
    isRefreshing,
    error,
    retry,
    refresh,
  };
}
