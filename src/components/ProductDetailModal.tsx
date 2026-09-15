import React, { useState } from 'react';
import { Product, Language, Review } from '../types';
import { resolveAsset } from '../assets/images';
import { 
  X, Flame, ShieldCheck, Star, Sparkles, Check, ShoppingCart, 
  Minus, Plus, Clock, Wind, Award, Zap, ThumbsUp
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, selectedWeight: number | string, quantity: number, price: number) => void;
  reviews: Review[];
  onAddReview: (productId: string, rating: number, comment: string, name: string) => void;
  lang: Language;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  reviews,
  onAddReview,
  lang,
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedWeight, setSelectedWeight] = useState<string>(() => {
    if (product.weightOptions && product.weightOptions.length > 0) {
      return product.weightOptions[0].weight;
    }
    return product.weightGrams ? `${product.weightGrams}g` : '1kg';
  });

  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const productReviews = reviews.filter((r) => r.productId === product.id);

  // Compute active unit price based on selected weight option if available
  const activeUnitPrice = React.useMemo(() => {
    if (product.weightOptions && product.weightOptions.length > 0) {
      const match = product.weightOptions.find((w) => w.weight === selectedWeight);
      if (match) return match.price;
    }
    return product.price;
  }, [product, selectedWeight]);

  const productImages = React.useMemo(() => {
    if (product.images && product.images.length > 0) return product.images;
    return [product.image];
  }, [product]);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;
    onAddReview(product.id, newRating, newReviewComment, newReviewName.trim() || 'عميل الذهب الأسود');
    setNewReviewComment('');
    setNewReviewName('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 sm:p-7 my-6 max-h-[92vh] overflow-y-auto text-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer z-20"
          title="إغلاق"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Visual Gallery Container */}
          <div className="space-y-3">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-inner">
              <img
                src={resolveAsset(productImages[selectedImageIndex] || productImages[0])}
                alt={product.nameAr}
                className="w-full h-full object-cover transition-all duration-300"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg';
                }}
              />
              {product.bonusGrams && (
                <div className="absolute top-3 right-3 bg-red-600 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+{product.bonusGrams}g مجاناً مدمج</span>
                </div>
              )}
              <div className="absolute bottom-2.5 right-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-bold text-zinc-300 flex items-center justify-between border border-zinc-800">
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> مفحوص ومغربل 100%
                </span>
                <span className="text-amber-400">{product.burnTimeMinutes || 180} دقيقة اشتعال</span>
              </div>
            </div>

            {/* Thumbnail selector if multiple images */}
            {productImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImageIndex === idx
                        ? 'border-amber-500 ring-2 ring-amber-500/40'
                        : 'border-zinc-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={resolveAsset(img)}
                      alt={`صورة ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Express Delivery Sanaa Guarantee */}
            <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-2.5 text-xs text-zinc-300">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-white">توصيل سريع داخل صنعاء (30 - 45 دقيقة)</p>
                <p className="text-[11px] text-zinc-400">مندوبونا متواجدون في كافة الأحياء لتسليم الشحنة فوراً</p>
              </div>
            </div>
          </div>

          {/* Details & Specs & Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-400 text-xs font-black border border-amber-500/30">
                  {product.category === 'premium' ? '👑 فحم ملكي مضغوط' : product.category === 'local' ? '🔥 فحم بلدي طبيعي' : '📦 خط الجملة'}
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  ● متوفر بالمستودع
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-amber-400 bg-zinc-900 px-2.5 py-1 rounded-xl border border-zinc-800">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span className="font-black">{product.rating || 4.9}</span>
                <span className="text-zinc-500">({product.reviewsCount || 45})</span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white">{product.nameAr}</h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{product.descriptionAr}</p>

            {/* Weight / Variant Options (if exists) */}
            {product.weightOptions && product.weightOptions.length > 0 && (
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-zinc-300 block">اختر الحجم / الوزن المطلوب:</label>
                <div className="flex flex-wrap gap-2">
                  {product.weightOptions.map((opt) => (
                    <button
                      key={opt.weight}
                      type="button"
                      onClick={() => setSelectedWeight(opt.weight)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        selectedWeight === opt.weight
                          ? 'border-amber-500 bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 scale-105'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <span>{opt.weight}</span>
                      <span className="mr-1 text-[11px] opacity-80">({opt.price.toLocaleString()} ر.ي)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Specifications */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">مدة الاشتعال الفعلي</span>
                <span className="font-black text-amber-400">{product.burnTimeMinutes || 180} دقيقة متواصلة</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">مستوى الدخان والشرار</span>
                <span className="font-black text-emerald-400">{product.smokeLevel || '0% منعدم'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">نسبة الرماد الأبيض</span>
                <span className="font-bold text-zinc-200">{product.ashContent || '< 2% ناصع'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">الوزن والمكافأة</span>
                <span className="font-bold text-zinc-200">{selectedWeight} {product.bonusGrams ? `(+${product.bonusGrams}g مجاناً)` : ''}</span>
              </div>
            </div>

            {/* Price & Quantity & Add to Cart Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-3 mt-4 shadow-lg shadow-amber-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 block">السعر الإجمالي للكمية</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-amber-400">
                      {(activeUnitPrice * quantity).toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-zinc-300">ريال يمني</span>
                  </div>
                  {quantity > 1 && (
                    <span className="text-[10px] text-zinc-500 block">
                      ({activeUnitPrice.toLocaleString()} ر.ي لكل عبوة)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-700 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 active:bg-zinc-700 transition-colors cursor-pointer"
                    title="تقليل الكمية"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-black text-sm text-white font-mono">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 active:bg-zinc-700 transition-colors cursor-pointer"
                    title="زيادة الكمية"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onAddToCart(product, selectedWeight, quantity, activeUnitPrice);
                  onClose();
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>إضافة {quantity} عبوة إلى السلة ({(activeUnitPrice * quantity).toLocaleString()} ر.ي)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <h3 className="text-base font-black text-white mb-4">تقييمات وآراء العملاء</h3>

          {/* Add Review Form */}
          <form onSubmit={handleReviewSubmit} className="mb-6 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">تقييمك:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setNewRating(star)}
                    className="p-1 text-amber-400"
                  >
                    <Star className={`w-4 h-4 ${star <= newRating ? 'fill-amber-400' : 'text-zinc-600'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newReviewName}
                onChange={(e) => setNewReviewName(e.target.value)}
                placeholder="اسمك (اختياري)"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                placeholder="اكتب تجربتك مع فحم الذهب الأسود..."
                required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-amber-500 hover:text-black text-amber-400 font-bold text-xs transition-colors"
            >
              نشر التقييم
            </button>

            {reviewSubmitted && (
              <span className="text-xs text-emerald-400 block font-bold">شكراً لك! تم تسجيل تقييمك بنجاح.</span>
            )}
          </form>

          {/* Reviews List */}
          <div className="space-y-3">
            {productReviews.length > 0 ? (
              productReviews.map((rev) => (
                <div key={rev.id} className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-zinc-200">{rev.customerName}</span>
                    <div className="flex text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400">{rev.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500">لا توجد تقييمات سابقة بعد. كن أول من يقيّم هذا المنتج الفاخر!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
