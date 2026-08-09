import { createContext } from "react";
import type { Song } from "@/types";

export interface UIState {
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  mobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  fullscreenLyrics: boolean;
  setFullscreenLyrics: (v: boolean) => void;
  /** Song whose lyrics panel is open (null = closed). */
  lyricsSong: Song | null;
  openLyrics: (song: Song) => void;
  closeLyrics: () => void;
}

export const UIContext = createContext<UIState | undefined>(undefined);
