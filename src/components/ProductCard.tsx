import React, { useState, useMemo } from 'react';
import { Product, Language } from '../types';
import { resolveAsset } from '../assets/images';
import { Flame, Plus, Minus, Star, Check, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedWeightGrams: number | string, quantity: number, price: number) => void;
  onOpenDetails: (product: Product) => void;
  lang: Language;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onOpenDetails,
  lang,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Initialize selected weight from weightOptions if available
  const [selectedWeight, setSelectedWeight] = useState<string>(() => {
    if (product.weightOptions && product.weightOptions.length > 0) {
      return product.weightOptions[0].weight;
    }
    return product.weightGrams ? `${product.weightGrams}g` : '250g';
  });

  // Calculate unit price dynamically based on selected weight variant
  const activeUnitPrice = useMemo(() => {
    if (product.weightOptions && product.weightOptions.length > 0) {
      const match = product.weightOptions.find((w) => w.weight === selectedWeight);
      if (match) return match.price;
    }
    return product.price;
  }, [product, selectedWeight]);

  const activeOriginalPrice = useMemo(() => {
    if (product.weightOptions && product.weightOptions.length > 0) {
      const match = product.weightOptions.find((w) => w.weight === selectedWeight);
      if (match && match.originalPrice) return match.originalPrice;
    }
    return product.originalPrice;
  }, [product, selectedWeight]);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, selectedWeight, quantity, activeUnitPrice);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === 'premium') return 'الخط الملكي';
    if (cat === 'wholesale') return 'توريد جملة';
    if (cat === 'bbq') return 'فحم الإشعال';
    return 'فحم محلي';
  };

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group relative flex flex-col justify-between rounded-3xl bg-[#111118] border border-[#222232] hover:border-amber-500/40 p-4 transition-all duration-300 hover:shadow-xl hover:shadow-black/60 cursor-pointer overflow-hidden text-right"
    >
      {/* Restrained Luxury Badges */}
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-1.5 items-end pointer-events-none">
        {product.isPopular && (
          <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-[#09090D] text-[11px] font-extrabold shadow-md">
            الأكثر طلباً
          </span>
        )}
        {product.bonusGrams && product.bonusGrams > 0 && (
          <span className="px-2.5 py-1 rounded-lg bg-[#1F1D2B] border border-amber-500/40 text-amber-300 text-[11px] font-bold shadow-sm">
            +{product.bonusGrams}g إضافية
          </span>
        )}
      </div>

      <div>
        {/* Product Image Stage */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#0A0A0F] mb-4 border border-[#1C1C28] group-hover:border-[#2E2E42] transition-colors">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-[#14141E] animate-luxury-pulse" />
          )}
          <img
            src={resolveAsset(product.images?.[0] || product.image)}
            alt={product.nameAr}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg';
              setImageLoaded(true);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090D]/80 via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* Quick Burn & Weight spec */}
          <div className="absolute bottom-2.5 right-2.5 left-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-300 bg-[#09090D]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
            <span className="flex items-center gap-1 text-amber-400">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{product.burnTimeMinutes || 180} دقيقة</span>
            </span>
            <span>{selectedWeight}</span>
          </div>
        </div>

        {/* Product Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-amber-400/90">
              {getCategoryLabel(product.category)}
            </span>
            {product.rating && (
              <div className="flex items-center gap-1 text-slate-300 text-[11px]">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-bold">{product.rating}</span>
                {product.reviewsCount ? (
                  <span className="text-slate-500">({product.reviewsCount})</span>
                ) : null}
              </div>
            )}
          </div>

          <h3 className="text-base font-extrabold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
            {product.nameAr}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-normal">
            {product.descriptionAr}
          </p>

          {/* Weight Variants Selector (if product has multiple weight options) */}
          {product.weightOptions && product.weightOptions.length > 1 && (
            <div 
              className="flex items-center gap-1.5 pt-1.5 overflow-x-auto no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {product.weightOptions.map((opt) => (
                <button
                  key={opt.weight}
                  type="button"
                  onClick={() => setSelectedWeight(opt.weight)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedWeight === opt.weight
                      ? 'bg-amber-400 text-[#09090D] font-extrabold shadow-sm'
                      : 'bg-[#181824] text-slate-300 border border-[#28283A] hover:border-slate-600'
                  }`}
                >
                  {opt.weight}
                </button>
              ))}
            </div>
          )}

          {/* Availability Status */}
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>متوفر للتوصيل الفوري بصنعاء</span>
          </div>
        </div>
      </div>

      {/* Pricing & Cart Action Bar */}
      <div className="pt-3.5 mt-3 border-t border-[#1F1F2E] flex items-center justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-amber-400 font-mono">
              {(activeUnitPrice * quantity).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400">ر.ي</span>
          </div>
          {activeOriginalPrice && activeOriginalPrice > activeUnitPrice ? (
            <span className="text-[11px] text-slate-500 line-through block font-mono">
              {(activeOriginalPrice * quantity).toLocaleString()} ر.ي
            </span>
          ) : quantity > 1 ? (
            <span className="text-[10px] text-slate-500 block font-mono">
              ({activeUnitPrice.toLocaleString()} ر.ي للعبوة)
            </span>
          ) : null}
        </div>

        {/* Stepper and Add to Cart Action */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center bg-[#181824] border border-[#2B2B3E] rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#252538] transition-colors text-xs font-bold cursor-pointer"
              title="تقليل الكمية"
              aria-label="تقليل الكمية"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center font-bold text-xs text-white font-mono">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#252538] transition-colors text-xs font-bold cursor-pointer"
              title="زيادة الكمية"
              aria-label="زيادة الكمية"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className={`p-2.5 rounded-xl text-xs font-black transition-all duration-300 active:scale-95 flex items-center justify-center cursor-pointer ${
              isAdded
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'gold-gradient-bg text-[#09090D] hover:brightness-110 shadow-md shadow-amber-500/15'
            }`}
            title="إضافة إلى السلة"
            aria-label="إضافة إلى السلة"
          >
            {isAdded ? (
              <Check className="w-4 h-4" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
