import React from 'react';
import { Language } from '../types';
import { ASSETS, resolveAsset } from '../assets/images';
import { Flame, Sparkles, ShieldCheck, Truck, Clock, Award, ArrowLeft } from 'lucide-react';

interface HeroBannerProps {
  lang: Language;
  userName?: string;
  onOpenAiAdvisor: () => void;
  onSelectCategory: (category: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  lang,
  userName,
  onOpenAiAdvisor,
  onSelectCategory,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-black to-zinc-950 border-b border-zinc-800">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Copy */}
          <div className="lg:col-span-7 space-y-6 text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>فحم طبيعي 100% نقي | توصيل فوري في أمانة العاصمة</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              فحم <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">الذهب الأسود</span>
              <br />
              الملكي الفاخر في صنعاء
            </h1>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-xl">
              نقاء فائق بدون دخان أو رائحة أو شرار. اشتعال يدوم لأكثر من 3 ساعات بحرارة متجانسة ثابتة. احصل على عبوتك الملكية مع <strong className="text-amber-400">+10 جرام مجاناً</strong> داخل كل كيس وتوصيل مباشر لباب منزلك أو مقهاك.
            </p>

            {/* Quick feature tags */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span>3+ ساعات اشتعال</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>0% دخان وشرار</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300">
                <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>توصيل 30 دقيقة</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button
                onClick={() => onSelectCategory('premium')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-sm hover:from-amber-400 hover:to-amber-500 shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <span>تسوق الفحم الفاخر</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => onSelectCategory('b2b')}
                className="px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 font-bold text-sm hover:bg-zinc-800 hover:border-amber-500/50 transition-all"
              >
                <span>طلبات الجملة والمقاهي (B2B)</span>
              </button>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-b from-zinc-900 to-black p-3 shadow-2xl shadow-amber-500/10">
              <img
                src={resolveAsset(ASSETS.pouchPair || ASSETS.heroBanner)}
                alt="فحم الذهب الأسود"
                className="w-full h-80 sm:h-96 object-cover rounded-2xl filter contrast-105"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              
              <div className="absolute bottom-6 right-6 left-6 flex items-center justify-between p-4 rounded-2xl bg-black/80 backdrop-blur-md border border-amber-500/40">
                <div>
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">عرض خاص محدود</span>
                  <p className="text-sm font-black text-white">عبوة 250g + 10g هدية إضافية</p>
                </div>
                <div className="text-left">
                  <span className="text-xs text-zinc-400 line-through block">1,500 ريال</span>
                  <span className="text-base font-black text-amber-400">1,200 ريال</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
