import React from 'react';
import { ShoppingBag, Package, Search, Truck, ArrowRight, RotateCcw, Flame } from 'lucide-react';

export type EmptyStateType = 'cart' | 'orders' | 'driver' | 'search';

interface EmptyStateProps {
  type: EmptyStateType;
  searchQuery?: string;
  onAction?: () => void;
  onSelectSuggestion?: (query: string) => void;
  customTitle?: string;
  customDesc?: string;
  actionLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  searchQuery,
  onAction,
  onSelectSuggestion,
  customTitle,
  customDesc,
  actionLabel,
}) => {
  const suggestions = [
    { label: 'الخط الملكي الفاخر', query: 'الفاخر' },
    { label: 'عبوة 250g المدمجة', query: '250g' },
    { label: 'شوالة مطاعم 20kg', query: 'شوالة' },
    { label: 'مكعبات إشعال فورية', query: 'إشعال' },
  ];

  if (type === 'cart') {
    return (
      <div className="text-center py-16 px-4 space-y-5 animate-in fade-in duration-300">
        <div className="w-18 h-18 mx-auto rounded-3xl bg-[#14141E] border border-[#242436] flex items-center justify-center text-slate-400 shadow-inner">
          <ShoppingBag className="w-8 h-8 text-amber-400/80" strokeWidth={1.25} />
        </div>
        <div className="space-y-1.5 max-w-xs mx-auto">
          <h3 className="text-base font-extrabold text-white">
            {customTitle || 'سلة المشتريات فارغة'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            {customDesc || 'لم تقم بإضافة أي عبوات فحم بعد. استكشف تشكيلتنا الملكية لتجربة اشتعال استثنائية.'}
          </p>
        </div>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="px-6 py-2.5 rounded-xl gold-gradient-bg text-[#09090D] text-xs font-extrabold shadow-md hover:brightness-105 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>{actionLabel || 'استكشف منتجات الفحم'}</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </button>
        )}
      </div>
    );
  }

  if (type === 'orders') {
    return (
      <div className="text-center py-12 px-5 space-y-5 bg-[#12121A] rounded-3xl border border-[#20202E] animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-[#181824] border border-[#28283C] flex items-center justify-center mx-auto text-amber-400 shadow-lg">
          <Package className="w-7 h-7 text-amber-400/80" strokeWidth={1.25} />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-sm sm:text-base font-extrabold text-white">
            {customTitle || 'لا توجد طلبات سابقة مسجلة'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            {customDesc || 'عند إتمام أي طلب جديد في المتجر، ستتمكن من متابعة مراحله الأربعة ومسار الكابتن مباشرة من هنا.'}
          </p>
        </div>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="px-6 py-2.5 rounded-xl gold-gradient-bg text-[#09090D] text-xs font-extrabold transition-all shadow-md hover:brightness-105 cursor-pointer inline-flex items-center gap-2"
          >
            <span>{actionLabel || 'تسوق منتجات الفحم الملكي'}</span>
            <Flame className="w-3.5 h-3.5 text-[#09090D]" />
          </button>
        )}
      </div>
    );
  }

  if (type === 'driver') {
    return (
      <div className="text-center py-12 px-4 space-y-4 bg-[#12121A] rounded-3xl border border-[#20202E] animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-[#181824] border border-[#28283C] flex items-center justify-center mx-auto text-amber-400">
          <Truck className="w-7 h-7 text-amber-400/80" strokeWidth={1.25} />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="text-sm font-extrabold text-white">
            {customTitle || 'لا توجد شحنات مكلفة حالياً'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            {customDesc || 'جميع الشحنات المخصصة لك ستظهر هنا فور إسنادها لك من قبل إدارة المتجر.'}
          </p>
        </div>
      </div>
    );
  }

  // Empty Search
  return (
    <div className="text-center py-14 px-4 space-y-6 bg-[#111118] rounded-3xl border border-[#222232] animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-2xl bg-[#161622] border border-[#28283C] flex items-center justify-center mx-auto text-slate-400">
        <Search className="w-7 h-7 text-amber-400/70" strokeWidth={1.25} />
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-base font-extrabold text-white">
          {searchQuery ? `لم نعثر على نتائج مطابقة لـ "${searchQuery}"` : 'لم يتم العثور على منتجات'}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed font-normal">
          تأكد من كتابة الكلمات بشكل صحيح، أو جرب اختيار أحد الأصناف المقترحة بالأسفل:
        </p>
      </div>

      {/* Suggested Search Chips */}
      {onSelectSuggestion && (
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSuggestion(item.query)}
              className="px-3 py-1.5 rounded-xl bg-[#181824] hover:bg-[#202030] text-slate-300 hover:text-amber-300 text-xs font-semibold border border-[#28283C] transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="px-5 py-2.5 rounded-xl bg-[#161622] hover:bg-[#1E1E2C] text-slate-200 text-xs font-bold border border-[#2A2A3E] transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>{actionLabel || 'عرض كافة منتجات الفحم'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
