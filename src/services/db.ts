import { Track, Playlist } from '../types';
import { renderCompositionToWav } from './audioSynthesizer';

const DB_NAME = 'OvozMusicApp_DB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('tracks')) {
        db.createObjectStore('tracks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ---------------- TRACK STORAGE OPERATIONS ----------------

export async function getAllTracks(): Promise<Track[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tracks'], 'readonly');
      const store = transaction.objectStore('tracks');
      const request = store.getAll();

      request.onsuccess = () => {
        const rawTracks: Track[] = request.result || [];
        // Reconstruct live blob URLs if needed
        const tracks = rawTracks.map((t) => {
          if (t.audioBlob) {
            return {
              ...t,
              audioUrl: URL.createObjectURL(t.audioBlob),
            };
          }
          return t;
        });
        resolve(tracks);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get tracks from IndexedDB:', error);
    return [];
  }
}

export async function saveTrack(track: Track): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['tracks'], 'readwrite');
    const store = transaction.objectStore('tracks');
    // Prepare track for persistence (Blob is safe in IndexedDB)
    const trackToStore = {
      ...track,
      // Don't store temporary blob: URL in DB, as it expires per session; we recreate it on load from audioBlob
      audioUrl: track.audioUrl.startsWith('blob:') ? '' : track.audioUrl,
    };
    const request = store.put(trackToStore);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteTrack(trackId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['tracks', 'playlists'], 'readwrite');
    const trackStore = transaction.objectStore('tracks');
    const playlistStore = transaction.objectStore('playlists');

    trackStore.delete(trackId);

    // Also remove from any playlist containing this track
    const playlistReq = playlistStore.getAll();
    playlistReq.onsuccess = () => {
      const playlists: Playlist[] = playlistReq.result || [];
      playlists.forEach((p) => {
        if (p.trackIds.includes(trackId)) {
          p.trackIds = p.trackIds.filter((id) => id !== trackId);
          playlistStore.put(p);
        }
      });
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function toggleTrackFavorite(trackId: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['tracks'], 'readwrite');
    const store = transaction.objectStore('tracks');
    const getReq = store.get(trackId);

    getReq.onsuccess = () => {
      const track: Track = getReq.result;
      if (!track) return resolve(false);
      track.isFavorite = !track.isFavorite;
      store.put(track);
      resolve(track.isFavorite);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

// ---------------- PLAYLIST STORAGE OPERATIONS ----------------

export async function getAllPlaylists(): Promise<Playlist[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['playlists'], 'readonly');
      const store = transaction.objectStore('playlists');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get playlists from IndexedDB:', error);
    return [];
  }
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['playlists'], 'readwrite');
    const store = transaction.objectStore('playlists');
    const request = store.put(playlist);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['playlists'], 'readwrite');
    const store = transaction.objectStore('playlists');
    const request = store.delete(playlistId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['playlists'], 'readwrite');
    const store = transaction.objectStore('playlists');
    const getReq = store.get(playlistId);

    getReq.onsuccess = () => {
      const playlist: Playlist = getReq.result;
      if (playlist && !playlist.trackIds.includes(trackId)) {
        playlist.trackIds.push(trackId);
        store.put(playlist);
      }
      resolve();
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['playlists'], 'readwrite');
    const store = transaction.objectStore('playlists');
    const getReq = store.get(playlistId);

    getReq.onsuccess = () => {
      const playlist: Playlist = getReq.result;
      if (playlist) {
        playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
        store.put(playlist);
      }
      resolve();
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

// ---------------- SEED INITIAL CONTENT ----------------

export async function initializeSeedData(): Promise<{ tracks: Track[]; playlists: Playlist[] }> {
  const existingTracks = await getAllTracks();
  const existingPlaylists = await getAllPlaylists();

  if (existingTracks.length > 0) {
    return { tracks: existingTracks, playlists: existingPlaylists };
  }

  // Pre-seed 3 varied high quality generated musical tracks
  const seeds = [
    {
      title: "Toshkent Oqshomi (Lo-Fi Chill)",
      artist: "Ovoz Studio",
      genre: "Lo-Fi",
      bpm: 85,
      scale: "minor",
      coverGradient: "from-purple-600 via-indigo-600 to-blue-500",
      description: "Sokin va mayin kechki muhit uchun lofi akkordlar va yengil barabanlar.",
      melodyNotes: [
        { note: "A4", step: 0, duration: 1 },
        { note: "C5", step: 3, duration: 1 },
        { note: "E5", step: 6, duration: 1.5 },
        { note: "D5", step: 9, duration: 1 },
        { note: "C5", step: 12, duration: 2 },
      ],
      drumPattern: {
        kick: [0, 8, 10],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        clap: [12],
      },
      bassPattern: [
        { note: "A2", step: 0 },
        { note: "F2", step: 4 },
        { note: "C2", step: 8 },
        { note: "G2", step: 12 },
      ],
    },
    {
      title: "Koinot Ritm (Synthwave 80s)",
      artist: "Retro Wave",
      genre: "Synthwave",
      bpm: 118,
      scale: "dorian",
      coverGradient: "from-pink-500 via-rose-600 to-indigo-700",
      description: "80-yillar retro sinti va dinamik bass ritmlari bilan qizg'in trek.",
      melodyNotes: [
        { note: "D4", step: 0, duration: 0.5 },
        { note: "F4", step: 2, duration: 0.5 },
        { note: "A4", step: 4, duration: 1 },
        { note: "C5", step: 6, duration: 1 },
        { note: "D5", step: 8, duration: 1.5 },
        { note: "A4", step: 12, duration: 1 },
      ],
      drumPattern: {
        kick: [0, 4, 8, 12], // 4 on the floor
        snare: [4, 12],
        hihat: [2, 6, 10, 14], // off-beat
        clap: [4, 12],
      },
      bassPattern: [
        { note: "D2", step: 0 },
        { note: "D2", step: 2 },
        { note: "D2", step: 4 },
        { note: "D2", step: 6 },
        { note: "F2", step: 8 },
        { note: "G2", step: 12 },
      ],
    },
    {
      title: "Sharqona Shamol (Melodic Beat)",
      artist: "Navo Pro",
      genre: "Sharqona",
      bpm: 96,
      scale: "oriental",
      coverGradient: "from-amber-500 via-orange-600 to-red-600",
      description: "Sharq ohanglari va Phrygian Dominant pardasidagi nafis kuy.",
      melodyNotes: [
        { note: "D4", step: 0, duration: 1 },
        { note: "D#4", step: 2, duration: 1 },
        { note: "F#4", step: 4, duration: 1.5 },
        { note: "G4", step: 7, duration: 0.5 },
        { note: "A4", step: 8, duration: 1 },
        { note: "F#4", step: 11, duration: 1 },
        { note: "D4", step: 13, duration: 1.5 },
      ],
      drumPattern: {
        kick: [0, 6, 10],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        clap: [4, 12],
      },
      bassPattern: [
        { note: "D2", step: 0 },
        { note: "D#2", step: 4 },
        { note: "C2", step: 8 },
        { note: "D2", step: 12 },
      ],
    },
  ];

  const createdTracks: Track[] = [];

  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i];
    const { blob, url, duration } = await renderCompositionToWav(
      {
        bpm: s.bpm,
        genre: s.genre,
        scale: s.scale,
        melodyNotes: s.melodyNotes,
        drumPattern: s.drumPattern,
        bassPattern: s.bassPattern,
      },
      24 // 24 seconds preview for fast loading
    );

    const track: Track = {
      id: `seed_track_${Date.now()}_${i}`,
      title: s.title,
      artist: s.artist,
      duration: Math.round(duration),
      genre: s.genre,
      bpm: s.bpm,
      audioBlob: blob,
      audioUrl: url,
      coverGradient: s.coverGradient,
      createdAt: Date.now() - (seeds.length - i) * 3600000,
      isFavorite: i === 0,
      isGenerated: true,
      description: s.description,
    };

    await saveTrack(track);
    createdTracks.push(track);
  }

  // Create 2 default playlists
  const defaultPlaylists: Playlist[] = [
    {
      id: 'pl_favorites',
      name: "Sevimli Taronalar",
      description: "Eng yaxshi va yurakka yaqin musiqalar to'plami.",
      coverGradient: "from-rose-500 to-purple-600",
      coverIcon: "Heart",
      trackIds: createdTracks.slice(0, 2).map((t) => t.id),
      createdAt: Date.now() - 7200000,
    },
    {
      id: 'pl_evening',
      name: "Kechki Dam Olish",
      description: "Ishdan keyin hordiq chiqarish uchun sokin ritmlar.",
      coverGradient: "from-cyan-500 to-blue-600",
      coverIcon: "Moon",
      trackIds: createdTracks.map((t) => t.id),
      createdAt: Date.now() - 3600000,
    },
  ];

  for (const pl of defaultPlaylists) {
    await savePlaylist(pl);
  }

  return { tracks: createdTracks, playlists: defaultPlaylists };
}
