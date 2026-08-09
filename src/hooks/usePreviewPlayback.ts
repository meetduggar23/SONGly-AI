import { useEffect, useState } from "react";
import {
  getPreviewingUrl,
  getPreviewPausedUrl,
  getPreviewProgress,
  subscribePreview,
} from "@/utils/audio";

/**
 * Tracks whether a specific preview URL is the one currently playing through
 * the shared single-instance audio manager, plus its playback progress.
 * Automatically resets when the preview ends or another preview starts.
 */
export function usePreviewPlayback(previewUrl?: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    duration: number;
  } | null>(null);

  useEffect(() => {
    if (!previewUrl) return;
    const sync = () => {
      const expected = new URL(previewUrl, window.location.href).href;
      const actual = getPreviewingUrl();
      const playing = actual !== null && actual === expected;
      setIsPlaying(playing);
      setIsPaused(!playing && getPreviewPausedUrl() === expected);
      setProgress(playing ? getPreviewProgress() : null);
    };
    sync();
    const unsubscribe = subscribePreview(sync);
    return unsubscribe;
  }, [previewUrl]);

  return { isPlaying, isPaused, progress };
}
