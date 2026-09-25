import React, { useState, useEffect } from 'react';
import { CartItem, Language, DeliveryAddress } from '../types';
import { 
  X, Trash2, ShoppingBag, MapPin, Tag, ArrowLeft, ArrowRight, 
  ChevronRight, CheckCircle2, Plus, Minus, ShieldCheck, Truck, Check, AlertCircle 
} from 'lucide-react';
import { resolveAsset } from '../assets/images';
import { SANAA_DISTRICTS } from '../data/mockData';
import { EmptyState } from './EmptyState';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  lang: Language;
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onProceedToCheckout: (districtFee: number, couponDiscount: number, customerNotes: string, selectedDistrictName: string, couponCode?: string) => void;
  onOpenMap: () => void;
  savedAddresses: DeliveryAddress[];
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  lang,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onOpenMap,
  savedAddresses,
  selectedAddressId,
  setSelectedAddressId
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [discountVal, setDiscountVal] = useState(0);
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('حدة');
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

  // Handle ESC key
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

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice || item.product.price) * item.quantity, 0);
  
  // Calculate delivery fee based on selected district
  const districtObj = SANAA_DISTRICTS.find((d) => d.nameAr === selectedDistrict);
  const shippingFee = cart.length > 0 ? (districtObj ? districtObj.fee : 1000) : 0;
  const total = Math.max(0, subtotal + shippingFee - discountVal);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsVerifyingCoupon(true);
    setCouponMsg(null);
    try {
      const res = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), amount: subtotal })
      });
      const data = await res.json();
      if (data.success) {
        setDiscountVal(data.discount);
        setCouponMsg({ text: `تم تفعيل الكوبون! خصم ${data.discount.toLocaleString()} ريال`, isError: false });
      } else {
        setDiscountVal(0);
        setCouponMsg({ text: data.message || 'الكوبون المدخل غير صالح أو منتهي الصلاحية', isError: true });
      }
    } catch {
      setDiscountVal(0);
      setCouponMsg({ text: 'تعذر التحقق من الكوبون حالياً. يرجى التحقق من اتصال الإنترنت', isError: true });
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  const handleProceed = () => {
    onProceedToCheckout(shippingFee, discountVal, customerNotes, selectedDistrict, couponCode.trim());
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg bg-[#0F0F16] border-r border-[#222232] h-full flex flex-col shadow-2xl relative text-right animate-in slide-in-from-left duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header with Navigation & Dismiss */}
        <div className="p-4 sm:p-5 border-b border-[#1E1E2C] flex items-center justify-between bg-[#12121A] gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-[#181824] hover:bg-[#202030] text-amber-300 border border-[#28283C] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-amber-400" />
              <span>مواصلة التسوق</span>
            </button>

            <div className="space-y-0.5">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>سلة المشتريات</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {totalItemsCount > 0 ? `${totalItemsCount} عبوة مختارة للتوصيل` : 'السلة فارغة حالياً'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#161622] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Item Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cart.length === 0 ? (
            <EmptyState
              type="cart"
              onAction={onClose}
              actionLabel="تصفح تشكيلة الفحم الملكي"
            />
          ) : (
            <>
              {/* Product Cards in Cart */}
              <div className="space-y-3">
                {cart.map((item, index) => {
                  const unitPrice = item.unitPrice || item.product.price;
                  const itemTotal = unitPrice * item.quantity;
                  const weightDisplay = item.selectedWeight || (item.product.weightGrams ? `${item.product.weightGrams}g` : '250g');

                  return (
                    <div 
                      key={`${item.product.id}-${item.selectedWeight || index}`}
                      className="p-3.5 rounded-2xl bg-[#14141E] border border-[#20202E] flex items-center justify-between gap-3 text-right"
                    >
                      {/* Thumbnail Image */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#0A0A0F] border border-[#1E1E2C] shrink-0">
                        <img
                          src={resolveAsset(item.product.images?.[0] || item.product.image)}
                          alt={item.product.nameAr}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {item.product.nameAr}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="bg-[#1C1C28] px-2 py-0.5 rounded-md text-amber-300 font-medium">
                            {weightDisplay}
                          </span>
                          <span>{unitPrice.toLocaleString()} ر.ي للعبوة</span>
                        </div>
                        <div className="text-xs font-black text-amber-400 font-mono">
                          المجموع: {itemTotal.toLocaleString()} ر.ي
                        </div>
                      </div>

                      {/* Actions: Stepper and Remove */}
                      <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(index)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          title="حذف من السلة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex items-center bg-[#181824] border border-[#262638] rounded-xl p-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white transition-colors text-xs font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-xs text-white font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white transition-colors text-xs font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* District Delivery Selector in Cart */}
              <div className="p-3.5 rounded-2xl bg-[#14141E] border border-[#20202E] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>منطقة التوصيل بصنعاء:</span>
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono font-bold">
                    رسوم التوصيل: {shippingFee.toLocaleString()} ر.ي
                  </span>
                </div>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-[#181824] border border-[#28283C] text-xs text-white rounded-xl px-3 py-2 focus:outline-none"
                >
                  {SANAA_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.nameAr}>
                      صنعاء - {d.nameAr} ({d.fee.toLocaleString()} ر.ي - {d.timeEstimate || '45 دقيقة'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Coupon Code Section */}
              <div className="p-3.5 rounded-2xl bg-[#14141E] border border-[#20202E] space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>كوبون الخصم أو التوصيل المجاني:</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="مثال: GOLD10 أو SANAA"
                    className="flex-1 bg-[#181824] border border-[#28283C] rounded-xl px-3 py-2 text-xs text-white uppercase placeholder-slate-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isVerifyingCoupon || !couponCode.trim()}
                    className="px-4 py-2 rounded-xl bg-[#202030] hover:bg-amber-400 hover:text-[#09090D] text-slate-200 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifyingCoupon ? 'تحقق...' : 'تطبيق'}
                  </button>
                </div>
                {couponMsg && (
                  <p className={`text-[11px] font-semibold flex items-center gap-1 ${couponMsg.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {couponMsg.isError ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    <span>{couponMsg.text}</span>
                  </p>
                )}
              </div>

              {/* Special Delivery Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 block">
                  ملاحظات إضافية للتوصيل (اختياري):
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="مثال: يرجى الاتصال قبل الوصول بـ 10 دقائق..."
                  className="w-full bg-[#14141E] border border-[#20202E] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Checkout Summary & CTA */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-[#1E1E2C] bg-[#12121A] space-y-3 shrink-0">
            {/* Price breakdown rows */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>المجموع الفرعي ({totalItemsCount} عبوة):</span>
                <span className="font-mono text-slate-200">{subtotal.toLocaleString()} ر.ي</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>رسوم التوصيل ({selectedDistrict}):</span>
                <span className="font-mono text-slate-200">{shippingFee.toLocaleString()} ر.ي</span>
              </div>

              {discountVal > 0 && (
                <div className="flex items-center justify-between text-emerald-400 font-semibold">
                  <span>الخصم المطبق:</span>
                  <span className="font-mono">-{discountVal.toLocaleString()} ر.ي</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#20202E] flex items-center justify-between text-sm font-black text-white">
                <span>المبلغ الإجمالي النهائي:</span>
                <span className="text-base text-amber-400 font-mono">{total.toLocaleString()} ر.ي</span>
              </div>
            </div>

            {/* Primary Checkout CTA */}
            <button
              type="button"
              onClick={handleProceed}
              className="w-full py-3.5 px-4 rounded-xl gold-gradient-bg text-[#09090D] font-extrabold text-sm hover:brightness-105 active:scale-[0.99] shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
            >
              <span>متابعة لإتمام الطلب وتحديد العنوان</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
