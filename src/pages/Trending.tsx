import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useTrending } from "@/hooks/useTrending";
import {
  TRENDING_REGIONS,
  type TrendingRegion,
} from "@/services/music/itunesService";
import { RegionSelect } from "@/components/feature/trending/RegionSelect";
import { FeaturedSongCard } from "@/components/feature/trending/FeaturedSongCard";
import { TrendingRow } from "@/components/feature/trending/TrendingRow";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { timeAgo } from "@/utils/format";

/** Skeleton placeholders for the featured hero and ranked rows. */
function TrendingSkeleton() {
  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl bg-card p-6 sm:p-10">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-10">
          <Skeleton className="h-60 w-60 shrink-0 rounded-3xl sm:h-72 sm:w-72 lg:h-80 lg:w-80" />
          <div className="w-full flex-1 space-y-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex flex-wrap gap-2 pt-4">
              <Skeleton className="h-11 w-32 rounded-full" />
              <Skeleton className="h-11 w-11 rounded-full" />
              <Skeleton className="h-11 w-36 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-9">
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-2.5">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-14 w-14 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Trending() {
  useDocumentTitle("Trending");
  const [region, setRegion] = useState<TrendingRegion>("IN");
  const {
    chart,
    regionLoaded,
    isLoading,
    isRefreshing,
    error,
    retry,
    refresh,
  } = useTrending(region);

  const ready = !!chart && regionLoaded === region && !isLoading;
  const items = ready ? chart.items : [];
  const featured = items[0];
  const rows = items.slice(1, 20);
  const updatedText =
    ready && chart.fetchedAt ? timeAgo(chart.fetchedAt) : null;
  const regionLabel =
    TRENDING_REGIONS.find((r) => r.code === region)?.label ?? "India";

  return (
    <div className="trending-page min-h-[calc(100vh-4rem)] overflow-x-hidden bg-background">
      <div className="mx-auto max-w-4xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary/80">
            Trending
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Trending Now
          </h1>
          <p className="mt-1.5 text-sm text-secondary-text">
            The songs people are listening to right now.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <RegionSelect value={region} onChange={setRegion} />
            <button
              onClick={refresh}
              disabled={isRefreshing}
              aria-label="Refresh trending chart"
              title="Refresh"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/60 text-secondary-text transition-colors hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-60"
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
            </button>
            {updatedText && (
              <span className="ml-1 text-xs font-medium text-muted">
                Updated {updatedText}
              </span>
            )}
          </div>
        </motion.header>

        {error ? (
          <div className="mt-8">
            <ErrorState
              title="Trending music is temporarily unavailable"
              message="Please try again in a moment."
              onRetry={retry}
            />
          </div>
        ) : !ready ? (
          <div className="mt-8">
            <TrendingSkeleton />
          </div>
        ) : (
          <div className="mt-8">
            {featured && <FeaturedSongCard song={featured} />}

            <section className="mt-10">
              <div className="mb-4 flex items-end justify-between px-1">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Popular Right Now
                  </h2>
                  <p className="mt-1 text-sm text-secondary-text">
                    Fresh from the {regionLabel} chart
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                {rows.map((song, i) => (
                  <TrendingRow key={song.id} song={song} index={i} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
