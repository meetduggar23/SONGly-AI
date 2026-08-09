import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Music2, User, Disc3, Trash2, type LucideIcon } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFavoritesStore } from "@/store/favorites";
import type { FavoriteItem, Song, Album } from "@/types";
import { useToastStore, toastSuccess } from "@/store/toast";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PLACEHOLDER_IMAGE } from "@/constants";
import { cn } from "@/utils/cn";

type Filter = "all" | "song" | "artist" | "album";

export function Favorites() {
  useDocumentTitle("Favorites");
  const navigate = useNavigate();
  const { favorites, removeFavorite, clearFavorites } = useFavoritesStore();
  const [filter, setFilter] = useState<Filter>("all");

  const filters: { id: Filter; label: string; icon: LucideIcon; count: number }[] = [
    { id: "all", label: "All", icon: Heart, count: favorites.length },
    { id: "song", label: "Songs", icon: Music2, count: favorites.filter((f) => f.type === "song").length },
    { id: "artist", label: "Artists", icon: User, count: favorites.filter((f) => f.type === "artist").length },
    { id: "album", label: "Albums", icon: Disc3, count: favorites.filter((f) => f.type === "album").length },
  ];

  const filtered = filter === "all" ? favorites : favorites.filter((f) => f.type === filter);

  const handleClear = () => {
    clearFavorites();
    useToastStore.getState().showToast({ type: "info", message: "All favorites cleared." });
  };

  const handleOpen = (item: FavoriteItem) => {
    if (item.type === "song" && item.data) {
      navigate(`/song/${(item.data as Song).id}`);
    } else if (item.type === "artist") {
      navigate(`/artist/${encodeURIComponent(item.title)}`);
    } else if (item.type === "album" && item.data) {
      navigate(`/album/${(item.data as Album).id}`);
    }
  };

  const typeIcon: Record<string, LucideIcon> = {
    song: Music2,
    artist: User,
    album: Disc3,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl">
            <Heart className="h-7 w-7 text-primary" />
            Favorites
          </h1>
          <p className="mt-1 text-sm text-secondary-text">
            Your saved songs, artists, and albums.
          </p>
        </div>
        {favorites.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              filter === f.id
? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-secondary-text hover:text-foreground",
            )}
          >
            <f.icon className="h-4 w-4" />
            {f.label}
<span className={cn("text-xs", filter === f.id ? "text-primary-foreground/70" : "text-muted")}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-8 w-8 text-primary" />}
          title={favorites.length === 0 ? "No favorites yet" : "Nothing here"}
          description={
            favorites.length === 0
              ? "Tap the heart icon on any song, artist, or album to save it here."
              : "No items in this category."
          }
          action={
            <Button onClick={() => navigate("/")}>Find Music</Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const Icon = typeIcon[item.type];
            return (
              <div
                key={item.id}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
              >
                <button
                  onClick={() => handleOpen(item)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <img
                    src={item.image || PLACEHOLDER_IMAGE}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="truncate text-xs text-secondary-text">
                        {item.subtitle}
                      </p>
                    )}
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-primary">
                      <Icon className="h-3 w-3" />
                      {item.type}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    removeFavorite(item.id);
                    toastSuccess("Removed from favorites", item.title);
                  }}
                  className="shrink-0 rounded-lg p-2 text-muted opacity-0 transition-all hover:bg-error/10 hover:text-error group-hover:opacity-100"
                  aria-label="Remove favorite"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
