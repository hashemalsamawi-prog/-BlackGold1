import React, { useState, useEffect } from 'react';
import { CartItem, Language, DeliveryAddress } from '../types';
import { X, Trash2, ShoppingBag, MapPin, Tag, ArrowLeft, ArrowRight, MessageSquare, AlertCircle, ChevronRight, CheckCircle2, Plus } from 'lucide-react';
import { resolveAsset, ASSETS } from '../assets/images';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  lang: Language;
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onProceedToCheckout: (districtFee: number, couponDiscount: number, customerNotes: string, selectedDistrictName: string) => void;
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
  const [couponMsg, setCouponMsg] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

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
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingFee = cart.length > 0 ? 1000 : 0;
  const total = Math.max(0, subtotal + shippingFee - discountVal);

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId) || (savedAddresses.length > 0 ? savedAddresses[0] : null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, amount: subtotal })
      });
      const data = await res.json();
      if (data.success) {
        setDiscountVal(data.discount);
        setCouponMsg(`تم تطبيق الكوبون بنجاح! خصم ${data.discount.toLocaleString()} ريال`);
      } else {
        setDiscountVal(0);
        setCouponMsg(data.message || 'الكوبون غير صالح');
      }
    } catch {
      // Local fallback coupon
      if (couponCode.toUpperCase() === 'GOLD10') {
        const disc = Math.round(subtotal * 0.1);
        setDiscountVal(disc);
        setCouponMsg(`تم تفعيل خصم 10% بنجاح (${disc.toLocaleString()} ريال)`);
      } else if (couponCode.toUpperCase() === 'SANAA') {
        setDiscountVal(1000);
        setCouponMsg('تم خصم رسوم التوصيل بالكامل (1,000 ريال)');
      } else {
        setDiscountVal(0);
        setCouponMsg('كوبون غير صالح');
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
      onClick={(e) => {
        // Tap outside cart drawer to close/return
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="w-full max-w-lg bg-[#14141E] border-r border-amber-500/20 h-full flex flex-col shadow-2xl relative text-right animate-in slide-in-from-left duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header with prominent Back Button */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/50 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              title="الرجوع ومواصلة التسوق"
            >
              <ChevronRight className="w-4 h-4 text-amber-400" />
              <span>رجوع للتسوق</span>
            </button>

            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>سلة مشترياتك</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              </h3>
              <p className="text-[10px] text-slate-400">
                {totalItemsCount > 0 ? `${totalItemsCount} عبوة مختارة للتوصيل` : 'السلة فارغة'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
            title="إغلاق السلة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content (Items + Details + Summary) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-black text-white">سلة مشترياتك فارغة حالياً</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  تصفح منتجات فحم الذهب الأسود الملكي والبلدي وأضف العبوات المطلوبة بضغطة زر واحدة.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl gold-gradient-bg text-slate-950 font-black text-xs hover:brightness-110 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                تصفح المنتجات الآن 🔥
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
                <span>المنتجات المختارة في السلة:</span>
                <span className="text-amber-400">{cart.length} أصناف</span>
              </div>

              {cart.map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-3 shadow-sm"
                >
                  <img
                    src={resolveAsset(item.product?.images?.[0] || (item.product as any)?.image || ASSETS.pouchPair)}
                    alt={item.product?.nameAr || 'منتج فحم الذهب الأسود'}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 object-cover rounded-xl bg-slate-950 shrink-0 border border-slate-800"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-xs font-black text-white truncate">{item.product.nameAr}</h4>
                    <div className="text-[11px] text-amber-400 font-bold flex items-center gap-1.5">
                      <span className="bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {item.selectedWeight}
                      </span>
                      <span>•</span>
                      <span className="font-mono">{item.unitPrice.toLocaleString()} YER</span>
                    </div>
                    
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(idx, Math.max(1, item.quantity - 1))}
                          className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-xs font-black text-slate-300 flex items-center justify-center active:scale-95 transition-all"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-xs font-black text-amber-300 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-xs font-black text-slate-300 flex items-center justify-center active:scale-95 transition-all"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-[11px] font-bold text-slate-400 font-mono">
                        = {(item.unitPrice * item.quantity).toLocaleString()} YER
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(idx)}
                    className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                    title="حذف من السلة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Delivery Location & Calculations Section */}
          {cart.length > 0 && (
            <div className="space-y-3.5 pt-2 border-t border-slate-800">
              
              {/* Active Delivery Location Preview (Manual Saved Addresses) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>موقع وعنوان التوصيل المعتمد:</span>
                  </label>

                  <button
                    type="button"
                    onClick={onOpenMap}
                    className="text-[11px] text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 underline cursor-pointer"
                  >
                    <span>إدارة ومواقع التوصيل 🗺️</span>
                  </button>
                </div>

                {selectedAddress ? (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/30 flex items-center justify-between gap-2">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{selectedAddress.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {selectedAddress.district}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate">{selectedAddress.street}</p>
                    </div>

                    <button
                      type="button"
                      onClick={onOpenMap}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold border border-slate-700 transition-all shrink-0 cursor-pointer"
                    >
                      تغيير 📍
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950 border border-dashed border-amber-500/40 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">لم يتم حفظ موقع للتوصيل بعد</span>
                    <button
                      type="button"
                      onClick={onOpenMap}
                      className="px-3 py-1.5 rounded-lg gold-gradient-bg text-slate-950 font-black text-[11px] cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ إضافة موقع</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Customer Delivery Notes */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <label className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>ملاحظات الفاتورة والتوصيل للمندوب (اختياري):</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: يرجى الاتصال قبل الوصول بـ 10 دقائق، أو تسليم الشحنة للاستقبال..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs p-2.5 rounded-xl outline-none focus:border-amber-500 resize-none"
                />
                <p className="text-[10px] text-slate-400">
                  تظهر هذه الملاحظة تلقائياً في الفاتورة الرسمية وشاشة الكابتن.
                </p>
              </div>

              {/* Discount Coupon Box */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>كوبون الخصم:</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="كوبون الخصم (مثال: GOLD10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-xl outline-none focus:border-amber-500 uppercase font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
                  >
                    تطبيق
                  </button>
                </div>
                {couponMsg && (
                  <p className="text-[11px] text-amber-300 font-semibold px-1">{couponMsg}</p>
                )}
              </div>

              {/* Financial Calculation Summary */}
              <div className="p-4 rounded-2xl bg-slate-950/95 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>المجموع الفرعي للمنتجات:</span>
                  <span className="font-bold font-mono">{subtotal.toLocaleString()} YER</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>رسوم التوصيل السريع (صنعاء):</span>
                  <span className="font-bold font-mono">{shippingFee.toLocaleString()} YER</span>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>الخصم المطبق:</span>
                    <span className="font-mono">- {discountVal.toLocaleString()} YER</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-black text-sm pt-2.5 border-t border-slate-800">
                  <span>المبلغ الإجمالي المطلوب بالريال:</span>
                  <span className="text-amber-400 text-base sm:text-lg font-mono font-black">
                    {total.toLocaleString()} YER
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Sticky Action Footer Bar (Safe padding to prevent mobile cut-off) */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#12121B] shrink-0 space-y-2.5 pb-24 sm:pb-5">
            <button
              type="button"
              onClick={() => onProceedToCheckout(shippingFee, discountVal, customerNotes, selectedAddress?.district || 'صنعاء')}
              className="w-full py-3.5 rounded-2xl gold-gradient-bg text-slate-950 font-black text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <span>متابعة إتمام الطلب وتأكيد الفاتورة</span>
              {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>

            <a
              href={`https://wa.me/967775000150?text=${encodeURIComponent(
                `*طلب فحم سريع - شركة الذهب الأسود* 👑\n-------------------------------\n*موقع التوصيل:* ${selectedAddress ? `${selectedAddress.title} - ${selectedAddress.district}` : 'صنعاء'}\n*الطلبات:*\n${cart.map((c) => `• ${c.product.nameAr} (${c.selectedWeight}) × ${c.quantity} = ${(c.unitPrice * c.quantity).toLocaleString()} YER`).join('\n')}\n-------------------------------\n*المجموع:* ${subtotal.toLocaleString()} YER\n*التوصيل:* ${shippingFee.toLocaleString()} YER\n*الإجمالي المطلوب:* ${total.toLocaleString()} YER\n${customerNotes ? `*ملاحظة:* ${customerNotes}\n` : ''}-------------------------------\nيرجى اعتماد الطلب وتأكيد التوصيل المباشر بالواتساب.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-2 transition-all border border-emerald-500/40 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>أو الطلب السريع الفوري عبر الواتساب (WhatsApp) 💬</span>
            </a>
          </div>
        )}

      </div>
    </div>
  );
};
