import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Shuffle, 
  Heart, 
  Download, 
  Maximize2,
  ListMusic
} from 'lucide-react';
import { Track } from '../types';
import { AudioVisualizer } from './AudioVisualizer';
import { downloadAudioTrack } from '../services/audioSynthesizer';

interface PlayerBarProps {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  isShuffle: boolean;
  analyserNode: AnalyserNode | null;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleLoop: () => void;
  onToggleShuffle: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleFavorite: (id: string) => void;
  onOpenNowPlaying: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isLooping,
  isShuffle,
  analyserNode,
  onTogglePlay,
  onSeek,
  onNext,
  onPrev,
  onToggleLoop,
  onToggleShuffle,
  onVolumeChange,
  onToggleMute,
  onToggleFavorite,
  onOpenNowPlaying,
}) => {
  if (!track) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#11121d]/95 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2.5 sm:py-3 shadow-2xl select-none">
      {/* Mini Seek Bar for Mobile (top hairline) */}
      <div 
        className="sm:hidden absolute top-0 left-0 right-0 h-1 bg-slate-800 cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickPos = (e.clientX - rect.left) / rect.width;
          onSeek(clickPos * duration);
        }}
      >
        <div
          className="h-full bg-indigo-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Track Info & Artwork */}
        <div 
          onClick={onOpenNowPlaying}
          className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial sm:w-64 cursor-pointer group"
        >
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr ${track.coverGradient} flex items-center justify-center text-white shadow-md shadow-black/40 shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform`}>
            <ListMusic className="w-5 h-5 opacity-90" />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              </div>
            )}
          </div>

          <div className="min-w-0 pr-1">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
              {track.title}
            </h4>
            <p className="text-[11px] text-slate-400 truncate">
              {track.artist}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(track.id);
            }}
            className="hidden sm:block p-1.5 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
          >
            <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Center: Playback Controls & Progress (Desktop) */}
        <div className="flex-1 max-w-xl hidden sm:flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onToggleShuffle}
              className={`p-1.5 transition-colors ${
                isShuffle ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Aralashtirish (Shuffle)"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onPrev}
              className="p-1.5 text-slate-300 hover:text-white transition-colors"
              title="Oldingi musiqa"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className="w-9 h-9 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 shadow-md shadow-white/10 transition-all"
              title={isPlaying ? "To'xtatish (Pause)" : "Ijro etish (Play)"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onNext}
              className="p-1.5 text-slate-300 hover:text-white transition-colors"
              title="Keyingi musiqa"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={onToggleLoop}
              className={`p-1.5 transition-colors ${
                isLooping ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Takrorlash (Loop)"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop Progress Bar */}
          <div className="w-full flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="w-9 text-right">{formatTime(currentTime)}</span>
            <div className="flex-1 relative flex items-center group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 group-hover:h-2 transition-all"
              />
            </div>
            <span className="w-9 text-left">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Mobile Mini Controls */}
        <div className="flex sm:hidden items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              downloadAudioTrack(track);
            }}
            className="p-2 text-slate-400 hover:text-white"
            title="Yuklab olish (.WAV)"
          >
            <Download className="w-4 h-4 text-indigo-400" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Right: Audio Visualizer, Volume & Download (Desktop) */}
        <div className="hidden sm:flex items-center gap-3 w-64 justify-end">
          {/* Live mini equalizer */}
          <div className="w-24 h-8 flex items-center">
            <AudioVisualizer
              analyserNode={analyserNode}
              isPlaying={isPlaying}
              barColor="#818cf8"
              height={30}
            />
          </div>

          {/* Download button */}
          <button
            type="button"
            onClick={() => downloadAudioTrack(track)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-indigo-400 border border-slate-700/60 transition-colors"
            title="Kompyuter yoki telefonga yuklab olish (.WAV)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              className="text-slate-400 hover:text-white"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={onOpenNowPlaying}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Kengaytirilgan pleyer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
