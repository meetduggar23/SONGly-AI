/**
 * Lightweight inline audio preview helper.
 * Plays a 30-second preview from a single shared element so only one
 * preview plays at a time — no global player UI needed.
 *
 * Pausing a preview keeps the shared element alive so it can be resumed from
 * the exact same position; `getPreviewingUrl` still returns `null` while
 * paused, so existing callers keep treating a paused preview as "not playing".
 */

let currentAudio: HTMLAudioElement | null = null;
let currentProgress: { current: number; duration: number } | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((l) => l());
}

export function subscribePreview(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/** URL currently playing (not paused). */
export function getPreviewingUrl(): string | null {
  if (!currentAudio || currentAudio.paused) return null;
  return currentAudio.src;
}

/** URL of the preview that is loaded but paused (resumable), if any. */
export function getPreviewPausedUrl(): string | null {
  if (currentAudio && currentAudio.paused) return currentAudio.src;
  return null;
}

export function getPreviewProgress(): { current: number; duration: number } | null {
  return currentProgress;
}

function clearPreview(): void {
  currentAudio = null;
  currentProgress = null;
}

function bindEvents(audio: HTMLAudioElement): void {
  audio.addEventListener("loadedmetadata", () => {
    if (currentAudio !== audio) return;
    currentProgress = { current: 0, duration: audio.duration || 0 };
    notify();
  });
  audio.addEventListener("timeupdate", () => {
    if (currentAudio !== audio) return;
    currentProgress = { current: audio.currentTime, duration: audio.duration || 0 };
    notify();
  });
  audio.addEventListener("ended", () => {
    if (currentAudio === audio) {
      clearPreview();
      notify();
    }
  });
}

export function playPreview(url: string): void {
  if (!url) return;
  stopPreview();
  const audio = new Audio(url);
  audio.volume = 0.7;
  bindEvents(audio);
  void audio.play().catch(() => {
    if (currentAudio === audio) {
      clearPreview();
      notify();
    }
  });
  currentAudio = audio;
  currentProgress = { current: 0, duration: 0 };
  notify();
}

/** Pause the current preview, keeping its position for a later resume. */
export function pausePreview(): void {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    notify();
  }
}

/** Resume the paused preview from where it left off. */
export function resumePreview(): void {
  if (currentAudio && currentAudio.paused) {
    void currentAudio.play().catch(() => {});
    notify();
  }
}

/** Seek the playing preview to `time` seconds (ignored while paused). */
export function seekPreview(time: number): void {
  if (!currentAudio || currentAudio.paused) return;
  currentAudio.currentTime = time;
  currentProgress = { current: time, duration: currentAudio.duration || 0 };
  notify();
}

export function stopPreview(): void {
  if (currentAudio) {
    currentAudio.pause();
    clearPreview();
    notify();
  }
}
