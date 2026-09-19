import React from 'react';
import { 
  Compass, 
  Sparkles, 
  FolderPlus, 
  Library, 
  Heart, 
  UploadCloud, 
  Music,
  Sliders,
  Disc3
} from 'lucide-react';
import { ActiveTab } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenStudio: () => void;
  onOpenUpload: () => void;
  onOpenCreatePlaylist: () => void;
  tracksCount: number;
  favoritesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenStudio,
  onOpenUpload,
  onOpenCreatePlaylist,
  tracksCount,
  favoritesCount,
}) => {
  return (
    <aside className="w-64 bg-[#0e0f18] border-r border-slate-800/80 p-5 flex flex-col justify-between hidden md:flex shrink-0 select-none">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Disc3 className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
              Ovoz Studio
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Musiqa & Pleylistlar
            </p>
          </div>
        </div>

        {/* Action Buttons: Studio & Upload */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onOpenStudio}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            Musiqa Yaratish
          </button>

          <button
            type="button"
            onClick={onOpenUpload}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-[#161725] hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800/80 flex items-center justify-center gap-2 transition-all"
          >
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            Fayl Yuklash (.mp3/.wav)
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Menyu
          </div>

          <button
            type="button"
            onClick={() => onTabChange('home')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'home'
                ? 'bg-indigo-600/15 text-indigo-400 font-extrabold border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            Bosh Sahifa
          </button>

          <button
            type="button"
            onClick={() => onTabChange('studio')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'studio'
                ? 'bg-indigo-600/15 text-indigo-400 font-extrabold border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Musiqa Studiyasi
          </button>

          <button
            type="button"
            onClick={() => onTabChange('playlists')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'playlists'
                ? 'bg-indigo-600/15 text-indigo-400 font-extrabold border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            Pleylistlar
          </button>

          <button
            type="button"
            onClick={() => onTabChange('library')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'library'
                ? 'bg-indigo-600/15 text-indigo-400 font-extrabold border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Library className="w-4 h-4" />
              Saqlangan Musiqalar
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {tracksCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('favorites')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'favorites'
                ? 'bg-indigo-600/15 text-indigo-400 font-extrabold border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4" />
              Sevimlilar
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {favoritesCount}
            </span>
          </button>
        </nav>
      </div>

      {/* PWA Offline Install Button */}
      <PWAInstallButton variant="sidebar" />

      {/* Device & Storage badge */}
      <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between text-slate-300 font-semibold">
          <span>Qurilma Xotirasi</span>
          <span className="text-emerald-400 font-bold">Faol</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Barcha musiqalar telefon va kompyuteringizda xavfsiz saqlanadi va yuklab olinadi.
        </p>
      </div>
    </aside>
  );
};
