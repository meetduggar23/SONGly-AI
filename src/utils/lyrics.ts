/**
 * Lyrics parsing and manipulation utilities.
 */

/**
 * Parse raw lyrics into an array of verse blocks.
 * Each block is an array of lines. Blank lines separate blocks.
 */
export function parseLyricsToBlocks(lyrics: string): string[][] {
  if (!lyrics) return [];
  return lyrics
    .split("\n")
    .reduce<string[][]>((blocks, line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        // Ensure at least one block exists
        if (blocks.length === 0) blocks.push([]);
        return blocks;
      }
      if (blocks.length === 0) blocks.push([]);
      blocks[blocks.length - 1].push(trimmed);
      return blocks;
    }, []);
}

/**
 * Check if lyrics seem to be instrumental (no words).
 */
export function isInstrumental(lyrics?: string): boolean {
  if (!lyrics) return false;
  const text = lyrics.trim().toLowerCase();
  return (
    text.length === 0 ||
    text === "instrumental" ||
    text.includes("instrumental") ||
    /^\([\s\S]*\)$/.test(text)
  );
}

/**
 * Count words in lyrics.
 */
export function countWords(lyrics: string): number {
  if (!lyrics) return 0;
  return lyrics.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Estimate reading time in minutes.
 */
export function estimateReadingTime(lyrics: string): number {
  const words = countWords(lyrics);
  // Average reading speed ~200 wpm
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Clean up common formatting artifacts from lyrics APIs.
 * Strips LRC timestamps ([00:27.93]) and LRC metadata tags ([ti:...]).
 */
export function cleanLyrics(lyrics: string): string {
  if (!lyrics) return "";
  return lyrics
    .replace(/\r/g, "")
    .replace(/\[(?:ti|ar|al|by|offset|length|re|ve):[^\]]*\]/gi, "")
    .replace(/\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * A single timestamped (LRC) lyric line with its offset in seconds.
 */
export interface SyncedLyricLine {
  time: number;
  text: string;
}

/**
 * Parse LRC-style timestamped lyrics (e.g. `[00:27.93] Swim, swim`) into
 * ordered lines with their time in seconds. Returns `null` as soon as any
 * line isn't timestamped, so plain lyrics never get a fabricated sync.
 */
export function parseLrcLines(text: string): SyncedLyricLine[] | null {
  if (!text) return null;
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const regex = /^\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]\s*(.*)$/;
  const entries: SyncedLyricLine[] = [];
  for (const line of lines) {
    const match = line.match(regex);
    if (!match) return null;
    const textPart = match[4].trim();
    if (!textPart) return null;
    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const fraction = Number(match[3] ?? 0);
    entries.push({ time: minutes * 60 + seconds + fraction / 1000, text: textPart });
  }
  return entries;
}

/**
 * Extract lines that contain a search term (for finding a lyric snippet).
 */
export function findLyricLine(lyrics: string, query: string): string | null {
  if (!lyrics || !query) return null;
  const lowerQuery = query.toLowerCase();
  const line = lyrics
    .split("\n")
    .find((l) => l.toLowerCase().includes(lowerQuery));
  return line || null;
}
