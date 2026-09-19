import React from 'react';
import { Compass, Sparkles, FolderPlus, Library, Heart } from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  hasActivePlayer: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  hasActivePlayer,
}) => {
  return (
    <nav
      className={`md:hidden fixed left-0 right-0 z-30 bg-[#0e0f18]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around select-none transition-all ${
        hasActivePlayer ? 'bottom-[64px]' : 'bottom-0'
      }`}
    >
      <button
        type="button"
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'home' ? 'text-indigo-400' : 'text-slate-500'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5">Asosiy</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('studio')}
        className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'studio' ? 'text-indigo-400' : 'text-slate-500'
        }`}
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5">Yaratish</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('playlists')}
        className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'playlists' ? 'text-indigo-400' : 'text-slate-500'
        }`}
      >
        <FolderPlus className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5">Pleylist</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('library')}
        className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'library' ? 'text-indigo-400' : 'text-slate-500'
        }`}
      >
        <Library className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5">Kutubxona</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('favorites')}
        className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'favorites' ? 'text-indigo-400' : 'text-slate-500'
        }`}
      >
        <Heart className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5">Sevimlilar</span>
      </button>
    </nav>
  );
};
