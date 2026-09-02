import React, { useState } from 'react';
import { Product, Language } from '../types';
import { resolveAsset } from '../assets/images';
import { Flame, Plus, Star, Check, Sparkles, Clock, ShieldCheck, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedWeightGrams: number, quantity: number, price: number) => void;
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

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, product.weightGrams, quantity, product.price);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group relative flex flex-col justify-between rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer overflow-hidden"
    >
      {/* Badges */}
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-1.5 items-end">
        {product.isPopular && (
          <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-black text-[11px] font-black shadow-md flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> الأكثر مبيعاً
          </span>
        )}
        {product.bonusGrams && product.bonusGrams > 0 && (
          <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-black shadow-md animate-pulse">
            +{product.bonusGrams}g مجاناً
          </span>
        )}
      </div>

      <div>
        {/* Product Image */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black/60 mb-4 border border-zinc-800 group-hover:border-amber-500/30 transition-colors">
          <img
            src={resolveAsset(product.images?.[0] || product.image)}
            alt={product.nameAr}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Quick Specs Chip */}
          <div className="absolute bottom-2 right-2 left-2 flex items-center justify-between text-[11px] font-bold text-zinc-300 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg">
            <span className="flex items-center gap-1 text-amber-400">
              <Flame className="w-3.5 h-3.5 fill-amber-400" /> {product.burnTimeMinutes || 180} دقيقة
            </span>
            <span>{product.weightGrams}g {product.bonusGrams ? `(+${product.bonusGrams}g)` : ''}</span>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2 text-right">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold">{product.rating || 4.9}</span>
              <span className="text-zinc-500">({product.reviewsCount || 45})</span>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400">
              {product.category === 'premium' ? 'فحم فاخر' : product.category === 'local' ? 'فحم بلدي' : 'توريد جملة'}
            </span>
          </div>

          <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors line-clamp-1">
            {product.nameAr}
          </h3>

          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {product.descriptionAr}
          </p>
        </div>
      </div>

      {/* Pricing & Add to Cart Action */}
      <div className="pt-4 mt-3 border-t border-zinc-800 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-amber-400">{product.price.toLocaleString()}</span>
            <span className="text-xs font-bold text-zinc-400">ريال</span>
          </div>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-zinc-500 line-through">
              {product.originalPrice.toLocaleString()} ريال
            </span>
          )}
        </div>

        <button
          onClick={handleAdd}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-black text-xs transition-all shadow-md ${
            isAdded
              ? 'bg-emerald-500 text-black'
              : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4" />
              <span>تمت الإضافة</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>أضف للسلة</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
