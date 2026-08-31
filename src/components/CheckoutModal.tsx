import React, { useState } from 'react';
import { CartItem, Language, DeliveryAddress, Order } from '../types';
import { SANAA_DISTRICTS } from '../data/mockData';
import { 
  X, Check, ShieldCheck, MapPin, Truck, Phone, User, 
  CreditCard, Banknote, Clock, Sparkles, AlertCircle
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  lang: Language;
  shippingFee: number;
  discount: number;
  customerNotes: string;
  selectedDistrictName: string;
  addresses: DeliveryAddress[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
  onSaveAddress: (addr: DeliveryAddress) => void;
  onUpdateAddress: (addr: DeliveryAddress) => void;
  onDeleteAddress: (id: string) => void;
  onOrderPlaced: (newOrder: Order) => void;
  onOpenTracking: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  lang,
  shippingFee,
  discount,
  customerNotes,
  selectedDistrictName,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onOrderPlaced,
  onOpenTracking,
}) => {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState(() => localStorage.getItem('bg_customer_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('bg_customer_phone') || '');
  const [district, setDistrict] = useState(selectedDistrictName || 'حدة');
  const [addressDetails, setAddressDetails] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'kuraimi' | 'one_cash' | 'floosak'>('cash_on_delivery');
  const [notes, setNotes] = useState(customerNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const subtotal = cart.reduce((sum, it) => sum + (it.product.price * it.quantity), 0);
  const totalAmount = Math.max(0, subtotal + shippingFee - discount);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('يرجى إدخال اسم المستلم');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 6) {
      setErrorMsg('يرجى إدخال رقم هاتف يمني صحيح (مثال: 777123456)');
      return;
    }
    if (!addressDetails.trim()) {
      setErrorMsg('يرجى كتابة تفاصيل العنوان والشارع بدقة');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: 'BG-' + Math.floor(1000 + Math.random() * 9000),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: cart,
      itemsSummary: cart.map(i => `${i.product.nameAr} × ${i.quantity}`).join('، '),
      subtotal,
      shippingFee,
      discountAmount: discount,
      totalAmount,
      district,
      addressDetails: addressDetails.trim(),
      paymentMethod,
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending',
      status: 'pending',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });
      const data = await res.json();
      if (data.success && data.data) {
        onOrderPlaced(data.data);
      } else {
        onOrderPlaced(newOrder);
      }
    } catch (e) {
      onOrderPlaced(newOrder);
    }

    setIsSubmitting(false);
    onClose();
    onOpenTracking();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-6 my-8 max-h-[92vh] overflow-y-auto text-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">إتمام طلب وتوصيل فحم الذهب الأسود</h2>
            <p className="text-xs text-zinc-400">تأكيد فوري وتوجيه مباشر لمندوب التوصيل في منطقتك بصنعاء</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs">
          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-bold mb-1">اسم العميل / المستلم *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="الاسم الكريم"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-white pr-9"
                />
                <User className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-bold mb-1">رقم الهاتف (واتساب) *</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="77XXXXXXXX"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-white pr-9"
                />
                <Phone className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
              </div>
            </div>
          </div>

          {/* Delivery District & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-bold mb-1">المديرية / الحي في صنعاء *</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-white"
              >
                {SANAA_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.nameAr}>{d.nameAr} ({d.fee} ريال توصيل)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-bold mb-1">الشارع وأقرب معلم بارز *</label>
              <input
                type="text"
                required
                value={addressDetails}
                onChange={(e) => setAddressDetails(e.target.value)}
                placeholder="مثال: شارع الستين - جوار سوبرماركت الهدى"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-white"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-zinc-300 font-bold mb-2">طريقة الدفع المفضلة</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash_on_delivery')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  paymentMethod === 'cash_on_delivery'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-black'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                }`}
              >
                <Banknote className="w-4 h-4 mx-auto mb-1" />
                <span>عند الاستلام (كاش)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('kuraimi')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  paymentMethod === 'kuraimi'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-black'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                }`}
              >
                <CreditCard className="w-4 h-4 mx-auto mb-1" />
                <span>حاسب / الكريمي</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('one_cash')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  paymentMethod === 'one_cash'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-black'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                }`}
              >
                <CreditCard className="w-4 h-4 mx-auto mb-1" />
                <span>ون كاش OneCash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('floosak')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  paymentMethod === 'floosak'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-black'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                }`}
              >
                <CreditCard className="w-4 h-4 mx-auto mb-1" />
                <span>فلوسك Floosak</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-zinc-300 font-bold mb-1">ملاحظات إضافية للمندوب (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="مثال: الاتصال عند الوصول أمام العمارة"
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl p-2.5 text-white"
            />
          </div>

          {/* Summary */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <div className="flex justify-between text-zinc-400">
              <span>مجموع المنتجات:</span>
              <span>{subtotal.toLocaleString()} ريال</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>رسوم التوصيل المباشر:</span>
              <span>{shippingFee.toLocaleString()} ريال</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>خصم الكوبون:</span>
                <span>-{discount.toLocaleString()} ريال</span>
              </div>
            )}
            <div className="pt-2 border-t border-zinc-800 flex justify-between text-base font-black text-amber-400">
              <span>الإجمالي المطلوب:</span>
              <span>{totalAmount.toLocaleString()} ريال</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Check className="w-5 h-5" />
            <span>{isSubmitting ? 'جاري تأكيد الطلب...' : 'تأكيد وإرسال الطلب الآن ⚡'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
