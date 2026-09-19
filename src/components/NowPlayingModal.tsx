import React from 'react';
import { 
  ChevronDown, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Shuffle, 
  Heart, 
  Download, 
  ListPlus, 
  Volume2, 
  VolumeX, 
  Music2,
  Sparkles,
  Gauge
} from 'lucide-react';
import { Track } from '../types';
import { AudioVisualizer } from './AudioVisualizer';
import { downloadAudioTrack } from '../services/audioSynthesizer';

interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  isShuffle: boolean;
  playbackRate: number;
  analyserNode: AnalyserNode | null;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleLoop: () => void;
  onToggleShuffle: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onChangeRate: (rate: number) => void;
  onToggleFavorite: (id: string) => void;
  onAddToPlaylist: (track: Track) => void;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({
  isOpen,
  onClose,
  track,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isLooping,
  isShuffle,
  playbackRate,
  analyserNode,
  onTogglePlay,
  onSeek,
  onNext,
  onPrev,
  onToggleLoop,
  onToggleShuffle,
  onVolumeChange,
  onToggleMute,
  onChangeRate,
  onToggleFavorite,
  onAddToPlaylist,
}) => {
  if (!isOpen || !track) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0c0d14]/95 backdrop-blur-2xl text-white overflow-y-auto animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 max-w-4xl mx-auto w-full">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Hozir Ijro Etilmoqda
          </span>
          <div className="text-xs font-semibold text-indigo-400 truncate max-w-[200px]">
            {track.genre}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite(track.id)}
            className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
          >
            <Heart className={`w-5 h-5 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => onAddToPlaylist(track)}
            className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ListPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Player Display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 max-w-lg mx-auto w-full">
        {/* Cover Art Visual with Glow */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-4">
          <div className={`absolute inset-0 rounded-3xl bg-gradient-to-tr ${track.coverGradient} blur-2xl opacity-40 animate-pulse`} />
          <div
            className={`relative w-full h-full rounded-3xl bg-gradient-to-tr ${track.coverGradient} shadow-2xl flex flex-col items-center justify-center p-6 text-white border border-white/10 ${
              isPlaying ? 'scale-[1.02] transition-transform duration-700' : ''
            }`}
          >
            <div className="w-20 h-20 rounded-2xl bg-black/20 backdrop-blur-md flex items-center justify-center mb-4 border border-white/10 shadow-inner">
              <Music2 className="w-10 h-10" />
            </div>

            {/* Audio Waveform inside cover */}
            <div className="w-full flex justify-center h-12">
              <AudioVisualizer
                analyserNode={analyserNode}
                isPlaying={isPlaying}
                barColor="#ffffff"
                height={40}
              />
            </div>

            <div className="mt-2 text-center">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-black/30 border border-white/10">
                {track.bpm} BPM
              </span>
            </div>
          </div>
        </div>

        {/* Track Title & Artist */}
        <div className="text-center mt-4 w-full">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
            {track.title}
          </h2>
          <p className="text-sm font-medium text-slate-400 mt-1 truncate">
            {track.artist}
          </p>

          {track.description && (
            <p className="text-xs text-slate-500 mt-2 line-clamp-2 px-4 italic">
              "{track.description}"
            </p>
          )}
        </div>

        {/* Progress Bar & Seek */}
        <div className="w-full mt-6 space-y-1.5">
          <div className="relative group flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between w-full max-w-sm mt-6">
          <button
            type="button"
            onClick={onToggleShuffle}
            className={`p-2.5 rounded-full transition-colors ${
              isShuffle ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onPrev}
            className="p-3 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            className="p-3 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          <button
            type="button"
            onClick={onToggleLoop}
            className={`p-2.5 rounded-full transition-colors ${
              isLooping ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Repeat className="w-5 h-5" />
          </button>
        </div>

        {/* Speed & Download row */}
        <div className="flex items-center justify-between w-full max-w-sm mt-6 pt-4 border-t border-slate-800/80">
          {/* Speed Selector */}
          <div className="flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-slate-500" />
            {[0.75, 1, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => onChangeRate(rate)}
                className={`text-[11px] font-bold px-2 py-1 rounded-md transition-colors ${
                  playbackRate === rate
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Download Button */}
          <button
            type="button"
            onClick={() => downloadAudioTrack(track)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Yuklab Olish (.WAV)
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3 w-full max-w-xs mt-5">
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
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
