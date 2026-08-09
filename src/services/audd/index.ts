import { getSongByIsrc, findMatchingTrack } from "@/services/music/itunesService";
import type { DetectedAppleMusic, DetectedSong, Song } from "@/types";

/**
 * AudD music recognition service (https://docs.audd.io/).
 *
 * SECURITY: the browser never sees the AudD API token. Audio is posted to
 * the app's own `/api/audd` endpoint, and the Vite dev/preview middleware
 * injects the token server-side (see vite.config.ts). Requests ask for
 * Apple Music metadata (`return=apple_music`) with the Indian storefront
 * (`market=IN`) so Hindi/Bollywood detection works out of the box.
 *
 * After identification, the result is matched against the iTunes/Apple Music
 * catalog (via `resolveDetectedTrack`) so Songly displays full artwork,
 * preview, and metadata — never the raw AudD payload.
 */

interface AudDApiError {
  error_code?: number;
  error_message?: string;
}

interface AudDAppleMusic {
  name?: string;
  artistName?: string;
  albumName?: string;
  artwork?: { url?: string };
  previews?: Array<{ url?: string }>;
  url?: string;
  isrc?: string;
  releaseDate?: string;
  durationInMillis?: number;
  playParams?: { id?: string };
}

interface AudDResult {
  artist?: string;
  title?: string;
  album?: string;
  release_date?: string;
  label?: string;
  timecode?: string;
  song_link?: string;
  song_id?: string;
  duration?: number;
  isrc?: string;
  cover_art?: { url?: string } | string;
  apple_music?: AudDAppleMusic;
}

interface AudDResponse {
  status: "success" | "error";
  result?: AudDResult | null;
  error?: AudDApiError;
}

/** Recognition succeeded but nothing in the audio matched a known song. */
export class AudDNoMatchError extends Error {
  constructor(message = "No song found. Try again.") {
    super(message);
    this.name = "AudDNoMatchError";
  }
}

/** AudD returned an error (invalid token, bad audio, rate limit, …). */
export class AudDError extends Error {
  code?: number;

  constructor(message: string, code?: number) {
    super(message);
    this.name = "AudDError";
    this.code = code;
  }
}

/** Map AudD error codes to friendly, non-technical messages. */
function friendlyMessage(code?: number, fallback?: string): string {
  switch (code) {
    case 900:
    case 901:
      return "Song recognition isn't configured on the server yet.";
    case 300:
      return "That clip was too short to identify. Try recording a bit longer.";
    case 400:
      return "That recording was too large to process. Try a shorter clip.";
    case 500:
      return "That audio couldn't be read. Try again with clearer sound.";
    case 600:
    case 700:
      return "Couldn't identify that song. Try getting a little closer to the music.";
    default:
      return (
        fallback || "Couldn't identify that song. Try getting a little closer to the music."
      );
  }
}

/** AudD artwork URLs contain {w}x{h} placeholders — render at 600x600. */
function appleMusicArtwork(url?: string): string | undefined {
  return url?.replace("{w}", "600").replace("{h}", "600") || url;
}

function mapAppleMusic(am: AudDAppleMusic | undefined): DetectedAppleMusic | undefined {
  if (!am) return undefined;
  const previewUrl = am.previews?.[0]?.url;
  return {
    name: am.name,
    artistName: am.artistName,
    albumName: am.albumName,
    artworkUrl: appleMusicArtwork(am.artwork?.url),
    previewUrl,
    url: am.url,
    isrc: am.isrc,
    releaseDate: am.releaseDate,
    durationInMillis: am.durationInMillis,
    trackId: am.playParams?.id,
  };
}

function mapResult(result: AudDResult): DetectedSong {
  const am = mapAppleMusic(result.apple_music);
  const cover =
    typeof result.cover_art === "string" ? result.cover_art : result.cover_art?.url;

  return {
    title: am?.name || result.title || "Unknown Track",
    artist: am?.artistName || result.artist || "Unknown Artist",
    album: am?.albumName || result.album,
    releaseDate: am?.releaseDate || result.release_date,
    coverUrl: am?.artworkUrl || cover,
    duration: am?.durationInMillis
      ? Math.round(am.durationInMillis / 1000)
      : result.duration,
    songId: result.song_id,
    songLink: result.song_link,
    isrc: am?.isrc || result.isrc,
    previewUrl: am?.previewUrl,
    appleMusic: am,
  };
}

/**
 * Recognize a song from an audio blob (mic recording or uploaded file).
 * Throws `AudDNoMatchError` when the audio was processed but no song matched.
 */
export async function recognizeAudio(
  blob: Blob,
  filename = "recording.webm",
): Promise<DetectedSong> {
  const form = new FormData();
  form.append("file", blob, filename);

  const params = new URLSearchParams({
    return: "apple_music",
    market: "IN",
  });

  let response: Response;
  try {
    response = await fetch(`/api/audd?${params.toString()}`, {
      method: "POST",
      body: form,
    });
  } catch {
    throw new AudDError(
      "Couldn't reach the recognition service. Check your connection and try again.",
    );
  }

  if (response.status === 503) {
    throw new AudDError(friendlyMessage(900));
  }
  if (!response.ok) {
    throw new AudDError(
      "The recognition service is unavailable right now. Please try again.",
    );
  }

  let data: AudDResponse;
  try {
    data = (await response.json()) as AudDResponse;
  } catch {
    throw new AudDError("The recognition service sent an invalid response.");
  }

  if (data.status === "error" || data.error) {
    const code = data.error?.error_code;
    throw new AudDError(friendlyMessage(code, data.error?.error_message), code);
  }

  if (!data.result) {
    throw new AudDNoMatchError();
  }

  return mapResult(data.result);
}

/**
 * Resolve the detected song to a full iTunes/Apple Music track:
 * 1. Complete Apple Music data (artwork + preview) from AudD → no extra calls.
 * 2. ISRC → exact iTunes lookup.
 * 3. Ranked iTunes search by artist + title.
 * Returns null when no catalog match is found.
 */
export async function resolveDetectedTrack(detected: DetectedSong): Promise<Song | null> {
  const am = detected.appleMusic;
  if (am && am.previewUrl && (am.artworkUrl || detected.coverUrl)) {
    return {
      id: am.trackId ? `it-${am.trackId}` : `audd-${detected.isrc || detected.songId || detected.title}`,
      title: am.name || detected.title,
      artist: am.artistName || detected.artist,
      album: am.albumName || detected.album,
      cover: am.artworkUrl || detected.coverUrl,
      coverMedium: am.artworkUrl || detected.coverUrl,
      coverSmall: am.artworkUrl,
      coverLarge: am.artworkUrl,
      duration: am.durationInMillis ? Math.round(am.durationInMillis / 1000) : detected.duration,
      previewUrl: am.previewUrl || detected.previewUrl,
      link: am.url || detected.songLink,
      releaseYear: am.releaseDate ? new Date(am.releaseDate).getFullYear() : undefined,
      source: "itunes",
    };
  }

  if (detected.isrc) {
    const byIsrc = await getSongByIsrc(detected.isrc);
    if (byIsrc) return byIsrc;
  }

  return findMatchingTrack(detected.title, detected.artist, detected.album);
}
