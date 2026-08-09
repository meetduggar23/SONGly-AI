import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, TriangleAlert } from "lucide-react";
import { useSongRecognition } from "@/hooks/useSongRecognition";
import { useFavoritesStore } from "@/store/favorites";
import {
  playPreview,
  stopPreview,
  subscribePreview,
  getPreviewingUrl,
} from "@/utils/audio";
import type { DetectedSong, Song } from "@/types";
import { HeroBackground } from "./HeroBackground";
import { ListeningModule } from "./ListeningModule";
import { MusicShowcase } from "./MusicShowcase";

const staggerItem = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

export function Hero() {
  const navigate = useNavigate();
  const [detectedTrack, setDetectedTrack] = useState<Song | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const onDetected = useCallback((_detected: DetectedSong, track: Song | null) => {
    setDetectedTrack(track);
  }, []);

  const {
    phase,
    error,
    progress,
    detectedSong,
    startListening,
    cancelListening,
  } = useSongRecognition(onDetected);

  const previewUrl = detectedTrack?.previewUrl || null;

  const favId = detectedTrack
    ? detectedTrack.id
    : detectedSong
      ? `detected-${detectedSong.title}`
      : "";
  const isFavorite = useFavoritesStore((s) =>
    favId ? s.isFavorite(favId, "song") : false,
  );

  const toggleDetectedFavorite = () => {
    if (detectedTrack) {
      toggleFavorite({
        id: detectedTrack.id,
        type: "song",
        title: detectedTrack.title,
        subtitle: detectedTrack.artist,
        image: detectedTrack.cover,
      });
    } else if (detectedSong) {
      toggleFavorite({
        id: favId,
        type: "song",
        title: detectedSong.title,
        subtitle: detectedSong.artist,
        image: detectedSong.coverUrl,
      });
    }
  };

const handlePreview = () => {
    if (!previewUrl) return;
    playPreview(previewUrl);
  };

  // Keep the preview button in sync with the shared audio element.
  useEffect(() => {
    const sync = () => {
      const expected = previewUrl
        ? new URL(previewUrl, window.location.href).href
        : null;
      setPreviewPlaying(expected !== null && getPreviewingUrl() === expected);
    };
    sync();
    const unsubscribe = subscribePreview(sync);
    return unsubscribe;
  }, [previewUrl]);

const handleStartListening = () => {
    setDetectedTrack(null);
    setPreviewPlaying(false);
    stopPreview();
    startListening();
  };

  const handleLyrics = () => {
    if (detectedTrack && /^(\d+|it-\d+)$/.test(detectedTrack.id)) {
      navigate(`/song/${detectedTrack.id}`);
    } else {
      navigate(
        `/search?q=${encodeURIComponent(
          `${detectedSong?.title ?? detectedTrack?.title ?? ""} ${
            detectedSong?.artist ?? detectedTrack?.artist ?? ""
          }`,
        )}`,
      );
    }
  };

  const listening = phase === "listening";
  const analyzing = phase === "analyzing" || phase === "success";

  return (
    <section className="relative overflow-hidden">
      <HeroBackground />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pt-10 lg:pb-12 lg:pt-12">
        <div className="grid items-start gap-10 lg:grid-cols-[45fr_55fr] lg:gap-10">
          {/* LEFT — primary interaction area */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <motion.div {...staggerItem(0.05)} className="w-full">
<span className="sr-only">Song Discovery</span>
              <h1 className="text-3xl font-black leading-[1.06] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                What&rsquo;s That Song?
                <br />
                <span className="text-gradient-green">We&rsquo;ll Find It.</span>
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm text-secondary-text sm:text-base lg:mx-0">
                Identify music in seconds with AI, search millions of songs,
                and discover your next favorite track.
              </p>
            </motion.div>

            <motion.div {...staggerItem(0.15)} className="mt-8 w-full sm:mt-10">
                <ListeningModule
                phase={phase}
                progress={progress}
                detected={detectedSong}
                onLyrics={handleLyrics}
                onStart={handleStartListening}
                onCancel={cancelListening}
                previewUrl={previewUrl}
                isPreviewPlaying={previewPlaying}
                onPreview={handlePreview}
                isFavorite={isFavorite}
                onFavorite={toggleDetectedFavorite}
              />
            </motion.div>

{/* Error */}
            <AnimatePresence>
              {phase === "error" && error && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 w-full max-w-md rounded-2xl border border-error/30 bg-error/5 p-5"
                >
                  <p className="flex items-start gap-2 text-left text-sm text-secondary-text">
                    <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-error" />
                    {error}
                  </p>
<div className="mt-4 flex justify-center gap-3 lg:justify-start">
                    <button
                      onClick={handleStartListening}
className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                    >
                      <Mic className="h-4 w-4" />
                      Try Again
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT — immersive music showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="lg:col-start-2"
          >
            <MusicShowcase
              listening={listening}
              analyzing={analyzing}
              detected={detectedSong}
              onLyrics={handleLyrics}
            />
          </motion.div>
        </div>

        {/* Caption + stats strip */}
        <motion.div
          {...staggerItem(0.25)}
          className="mx-auto mt-10 flex max-w-[1000px] flex-col items-center gap-8 lg:mt-12 lg:flex-row lg:items-center lg:justify-center lg:gap-16"
        >
          {/* Description */}
<p className="max-w-[420px] text-center text-base leading-relaxed text-secondary-text">
            Tap to listen and let AI identify the music around you.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xl font-extrabold text-foreground">500K+</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
                Songs
              </p>
            </div>
<span className="h-9 w-px bg-accent/30" />
            <div className="text-center">
              <p className="text-xl font-extrabold text-foreground">120+</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
                Countries
              </p>
            </div>
<span className="h-9 w-px bg-accent/30" />
<div className="text-center">
              <p className="text-xl font-extrabold text-foreground">Millions</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
                Tracks
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
