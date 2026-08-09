import { useState, useCallback, type ReactNode } from "react";
import { UIContext } from "@/context/ui-context";
import { getPreviewingUrl, stopPreview } from "@/utils/audio";
import type { Song } from "@/types";

export function UIProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [fullscreenLyrics, setFullscreenLyrics] = useState(false);
  const [lyricsSong, setLyricsSong] = useState<Song | null>(null);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  const openLyrics = useCallback((song: Song) => {
    setSearchOpen(false);
    setMobileNavOpen(false);
    // Keep only one preview at a time: stop anything not tied to this song so
    // the lyrics panel starts in sync with what's playing.
    const playingUrl = getPreviewingUrl();
    if (
      song.previewUrl &&
      playingUrl &&
      playingUrl !== new URL(song.previewUrl, window.location.href).href
    ) {
      stopPreview();
    }
    setLyricsSong(song);
  }, []);

  const closeLyrics = useCallback(() => setLyricsSong(null), []);

  return (
    <UIContext.Provider
      value={{
        searchOpen,
        openSearch,
        closeSearch,
        mobileNavOpen,
        openMobileNav,
        closeMobileNav,
        fullscreenLyrics,
        setFullscreenLyrics,
        lyricsSong,
        openLyrics,
        closeLyrics,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}
