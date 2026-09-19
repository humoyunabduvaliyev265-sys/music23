import React from 'react';
import { 
  Play, 
  Pause, 
  Heart, 
  Download, 
  ListPlus, 
  Trash2, 
  Music, 
  Sparkles,
  FileAudio
} from 'lucide-react';
import { Track } from '../types';
import { downloadAudioTrack } from '../services/audioSynthesizer';

interface TrackCardProps {
  track: Track;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: (track: Track) => void;
  onToggleFavorite: (id: string) => void;
  onAddToPlaylist: (track: Track) => void;
  onDelete?: (id: string) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  index,
  isCurrent,
  isPlaying,
  onPlay,
  onToggleFavorite,
  onAddToPlaylist,
  onDelete,
}) => {
  const formatDuration = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
        isCurrent
          ? 'bg-indigo-600/15 border-indigo-500/40 text-white shadow-lg shadow-indigo-600/5'
          : 'bg-[#151622] hover:bg-[#1a1c2b] border-slate-800/80 hover:border-slate-700/80 text-slate-300'
      }`}
    >
      {/* Left: Index, Play Trigger & Cover Art */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onPlay(track)}
          className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center shadow-md group/btn"
        >
          <div className={`absolute inset-0 bg-gradient-to-tr ${track.coverGradient}`} />
          
          {/* Overlay play state */}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
            isCurrent ? 'opacity-100' : 'opacity-0 group-hover/btn:opacity-100'
          }`}>
            {isCurrent && isPlaying ? (
              <Pause className="w-5 h-5 text-white fill-white" />
            ) : (
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            )}
          </div>

          {!isCurrent && (
            <div className="relative text-white/90">
              {track.isGenerated ? <Sparkles className="w-4 h-4" /> : <Music className="w-4 h-4" />}
            </div>
          )}
        </button>

        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2">
            <h4 className={`text-sm font-bold truncate ${isCurrent ? 'text-indigo-400' : 'text-white'}`}>
              {track.title}
            </h4>
            {track.isGenerated && (
              <span className="hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI / Sint
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span className="truncate">{track.artist}</span>
            <span>•</span>
            <span className="text-[11px] text-slate-500">{track.genre}</span>
            {track.bpm > 0 && (
              <>
                <span>•</span>
                <span className="text-[11px] text-slate-500">{track.bpm} BPM</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Duration & Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <span className="text-xs font-mono text-slate-400 mr-1 sm:mr-2">
          {formatDuration(track.duration)}
        </span>

        {/* Favorite */}
        <button
          type="button"
          onClick={() => onToggleFavorite(track.id)}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-800/60 transition-colors"
          title={track.isFavorite ? "Sevimlilardan o'chirish" : "Sevimlilarga qo'shish"}
        >
          <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Add to Playlist */}
        <button
          type="button"
          onClick={() => onAddToPlaylist(track)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="Pleylistga qo'shish"
        >
          <ListPlus className="w-4 h-4" />
        </button>

        {/* Download WAV */}
        <button
          type="button"
          onClick={() => downloadAudioTrack(track)}
          className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 transition-colors"
          title="Telefonga / Kompyuterga yuklab olish (.WAV)"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Delete option if user wants to remove */}
        {onDelete && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`"${track.title}" musiqasini o'chirishni istaysizmi?`)) {
                onDelete(track.id);
              }
            }}
            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 transition-colors hidden sm:block"
            title="O'chirish"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
