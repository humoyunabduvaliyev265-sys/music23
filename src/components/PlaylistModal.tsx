import React, { useState } from 'react';
import { FolderPlus, Music, Heart, Flame, Sparkles, Moon, Sun, Star, X } from 'lucide-react';
import { Playlist } from '../types';
import { savePlaylist } from '../services/db';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated: (playlist: Playlist) => void;
  initialPlaylist?: Playlist | null;
}

const ICONS = [
  { id: 'Music', Icon: Music },
  { id: 'Heart', Icon: Heart },
  { id: 'Flame', Icon: Flame },
  { id: 'Sparkles', Icon: Sparkles },
  { id: 'Moon', Icon: Moon },
  { id: 'Sun', Icon: Sun },
  { id: 'Star', Icon: Star },
];

const GRADIENTS = [
  'from-purple-600 to-indigo-600',
  'from-rose-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-red-600',
  'from-emerald-500 to-teal-700',
  'from-pink-500 to-rose-600',
];

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  onPlaylistCreated,
  initialPlaylist,
}) => {
  const [name, setName] = useState(initialPlaylist?.name || '');
  const [description, setDescription] = useState(initialPlaylist?.description || '');
  const [selectedIcon, setSelectedIcon] = useState(initialPlaylist?.coverIcon || 'Music');
  const [selectedGradient, setSelectedGradient] = useState(
    initialPlaylist?.coverGradient || GRADIENTS[0]
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const playlist: Playlist = {
      id: initialPlaylist ? initialPlaylist.id : `pl_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      coverIcon: selectedIcon,
      coverGradient: selectedGradient,
      trackIds: initialPlaylist ? initialPlaylist.trackIds : [],
      createdAt: initialPlaylist ? initialPlaylist.createdAt : Date.now(),
    };

    await savePlaylist(playlist);
    onPlaylistCreated(playlist);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md bg-[#13141f] border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialPlaylist ? "Pleylistni Tahrirlash" : "Yangi Pleylist Yaratish"}
              </h3>
              <p className="text-xs text-slate-400">Musiqalaringizni to'plamlarga ajrating</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Pleylist Nomi *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Kechki Sayr, Sevimli Hitlar..."
              className="w-full bg-[#171926] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Tavsif (Ixtiyoriy)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ushbu pleylist qanday kayfiyat yoki holat uchun mo'ljallangan?"
              rows={2}
              className="w-full bg-[#171926] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Belgi (Icon)
            </label>
            <div className="flex gap-2">
              {ICONS.map(({ id, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedIcon(id)}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                    selectedIcon === id
                      ? 'border-indigo-500 bg-indigo-600/30 text-indigo-300'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Muqova Rangi
            </label>
            <div className="flex gap-2.5">
              {GRADIENTS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGradient(g)}
                  className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${g} transition-all transform ${
                    selectedGradient === g
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all"
            >
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
