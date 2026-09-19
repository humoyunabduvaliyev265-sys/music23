import React from 'react';
import { ListPlus, Check, X, FolderPlus } from 'lucide-react';
import { Track, Playlist } from '../types';
import { addTrackToPlaylist, removeTrackFromPlaylist } from '../services/db';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  playlists: Playlist[];
  onPlaylistsUpdated: () => void;
  onOpenCreatePlaylist: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  track,
  playlists,
  onPlaylistsUpdated,
  onOpenCreatePlaylist,
}) => {
  if (!isOpen || !track) return null;

  const handleToggle = async (playlist: Playlist) => {
    const isAlreadyIn = playlist.trackIds.includes(track.id);
    if (isAlreadyIn) {
      await removeTrackFromPlaylist(playlist.id, track.id);
    } else {
      await addTrackToPlaylist(playlist.id, track.id);
    }
    onPlaylistsUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm bg-[#13141f] border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <ListPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pleylistga Qo'shish</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                "{track.title}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="my-4 max-h-60 overflow-y-auto space-y-2">
          {playlists.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              Hozircha pleylistlar mavjud emas.
            </p>
          ) : (
            playlists.map((pl) => {
              const inPlaylist = pl.trackIds.includes(track.id);
              return (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => handleToggle(pl)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    inPlaylist
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${pl.coverGradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                    >
                      {pl.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold truncate max-w-[180px]">{pl.name}</div>
                      <div className="text-[10px] text-slate-400">{pl.trackIds.length} musiqa</div>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      inPlaylist
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-slate-700 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCreatePlaylist();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            <FolderPlus className="w-3.5 h-3.5" /> Yangi pleylist ochish
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Tayyor
          </button>
        </div>
      </div>
    </div>
  );
};
