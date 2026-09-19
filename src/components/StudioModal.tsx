import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Music, 
  Play, 
  Square, 
  Sliders, 
  Download, 
  Save, 
  X, 
  Flame, 
  RefreshCw,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Track } from '../types';
import { 
  playLivePadSound, 
  renderCompositionToWav, 
  downloadAudioTrack,
  SCALES
} from '../services/audioSynthesizer';
import { saveTrack } from '../services/db';
import { generateOfflineProceduralComposition } from '../services/proceduralComposer';
import { WifiOff } from 'lucide-react';

interface StudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackCreated: (track: Track) => void;
  onPlayTrack: (track: Track) => void;
}

const GENRE_PRESETS = [
  { id: 'lofi', label: 'Lo-Fi Chill', icon: '☕', bpm: 85, scale: 'minor', color: 'from-purple-500 to-indigo-600' },
  { id: 'synthwave', label: 'Synthwave 80s', icon: '🌆', bpm: 120, scale: 'dorian', color: 'from-pink-500 to-purple-600' },
  { id: 'oriental', label: 'Sharqona / Folk', icon: '🪕', bpm: 95, scale: 'oriental', color: 'from-amber-500 to-red-600' },
  { id: 'hiphop', label: 'Hip-Hop & Trap', icon: '🎧', bpm: 135, scale: 'minor', color: 'from-emerald-500 to-teal-700' },
  { id: 'house', label: 'Deep House / Dance', icon: '⚡', bpm: 124, scale: 'minor', color: 'from-blue-500 to-cyan-600' },
  { id: 'ambient', label: 'Sokin Ambient', icon: '🌌', bpm: 72, scale: 'pentatonic', color: 'from-violet-600 to-fuchsia-700' },
];

const PROMPT_SUGGESTIONS = [
  "Toshkentning yomg'irli oqshomi uchun sokin lofi gitara",
  "80-yillar retro synthwave va kosmik ritmlar",
  "Sharqona ohanglar, nafis nay va doira ritmi",
  "Kechki mashg'ulot yoki yugurish uchun baquvvat EDM bit",
  "Dars qilish va diqqatni jamlash uchun mayin ambient fortepiano",
];

const DRUM_CHANNELS = [
  { id: 'kick', name: 'Kick (Bass Drum)', sound: 'kick', color: 'bg-rose-500' },
  { id: 'snare', name: 'Snare (Qarsillama)', sound: 'snare', color: 'bg-amber-500' },
  { id: 'hihat', name: 'Hi-Hat (Metalli)', sound: 'hihat', color: 'bg-sky-400' },
  { id: 'clap', name: 'Clap (Qarsak)', sound: 'clap', color: 'bg-purple-500' },
  { id: 'bass', name: 'Sub Bass', sound: 'bass', color: 'bg-emerald-500', defaultNote: 'A2' },
  { id: 'synth', name: 'Melodiya Sint', sound: 'synth', color: 'bg-indigo-400', defaultNote: 'E4' },
];

