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
  onAddToCart: (product: Product, selectedWeight: number, quantity: number, price: number) => void;
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
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const productReviews = reviews.filter((r) => r.productId === product.id);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto text-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Visual Container */}
          <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800">
            <img
              src={resolveAsset(product.images?.[0] || product.image)}
              alt={product.nameAr}
              className="w-full h-80 object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg';
              }}
            />
            {product.bonusGrams && (
              <div className="absolute top-4 right-4 bg-red-600 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-lg">
                +{product.bonusGrams}g مجاناً مدمج
              </div>
            )}
          </div>

          {/* Details & Specs */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/30">
                {product.category === 'premium' ? 'فحم ملكي مضغوط' : 'فحم حطب سدر طبيعي'}
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="font-bold">{product.rating || 4.9}</span>
              </div>
            </div>

            <h2 className="text-xl font-black text-white">{product.nameAr}</h2>
            <p className="text-xs text-zinc-300 leading-relaxed">{product.descriptionAr}</p>

            {/* Technical Specifications */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">مدة الاشتعال</span>
                <span className="font-bold text-amber-400">{product.burnTimeMinutes || 180} دقيقة</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">مستوى الدخان والشرار</span>
                <span className="font-bold text-emerald-400">{product.smokeLevel || '0% منعدم'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">نسبة الرماد</span>
                <span className="font-bold text-zinc-300">{product.ashContent || '< 2%'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">الوزن الصافي</span>
                <span className="font-bold text-zinc-300">{product.weightGrams}g (+{product.bonusGrams || 10}g)</span>
              </div>
            </div>

            {/* Price & Quantity */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between mt-4">
              <div>
                <span className="text-xs text-zinc-400 block">السعر الإجمالي</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-amber-400">
                    {(product.price * quantity).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">ريال</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-sm text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                onAddToCart(product, product.weightGrams, quantity, product.price);
                onClose();
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>إضافة {quantity} عبوة إلى السلة</span>
            </button>
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
