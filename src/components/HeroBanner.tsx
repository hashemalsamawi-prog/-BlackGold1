import React, { useState } from 'react';
import { Language } from '../types';
import { ASSETS, resolveAsset } from '../assets/images';
import { Flame, ShieldCheck, Truck, ArrowLeft, Store, Clock, Crown, Sparkles } from 'lucide-react';

interface HeroBannerProps {
  lang: Language;
  userName?: string;
  onOpenAiAdvisor?: () => void;
  onSelectCategory: (category: string) => void;
  bannerImage?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerPrice?: number;
  bannerOldPrice?: number;
  enableAnimations?: boolean;
  bannerAnimation?: 'float' | 'glow' | 'zoom' | 'none';
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  lang,
  onSelectCategory,
  bannerImage,
  bannerTitle = 'العبوة الملكية الفاخرة',
  bannerSubtitle = '250g + 10g هدية مدمجة',
  bannerPrice = 600,
  bannerOldPrice = 700,
}) => {
  const [imgError, setImgError] = useState(false);
  const activeImage = bannerImage || ASSETS.pouchPair || ASSETS.heroBanner;

  return (
    <section className="relative overflow-hidden bg-[#09090D] border-b border-[#1E1E2C]">
      {/* Subtle architectural gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* Main Brand & Proposition Copy */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-right">
            
            {/* Authenticity Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#161622] border border-[#2B2B3D] text-amber-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>فحم طبيعي نقي 100% • توصيل فوري داخل أمانة العاصمة صنعاء</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-white leading-[1.2] tracking-tight">
              فحم <span className="text-amber-400">الذهب الأسود</span> الملكي
              <br />
              <span className="text-slate-300 text-2xl sm:text-4xl font-extrabold">حرارة متجانسة ونقاء يدوم طويلاً</span>
            </h1>

            {/* Refined Description */}
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
              فحم نباتي نقي عالي الكثافة يمنحك اشتعالاً هادئاً متواصلاً لأكثر من 3 ساعات، بدون شرار أو روائح كيميائية مع رماد أبيض نقي. متوفر بعبوات فاخرة ومحمية من الرطوبة مع توصيل مباشر لكافة أحياء صنعاء.
            </p>

            {/* Verified Facts & Performance Strip */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-[#111118] border border-[#20202E] text-right space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>3+ ساعات</span>
                </div>
                <p className="text-[11px] text-slate-400">اشتعال مستمر وحرارة ثابتة</p>
              </div>

              <div className="p-3 rounded-2xl bg-[#111118] border border-[#20202E] text-right space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>&lt; 1.5% رماد</span>
                </div>
                <p className="text-[11px] text-slate-400">رماد أبيض ناعم وخالٍ من الشوائب</p>
              </div>

              <div className="p-3 rounded-2xl bg-[#111118] border border-[#20202E] text-right space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span>توصيل مباشر</span>
                </div>
                <p className="text-[11px] text-slate-400">تغطية لكافة مديريات صنعاء</p>
              </div>
            </div>

            {/* Primary and Secondary CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-3">
              <button
                onClick={() => {
                  onSelectCategory('premium');
                  const el = document.getElementById('products-grid-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 rounded-xl gold-gradient-bg text-[#09090D] font-extrabold text-sm hover:brightness-105 shadow-lg shadow-amber-500/15 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>تسوق التشكيلة الملكية</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  onSelectCategory('wholesale');
                  const el = document.getElementById('products-grid-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3.5 rounded-xl bg-[#14141E] border border-[#2B2B3E] text-slate-200 hover:text-white hover:border-amber-500/40 text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Store className="w-4 h-4 text-amber-400" />
                <span>عروض الجملة والمقاهي (B2B)</span>
              </button>
            </div>
          </div>

          {/* Product Hero Image Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden bg-[#111118] border border-[#262638] shadow-2xl p-3 sm:p-4">
              <div className="relative aspect-[4/3] sm:aspect-square w-full rounded-2xl overflow-hidden bg-[#0A0A0F]">
                {!imgError ? (
                  <>
                    <img
                      src={resolveAsset(activeImage)}
                      alt="فحم الذهب الأسود الملكي"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090D] via-transparent to-transparent opacity-80" />
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#1C1810] via-[#12121A] to-[#0A0A0F] border border-amber-500/20">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/25 to-amber-600/10 border border-amber-500/40 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/10">
                      <Crown className="w-8 h-8 text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]" />
                    </div>
                    <span className="text-amber-400 font-black text-xl tracking-tight">فحم الذهب الأسود الملكي</span>
                    <span className="text-slate-300 text-xs mt-1.5 font-medium">العبوة الفاخرة المبتكرة بنظام Zipper Lock</span>
                    <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>حرارة متجانسة لأكثر من 3 ساعات</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Editorial Badge Bar */}
              <div className="mt-3 p-3.5 rounded-xl bg-[#14141E] border border-[#242436] flex items-center justify-between text-right">
                <div>
                  <span className="text-[11px] font-bold text-amber-400 block">
                    {bannerTitle}
                  </span>
                  <p className="text-xs font-semibold text-slate-300">{bannerSubtitle}</p>
                </div>
                <div className="text-left">
                  {bannerOldPrice && bannerOldPrice > bannerPrice && (
                    <span className="text-[11px] text-slate-500 line-through block font-mono">
                      {bannerOldPrice.toLocaleString()} ر.ي
                    </span>
                  )}
                  <span className="text-base font-black text-amber-400 font-mono">
                    {bannerPrice.toLocaleString()} <span className="text-xs font-sans text-slate-300">ر.ي</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
