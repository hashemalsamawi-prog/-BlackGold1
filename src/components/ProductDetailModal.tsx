import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, Language, Review } from '../types';
import { resolveAsset } from '../assets/images';
import { 
  X, Flame, ShieldCheck, Star, ShoppingCart, 
  Minus, Plus, Clock, Wind, Check, Zap
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
  const [modalImageLoaded, setModalImageLoaded] = useState(false);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll modal container to top when opened or product changes
  useEffect(() => {
    if (modalContainerRef.current) {
      modalContainerRef.current.scrollTop = 0;
    }
    setSelectedImageIndex(0);
    setModalImageLoaded(false);
  }, [product?.id]);

  const [selectedWeight, setSelectedWeight] = useState<string>(() => {
    if (product.weightOptions && product.weightOptions.length > 0) {
      return product.weightOptions[0].weight;
    }
    return product.weightGrams ? `${product.weightGrams}g` : '250g';
  });

  const [isAdded, setIsAdded] = useState(false);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const productReviews = reviews.filter((r) => r.productId === product.id);

  // Compute active unit price based on selected weight option
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

  const productImages = useMemo(() => {
    if (product.images && product.images.length > 0) return product.images;
    return [product.image];
  }, [product]);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;
    onAddReview(product.id, newRating, newReviewComment, newReviewName.trim() || 'عميل فحم الذهب الأسود');
    setNewReviewComment('');
    setNewReviewName('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  const handleAddToCartClick = () => {
    onAddToCart(product, selectedWeight, quantity, activeUnitPrice);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={modalContainerRef}
        className="relative w-full max-w-4xl rounded-3xl bg-[#0F0F16] border border-[#222232] shadow-2xl p-5 sm:p-8 my-6 max-h-[90vh] overflow-y-auto text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2.5 rounded-xl bg-[#161622] border border-[#242436] text-slate-400 hover:text-white hover:bg-[#1E1E2C] transition-colors cursor-pointer z-20"
          title="إغلاق"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Gallery Container (Left column in LTR, Right in RTL) */}
          <div className="md:col-span-6 space-y-3">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#0A0A0F] border border-[#1E1E2C] shadow-inner">
              {!modalImageLoaded && (
                <div className="absolute inset-0 bg-[#161622] animate-luxury-pulse" />
              )}
              <img
                src={resolveAsset(productImages[selectedImageIndex] || productImages[0])}
                alt={product.nameAr}
                onLoad={() => setModalImageLoaded(true)}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  modalImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg';
                  setModalImageLoaded(true);
                }}
              />
              {product.bonusGrams && (
                <div className="absolute top-3 right-3 bg-[#1E1D2B] border border-amber-500/40 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-xl shadow-md">
                  +{product.bonusGrams}g مجاناً مدمج
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {productImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImageIndex === idx
                        ? 'border-amber-400 ring-2 ring-amber-400/30'
                        : 'border-[#222232] opacity-60 hover:opacity-100'
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
          </div>

          {/* Product Specifications & Purchase Area */}
          <div className="md:col-span-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
                <span>{product.category === 'premium' ? 'الخط الملكي الفاخر' : 'فحم درجة أولى'}</span>
                <span>•</span>
                <div className="flex items-center gap-1 text-slate-300">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{product.rating || 4.9}</span>
                  <span className="text-slate-500">({productReviews.length || product.reviewsCount || 45} تقييم)</span>
                </div>
              </div>

              <h2 className="text-2xl font-black text-white">
                {product.nameAr}
              </h2>

              <p className="text-sm text-slate-300 mt-2 leading-relaxed font-normal">
                {product.descriptionAr}
              </p>
            </div>

            {/* Structured Specifications Grid */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-[#14141E] border border-[#222232] text-xs">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 block">مدة الاشتعال</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>{product.burnTimeMinutes || 180} دقيقة متواصلة</span>
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 block">نسبة الرماد</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>أقل من 1.5% (رماد أبيض)</span>
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 block">المصدر والمكونات</span>
                <span className="font-bold text-white">طبيعي 100% بدون إضافات</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 block">الدخان والشرار</span>
                <span className="font-bold text-emerald-400">انبعاثات نقية خالية من الشوائب</span>
              </div>
            </div>

            {/* Weight Options Selector */}
            {product.weightOptions && product.weightOptions.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  اختر حجم أو وزن العبوة:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.weightOptions.map((opt) => (
                    <button
                      key={opt.weight}
                      type="button"
                      onClick={() => setSelectedWeight(opt.weight)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedWeight === opt.weight
                          ? 'bg-amber-400 text-[#09090D] font-extrabold shadow-sm'
                          : 'bg-[#14141E] text-slate-300 border border-[#242436] hover:border-slate-600'
                      }`}
                    >
                      <span>{opt.weight}</span>
                      <span className="mr-1.5 text-[11px] opacity-80 font-mono">({opt.price.toLocaleString()} ر.ي)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price & Quantity Calculation */}
            <div className="p-4 rounded-2xl bg-[#14141E] border border-[#222232] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">السعر الإجمالي:</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {(activeUnitPrice * quantity).toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-slate-400">ر.ي</span>
                  </div>
                  {activeOriginalPrice && activeOriginalPrice > activeUnitPrice && (
                    <span className="text-xs text-slate-500 line-through font-mono">
                      {(activeOriginalPrice * quantity).toLocaleString()} ر.ي
                    </span>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center bg-[#0F0F16] border border-[#262638] rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1E1E2C] transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-white font-mono">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1E1E2C] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Purchase Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToCartClick}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-500 text-white'
                      : 'gold-gradient-bg text-[#09090D] hover:brightness-105 shadow-md shadow-amber-500/15'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>تمت الإضافة بنجاح</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>إضافة إلى السلة</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-8 pt-6 border-t border-[#1F1F2E] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>آراء وتقييمات العملاء</span>
              <span className="text-xs text-slate-400 font-normal">({productReviews.length})</span>
            </h3>
          </div>

          {/* List of existing verified reviews */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto no-scrollbar">
            {productReviews.length === 0 ? (
              <p className="text-xs text-slate-500 col-span-2 py-2">لا توجد تقييمات مضافة بعد لهذا المنتج. كن أول من يكتب تقييماً!</p>
            ) : (
              productReviews.map((rev) => (
                <div key={rev.id} className="p-3 rounded-xl bg-[#14141E] border border-[#20202E] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{rev.customerName || rev.userName || 'عميل الذهب الأسود'}</span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{rev.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Submit a Review Form */}
          <form onSubmit={handleReviewSubmit} className="p-3.5 rounded-2xl bg-[#12121A] border border-[#222232] space-y-3">
            <span className="text-xs font-bold text-slate-300 block">أضف رأيك وتجربتك:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newReviewName}
                onChange={(e) => setNewReviewName(e.target.value)}
                placeholder="اسمك أو لقبك (اختياري)"
                className="w-full bg-[#181824] border border-[#28283C] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs">
                <span className="text-slate-400">التقييم:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setNewRating(s)}
                      className="cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${s <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <textarea
              value={newReviewComment}
              onChange={(e) => setNewReviewComment(e.target.value)}
              placeholder="اكتب تقييمك لجودة الفحم والاشتعال والتوصيل..."
              rows={2}
              className="w-full bg-[#181824] border border-[#28283C] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between">
              {reviewSubmitted ? (
                <span className="text-xs text-emerald-400 font-bold">شكراً لك! تم إرسال تقييمك بنجاح.</span>
              ) : <div />}
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#1E1E2C] hover:bg-amber-400 hover:text-[#09090D] text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                إرسال التقييم
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
