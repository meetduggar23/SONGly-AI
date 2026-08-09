import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, User, Music2, type LucideIcon } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useSearchResults } from "@/hooks/useSearch";
import { SongCard } from "@/components/feature/SongCard";
import { ArtistCard } from "@/components/feature/ArtistCard";
import { CardGridSkeleton } from "@/components/feature/Loaders";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/utils/cn";

type Tab = "all" | "songs" | "artists";

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { results, loading, error } = useSearchResults(query);
  const [tab, setTab] = useState<Tab>("all");

  useDocumentTitle(query ? `Search: ${query}` : "Search");

  const tabs: { id: Tab; label: string; count?: number; icon: LucideIcon }[] = [
    { id: "all", label: "All", count: results.totalResults, icon: Search },
    { id: "songs", label: "Songs", count: results.songs.length, icon: Music2 },
    { id: "artists", label: "Artists", count: results.artists.length, icon: User },
  ];

  if (!query) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Search for music"
          description="Enter a song, artist, or album to see results."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-foreground">
          Results for “{query}”
        </h1>
        <CardGridSkeleton count={10} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <ErrorState title="Search failed" message={error} />
      </div>
    );
  }

  const showSongs = tab === "all" || tab === "songs";
  const showArtists = tab === "all" || tab === "artists";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
        Results for “{query}”
      </h1>
      <p className="mb-6 text-sm text-secondary-text">
        {results.totalResults} results found
      </p>

      {/* Tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-secondary-text hover:text-foreground",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {typeof t.count === "number" && (
<span className={cn("text-xs", tab === t.id ? "text-primary-foreground/70" : "text-muted")}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Songs */}
      {showSongs && (
        <section className="mb-10">
          {results.songs.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {results.songs.map((song, i) => (
                <SongCard key={song.id} song={song} index={i} />
              ))}
            </div>
          ) : tab === "songs" ? (
            <EmptyState icon={<Music2 className="h-8 w-8 text-primary" />} title="No songs found" />
          ) : null}
        </section>
      )}

      {/* Artists */}
      {showArtists && (
        <section className="mb-10">
          {results.artists.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {results.artists.map((artist, i) => (
                <ArtistCard key={artist.id} artist={artist} index={i} />
              ))}
            </div>
          ) : tab === "artists" ? (
            <EmptyState icon={<User className="h-8 w-8 text-primary" />} title="No artists found" />
          ) : null}
        </section>
      )}

      {results.totalResults === 0 && (
        <EmptyState
          title="No results found"
          description={`We couldn't find anything for "${query}". Try different keywords.`}
        />
      )}
    </div>
  );
}
