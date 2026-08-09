// Core domain types for the SONGly application

export interface Song {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  cover?: string;
  coverSmall?: string;
  coverMedium?: string;
  coverLarge?: string;
  duration?: number;
  previewUrl?: string;
  link?: string;
  releaseYear?: number;
  source?: "deezer" | "itunes" | "lastfm" | "local";
  language?: "hindi" | "english";
}

export interface Artist {
  id: string;
  name: string;
  image?: string;
  imageSmall?: string;
  imageMedium?: string;
  imageLarge?: string;
  genres?: string[];
  country?: string;
  biography?: string;
  listeners?: number;
  playcount?: number;
  source?: "deezer" | "itunes" | "lastfm" | "local";
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  cover?: string;
  coverSmall?: string;
  coverMedium?: string;
  coverLarge?: string;
  releaseDate?: string;
  genre?: string;
  label?: string;
  trackCount?: number;
  duration?: number;
  tracks?: Track[];
  source?: "deezer" | "itunes" | "lastfm" | "local";
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration?: number;
  trackNumber?: number;
  previewUrl?: string;
}

export interface Lyrics {
  lyrics: string;
  source: "ovh" | "lrclib" | "none";
  synced?: boolean;
  /** Raw timestamped (LRC) lyrics, kept untouched so timestamps survive for
   *  real time-synced playback. Present only when the provider returns them. */
  syncedLyrics?: string;
}

export interface SearchResults {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  totalResults: number;
}

export interface SearchSuggestions {
  suggestions: string[];
}

export type SuggestionKind = "song" | "artist" | "album";

export interface SearchSuggestion {
  id: string;
  kind: SuggestionKind;
  title: string;
  subtitle: string;
  cover?: string;
  song?: Song;
  artist?: Artist;
  album?: Album;
}

export interface FavoriteItem {
  id: string;
  type: "song" | "artist" | "album";
  title: string;
  subtitle?: string;
  image?: string;
  addedAt: number;
  data?: Song | Artist | Album;
}

export interface DetectedAppleMusic {
  name?: string;
  artistName?: string;
  albumName?: string;
  artworkUrl?: string;
  previewUrl?: string;
  url?: string;
  isrc?: string;
  releaseDate?: string;
  durationInMillis?: number;
  /** Apple Music track id (playParams.id). */
  trackId?: string;
}

export interface DetectedSong {
  title: string;
  artist: string;
  album?: string;
  releaseDate?: string;
  coverUrl?: string;
  duration?: number;
  songId?: string;
  songLink?: string;
  isrc?: string;
  previewUrl?: string;
  appleMusic?: DetectedAppleMusic;
}
