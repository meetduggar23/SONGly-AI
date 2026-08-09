import { ovhClient, lrcLibClient } from "@/api/client";
import type { Lyrics } from "@/types";
import { cleanLyrics } from "@/utils/lyrics";

/**
 * Lyrics service abstraction.
 * Fetches lyrics from multiple providers with fallbacks.
 */

export interface LyricsRequest {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
}

type LyricsSource = "auto" | "ovh" | "lrclib";

/**
 * Fetch lyrics from Lyrics.ovh API.
 */
async function fetchFromOvh(
  artist: string,
  title: string,
): Promise<Lyrics | null> {
  try {
    const { data } = await ovhClient.get<{ lyrics: string }>(
      `/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
    );
    const lyrics = cleanLyrics(data.lyrics);
    if (!lyrics) return null;
    return { lyrics, source: "ovh", synced: false };
  } catch {
    return null;
  }
}

/**
 * Fetch lyrics from LrcLib API.
 */
async function fetchFromLrcLib(
  params: LyricsRequest,
): Promise<Lyrics | null> {
  try {
    const { title, artist, album, duration } = params;
    const { data } = await lrcLibClient.get("/search", {
      params: {
        track_name: title,
        artist_name: artist,
        album_name: album,
        duration: duration || undefined,
      },
    });
    const results = Array.isArray(data) ? data : [];
    if (results.length === 0) return null;

    const best = results[0];
    const rawSynced =
      typeof best.syncedLyrics === "string" ? best.syncedLyrics.trim() : "";
    const rawPlain =
      typeof best.plainLyrics === "string" ? best.plainLyrics.trim() : "";

    // When the provider ships timestamped (LRC) lyrics we keep the raw text
    // untouched in `syncedLyrics` so consumers can drive real synchronization,
    // while `lyrics` stays the cleaned plain text for static display/download.
    const useSynced = rawSynced.length > 0;
    const lyrics = cleanLyrics(useSynced ? rawSynced : rawPlain);
    if (!lyrics) return null;
    return {
      lyrics,
      source: "lrclib",
      synced: useSynced,
      syncedLyrics: useSynced ? rawSynced : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Get lyrics with automatic fallback between providers.
 */
export async function getLyrics(
  params: LyricsRequest,
  source: LyricsSource = "auto",
): Promise<Lyrics> {
  // Try the selected source first, then fall back to the other one.
  const attempts: LyricsSource[] =
    source === "ovh" ? ["ovh", "lrclib"] : ["lrclib", "ovh"];

  for (const src of attempts) {
    const result =
      src === "ovh"
        ? await fetchFromOvh(params.artist, params.title)
        : await fetchFromLrcLib(params);
    if (result) return result;
  }

  return { lyrics: "", source: "none", synced: false };
}

/**
 * Check if lyrics are available for a song.
 */
export async function hasLyrics(params: LyricsRequest): Promise<boolean> {
  const result = await getLyrics(params, "auto");
  return result.source !== "none";
}
