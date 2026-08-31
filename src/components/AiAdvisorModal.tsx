import React, { useState, useEffect } from 'react';
import { X, Sparkles, Flame, Send, CheckCircle2, ArrowRight, ChevronRight } from 'lucide-react';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecommendedProduct: (productId: string) => void;
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  onClose,
  onSelectRecommendedProduct
}) => {
  const [useCase, setUseCase] = useState('مجالس ومناسبات فاخرة');
  const [guests, setGuests] = useState('10 - 20 شخص');
  const [duration, setDuration] = useState('4 إلى 6 ساعات');
  const [location, setLocation] = useState('صنعاء (حدة / السبعين)');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [recommendedId, setRecommendedId] = useState<string>('bg-prem-500g');

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRecommendation(null);

    try {
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCase, guests, duration, location })
      });
      const data = await res.json();
      if (data.success) {
        setRecommendation(data.recommendation);
        setRecommendedId(data.recommendedProductId || 'bg-prem-500g');
      }
    } catch {
      setRecommendation("بناءً على طلبك للمجالس الفاخرة في صنعاء: ننصحك بـ 'فحم الذهب الأسود الفاخر عبوة 500 جرام Zipper' للحصول على أطول مدة اشتعال (أكثر من 6 ساعات) بدون رماد متطاير أو روائح.");
      setRecommendedId('bg-prem-500g');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-[#121218] border border-amber-500/40 rounded-3xl max-w-xl w-full p-4 sm:p-6 text-slate-100 relative shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto text-right"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header with Back Button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              title="الرجوع للشاشة السابقة"
            >
              <ChevronRight className="w-4 h-4 text-amber-400" />
              <span>رجوع</span>
            </button>

            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">مستشار الفحم الذكي (Black Gold AI)</h2>
              <p className="text-[11px] text-slate-400">مساعدك الذكي لاختيار عبوة الفحم والوزن الأنسب</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>


        {/* Input Form */}
        <form onSubmit={handleAskAi} className="space-y-4 text-xs">
          
          <div>
            <label className="block text-slate-300 font-bold mb-1">الغرض الأساسي من استخدام الفحم:</label>
            <select
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none focus:border-amber-500 font-semibold"
            >
              <option value="مجالس ومناسبات فاخرة">مجالس ومناسبات فاخرة بدون دخان</option>
              <option value="شواء ومشاوي عائلية">شواء ومشاوي عائلية لحوم ودواجن</option>
              <option value="شيشة وأراجيل">شيشة وأراجيل بمكعبات جوز الهند</option>
              <option value="بخور وعود عالي الجودة">بخور وعود عالي الجودة</option>
              <option value="تدفئة وطهي بلدي">تدفئة وطهي بلدي</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">عدد الأشخاص المتوقع:</label>
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none focus:border-amber-500"
              >
                <option value="1 - 3 أشخاص (عبوة 250g)">1 - 3 أشخاص (عبوة 250g)</option>
                <option value="4 - 10 أشخاص (عبوة 500g)">4 - 10 أشخاص (عبوة 500g)</option>
                <option value="10 - 20 شخص (1 كجم فأكثر)">10 - 20 شخص (1 كجم فأكثر)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">المدة المطلوبة للاشتعال:</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none focus:border-amber-500"
              >
                <option value="2 إلى 3 ساعات">2 إلى 3 ساعات</option>
                <option value="4 إلى 6 ساعات">4 إلى 6 ساعات متواصلة</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl gold-gradient-bg text-slate-950 font-black text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>{loading ? 'جاري تحليل الخيارات بالذكاء الاصطناعي...' : 'احصل على التوصية الفورية الآن'}</span>
          </button>
        </form>

        {/* AI Output Result Box */}
        {recommendation && (
          <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 text-xs space-y-3 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-amber-400 font-extrabold">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>توصية المستشار الذكي:</span>
            </div>

            <p className="text-slate-200 leading-relaxed font-semibold">
              {recommendation}
            </p>

            <button
              onClick={() => {
                onSelectRecommendedProduct(recommendedId);
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all flex items-center gap-1"
            >
              <span>عرض المنتج الموصى به مباشرة</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
