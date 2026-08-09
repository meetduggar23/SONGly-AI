/**
 * Client-side file download utilities.
 */

/** Trigger a browser download of a text blob */
export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = "text/plain",
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Download lyrics as a .txt file */
export function downloadLyrics(
  title: string,
  artist: string,
  lyrics: string,
): void {
  const header = `${title}\n${artist}\n${"=".repeat(Math.max(title.length, artist.length))}\n\n`;
  const footer = `\n\n---\nLyrics via SONGly`;
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, "_");
  downloadTextFile(`${safeTitle} - ${artist}.txt`, header + lyrics + footer);
}

/** Download any data as a JSON file */
export function downloadJSON(filename: string, data: unknown): void {
  downloadTextFile(filename, JSON.stringify(data, null, 2), "application/json");
}

