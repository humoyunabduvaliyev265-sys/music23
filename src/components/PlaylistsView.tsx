import React, { useState } from 'react';
import { 
  FolderPlus, 
  Play, 
  Shuffle, 
  Trash2, 
  Music, 
  ArrowLeft, 
  Download,
  ListMusic
} from 'lucide-react';
import { Playlist, Track } from '../types';
import { TrackCard } from './TrackCard';
import { downloadAudioTrack } from '../services/audioSynthesizer';
import { deletePlaylist } from '../services/db';

interface PlaylistsViewProps {
  playlists: Playlist[];
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onPlayQueue: (tracks: Track[], startIndex?: number) => void;
  onToggleFavorite: (id: string) => void;
  onAddToPlaylist: (track: Track) => void;
  onOpenCreatePlaylist: () => void;
  onDeletePlaylist: (id: string) => void;
  onDeleteTrackFromDb: (id: string) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onPlayQueue,
  onToggleFavorite,
  onAddToPlaylist,
  onOpenCreatePlaylist,
  onDeletePlaylist,
  onDeleteTrackFromDb,
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const playlistTracks = selectedPlaylist
    ? selectedPlaylist.trackIds
        .map((id) => tracks.find((t) => t.id === id))
        .filter((t): t is Track => t !== undefined)
    : [];

  const handleDownloadAll = () => {
    playlistTracks.forEach((track, idx) => {
      setTimeout(() => {
        downloadAudioTrack(track);
      }, idx * 500); // slight stagger to avoid browser popup blockers
    });
  };

  if (selectedPlaylist) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Back navigation */}
        <button
          type="button"
          onClick={() => setSelectedPlaylistId(null)}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Barcha Pleylistlar
        </button>

        {/* Playlist Banner Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#171926] border border-slate-800">
          <div
            className={`w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-tr ${selectedPlaylist.coverGradient} shadow-2xl flex items-center justify-center text-white shrink-0`}
          >
            <ListMusic className="w-16 h-16 opacity-90" />
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Pleylist
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 truncate">
              {selectedPlaylist.name}
            </h1>
            {selectedPlaylist.description && (
              <p className="text-xs text-slate-400 mt-1">
                {selectedPlaylist.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
              <span>{playlistTracks.length} ta musiqa</span>
              <span>•</span>
              <span>
                {Math.round(
                  playlistTracks.reduce((acc, curr) => acc + curr.duration, 0) / 60
                )}{' '}
                daqiqa
              </span>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                type="button"
                disabled={playlistTracks.length === 0}
                onClick={() => onPlayQueue(playlistTracks, 0)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
              >
                <Play className="w-4 h-4 fill-white" /> Barchasini Ijro Etish
              </button>

              <button
                type="button"
                disabled={playlistTracks.length === 0}
                onClick={() => {
                  const shuffled = [...playlistTracks].sort(() => Math.random() - 0.5);
                  onPlayQueue(shuffled, 0);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <Shuffle className="w-4 h-4" /> Aralashtirib Tinglash
              </button>

              <button
                type="button"
                disabled={playlistTracks.length === 0}
                onClick={handleDownloadAll}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors"
                title="Barcha treklarni yuklab olish"
              >
                <Download className="w-4 h-4 text-indigo-400" /> Barchasini Yuklash
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm(`"${selectedPlaylist.name}" pleylistini o'chirmoqchimisiz?`)) {
                    onDeletePlaylist(selectedPlaylist.id);
                    setSelectedPlaylistId(null);
                  }
                }}
                className="p-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 transition-colors ml-auto"
                title="Pleylistni o'chirish"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tracks in Playlist */}
        <div className="space-y-2">
          {playlistTracks.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-slate-900/30 border border-slate-800">
              <Music className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Bu pleylistda hozircha musiqa yo'q.</p>
              <p className="text-xs text-slate-500 mt-1">
                Kutubxonadan yoki AI studiyasidan musiqa qo'shishingiz mumkin.
              </p>
            </div>
          ) : (
            playlistTracks.map((track, idx) => (
              <TrackCard
                key={track.id}
                track={track}
                index={idx}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                onPlay={(t) => onPlayQueue(playlistTracks, idx)}
                onToggleFavorite={onToggleFavorite}
                onAddToPlaylist={onAddToPlaylist}
                onDelete={onDeleteTrackFromDb}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Playlists Grid Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Mening Pleylistlarim
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Musiqalarni to'plamlarga jamlang va zavq bilan tinglang
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreatePlaylist}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
        >
          <FolderPlus className="w-4 h-4" /> Yangi Pleylist
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {playlists.map((pl) => {
          const count = pl.trackIds.length;
          return (
            <div
              key={pl.id}
              onClick={() => setSelectedPlaylistId(pl.id)}
              className="group p-4 rounded-2xl bg-[#141522] hover:bg-[#181a2b] border border-slate-800/80 hover:border-slate-700/80 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div
                className={`w-full aspect-square rounded-xl bg-gradient-to-tr ${pl.coverGradient} flex items-center justify-center text-white shadow-lg shadow-black/40 group-hover:scale-[1.02] transition-transform relative overflow-hidden`}
              >
                <ListMusic className="w-12 h-12 opacity-80" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                  {pl.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {count} ta musiqa
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
