import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface DiscoverMoreFooterProps {
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  className?: string;
}

/**
 * Subtle "Discover more music →" footer for the suggestion dropdown.
 * While more results load it swaps to a quiet spinner, and when the pool is
 * exhausted it shows a short end-of-results message instead.
 */
export function DiscoverMoreFooter({
  hasMore,
  isLoadingMore,
  onLoadMore,
  className,
}: DiscoverMoreFooterProps) {
  return (
    <div className={cn("border-t border-search-border", className)}>
      {hasMore ? (
        isLoadingMore ? (
          <div className="flex w-full items-center justify-center gap-2 px-4 py-3 text-xs font-medium text-secondary-text">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            Loading more music…
          </div>
        ) : (
          <button
            type="button"
            onClick={onLoadMore}
            className="group flex w-full items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted transition-colors hover:text-primary"
          >
            Discover more music
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        )
      ) : (
        <div className="flex w-full items-center justify-center px-4 py-3 text-center text-[11px] font-medium text-muted/70">
          You&rsquo;ve discovered all available music.
        </div>
      )}
    </div>
  );
}
