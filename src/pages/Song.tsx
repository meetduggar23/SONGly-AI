import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Pause, Heart, Clock, Music2, Share2 } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getSong } from "@/services/deezer";
import { getSongDetails } from "@/services/music/itunesService";
import { getLyrics } from "@/services/lyrics";
import type { Song as SongType, Lyrics } from "@/types";
import { PLACEHOLDER_IMAGE } from "@/constants";
import { formatDuration } from "@/utils/format";
import { useFavoritesStore, songToFavorite } from "@/store/favorites";
import { LyricsViewer } from "@/components/feature/LyricsViewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { toastSuccess } from "@/store/toast";
import { cn } from "@/utils/cn";
import { playPreview, stopPreview, subscribePreview, getPreviewingUrl } from "@/utils/audio";

export function SongPage() {
  const { id } = useParams<{ id: string }>();
  const [song, setSong] = useState<SongType | null>(null);
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lyricsLoading, setLyricsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFavorite = useFavoritesStore((s) =>
    s.isFavorite(id || "", "song"),
  );
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      if (!id) {
        setError("Song not found.");
        setLoading(false);
        return;
      }
      const data = /^\d+$/.test(id)
        ? await getSong(id)
        : await getSongDetails(id);
      if (cancelled) return;
      if (!data) {
        setError("Song not found.");
        setLoading(false);
        return;
      }
      setSong(data);
      setLoading(false);

      setLyricsLoading(true);
      const SONGlyrics = await getLyrics({
        title: data.title,
        artist: data.artist,
        duration: data.duration,
      });
      if (!cancelled) {
        setLyrics(SONGlyrics);
        setLyricsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useDocumentTitle(song ? `${song.title} — ${song.artist}` : "Song");

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!song?.previewUrl) return;
    const unsubscribe = subscribePreview(() => {
      setIsPlaying(
        getPreviewingUrl() === new URL(song.previewUrl!, window.location.href).href,
      );
    });
    return unsubscribe;
  }, [song?.previewUrl]);

  const handlePlay = () => {
    if (!song?.previewUrl) return;
    if (isPlaying) {
      stopPreview();
    } else {
      playPreview(song.previewUrl);
    }
  };

  const handleFavorite = () => {
    if (!song) return;
    toggleFavorite(songToFavorite(song));
    toastSuccess(
      isFavorite ? "Removed from favorites" : "Added to favorites",
      song.title,
    );
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: song?.title, text: song?.artist, url });
      } else {
        await navigator.clipboard.writeText(url);
        toastSuccess("Link copied to clipboard", "Share");
      }
    } catch {
      /* user cancelled */
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <ErrorState title="Song not found" message={error} />
      </div>
    );
  }

  if (loading || !song) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="animate-pulse">
          <div className="mb-6 flex items-center gap-6">
            <div className="h-40 w-40 rounded-2xl bg-border/50" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-2/3 bg-border/50 rounded" />
              <div className="h-4 w-1/3 bg-border/50 rounded" />
              <div className="h-4 w-1/4 bg-border/50 rounded" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-border/50 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end"
      >
        <img
          src={song.coverLarge || song.coverMedium || song.cover || PLACEHOLDER_IMAGE}
          alt={song.title}
          className="h-40 w-40 shrink-0 rounded-2xl object-cover shadow-2xl sm:h-48 sm:w-48"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">{song.source?.toUpperCase()}</Badge>
            {song.releaseYear && <Badge variant="outline">{song.releaseYear}</Badge>}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
            {song.title}
          </h1>
          <p className="mt-2 text-lg text-secondary-text">
            by{" "}
            <Link
              to={`/artist/${encodeURIComponent(song.artist)}`}
              className="text-primary hover:underline"
            >
              {song.artist}
            </Link>
          </p>
          {song.album && (
            <p className="mt-1 text-sm text-muted">
              Album:{" "}
              {song.albumId && /^\d+$/.test(song.albumId) ? (
                <Link to={`/album/${song.albumId}`} className="hover:text-primary hover:underline">
                  {song.album}
                </Link>
              ) : (
                <span>{song.album}</span>
              )}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={handlePlay} disabled={!song.previewUrl} className="h-12 px-6">
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              {isPlaying ? "Pause" : "Play Preview"}
            </Button>
            <Button variant="outline" size="icon" onClick={handleFavorite} aria-label="Favorite">
              <Heart className={cn("h-5 w-5", isFavorite && "fill-current text-primary")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Share">
              <Share2 className="h-5 w-5" />
            </Button>
            <span className="ml-auto flex items-center gap-1.5 text-sm text-muted">
              <Clock className="h-4 w-4" />
              {formatDuration(song.duration)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Lyrics */}
      <LyricsViewer
        title={song.title}
        artist={song.artist}
        lyrics={
          lyrics || { lyrics: "", source: "none", synced: false }
        }
        loading={lyricsLoading}
      />

      {/* Source note */}
      <div className="mt-6 flex items-center gap-2 text-xs text-muted">
        <Music2 className="h-4 w-4" />
        Lyrics provided by Lyrics.ovh &amp; LRC Lib.
      </div>
    </div>
  );
}
