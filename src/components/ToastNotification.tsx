import React, { useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  message: string;
  type?: ToastType;
}

interface ToastNotificationProps {
  toast: string | ToastData | null;
  onClose: () => void;
  duration?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  onClose,
  duration = 3800,
}) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, duration, onClose]);

  if (!toast) return null;

  const message = typeof toast === 'string' ? toast : toast.message;
  const type: ToastType = typeof toast === 'string' ? 'success' : toast.type || 'success';

  const isError = type === 'error';
  const isInfo = type === 'info';

  const borderClass = isError
    ? 'border-rose-500/35 bg-[#12090C]'
    : isInfo
    ? 'border-blue-500/30 bg-[#0A0E18]'
    : 'border-amber-500/40 bg-[#0F0F16]';

  const textClass = isError
    ? 'text-rose-200'
    : isInfo
    ? 'text-blue-200'
    : 'text-slate-100';

  const icon = isError ? (
    <div className="w-7 h-7 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
      <AlertCircle className="w-4 h-4" />
    </div>
  ) : isInfo ? (
    <div className="w-7 h-7 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
      <Info className="w-4 h-4" />
    </div>
  ) : (
    <div className="w-7 h-7 rounded-xl bg-[#1A1A26] border border-[#28283C] flex items-center justify-center text-amber-400 shrink-0">
      <CheckCircle2 className="w-4 h-4" />
    </div>
  );

  return (
    <aside
      aria-label="إشعار النظام"
      className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md pointer-events-auto"
    >
      <div
        className={`p-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center justify-between gap-3 text-right animate-in fade-in slide-in-from-bottom-3 duration-300 ${borderClass}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon}
          <p className={`text-xs font-bold leading-snug truncate sm:whitespace-normal ${textClass}`}>
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
