import React, { useState } from 'react';
import { 
  Phone, MessageSquare, Flame, Calculator, 
  Truck, X, ChevronUp, Clock, ShieldCheck, Sparkles 
} from 'lucide-react';
import { Language } from '../types';

interface ExpressHotlineBarProps {
  lang: Language;
  onOpenCalculator: () => void;
  onOpenTracker: () => void;
  onOpenMap?: () => void;
  phoneNumber?: string;
  whatsappNumber?: string;
}

export const ExpressHotlineBar: React.FC<ExpressHotlineBarProps> = ({
  lang,
  onOpenCalculator,
  onOpenTracker,
  onOpenMap,
  phoneNumber = '775000150',
  whatsappNumber = '967775000150'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const cleanWhatsapp = whatsappNumber.replace(/\D/g, '');

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-40">
      {/* Expanded Menu */}
      {isExpanded && (
        <div className="mb-3 w-64 rounded-3xl bg-zinc-950/95 border border-amber-500/40 backdrop-blur-md shadow-2xl p-4 text-right space-y-2.5 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>خدمة عملاء صنعاء السريعة</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[11px] text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>مندوبو التوصيل متواجدون الآن</span>
            </div>
            <p>التوصيل المباشر لكافة أحياء ومديريات صنعاء خلال 30-45 دقيقة.</p>
          </div>

          {/* Direct Phone Call */}
          <a
            href={`tel:${cleanPhone}`}
            id="hotline-phone-call"
            className="w-full p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400" />
              <span>اتصال هاتفي مباشر</span>
            </div>
            <span className="font-mono text-amber-400 text-xs" dir="ltr">{phoneNumber}</span>
          </a>

          {/* Quick WhatsApp */}
          <a
            href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent('السلام عليكم، أرغب في طلب فحم الذهب الأسود الملكي وتوصيله في صنعاء.')}`}
            target="_blank"
            rel="noopener noreferrer"
            id="hotline-whatsapp-btn"
            className="w-full p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>محادثة واتساب سريعة</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">متصل الآن</span>
          </a>

          {/* Calculator Quick Link */}
          <button
            onClick={() => {
              setIsExpanded(false);
              onOpenCalculator();
            }}
            id="hotline-calc-btn"
            className="w-full p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer text-right"
          >
            <Calculator className="w-4 h-4 text-amber-400 shrink-0" />
            <span>حاسبة استهلاك الفحم الذكية 🧮</span>
          </button>

          {/* Order Tracking */}
          <button
            onClick={() => {
              setIsExpanded(false);
              onOpenTracker();
            }}
            id="hotline-track-btn"
            className="w-full p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer text-right"
          >
            <Truck className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>تتبع طلبي المباشر 🛵</span>
          </button>
        </div>
      )}

      {/* Main Floating Trigger Pill */}
      <button
        type="button"
        id="express-hotline-toggle-btn"
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-black text-xs shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300"
      >
        <div className="relative">
          <Phone className="w-4 h-4 text-zinc-950" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-600" />
        </div>
        <span className="hidden sm:inline">طلب فوري أو اتصال بصنعاء ⚡</span>
        <span className="sm:hidden">طلب سريع ⚡</span>
        <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
