import React from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, reconnectedNotice } = useOnlineStatus();

  if (isOnline && !reconnectedNotice) {
    return null;
  }

  if (reconnectedNotice) {
    return (
      <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 px-4 py-1.5 text-xs flex items-center justify-center gap-2 transition-all duration-300">
        <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="font-medium">Internet aloqasi qayta tiklandi.</span>
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 px-4 py-2 text-xs flex items-center justify-between gap-3 backdrop-blur-md z-30 relative transition-all duration-300">
      <div className="flex items-center gap-2 min-w-0">
        <span className="p-1 rounded-full bg-amber-500/20 text-amber-300 shrink-0">
          <WifiOff className="w-3.5 h-3.5" />
        </span>
        <div className="truncate">
          <span className="font-semibold text-amber-100">Offlayn rejim faol: </span>
          <span className="text-amber-200/90 text-[11px] sm:text-xs">
            Barcha saqlangan musiqalar, pleylistlar va musiqiy studiya internetsiz to'liq ishlamoqda.
          </span>
        </div>
      </div>
      <div className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-medium">
        Lokal Xotira
      </div>
    </div>
  );
};
