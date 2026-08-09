import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Pause, Heart, Share2, Download, Music2 } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getSong } from "@/services/deezer";
import { getSongDetails } from "@/services/music/itunesService";
import { getLyrics } from "@/services/lyrics";
import type { Song as SongType, Lyrics } from "@/types";
import { PLACEHOLDER_IMAGE } from "@/constants";
import { useFavoritesStore, songToFavorite } from "@/store/favorites";
import { LyricsViewer } from "@/components/feature/LyricsViewer";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { toastSuccess } from "@/store/toast";
import { cn } from "@/utils/cn";
import { downloadLyrics } from "@/utils/download";
import {
  playPreview,
  stopPreview,
  subscribePreview,
  getPreviewingUrl,
} from "@/utils/audio";

/** Skeleton: album art, song title, and lyric line placeholders. */
function SongSkeleton() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="animate-pulse">
        <div className="h-24 w-24 rounded-2xl bg-border/40 sm:h-32 sm:w-32" />
        <div className="mx-auto mt-5 h-7 w-48 rounded bg-border/40" />
        <div className="mx-auto mt-2 h-4 w-32 rounded bg-border/40" />
        <div className="mt-6 flex justify-center gap-2">
          <div className="h-10 w-10 rounded-full bg-border/40" />
          <div className="h-10 w-28 rounded-full bg-border/40" />
          <div className="h-10 w-24 rounded-full bg-border/40" />
        </div>
      </div>
      <div className="mt-14 w-full max-w-2xl animate-pulse space-y-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "mx-auto h-4 rounded-full bg-border/40",
              i % 3 === 0 ? "w-40" : i % 3 === 1 ? "w-56" : "w-48",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function SongPage() {
  const { id } = useParams<{ id: string }>();
  const [song, setSong] = useState<SongType | null>(null);
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lyricsLoading, setLyricsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFavorite = useFavoritesStore((s) => s.isFavorite(id || "", "song"));
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
        getPreviewingUrl() ===
          new URL(song.previewUrl!, window.location.href).href,
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

  const handleDownload = () => {
    if (!song || !lyrics?.lyrics) return;
    downloadLyrics(song.title, song.artist, lyrics.lyrics);
    toastSuccess("Lyrics downloaded", `${song.title} - ${song.artist}.txt`);
  };

  const art = song
    ? song.coverLarge || song.coverMedium || song.cover || PLACEHOLDER_IMAGE
    : PLACEHOLDER_IMAGE;

  return (
    <div className="song-page relative min-h-[calc(100vh-4rem)] overflow-x-hidden bg-background">
      {/* Very subtle blurred artwork influence in the background. */}
      {song && (
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <img
            src={art}
            alt=""
            className="h-full w-full scale-125 object-cover opacity-[0.06] blur-[48px]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-background/70" />
        </div>
      )}

      <div className="relative mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        {error ? (
          <div className="mt-4">
            <ErrorState title="Song not found" message={error} />
          </div>
        ) : loading || !song ? (
          <SongSkeleton />
        ) : (
          <>
            {/* Compact song header */}
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative">
                <div
                  className="absolute -inset-8 rounded-full bg-accent/25 blur-3xl"
                  aria-hidden="true"
                />
                <img
                  src={art}
                  alt={`${song.title} cover`}
                  className="relative h-24 w-24 rounded-2xl object-cover shadow-[0_16px_40px_rgba(0,0,0,0.45)] ring-1 ring-foreground/10 sm:h-32 sm:w-32"
                  loading="lazy"
                />
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                {song.title}
              </h1>
              <p className="mt-1.5 text-base text-secondary-text">
                <Link
                  to={`/artist/${encodeURIComponent(song.artist)}`}
                  className="transition-colors hover:text-foreground hover:underline"
                >
                  {song.artist}
                </Link>
              </p>
              {song.album && (
                <p className="mt-1 text-sm text-muted">
                  {song.albumId && /^\d+$/.test(song.albumId) ? (
                    <Link
                      to={`/album/${song.albumId}`}
                      className="transition-colors hover:text-primary hover:underline"
                    >
                      {song.album}
                    </Link>
                  ) : (
                    <span>{song.album}</span>
                  )}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFavorite}
                  aria-label="Favorite"
                  title="Favorite"
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      isFavorite && "fill-current text-primary",
                    )}
                  />
                </Button>
                <Button
                  onClick={handlePlay}
                  disabled={!song.previewUrl}
                  className="h-10 px-5"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="h-4 w-4 fill-current" />
                  )}
                  {isPlaying ? "Pause" : "Preview"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!lyrics?.lyrics}
                  title="Download lyrics"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  aria-label="Share"
                  title="Share"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.header>

            {/* Lyrics section */}
            <div className="mx-auto mt-12 w-full max-w-xl">
              <div className="h-px w-full bg-border/60" aria-hidden="true" />
              <h2 className="mt-8 text-center text-2xl font-bold tracking-tight text-foreground">
                Lyrics
              </h2>
              <p className="mt-1 text-center text-sm text-secondary-text">
                {song.title} · {song.artist}
              </p>
            </div>

            <div className="mt-10">
              <LyricsViewer
                lyrics={lyrics || { lyrics: "", source: "none", synced: false }}
                loading={lyricsLoading}
                previewUrl={song.previewUrl}
              />
            </div>

            {/* Source note */}
            <div className="mt-12 flex items-center justify-center gap-2 text-xs text-muted">
              <Music2 className="h-3.5 w-3.5" />
              Lyrics provided by Lyrics.ovh &amp; LRC Lib.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