export const StudioModal: React.FC<StudioModalProps> = ({
  isOpen,
  onClose,
  onTrackCreated,
  onPlayTrack,
}) => {
  const [activeMode, setActiveMode] = useState<'ai' | 'sequencer'>('ai');

  // AI Generator state
  const [promptText, setPromptText] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('lofi');
  const [bpm, setBpm] = useState(85);
  const [scale, setScale] = useState('minor');
  const [durationSecs, setDurationSecs] = useState(25);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [lastCreatedTrack, setLastCreatedTrack] = useState<Track | null>(null);

  // Sequencer state
  const [sequencerBpm, setSequencerBpm] = useState(110);
  const [grid, setGrid] = useState<Record<string, boolean[]>>({
    kick: [true, false, false, false, false, false, false, false, true, false, true, false, false, false, false, false],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    bass: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
    synth: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
  });
  const [isSequencerPlaying, setIsSequencerPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRenderingSeq, setIsRenderingSeq] = useState(false);

  // Sequencer playback loop
  const stepTimerRef = useRef<number | null>(null);
  const currentStepRef = useRef(0);
  currentStepRef.current = currentStep;

  useEffect(() => {
    if (!isSequencerPlaying) {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      setCurrentStep(0);
      return;
    }

    const intervalMs = (60 / sequencerBpm / 4) * 1000;
    stepTimerRef.current = window.setInterval(() => {
      const step = currentStepRef.current;
      // Play enabled sounds for this step
      DRUM_CHANNELS.forEach((ch) => {
        if (grid[ch.id]?.[step]) {
          playLivePadSound(ch.sound, ch.defaultNote);
        }
      });

      setCurrentStep((prev) => (prev + 1) % 16);
    }, intervalMs);

    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, [isSequencerPlaying, sequencerBpm, grid]);

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen && isSequencerPlaying) {
      setIsSequencerPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle sequencer step
  const toggleStep = (channelId: string, stepIndex: number) => {
    setGrid((prev) => {
      const newSteps = [...prev[channelId]];
      newSteps[stepIndex] = !newSteps[stepIndex];
      return { ...prev, [channelId]: newSteps };
    });
    // Trigger sound on click if activating
    if (!grid[channelId][stepIndex]) {
      const ch = DRUM_CHANNELS.find((c) => c.id === channelId);
      if (ch) playLivePadSound(ch.sound, ch.defaultNote);
    }
  };

  // Handle AI track creation
  const handleGenerateAiTrack = async () => {
    setIsGenerating(true);
    setGenerationStep("Musiqa tuzilishi shakllantirilmoqda...");

    try {
      let comp;
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      if (isOffline) {
        setGenerationStep("Offlayn rejim: Lokal sintezator musiqani shakllantirmoqda...");
        comp = generateOfflineProceduralComposition(promptText, selectedGenre, bpm, scale);
      } else {
        try {
          const response = await fetch('/api/ai/compose-track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: promptText || `${selectedGenre} janrida musiqiy kompozitsiya`,
              genre: selectedGenre,
              mood: 'melodic',
              tempo: bpm,
              scale: scale,
            }),
          });

          if (!response.ok) {
            throw new Error(`Server status: ${response.status}`);
          }
          const data = await response.json();
          comp = data.composition;
        } catch (fetchErr) {
          console.warn("Server aloqasi mavjud emas, lokal generatsiyaga o'tildi:", fetchErr);
          setGenerationStep("Offlayn: Brauzer sintezatori orqali kuy yaratilmoqda...");
          comp = generateOfflineProceduralComposition(promptText, selectedGenre, bpm, scale);
        }
      }

      setGenerationStep("Web Audio yordamida stereo to'lqinlar sintez qilinmoqda...");

      // 2. Synthesize audio buffer to WAV using Web Audio OfflineAudioContext
      const { blob, url, duration } = await renderCompositionToWav(
        {
          bpm: comp.bpm || bpm,
          genre: selectedGenre,
          scale: comp.scale || scale,
          melodyNotes: comp.melodyNotes,
          drumPattern: comp.drumPattern,
          bassPattern: comp.bassPattern,
        },
        durationSecs
      );

      setGenerationStep("Fayl saqlanmoqda va kutubxonaga qo'shilmoqda...");

      const genreObj = GENRE_PRESETS.find((g) => g.id === selectedGenre);
      const newTrack: Track = {
        id: `track_gen_${Date.now()}`,
        title: comp.title || `${genreObj?.label || 'Yangi'} Kuy`,
        artist: comp.artist || 'Ovoz Studio AI',
        duration: Math.round(duration),
        genre: genreObj?.label || selectedGenre,
        bpm: comp.bpm || bpm,
        audioBlob: blob,
        audioUrl: url,
        coverGradient: genreObj?.color || 'from-indigo-600 to-purple-600',
        createdAt: Date.now(),
        isFavorite: false,
        isGenerated: true,
        description: comp.description || promptText || "Sun'iy intellekt tomonidan sintez qilingan original musiqa.",
        compositionData: comp,
      };

      await saveTrack(newTrack);
      setLastCreatedTrack(newTrack);
      onTrackCreated(newTrack);
      onPlayTrack(newTrack);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error("Musiqa yaratishda xatolik:", err);
      alert("Musiqa yaratishda xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Render Sequencer pattern into a real full audio track
  const handleSaveSequencerTrack = async () => {
    setIsRenderingSeq(true);
    try {
      const kickSteps: number[] = [];
      const snareSteps: number[] = [];
      const hihatSteps: number[] = [];
      const clapSteps: number[] = [];

      for (let i = 0; i < 16; i++) {
        if (grid.kick[i]) kickSteps.push(i);
        if (grid.snare[i]) snareSteps.push(i);
        if (grid.hihat[i]) hihatSteps.push(i);
        if (grid.clap[i]) clapSteps.push(i);
      }

      // Convert synth steps to notes
      const melodyNotes = [];
      const scaleNotes = SCALES.minor;
      for (let i = 0; i < 16; i++) {
        if (grid.synth[i]) {
          melodyNotes.push({
            note: scaleNotes[i % scaleNotes.length],
            step: i,
            duration: 1,
          });
        }
      }

      const bassPattern = [];
      for (let i = 0; i < 16; i++) {
        if (grid.bass[i]) {
          bassPattern.push({
            note: "A2",
            step: i,
          });
        }
      }

      const { blob, url, duration } = await renderCompositionToWav(
        {
          bpm: sequencerBpm,
          genre: 'Bit-Meyker',
          scale: 'minor',
          melodyNotes,
          drumPattern: {
            kick: kickSteps,
            snare: snareSteps,
            hihat: hihatSteps,
            clap: clapSteps,
          },
          bassPattern,
        },
        30 // 30 seconds track
      );

      const newTrack: Track = {
        id: `track_seq_${Date.now()}`,
        title: `Original Bit #${Math.floor(Math.random() * 900 + 100)}`,
        artist: "Mening Studiyam",
        duration: Math.round(duration),
        genre: 'Beatmaker',
        bpm: sequencerBpm,
        audioBlob: blob,
        audioUrl: url,
        coverGradient: 'from-emerald-500 to-cyan-600',
        createdAt: Date.now(),
        isFavorite: true,
        isGenerated: true,
        description: `16-qadamli interaktiv bit-meykerda tuzilgan shaxsiy ritm (${sequencerBpm} BPM).`,
      };

      await saveTrack(newTrack);
      setLastCreatedTrack(newTrack);
      onTrackCreated(newTrack);
      onPlayTrack(newTrack);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error("Bitni saqlashda xatolik:", err);
    } finally {
      setIsRenderingSeq(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#13141f] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#171926]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Ovoz Musiqa Studiyasi
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  AI & Synth
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Musiqa yarating, ritmlar tuzing va darhol yuklab oling
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 px-6 bg-[#11121d]">
          <button
            onClick={() => setActiveMode('ai')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
              activeMode === 'ai'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            AI & Janr Generatori
          </button>
          <button
            onClick={() => setActiveMode('sequencer')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
              activeMode === 'sequencer'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Interaktiv Bit-Meyker
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeMode === 'ai' ? (
            <div className="space-y-6">
              {/* Genre Grid */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  1. Musiqa Janri va Uslubi
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {GENRE_PRESETS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setSelectedGenre(g.id);
                        setBpm(g.bpm);
                        setScale(g.scale);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        selectedGenre === g.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-md shadow-indigo-500/10'
                          : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{g.label}</div>
                        <div className="text-[11px] text-slate-400">{g.bpm} BPM</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Text / Mood */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    2. Musiqa Tasviri (G'oya yoki Kayfiyat)
                  </label>
                  <span className="text-[11px] text-slate-500">Ixtiyoriy</span>
                </div>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Masalan: Tungi Toshkent ko'chalari uchun sokin va shinam lofi gitara akkordlari..."
                  rows={2}
                  className="w-full bg-[#171926] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                />

                {/* Suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PROMPT_SUGGESTIONS.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPromptText(sug)}
                      className="text-[11px] bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700/50 transition-colors truncate max-w-full"
                    >
                      ✨ {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tuning Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
                    <span>Tezlik (BPM)</span>
                    <span className="text-indigo-400 font-bold">{bpm} BPM</span>
                  </div>
                  <input
                    type="range"
                    min={65}
                    max={155}
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
                    <span>Musiqa Pardasi (Gama)</span>
                    <span className="text-indigo-400 font-bold capitalize">{scale}</span>
                  </div>
                  <select
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                    className="w-full bg-[#13141f] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="minor">Minor (Mayus / Lofi)</option>
                    <option value="major">Major (Shod / Yengil)</option>
                    <option value="oriental">Sharqona / Phrygian</option>
                    <option value="dorian">Dorian (80s Retro)</option>
                    <option value="pentatonic">Pentatonik (Sokin)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
                    <span>Davomiyligi</span>
                    <span className="text-indigo-400 font-bold">{durationSecs} soniya</span>
                  </div>
                  <div className="flex gap-2">
                    {[15, 25, 45].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setDurationSecs(sec)}
                        className={`flex-1 py-1 text-xs rounded-lg font-semibold border ${
                          durationSecs === sec
                            ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                            : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerateAiTrack}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-xl shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm transition-all active:scale-[0.99]"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>{generationStep || "Musiqa sintez qilinmoqda..."}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Yangi Musiqa Yaratish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Sequencer Mode */
            <div className="space-y-6">
              {/* Sequencer Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSequencerPlaying(!isSequencerPlaying)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all ${
                      isSequencerPlaying
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                    }`}
                  >
                    {isSequencerPlaying ? (
                      <>
                        <Square className="w-4 h-4 fill-white" /> To'xtatish
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" /> Ritm Ijrosi (Play)
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGrid({
                        kick: new Array(16).fill(false),
                        snare: new Array(16).fill(false),
                        hihat: new Array(16).fill(false),
                        clap: new Array(16).fill(false),
                        bass: new Array(16).fill(false),
                        synth: new Array(16).fill(false),
                      });
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700"
                  >
                    Tozalash
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Tezlik:</span>
                    <input
                      type="range"
                      min={70}
                      max={150}
                      value={sequencerBpm}
                      onChange={(e) => setSequencerBpm(Number(e.target.value))}
                      className="w-24 accent-indigo-500"
                    />
                    <span className="text-xs font-bold text-indigo-400 min-w-10">
                      {sequencerBpm} BPM
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isRenderingSeq}
                    onClick={handleSaveSequencerTrack}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                  >
                    {isRenderingSeq ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Trek qilib saqlash & yuklash
                  </button>
                </div>
              </div>

              {/* 16-Step Matrix */}
              <div className="overflow-x-auto pb-2">
                <div className="min-w-[580px] space-y-2.5">
                  {/* Step indicators */}
                  <div className="grid grid-cols-[140px_repeat(16,minmax(0,1fr))] gap-1.5 px-1 items-center">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Asboblar
                    </span>
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className={`text-center text-[10px] font-mono font-bold py-1 rounded transition-colors ${
                          currentStep === i && isSequencerPlaying
                            ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/40'
                            : i % 4 === 0
                            ? 'text-slate-300 bg-slate-800/40'
                            : 'text-slate-600'
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  {/* Channel Rows */}
                  {DRUM_CHANNELS.map((channel) => (
                    <div
                      key={channel.id}
                      className="grid grid-cols-[140px_repeat(16,minmax(0,1fr))] gap-1.5 items-center p-1.5 rounded-xl bg-[#171926] border border-slate-800/80 hover:border-slate-700/80 transition-colors"
                    >
                      {/* Channel Label & Live Test Button */}
                      <button
                        type="button"
                        onClick={() => playLivePadSound(channel.sound, channel.defaultNote)}
                        className="flex items-center gap-2 text-left hover:text-indigo-400 group py-1 px-1.5 rounded-lg hover:bg-slate-800/40 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-300 group-hover:text-white truncate">
                          {channel.name}
                        </span>
                      </button>

                      {/* 16 Step Buttons */}
                      {Array.from({ length: 16 }).map((_, stepIdx) => {
                        const isActive = grid[channel.id]?.[stepIdx];
                        const isCurrentPlayhead = isSequencerPlaying && currentStep === stepIdx;

                        return (
                          <button
                            key={stepIdx}
                            type="button"
                            onClick={() => toggleStep(channel.id, stepIdx)}
                            className={`h-9 rounded-lg transition-all transform active:scale-90 ${
                              isActive
                                ? `${channel.color} text-white shadow-sm`
                                : stepIdx % 4 === 0
                                ? 'bg-slate-800/90 hover:bg-slate-700/90'
                                : 'bg-slate-800/50 hover:bg-slate-700/60'
                            } ${
                              isCurrentPlayhead
                                ? 'ring-2 ring-white ring-offset-1 ring-offset-black scale-105 z-10'
                                : ''
                            }`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Tap Pads */}
              <div className="pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Jonli Ovoz Yostiqchalari (Live Drum Pads - bosing va tinglang)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {DRUM_CHANNELS.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => playLivePadSound(ch.sound, ch.defaultNote)}
                      className="py-4 px-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:bg-indigo-500/10 active:scale-95 transition-all text-center flex flex-col items-center justify-center gap-1.5 group"
                    >
                      <div className={`w-3 h-3 rounded-full ${ch.color}`} />
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white truncate w-full">
                        {ch.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recently Created Track Card with Instant Download */}
          {lastCreatedTrack && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${lastCreatedTrack.coverGradient} flex items-center justify-center shadow-lg shadow-black/40 text-white shrink-0`}>
                  <Music className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Muvaffaqiyatli Yaratildi!
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{lastCreatedTrack.title}</h4>
                  <p className="text-xs text-slate-400">{lastCreatedTrack.genre} • {lastCreatedTrack.bpm} BPM • {lastCreatedTrack.duration}s</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPlayTrack(lastCreatedTrack)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Tinglash
                </button>
                <button
                  type="button"
                  onClick={() => downloadAudioTrack(lastCreatedTrack)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Telefonga / Kompyuterga Yuklash (.WAV)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
