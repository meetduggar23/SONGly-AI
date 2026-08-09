// Application-wide constants and configuration

export const APP_NAME = "SONGly";
export const APP_TAGLINE = "Find any song. Instantly. By AI.";
export const APP_VERSION = "1.0.0";

// API endpoints (raw upstream bases — proxying is handled in @/api/client)
export const API = {
  deezer: "https://api.deezer.com",
  ovh: "https://api.lyrics.ovh/v1",
  lrcLib: "https://lrclib.net/api",
  itunes: "https://itunes.apple.com",
  lastfm: "https://ws.audioscrobbler.com/2.0",
  audd: "https://api.audd.io",
};

// AudD recognition token (optional — set VITE_AUDD_API_KEY in .env)
export const AUDD_API_TOKEN = import.meta.env.VITE_AUDD_API_KEY || "";

// Local storage keys
export const STORAGE_KEYS = {
  favorites: "lfai_favorites",
  theme: "lfai_theme",
};

// Placeholder images
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTgxODE4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iNjAiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPuaLmeiDheWwj+itiDwvdGV4dD48L3N2Zz4=";

// Duration formats
export const DEFAULT_FONT_SIZES = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};
