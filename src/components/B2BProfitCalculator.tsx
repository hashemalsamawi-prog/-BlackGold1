import React, { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Store, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Phone } from 'lucide-react';
import { Language } from '../types';

interface B2BProfitCalculatorProps {
  lang: Language;
  onOpenWholesaleOrder: () => void;
}

export const B2BProfitCalculator: React.FC<B2BProfitCalculatorProps> = ({
  lang,
  onOpenWholesaleOrder
}) => {
  const [daily250g, setDaily250g] = useState<number>(10);
  const [daily500g, setDaily500g] = useState<number>(6);
  const [daily1kg, setDaily1kg] = useState<number>(3);

  // Margins:
  // 250g: Retail 600 - Buy 480 = 120 profit
  // 500g: Retail 1000 - Buy 800 = 200 profit
  // 1kg: Retail 1600 - Buy 1300 = 300 profit
  const dailyProfit = (daily250g * 120) + (daily500g * 200) + (daily1kg * 300);
  const monthlyProfit = dailyProfit * 26; // 26 working days in Sanaa commercial cycle
  const annualProfit = monthlyProfit * 12;

  const totalPacksDaily = daily250g + daily500g + daily1kg;

  return (
    <div className="relative rounded-3xl bg-gradient-to-b from-[#14141E] via-[#0E0E14] to-[#0A0A0C] border border-amber-500/25 p-6 sm:p-10 shadow-2xl overflow-hidden text-right my-12">
      
      {/* Glow highlight */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 space-y-8">
        
        {/* Title and Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black">
              <Store className="w-3.5 h-3.5" />
              <span>مخصص لأصحاب البقالات، السوبرماركت، ومحلات المعسل</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              حاسبة أرباح التاجر | كم ستربح شهرياً مع فحم الذهب الأسود؟
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              احسب عوائدك الصافية بهوامش ربح تجارية تصل إلى 30% مع ستاند عرض خشبي فاخر مجاني وضمان استرجاع 100%.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center shrink-0">
            <span className="text-[10px] text-amber-300 font-bold block">متوسط ربح الكيس الواحد</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400">120 - 300 ريال</span>
          </div>
        </div>

        {/* Sliders & Calculation Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Sliders (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Slider 1: 250g */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">عبوات الربع كيلو (250g)</h4>
                  <span className="text-[11px] text-slate-400">ربحك في الكيس: 120 ريال</span>
                </div>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg font-black text-base">
                  {daily250g} كيس / يوم
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={daily250g}
                onChange={(e) => setDaily250g(Number(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0 كيس</span>
                <span>25 كيس</span>
                <span>50 كيس</span>
              </div>
            </div>

            {/* Slider 2: 500g */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">عبوات النصف كيلو (500g)</h4>
                  <span className="text-[11px] text-slate-400">ربحك في الكيس: 200 ريال</span>
                </div>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg font-black text-base">
                  {daily500g} كيس / يوم
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={daily500g}
                onChange={(e) => setDaily500g(Number(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0 كيس</span>
                <span>15 كيس</span>
                <span>30 كيس</span>
              </div>
            </div>

            {/* Slider 3: 1kg */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">عبوات الكيلو الكامل (1kg)</h4>
                  <span className="text-[11px] text-slate-400">ربحك في الكيس: 300 ريال</span>
                </div>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg font-black text-base">
                  {daily1kg} كيس / يوم
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={daily1kg}
                onChange={(e) => setDaily1kg(Number(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0 كيس</span>
                <span>10 كيس</span>
                <span>20 كيس</span>
              </div>
            </div>

          </div>

          {/* Result Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-[#101018] border-2 border-amber-500/40 space-y-6 shadow-xl">
              
              <div className="space-y-1">
                <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">صافي أرباحك الإضافية المتوقعة</span>
                <div className="text-3xl sm:text-4xl font-black text-white flex items-baseline gap-2">
                  <span className="gold-gradient-text">{monthlyProfit.toLocaleString('en-US')}</span>
                  <span className="text-sm font-bold text-amber-400">ريال / شهرياً</span>
                </div>
                <p className="text-xs text-slate-400">
                  بمعدل بيع {totalPacksDaily} كيس فقط يومياً في محلك التجاري.
                </p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>الربح اليومي الصافي:</span>
                  <span className="font-bold text-amber-300">{dailyProfit.toLocaleString('en-US')} YER</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>الربح السنوي المتوقع:</span>
                  <span className="font-bold text-emerald-400">{annualProfit.toLocaleString('en-US')} YER</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>المزايا الميدانية المرفقة:</span>
                  <span className="font-bold text-white">ستاند خشبي + بوسترات مجاناً</span>
                </div>
              </div>

              {/* Guarantees */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/20 space-y-1.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ضمان استرجاع 100% بدون أي قيد</span>
                </div>
                <p className="text-slate-400">إذا لم يُبع المنتج خلال 30 يوماً، يسترد المندوب البضاعة ويعيد أموالك نقداً فوراً.</p>
              </div>

              <button
                onClick={onOpenWholesaleOrder}
                className="w-full py-4 rounded-xl gold-gradient-bg text-slate-950 font-black text-sm hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>طلب عينة مجانية + كرتون تجريبي للمحل</span>
              </button>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
