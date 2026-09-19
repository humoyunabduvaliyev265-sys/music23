import React, { useState, useRef } from 'react';
import { UploadCloud, Music, X, CheckCircle2, AlertCircle, FileAudio } from 'lucide-react';
import { Track } from '../types';
import { saveTrack } from '../services/db';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackUploaded: (track: Track) => void;
}

const GRADIENTS = [
  'from-blue-600 to-indigo-700',
  'from-rose-500 to-amber-600',
  'from-emerald-500 to-teal-700',
  'from-purple-600 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-orange-600',
];

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onTrackUploaded,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setUploadStatus("Fayllar yuklanmoqda va tekshirilmoqda...");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) {
          continue;
        }

        // Calculate audio duration using a temporary Audio element
        const duration: number = await new Promise((resolve) => {
          const tempAudio = new Audio();
          const tempUrl = URL.createObjectURL(file);
          tempAudio.src = tempUrl;
          tempAudio.onloadedmetadata = () => {
            const dur = tempAudio.duration || 180;
            URL.revokeObjectURL(tempUrl);
            resolve(Math.round(dur));
          };
          tempAudio.onerror = () => {
            URL.revokeObjectURL(tempUrl);
            resolve(180); // fallback default
          };
        });

        // Clean filename for title
        const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        const randomGradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

        const newTrack: Track = {
          id: `track_upload_${Date.now()}_${i}`,
          title: cleanTitle,
          artist: "Yuklangan Musiqa",
          duration,
          genre: "Mahalliy Fayl",
          bpm: 120,
          audioBlob: file,
          audioUrl: URL.createObjectURL(file),
          coverGradient: randomGradient,
          createdAt: Date.now(),
          isFavorite: false,
          isGenerated: false,
          description: `Telefon yoki kompyuterdan yuklangan audio fayl (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
        };

        await saveTrack(newTrack);
        onTrackUploaded(newTrack);
      }

      setUploadStatus("Barcha musiqalar saqlandi!");
      setTimeout(() => {
        setIsProcessing(false);
        setUploadStatus(null);
        onClose();
      }, 700);
    } catch (err) {
      console.error("Audio yuklashda xatolik:", err);
      alert("Faylni yuklashda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-[#13141f] border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Musiqa Yuklash</h3>
              <p className="text-xs text-slate-400">Telefon yoki kompyuteringizdan audio fayl qo'shing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropzone */}
        <div className="mt-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/80'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.files)}
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
              multiple
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center shadow-inner">
              <FileAudio className="w-7 h-7" />
            </div>

            <div>
              <p className="text-sm font-bold text-white mb-1">
                Faylni bu yerga tashlang yoki bosing
              </p>
              <p className="text-xs text-slate-400">
                MP3, WAV, OGG, M4A, FLAC formatlar qo'llab-quvvatlanadi
              </p>
            </div>

            <span className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              Faylni Tanlash
            </span>
          </div>
        </div>

        {uploadStatus && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2.5 text-xs text-indigo-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadStatus}</span>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Saqlash: Qurilmangizning xavfsiz xotirasi</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
