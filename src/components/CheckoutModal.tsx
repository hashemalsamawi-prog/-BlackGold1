import React, { useState } from 'react';
import { CartItem, Language, DeliveryAddress, Order } from '../types';
import { SANAA_DISTRICTS } from '../data/mockData';
import { 
  X, Check, ShieldCheck, MapPin, Truck, Phone, User, 
  CreditCard, Banknote, Clock, Sparkles, AlertCircle, MessageSquare
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
  onSaveAddress?: (addr: DeliveryAddress) => void;
  onUpdateAddress?: (addr: DeliveryAddress) => void;
  onDeleteAddress?: (id: string) => void;
  onOrderPlaced: (newOrder: Order) => void;
  onOpenTracking: () => void;
  whatsappNumber?: string;
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
  addresses = [],
  selectedAddressId,
  onSelectAddress,
  onSaveAddress,
  onOrderPlaced,
  onOpenTracking,
  whatsappNumber,
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

  // Dynamic shipping fee based on selected district
  const selectedDistrictObj = SANAA_DISTRICTS.find((d) => d.nameAr === district);
  const currentShippingFee = selectedDistrictObj ? selectedDistrictObj.fee : (shippingFee || 1000);
  const subtotal = cart.reduce((sum, it) => sum + ((it.unitPrice || it.product.price) * it.quantity), 0);
  const totalAmount = Math.max(0, subtotal + currentShippingFee - discount);

  const paymentNames: Record<string, string> = {
    cash_on_delivery: 'عند الاستلام (كاش) 💵',
    kuraimi: 'حاسب / الكريمي 💳',
    one_cash: 'ون كاش OneCash 📱',
    floosak: 'فلوسك Floosak 📲'
  };

  const handleSelectSavedAddr = (addr: DeliveryAddress) => {
    if (addr.district) setDistrict(addr.district);
    if (addr.street) setAddressDetails(addr.street);
    if (addr.phone && !customerPhone) setCustomerPhone(addr.phone);
  };

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

    // Persist customer inputs
    localStorage.setItem('bg_customer_name', customerName.trim());
    localStorage.setItem('bg_customer_phone', customerPhone.trim());

    if (onSaveAddress) {
      onSaveAddress({
        id: 'addr-' + Date.now(),
        title: customerName.trim(),
        district,
        street: addressDetails.trim(),
        phone: customerPhone.trim(),
        isDefault: true,
      });
    }

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: 'BG-' + Math.floor(1000 + Math.random() * 9000),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: cart,
      itemsSummary: cart.map(i => `${i.product.nameAr} (${i.selectedWeight || 'العبوة'}) × ${i.quantity}`).join('، '),
      subtotal,
      shippingFee: currentShippingFee,
      discountAmount: discount,
      totalAmount,
      district,
      addressDetails: addressDetails.trim(),
      paymentMethod,
      paymentStatus: 'pending',
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

  const handleSendWhatsAppOrder = async () => {
    const targetWhatsApp = whatsappNumber || '967775000150';
    const itemsList = cart.map(i => `• ${i.product.nameAr} (${i.selectedWeight || 'العبوة'}) × ${i.quantity} = ${((i.unitPrice || i.product.price) * i.quantity).toLocaleString()} ريال`).join('\n');
    
    const clientName = customerName.trim() || 'عميل المتجر الإلكتروني';
    const clientPhone = customerPhone.trim() || 'محدد في محادثة الواتساب';
    const addr = addressDetails.trim() || 'سيتم تزويده في المحادثة أو إرسال اللوكيشن';
    
    const message = `*طلب شراء جديد - فحم الذهب الأسود* 👑
-------------------------------
👤 *العميل:* ${clientName}
📱 *الهاتف:* ${clientPhone}
📍 *المنطقة في صنعاء:* ${district}
🏢 *العنوان / المعلم:* ${addr}
💳 *طريقة الدفع:* ${paymentNames[paymentMethod] || 'عند الاستلام'}
${notes.trim() ? `📝 *ملاحظات للمندوب:* ${notes.trim()}\n` : ''}-------------------------------
📦 *المنتجات المطلوبة:*
${itemsList}
-------------------------------
💰 *مجموع المنتجات:* ${subtotal.toLocaleString()} ريال
🚚 *رسوم التوصيل (${district}):* ${currentShippingFee.toLocaleString()} ريال
${discount > 0 ? `🏷️ *خصم الكوبون:* -${discount.toLocaleString()} ريال\n` : ''}⭐ *المبلغ المطلوب:* ${totalAmount.toLocaleString()} ريال
-------------------------------
يرجى تأكيد واعتماد الطلب للتوصيل الفوري.`;

    // Persist order in system so it shows up in dashboard
    const waOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: 'BG-WA-' + Math.floor(1000 + Math.random() * 9000),
      customerName: clientName,
      customerPhone: clientPhone,
      items: cart,
      itemsSummary: cart.map(i => `${i.product.nameAr} (${i.selectedWeight || 'العبوة'}) × ${i.quantity}`).join('، '),
      subtotal,
      shippingFee: currentShippingFee,
      discountAmount: discount,
      totalAmount,
      district,
      addressDetails: addr,
      paymentMethod,
      paymentStatus: 'pending',
      status: 'pending',
      notes: notes.trim() ? `${notes.trim()} (طلب تم إرساله عبر الواتساب)` : 'طلب مباشر عبر الواتساب',
      createdAt: new Date().toISOString(),
    };

    try {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waOrder),
      }).catch(() => {});
    } catch {}

    onOrderPlaced(waOrder);

    if (customerName.trim()) localStorage.setItem('bg_customer_name', customerName.trim());
    if (customerPhone.trim()) localStorage.setItem('bg_customer_phone', customerPhone.trim());
    if (addressDetails.trim() && onSaveAddress) {
      onSaveAddress({
        id: 'addr-' + Date.now(),
        title: customerName.trim(),
        district,
        street: addressDetails.trim(),
        phone: customerPhone.trim(),
        isDefault: true,
      });
    }

    onClose();
    window.open(`https://wa.me/${targetWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-5 sm:p-7 my-auto max-h-[92vh] overflow-y-auto text-right animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">إتمام طلب وتوصيل فحم الذهب الأسود</h2>
            <p className="text-[11px] sm:text-xs text-zinc-400">تأكيد فوري وتوجيه مباشر لمندوب التوصيل في منطقتك بصنعاء</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs">
          {/* If user previously saved real addresses, show quick pick */}
          {addresses.length > 0 && (
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-400 block mb-1.5">عناوينك المحفوظة سابقاً:</span>
              <div className="flex flex-wrap gap-2">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectSavedAddr(addr)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-700 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{addr.district} - {addr.street?.slice(0, 20)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-white pr-9 font-mono"
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
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'cash_on_delivery'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-black'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Banknote className="w-4 h-4 mx-auto mb-1" />
                <span>عند الاستلام (كاش)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('kuraimi')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'kuraimi'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-black'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <CreditCard className="w-4 h-4 mx-auto mb-1" />
                <span>حاسب / الكريمي</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('one_cash')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'one_cash'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-black'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <CreditCard className="w-4 h-4 mx-auto mb-1" />
                <span>ون كاش OneCash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('floosak')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'floosak'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-black'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
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
              placeholder="مثال: الاتصال عند الوصول أمام العمارة، أو تسليم الشحنة للاستقبال..."
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl p-2.5 text-white resize-none"
            />
          </div>

          {/* Summary */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex justify-between text-zinc-400">
              <span>مجموع المنتجات:</span>
              <span className="font-mono font-bold text-white">{subtotal.toLocaleString()} ريال</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>رسوم التوصيل المباشر ({district}):</span>
              <span className="font-mono font-bold text-white">{currentShippingFee.toLocaleString()} ريال</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>خصم الكوبون:</span>
                <span className="font-mono font-bold">-{discount.toLocaleString()} ريال</span>
              </div>
            )}
            <div className="pt-2.5 border-t border-zinc-800 flex justify-between text-base font-black text-amber-400">
              <span>الإجمالي المطلوب:</span>
              <span className="font-mono text-lg">{totalAmount.toLocaleString()} ريال</span>
            </div>
          </div>

          {/* Action Buttons: 1. Confirm & Submit, 2. Send via WhatsApp */}
          <div className="space-y-2.5 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all cursor-pointer active:scale-[0.99]"
            >
              <Check className="w-5 h-5" />
              <span>{isSubmitting ? 'جاري تأكيد الطلب...' : 'تأكيد وإرسال الطلب الآن ⚡'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsAppOrder}
              className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all border border-emerald-400/30 cursor-pointer active:scale-[0.99]"
            >
              <MessageSquare className="w-4 h-4 text-white fill-white" />
              <span>أو إرسال الطلب عبر الواتساب مباشرة (WhatsApp) 💬</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

