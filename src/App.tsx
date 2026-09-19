/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  UploadCloud, 
  Search, 
  FolderPlus, 
  Music, 
  Compass, 
  Library, 
  Heart, 
  Play, 
  Shuffle, 
  Download,
  Flame,
  Sliders,
  Radio,
  ArrowRight
} from 'lucide-react';

import { Track, Playlist, ActiveTab } from './types';
import { 
  getAllTracks, 
  getAllPlaylists, 
  initializeSeedData, 
  toggleTrackFavorite, 
  deleteTrack, 
  deletePlaylist 
} from './services/db';
import { getLiveAudioContext, downloadAudioTrack } from './services/audioSynthesizer';

import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { PlayerBar } from './components/PlayerBar';
import { TrackCard } from './components/TrackCard';
import { StudioModal } from './components/StudioModal';
import { UploadModal } from './components/UploadModal';
import { PlaylistModal } from './components/PlaylistModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { NowPlayingModal } from './components/NowPlayingModal';
import { PlaylistsView } from './components/PlaylistsView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string>('all');

  // Player state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  // Modals state
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);

  // Audio element and analyzer refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isSourceConnectedRef = useRef(false);

  // Initialize DB and sample music
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const { tracks: loadedTracks, playlists: loadedPlaylists } = await initializeSeedData();
        setTracks(loadedTracks);
        setPlaylists(loadedPlaylists);
        setQueue(loadedTracks);
        if (loadedTracks.length > 0 && !currentTrack) {
          setCurrentTrack(loadedTracks[0]);
        }
      } catch (err) {
        console.error("Ma'lumotlar yuklanishida xatolik:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync playback rate with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Connect Web Audio Analyser node to audio element
  const initAudioAnalyzer = () => {
    if (isSourceConnectedRef.current || !audioRef.current) return;
    try {
      const ctx = getLiveAudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      isSourceConnectedRef.current = true;
    } catch (e) {
      console.warn("Web Audio Analyser ulanishda xato (bu normal):", e);
    }
  };

  // Playback Control Handlers
  const handlePlayTrack = (track: Track, customQueue?: Track[], index?: number) => {
    initAudioAnalyzer();
    const activeQueue = customQueue || tracks;
    setQueue(activeQueue);
    const targetIdx = index !== undefined ? index : activeQueue.findIndex((t) => t.id === track.id);
    setQueueIndex(targetIdx);
    setCurrentTrack(track);

    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => console.log("Ijro etish xatoligi:", e));
    }
  };

  const handleTogglePlay = () => {
    if (!currentTrack && tracks.length > 0) {
      handlePlayTrack(tracks[0]);
      return;
    }
    if (!audioRef.current) return;

    initAudioAnalyzer();
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => console.log("Play failed:", e));
    }
  };

  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleNext = () => {
    if (queue.length === 0) return;
    let nextIdx = queueIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      nextIdx = 0;
    }
    const nextTrack = queue[nextIdx];
    if (nextTrack) {
      handlePlayTrack(nextTrack, queue, nextIdx);
    }
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    if (currentTime > 3) {
      handleSeek(0);
      return;
    }
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) prevIdx = queue.length - 1;
    const prevTrack = queue[prevIdx];
    if (prevTrack) {
      handlePlayTrack(prevTrack, queue, prevIdx);
    }
  };

  const handleTrackEnded = () => {
    if (isLooping && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      handleNext();
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (id: string) => {
    const isFav = await toggleTrackFavorite(id);
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isFavorite: isFav } : t))
    );
    if (currentTrack && currentTrack.id === id) {
      setCurrentTrack({ ...currentTrack, isFavorite: isFav });
    }
  };

  // Delete track
  const handleDeleteTrack = async (id: string) => {
    await deleteTrack(id);
    setTracks((prev) => prev.filter((t) => t.id !== id));
    setQueue((prev) => prev.filter((t) => t.id !== id));
    if (currentTrack?.id === id) {
      const remaining = tracks.filter((t) => t.id !== id);
      if (remaining.length > 0) {
        handlePlayTrack(remaining[0], remaining);
      } else {
        setCurrentTrack(null);
        setIsPlaying(false);
      }
    }
  };

  // Delete playlist
  const handleDeletePlaylist = async (id: string) => {
    await deletePlaylist(id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  // Filtered tracks
  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.genre.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGenre =
      selectedGenreFilter === 'all' ||
      track.genre.toLowerCase().includes(selectedGenreFilter.toLowerCase());

    if (activeTab === 'favorites') {
      return matchesSearch && track.isFavorite;
    }

    return matchesSearch && matchesGenre;
  });

  const favoritesCount = tracks.filter((t) => t.isFavorite).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0d14] text-slate-100 font-sans">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={handleTrackEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenStudio={() => setIsStudioOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenCreatePlaylist={() => setIsPlaylistModalOpen(true)}
        tracksCount={tracks.length}
        favoritesCount={favoritesCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-32 sm:pb-24">
        {/* Offline connectivity indicator */}
        <OfflineIndicator />

        {/* Top Bar with Search & Quick Actions */}
        <header className="sticky top-0 z-20 bg-[#0c0d14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Musiqa nomi, ijrochi yoki janr bo'yicha qidirish..."
              className="w-full bg-[#161725] border border-slate-800/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton variant="header" />

            <button
              type="button"
              onClick={() => setIsStudioOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Musiqa Yaratish</span>
              <span className="sm:hidden">Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
              title="Fayl yuklash"
            >
              <UploadCloud className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Yuklash</span>
            </button>
          </div>
        </header>

        {/* View Router */}
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
          {activeTab === 'playlists' ? (
            <PlaylistsView
              playlists={playlists}
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={handlePlayTrack}
              onPlayQueue={(ql, idx) => handlePlayTrack(ql[idx || 0], ql, idx)}
              onToggleFavorite={handleToggleFavorite}
              onAddToPlaylist={(track) => {
                setSelectedTrackForPlaylist(track);
                setIsAddToPlaylistOpen(true);
              }}
              onOpenCreatePlaylist={() => setIsPlaylistModalOpen(true)}
              onDeletePlaylist={handleDeletePlaylist}
              onDeleteTrackFromDb={handleDeleteTrack}
            />
          ) : activeTab === 'studio' ? (
            /* Studio Tab View */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-[#171926] border border-indigo-500/20">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                    Kreativ Laboratoriya
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                    Musiqa Yaratish va Sintezatori
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Sun'iy intellekt orqali yangi kuylar to'qing yoki 16-qadamli bit-meykerda o'z ritmlaringizni yarating.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStudioOpen(true)}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-indigo-600/30 transition-all shrink-0"
                >
                  <Sparkles className="w-4 h-4" /> Studiyani Ochish
                </button>
              </div>

              {/* List of user generated tracks */}
              <div>
                <h3 className="text-base font-bold text-white mb-3">
                  Siz Yaratgan Musiqalar ({tracks.filter((t) => t.isGenerated).length})
                </h3>
                <div className="space-y-2">
                  {tracks.filter((t) => t.isGenerated).length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-[#141522] border border-slate-800 text-slate-400 text-xs">
                      Hozircha yaratilgan treklar yo'q. "Studiyani Ochish" tugmasini bosing!
                    </div>
                  ) : (
                    tracks
                      .filter((t) => t.isGenerated)
                      .map((track, idx) => (
                        <TrackCard
                          key={track.id}
                          track={track}
                          index={idx}
                          isCurrent={currentTrack?.id === track.id}
                          isPlaying={isPlaying && currentTrack?.id === track.id}
                          onPlay={(t) => handlePlayTrack(t, tracks.filter((x) => x.isGenerated))}
                          onToggleFavorite={handleToggleFavorite}
                          onAddToPlaylist={(t) => {
                            setSelectedTrackForPlaylist(t);
                            setIsAddToPlaylistOpen(true);
                          }}
                          onDelete={handleDeleteTrack}
                        />
                      ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Home / Library / Favorites View */
            <div className="space-y-8">
              {/* Hero Banner (Only on Home tab) */}
              {activeTab === 'home' && (
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-950 via-purple-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
                  <div className="relative z-10 max-w-xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" /> Web Audio & AI Sintezator
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                      Musiqa Yarating, Tinglang va Telefoningizga Saqlang
                    </h1>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      AI va ritm studiyasi orqali bepul musiqa yarating, o'z audiolaringizni yuklang, 
                      pleylistlar tuzing va bir marta bosish bilan .WAV formatida yuklab oling.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsStudioOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
                      >
                        <Sparkles className="w-4 h-4" /> Musiqa Yaratish
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsUploadOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
                      >
                        <UploadCloud className="w-4 h-4 text-indigo-400" /> Fayl Yuklash
                      </button>
                    </div>
                  </div>

                  {/* Aesthetic Background Elements */}
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
                </div>
              )}

              {/* Genre Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'Barchasi' },
                  { id: 'lo-fi', label: 'Lo-Fi Chill' },
                  { id: 'synthwave', label: 'Synthwave' },
                  { id: 'sharqona', label: 'Sharqona' },
                  { id: 'beatmaker', label: 'Bit-Meyker' },
                  { id: 'mahalliy', label: 'Yuklanganlar' },
                ].map((genre) => (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => setSelectedGenreFilter(genre.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                      selectedGenreFilter === genre.id
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                        : 'bg-[#151622] text-slate-400 hover:text-white border-slate-800'
                    }`}
                  >
                    {genre.label}
                  </button>
                ))}
              </div>

              {/* Track List Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {activeTab === 'favorites'
                        ? 'Sevimli Musiqalaringiz'
                        : activeTab === 'library'
                        ? 'Saqlangan Barcha Musiqalar'
                        : 'Ommabop Taronalar'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {filteredTracks.length} ta musiqa topildi
                    </p>
                  </div>

                  {filteredTracks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handlePlayTrack(filteredTracks[0], filteredTracks, 0)}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Barchasini Tinglash
                    </button>
                  )}
                </div>

                {/* Track Rows */}
                {filteredTracks.length === 0 ? (
                  <div className="text-center py-16 rounded-2xl bg-[#13141f] border border-slate-800">
                    <Music className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-400">Hech qanday musiqa topilmadi</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Qidiruv so'zini o'zgartiring yoki yangi musiqa yarating.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTracks.map((track, idx) => (
                      <TrackCard
                        key={track.id}
                        track={track}
                        index={idx}
                        isCurrent={currentTrack?.id === track.id}
                        isPlaying={isPlaying && currentTrack?.id === track.id}
                        onPlay={(t) => handlePlayTrack(t, filteredTracks, idx)}
                        onToggleFavorite={handleToggleFavorite}
                        onAddToPlaylist={(t) => {
                          setSelectedTrackForPlaylist(t);
                          setIsAddToPlaylistOpen(true);
                        }}
                        onDelete={handleDeleteTrack}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Persistent Bottom Player Bar */}
      <PlayerBar
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isLooping={isLooping}
        isShuffle={isShuffle}
        analyserNode={analyserRef.current}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onNext={handleNext}
        onPrev={handlePrev}
        onToggleLoop={() => setIsLooping(!isLooping)}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        onVolumeChange={setVolume}
        onToggleMute={() => setIsMuted(!isMuted)}
        onToggleFavorite={handleToggleFavorite}
        onOpenNowPlaying={() => setIsNowPlayingOpen(true)}
      />

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasActivePlayer={currentTrack !== null}
      />

      {/* Modals */}
      <StudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onTrackCreated={(newTrack) => {
          setTracks((prev) => [newTrack, ...prev]);
        }}
        onPlayTrack={(newTrack) => {
          handlePlayTrack(newTrack, [newTrack, ...tracks], 0);
        }}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onTrackUploaded={(newTrack) => {
          setTracks((prev) => [newTrack, ...prev]);
        }}
      />

      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        onPlaylistCreated={(newPl) => {
          setPlaylists((prev) => [newPl, ...prev]);
        }}
      />

      <AddToPlaylistModal
        isOpen={isAddToPlaylistOpen}
        onClose={() => setIsAddToPlaylistOpen(false)}
        track={selectedTrackForPlaylist}
        playlists={playlists}
        onPlaylistsUpdated={async () => {
          const updated = await getAllPlaylists();
          setPlaylists(updated);
        }}
        onOpenCreatePlaylist={() => setIsPlaylistModalOpen(true)}
      />

      <NowPlayingModal
        isOpen={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isLooping={isLooping}
        isShuffle={isShuffle}
        playbackRate={playbackRate}
        analyserNode={analyserRef.current}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onNext={handleNext}
        onPrev={handlePrev}
        onToggleLoop={() => setIsLooping(!isLooping)}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        onVolumeChange={setVolume}
        onToggleMute={() => setIsMuted(!isMuted)}
        onChangeRate={setPlaybackRate}
        onToggleFavorite={handleToggleFavorite}
        onAddToPlaylist={(t) => {
          setSelectedTrackForPlaylist(t);
          setIsAddToPlaylistOpen(true);
        }}
      />
    </div>
  );
}
