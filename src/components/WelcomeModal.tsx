import React from 'react';
import { Language } from '../types';
import { Logo } from './Logo';
import { Flame, Sparkles, Truck, ShieldCheck, X, ArrowLeft } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  onContinueAsGuest: () => void;
  lang: Language;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
  onContinueAsGuest,
  lang,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-amber-500/40 shadow-2xl p-6 sm:p-8 text-right overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-32 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
          <Logo size="lg" showText={false} />

          <div>
            <h2 className="text-xl font-black text-white">مرحباً بك في متجر الذهب الأسود 👑</h2>
            <p className="text-xs text-zinc-400 mt-1">الفحم الطبيعي الملكي الأول والأكثر نقاوة في صنعاء</p>
          </div>

          {/* Quick highlight points */}
          <div className="w-full space-y-2 py-2 text-xs text-zinc-300 text-right">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>عرض ملكي: <strong>+10 جرام مجاناً</strong> في كل كيس!</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <Truck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>توصيل مباشر وسريع لكافة أحياء ومناطق صنعاء.</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ضمان الجودة الملكية والنقاء التام 100%.</span>
            </div>
          </div>

          <div className="w-full space-y-2 pt-2">
            <button
              onClick={onContinueAsGuest}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <span>تصفح المتجر والطلب السريع</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenLogin}
              className="w-full py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
            >
              تسجيل الدخول برقم الهاتف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
