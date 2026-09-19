export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  genre: string;
  bpm: number;
  audioBlob?: Blob;
  audioUrl: string;
  coverGradient: string;
  createdAt: number;
  isFavorite: boolean;
  isGenerated: boolean;
  description?: string;
  compositionData?: any;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverGradient: string;
  coverIcon: string;
  trackIds: string[];
  createdAt: number;
}

export type ActiveTab = 'home' | 'library' | 'playlists' | 'studio' | 'favorites';

export interface BeatSequencerData {
  bpm: number;
  stepsCount: number;
  swing: number;
  instruments: {
    id: string;
    name: string;
    color: string;
    steps: boolean[];
  }[];
}

export interface GeneratedComposition {
  title: string;
  artist?: string;
  genre: string;
  mood: string;
  bpm: number;
  scale?: string;
  rootKey?: string;
  chordProgression?: string[];
  leadInstrument?: string;
  melodyNotes?: { note: string; step: number; duration?: number }[];
  drumPattern?: {
    kick?: number[];
    snare?: number[];
    hihat?: number[];
    clap?: number[];
  };
  bassPattern?: { note: string; step: number }[];
  description?: string;
}
