import { useEffect, useRef, useState } from "react";
import { useRecorder } from "@/hooks/useRecorder";
import { recognizeAudio, resolveDetectedTrack, AudDError, AudDNoMatchError } from "@/services/audd";
import type { DetectedSong, Song } from "@/types";

export type RecognitionPhase =
  | "idle"
  | "listening"
  | "analyzing"
  | "success"
  | "no-match"
  | "error";

interface UseSongRecognitionOptions {
  /** How long (ms) to hold the "Song Detected" reveal before invoking onDetected. */
  holdMs?: number;
}

/**
 * Full microphone recognition flow: record → AudD identifies → iTunes/Apple
 * Music match. Phases: idle → listening → analyzing → success (→ idle), with
 * "no-match" when AudD couldn't identify the audio and "error" for everything
 * else. Runs are invalidated on cancel/unmount so stale results never fire or
 * update state, and timers are always cleaned up. Starting a second run while
 * one is in progress is ignored.
 */
export function useSongRecognition(
  onDetected?: (detected: DetectedSong, track: Song | null) => void,
  options?: UseSongRecognitionOptions,
) {
  const holdMs = options?.holdMs ?? 1400;
  const [phase, setPhase] = useState<RecognitionPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [detectedSong, setDetectedSong] = useState<DetectedSong | null>(null);
  const [track, setTrack] = useState<Song | null>(null);
  const progressRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const runIdRef = useRef(0);
  const activeRef = useRef(false);
  const disposedRef = useRef(false);

  const runRecognitionRef = useRef<(blob: Blob) => void>(() => {});
  runRecognitionRef.current = (blob) => {
    if (disposedRef.current) return;
    void runRecognition(blob);
  };

  const { seconds, error: recorderError, start, cancel } = useRecorder(
    (blob) => runRecognitionRef.current(blob),
  );

  useEffect(() => {
    if (recorderError) {
      activeRef.current = false;
      setDetectedSong(null);
      setTrack(null);
      setPhase("error");
      setError(recorderError);
    }
  }, [recorderError]);

  useEffect(() => {
    return () => {
      disposedRef.current = true;
      runIdRef.current += 1;
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    };
  }, []);

  const stopProgressTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const runRecognition = async (blob: Blob) => {
    const runId = runIdRef.current;
    setPhase("analyzing");
    setError(null);
    progressRef.current = 0;
    setProgress(0);

    timerRef.current = window.setInterval(() => {
      progressRef.current = Math.min(90, progressRef.current + Math.random() * 12);
      setProgress(Math.floor(progressRef.current));
    }, 250);

    try {
      const detected = await recognizeAudio(blob, "recording.webm");
      if (runId !== runIdRef.current) return;
      setDetectedSong(detected);

      const matched = await resolveDetectedTrack(detected);
      if (runId !== runIdRef.current) return;
      setTrack(matched);
      stopProgressTimer();
      setProgress(100);
      setPhase("success");

      holdTimerRef.current = window.setTimeout(() => {
        holdTimerRef.current = null;
        if (runId !== runIdRef.current) return;
        activeRef.current = false;
        onDetected?.(detected, matched);
        setPhase("idle");
      }, holdMs);
    } catch (e) {
      if (runId !== runIdRef.current) return;
      stopProgressTimer();
      activeRef.current = false;
      setDetectedSong(null);
      setTrack(null);
      if (e instanceof AudDNoMatchError) {
        setPhase("no-match");
        setError(e.message);
      } else if (e instanceof AudDError) {
        setPhase("error");
        setError(e.message);
      } else {
        setPhase("error");
        setError("Recognition failed. Please try again.");
      }
    }
  };

  const startListening = async () => {
    if (activeRef.current) return;
    activeRef.current = true;
    runIdRef.current += 1;
    setDetectedSong(null);
    setTrack(null);
    setError(null);
    setPhase("listening");
    await start();
  };

  const cancelListening = () => {
    activeRef.current = false;
    runIdRef.current += 1;
    cancel();
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setDetectedSong(null);
    setTrack(null);
    setPhase("idle");
    setError(null);
  };

  return {
    phase,
    error,
    progress,
    detectedSong,
    track,
    seconds,
    startListening,
    cancelListening,
  };
}
