import React, { useState } from 'react';
import { Download, Smartphone, Check, Share, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'header' | 'floating';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'sidebar' }) => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed and running as standalone app, show subtle badge or hide
  if (isInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Ilova o'rnatilgan (Offlayn tayyor)</span>
        </div>
      );
    }
    return null;
  }

  // If not installable and not iOS, don't display unnecessary clutter
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }
    setIsInstalling(true);
    await installApp();
    setIsInstalling(false);
  };

  if (variant === 'header') {
    return (
      <>
        <button
          id="pwa-install-header-btn"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
          title="Telefon yoki kompyuterga ilovani o'rnatish"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ilovani o'rnatish</span>
          <span className="sm:hidden">Yuklab olish</span>
        </button>

        {showIosGuide && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#161724] border border-white/10 rounded-2xl max-w-sm w-full p-5 text-slate-200 shadow-2xl relative">
              <button
                onClick={() => setShowIosGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-base">iPhone ga o'rnatish</h4>
                  <p className="text-xs text-slate-400">Offlayn ishlatish uchun</p>
                </div>
              </div>
              <div className="space-y-2.5 text-xs text-slate-300 mt-4 bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-indigo-400">1.</span>
                  <span>Safari brauzerining pastki qismidagi <Share className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> <b>Ulashish</b> tugmasini bosing.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-indigo-400">2.</span>
                  <span>Menyudan <b>"Bosh ekranga qo'shish" (Add to Home Screen)</b> ni tanlang.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-indigo-400">3.</span>
                  <span>Endi ilova telefoningizda alohida offlayn musiqa pleyeri sifatida ishlaydi!</span>
                </p>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="w-full mt-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
              >
                Tushundim
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-950/50 via-[#18192a] to-purple-950/30 border border-indigo-500/20 shadow-lg">
        <div className="flex items-start gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white">Offlayn Ilova</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300 font-medium">PWA</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Telefon yoki kompyuterga o'rnating, internetsiz ham ishlaydi.
            </p>
          </div>
        </div>

        <button
          id="pwa-install-sidebar-btn"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          {isInstalling ? (
            <span>O'rnatilmoqda...</span>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>O'rnatish (Bosh ekranga)</span>
            </>
          )}
        </button>
      </div>

      {showIosGuide && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161724] border border-white/10 rounded-2xl max-w-sm w-full p-5 text-slate-200 shadow-2xl relative">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-base">iPhone ga o'rnatish</h4>
                <p className="text-xs text-slate-400">Offlayn ishlatish uchun</p>
              </div>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300 mt-4 bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
              <p className="flex items-start gap-2">
                <span className="font-bold text-indigo-400">1.</span>
                <span>Safari brauzerining pastki qismidagi <Share className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> <b>Ulashish</b> tugmasini bosing.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-indigo-400">2.</span>
                <span>Menyudan <b>"Bosh ekranga qo'shish" (Add to Home Screen)</b> ni tanlang.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-indigo-400">3.</span>
                <span>Endi ilova telefoningizda alohida offlayn musiqa pleyeri sifatida ishlaydi!</span>
              </p>
            </div>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full mt-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
            >
              Tushundim
            </button>
          </div>
        </div>
      )}
    </>
  );
};
