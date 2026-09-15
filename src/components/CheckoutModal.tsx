import React, { useState, useEffect } from 'react';
import { CartItem, Language, DeliveryAddress, Order } from '../types';
import { SANAA_DISTRICTS } from '../data/mockData';
import { 
  X, Check, ShieldCheck, MapPin, Truck, Phone, User, 
  CreditCard, Banknote, Clock, Sparkles, AlertCircle, MessageSquare,
  ArrowRight, Package, Loader2
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
  appliedCoupon?: { code: string; discountPercent?: number } | null;
  couponCode?: string;
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
  appliedCoupon = null,
  couponCode,
}) => {
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('bg_customer_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('bg_customer_phone') || '');
  const [district, setDistrict] = useState(selectedDistrictName || 'حدة');
  const [addressDetails, setAddressDetails] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'kuraimi' | 'one_cash' | 'floosak'>('cash_on_delivery');
  const [notes, setNotes] = useState(customerNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize state when opened
  useEffect(() => {
    if (isOpen) {
      if (selectedDistrictName) setDistrict(selectedDistrictName);
      if (customerNotes) setNotes(customerNotes);
      setErrorMsg('');
      const selectedAddr = addresses.find(a => a.id === selectedAddressId) || (addresses.length > 0 ? addresses[0] : null);
      if (selectedAddr) {
        if (selectedAddr.district) setDistrict(selectedAddr.district);
        if (selectedAddr.street && !addressDetails) setAddressDetails(selectedAddr.street);
        if (selectedAddr.phone && !customerPhone) setCustomerPhone(selectedAddr.phone);
      }
    }
  }, [isOpen, selectedDistrictName, customerNotes, selectedAddressId, addresses]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const getCarrierBadge = (phoneStr: string) => {
    const clean = phoneStr.replace(/\D/g, '');
    if (clean.startsWith('77') || clean.startsWith('78')) return { name: 'يمن موبايل', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    if (clean.startsWith('73')) return { name: 'يو YOU', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
    if (clean.startsWith('71')) return { name: 'سبأفون', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
    if (clean.startsWith('70')) return { name: 'واي Y', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    return null;
  };

  const carrier = getCarrierBadge(customerPhone);
  const cleanPhone = customerPhone.replace(/\D/g, '');
  const isPhoneValid = cleanPhone.length === 9 && (cleanPhone.startsWith('77') || cleanPhone.startsWith('78') || cleanPhone.startsWith('73') || cleanPhone.startsWith('71') || cleanPhone.startsWith('70'));

  const handleSelectSavedAddr = (addr: DeliveryAddress) => {
    if (addr.district) setDistrict(addr.district);
    if (addr.street) setAddressDetails(addr.street);
    if (addr.phone && !customerPhone) setCustomerPhone(addr.phone);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

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

    const clientRequestId = `bg-ord-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const orderPayload = {
      customerName: customerName.trim() || 'عميل المتجر',
      customerPhone: customerPhone.trim() || '770000000',
      items: cart.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        weight: i.selectedWeight || i.product.weight || '1kg'
      })),
      subtotal,
      shippingFee: currentShippingFee,
      discount,
      total: totalAmount,
      district,
      address: {
        district,
        street: addressDetails.trim() || 'أمانة العاصمة',
        landmark: ''
      },
      paymentMethod,
      notes: notes.trim(),
      couponCode: couponCode || appliedCoupon?.code || undefined,
      idempotencyKey: clientRequestId
    };

    try {
      const authHeader = typeof window !== 'undefined' && localStorage.getItem('bg_auth_token')
        ? { 'Authorization': `Bearer ${localStorage.getItem('bg_auth_token')}` }
        : (typeof window !== 'undefined' && localStorage.getItem('bg_guest_token')
            ? { 'Authorization': `Bearer ${localStorage.getItem('bg_guest_token')}` }
            : {});

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': clientRequestId,
          ...authHeader
        },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        if (data.guestToken && typeof window !== 'undefined') {
          localStorage.setItem('bg_guest_token', data.guestToken);
        }
        onOrderPlaced(data.data);
        setIsSubmitting(false);
        onClose();
        return;
      } else {
        setErrorMsg(data.message || 'فشل إرسال الطلب، يرجى مراجعة بيانات الطلب والمحاولة مرة أخرى');
        setIsSubmitting(false);
        return;
      }
    } catch (e: any) {
      setErrorMsg('تعذر الاتصال بالخادم، يرجى التحقق من اتصال الشبكة وإعادة المحاولة');
      setIsSubmitting(false);
      return;
    }
  };

  const handleSendWhatsAppOrder = async () => {
    if (isSubmitting) return;
    if (cart.length === 0) return;
    setErrorMsg('');
    setIsSubmitting(true);

    const clientName = customerName.trim() || 'عميل المتجر';
    const clientPhone = customerPhone.trim() || '770000000';
    const addr = addressDetails.trim() || 'صنعاء';

    const clientRequestId = `bg-wa-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const orderPayload = {
      customerName: clientName,
      customerPhone: clientPhone,
      items: cart.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        weight: i.selectedWeight || i.product.weight || '1kg'
      })),
      subtotal,
      shippingFee: currentShippingFee,
      discount,
      total: totalAmount,
      district,
      address: {
        district,
        street: addr,
        landmark: ''
      },
      paymentMethod,
      notes: notes.trim() ? `${notes.trim()} (طلب مباشر عبر الواتساب)` : 'طلب مباشر عبر الواتساب',
      couponCode: couponCode || appliedCoupon?.code || undefined,
      idempotencyKey: clientRequestId
    };

    try {
      const authHeader = typeof window !== 'undefined' && localStorage.getItem('bg_auth_token')
        ? { 'Authorization': `Bearer ${localStorage.getItem('bg_auth_token')}` }
        : (typeof window !== 'undefined' && localStorage.getItem('bg_guest_token')
            ? { 'Authorization': `Bearer ${localStorage.getItem('bg_guest_token')}` }
            : {});

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': clientRequestId,
          ...authHeader
        },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json();

      if (!res.ok || !data.success || !data.data) {
        setErrorMsg(data.message || 'تعذر تأكيد الطلب في النظام قبل إرسال الواتساب. يرجى التحقق من توفر المخزون.');
        setIsSubmitting(false);
        return;
      }

      const verifiedOrder = data.data;

      if (data.guestToken && typeof window !== 'undefined') {
        localStorage.setItem('bg_guest_token', data.guestToken);
      }

      try {
        const myIdsStr = localStorage.getItem('bg_my_order_ids') || '[]';
        const myIds = JSON.parse(myIdsStr);
        if (Array.isArray(myIds)) {
          if (verifiedOrder.id && !myIds.includes(verifiedOrder.id)) myIds.unshift(verifiedOrder.id);
          if (verifiedOrder.orderNumber && !myIds.includes(verifiedOrder.orderNumber)) myIds.unshift(verifiedOrder.orderNumber);
          localStorage.setItem('bg_my_order_ids', JSON.stringify(myIds));
        }

        const myCacheStr = localStorage.getItem('bg_my_orders_cache') || '[]';
        const myCache = JSON.parse(myCacheStr);
        if (Array.isArray(myCache)) {
          const updated = [verifiedOrder, ...myCache.filter((o: any) => o && o.id !== verifiedOrder.id && o.orderNumber !== verifiedOrder.orderNumber)];
          localStorage.setItem('bg_my_orders_cache', JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('Storage sync error:', err);
      }

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

      // Prepare official WhatsApp message with verified real server order number
      const targetWhatsApp = whatsappNumber || '967775000150';
      const itemsList = cart.map(i => `• ${i.product.nameAr} (${i.selectedWeight || 'العبوة'}) × ${i.quantity} = ${((i.unitPrice || i.product.price) * i.quantity).toLocaleString()} ريال`).join('\n');
      
      const message = `*طلب شراء جديد ومؤكد - فحم الذهب الأسود* 👑
-------------------------------
📦 *رقم الطلب الرسمي:* #${verifiedOrder.orderNumber}
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
${discount > 0 ? `🏷️ *خصم الكوبون:* -${discount.toLocaleString()} ريال\n` : ''}⭐ *المبلغ الإجمالي:* ${totalAmount.toLocaleString()} ريال
-------------------------------
تم تسجيل وتأكيد الطلب في نظام المتجر بنجاح. يرجى البدء في التجهيز والشحن السريع.`;

      onOrderPlaced(verifiedOrder);
      setIsSubmitting(false);
      onClose();

      const cleanWhatsApp = targetWhatsApp.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(message)}`, '_blank');
    } catch (e: any) {
      setErrorMsg('تعذر الاتصال بالخادم لإنشاء الطلب. يرجى المحاولة مرة أخرى.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="checkout-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-5 sm:p-7 my-auto max-h-[92vh] overflow-y-auto text-right animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar with Prominent Close / Back Button */}
        <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">إتمام طلب وتوصيل فحم الذهب الأسود</h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">تأكيد فوري وتوجيه مباشر لمندوب التوصيل في منطقتك بصنعاء</p>
            </div>
          </div>

          {/* Close & Return Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer shrink-0"
            title="إغلاق والرجوع للشاشة السابقة"
            aria-label="إغلاق الشاشة والرجوع"
          >
            <span className="text-xs font-bold hidden sm:inline">رجوع</span>
            <X className="w-5 h-5" />
          </button>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-zinc-300 font-bold">رقم الهاتف (واتساب) *</label>
                {carrier && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${carrier.color}`}>
                    {carrier.name}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="77XXXXXXXX"
                  className={`w-full bg-zinc-950 border rounded-xl px-3 py-2.5 text-white pr-9 font-mono transition-colors ${
                    customerPhone.length > 0 && !isPhoneValid
                      ? 'border-amber-500/80 focus:border-amber-400'
                      : customerPhone.length > 0 && isPhoneValid
                      ? 'border-emerald-500/80 focus:border-emerald-400'
                      : 'border-zinc-700 focus:border-amber-500'
                  }`}
                />
                <Phone className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
              </div>
              {customerPhone.length > 0 && !isPhoneValid && (
                <p className="text-[10px] text-amber-400 mt-1">
                  * يرجى إدخال 9 أرقام تبدأ بـ 77 أو 78 أو 73 أو 71 أو 70
                </p>
              )}
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

          {/* Cart Items Preview */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 pb-1.5 border-b border-zinc-800">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                <span>محتويات طلبك ({cart.reduce((s, i) => s + i.quantity, 0)} عبوة):</span>
              </span>
              <span className="text-[11px] text-amber-400 font-mono font-bold">{subtotal.toLocaleString()} ر.ي</span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-zinc-900">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs pt-1.5 first:pt-0 text-zinc-300">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-amber-400 font-mono">
                      {item.quantity}×
                    </span>
                    <span className="font-bold text-white line-clamp-1">{item.product.nameAr}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">({item.selectedWeight || '1kg'})</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-300 text-[11px]">
                    {(((item.unitPrice || item.product.price) * item.quantity)).toLocaleString()} ر.ي
                  </span>
                </div>
              ))}
            </div>
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
              id="checkout-submit-btn"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري تسجيل وتأكيد طلبك...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>تأكيد وإرسال الطلب الآن ⚡</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="checkout-whatsapp-btn"
              onClick={handleSendWhatsAppOrder}
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all border border-emerald-400/30 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <MessageSquare className="w-4 h-4 text-white fill-white" />
              <span>أو إرسال الطلب عبر الواتساب مباشرة (WhatsApp) 💬</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-zinc-700/60 cursor-pointer active:scale-[0.99]"
            >
              <ArrowRight className="w-4 h-4 text-zinc-400" />
              <span>إلغاء والرجوع للشاشة السابقة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

