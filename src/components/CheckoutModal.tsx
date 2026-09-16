import React, { useState, useEffect, useRef } from 'react';
import { CartItem, Language, DeliveryAddress, Order } from '../types';
import { SANAA_DISTRICTS } from '../data/mockData';
import { 
  X, Check, ShieldCheck, MapPin, Truck, Phone, User, 
  CreditCard, Banknote, Clock, AlertCircle, ArrowLeft, Loader2,
  Package, ChevronRight, CheckCircle2
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
  onSaveAddress,
  onOrderPlaced,
  whatsappNumber = '967775000150',
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
  const checkoutModalRef = useRef<HTMLDivElement>(null);

  // Synchronize state when opened & auto-scroll to top
  useEffect(() => {
    if (isOpen) {
      if (checkoutModalRef.current) {
        checkoutModalRef.current.scrollTop = 0;
      }
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

  if (!isOpen) return null;

  // Dynamic shipping fee based on selected district
  const selectedDistrictObj = SANAA_DISTRICTS.find((d) => d.nameAr === district);
  const currentShippingFee = selectedDistrictObj ? selectedDistrictObj.fee : (shippingFee || 1000);
  const subtotal = cart.reduce((sum, it) => sum + ((it.unitPrice || it.product.price) * it.quantity), 0);
  const totalAmount = Math.max(0, subtotal + currentShippingFee - discount);

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

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!customerName.trim()) {
      setErrorMsg('يرجى كتابة اسم المستلم');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 6) {
      setErrorMsg('يرجى إدخال رقم هاتف يمني صحيح (مثال: 777123456)');
      return;
    }
    if (!addressDetails.trim()) {
      setErrorMsg('يرجى كتابة تفاصيل الشارع والحي أو أقرب معلم بدقة');
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
        weight: i.selectedWeight || i.product.weight || '250g'
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
        setErrorMsg(data.message || 'فشل إرسال الطلب، يرجى مراجعة البيانات والمحاولة مجدداً');
        setIsSubmitting(false);
        return;
      }
    } catch {
      setErrorMsg('تعذر الاتصال بالخادم، يرجى التأكد من اتصال الإنترنت وإعادة المحاولة');
      setIsSubmitting(false);
      return;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div 
        ref={checkoutModalRef}
        className="relative w-full max-w-2xl rounded-3xl bg-[#0F0F16] border border-[#222232] shadow-2xl p-5 sm:p-7 my-6 max-h-[92vh] overflow-y-auto text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E1E2C] gap-3">
          <div className="space-y-0.5">
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>إتمام طلب الشراء والتوصيل</span>
            </h2>
            <p className="text-xs text-slate-400">
              توصيل مباشر لباب منزلك أو مقهاك داخل أمانة العاصمة صنعاء
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl bg-[#161622] border border-[#242436] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="mt-5 space-y-6">
          
          {/* Step 1: Customer Contact Information */}
          <div className="p-4 rounded-2xl bg-[#14141E] border border-[#20202E] space-y-3.5">
            <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>1. بيانات المستلم للتواصل</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  الاسم الكامل <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: أحمد عبد الله"
                  className="w-full bg-[#181824] border border-[#28283C] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/25 transition-all duration-300"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 block">
                    رقم الهاتف اليمني <span className="text-amber-400">*</span>
                  </label>
                  {carrier && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${carrier.color}`}>
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
                    placeholder="77XXXXXXX أو 73XXXXXXX"
                    className="w-full bg-[#181824] border border-[#28283C] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/25 transition-all duration-300 font-mono"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
                {customerPhone && !isPhoneValid && (
                  <p className="text-[11px] text-rose-400 mt-1 animate-in fade-in slide-in-from-top-1 duration-200 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>يرجى إدخال 9 أرقام تبدأ بـ 77، 78، 73، 71 أو 70</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Sana'a Delivery Address */}
          <div className="p-4 rounded-2xl bg-[#14141E] border border-[#20202E] space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>2. عنوان التوصيل داخل صنعاء</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                تغطية شاملة لجميع الأحياء
              </span>
            </div>

            {/* Saved Addresses Quick Selection */}
            {addresses && addresses.length > 0 && (
              <div className="space-y-1.5 pb-1">
                <span className="text-[11px] text-slate-400 block">العناوين السابقة المسجلة:</span>
                <div className="flex flex-wrap gap-2">
                  {addresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        if (a.district) setDistrict(a.district);
                        if (a.street) setAddressDetails(a.street);
                        if (a.phone && !customerPhone) setCustomerPhone(a.phone);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#181824] border border-[#28283C] hover:border-amber-400/50 text-[11px] text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>{a.title || a.district}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  المديرية أو المنطقة <span className="text-amber-400">*</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-[#181824] border border-[#28283C] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/25 transition-all duration-300"
                >
                  {SANAA_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.nameAr}>
                      {d.nameAr} (توصيل: {d.fee.toLocaleString()} ر.ي - {d.timeEstimate || '45 دقيقة'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  تفاصيل الشارع والمعلم <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addressDetails}
                  onChange={(e) => setAddressDetails(e.target.value)}
                  placeholder="اسم الشارع، رقم المبنى، بجوار معلم معروف..."
                  className="w-full bg-[#181824] border border-[#28283C] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/25 transition-all duration-300"
                />
                {errorMsg && !addressDetails.trim() && (
                  <p className="text-[11px] text-rose-400 mt-1 animate-in fade-in slide-in-from-top-1 duration-200 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>يرجى كتابة الشارع وأقرب معلم لتسهيل التوصيل</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Local Payment Methods */}
          <div className="p-4 rounded-2xl bg-[#14141E] border border-[#20202E] space-y-3.5">
            <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>3. طريقة الدفع المفضلة</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'cash_on_delivery', title: 'الدفع عند الاستلام (كاش)', subtitle: 'تسليم المبلغ للمندوب يداً بيد' },
                { id: 'kuraimi', title: 'خدمة حاسب / بنك الكريمي', subtitle: 'تحويل مباشر لحساب المتجر' },
                { id: 'one_cash', title: 'محفظة ون كاش (OneCash)', subtitle: 'دفع عبر تطبيق ون كاش' },
                { id: 'floosak', title: 'محفظة فلوسك (Floosak)', subtitle: 'دفع عبر تطبيق فلوسك' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    paymentMethod === m.id
                      ? 'bg-amber-500/10 border-amber-400 text-white shadow-sm'
                      : 'bg-[#181824] border-[#242436] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{m.title}</span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentMethod === m.id ? 'border-amber-400 bg-amber-400 text-[#09090D]' : 'border-slate-600'
                    }`}>
                      {paymentMethod === m.id && <Check className="w-3 h-3" />}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">{m.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Order Financial Summary Box */}
          <div className="p-4 rounded-2xl bg-[#14141E] border border-[#20202E] space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>المجموع الفرعي ({cart.length} أصناف):</span>
              <span className="font-mono text-slate-200">{subtotal.toLocaleString()} ر.ي</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>رسوم التوصيل إلى ({district}):</span>
              <span className="font-mono text-slate-200">{currentShippingFee.toLocaleString()} ر.ي</span>
            </div>

            {discount > 0 && (
              <div className="flex items-center justify-between text-emerald-400 font-semibold">
                <span>الخصم المطبق:</span>
                <span className="font-mono">-{discount.toLocaleString()} ر.ي</span>
              </div>
            )}

            <div className="pt-2 border-t border-[#20202E] flex items-center justify-between text-base font-black text-white">
              <span>الإجمالي المطلوب سداده:</span>
              <span className="text-amber-400 font-mono text-lg">{totalAmount.toLocaleString()} ر.ي</span>
            </div>
          </div>

          {/* Submit Order Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl gold-gradient-bg text-[#09090D] font-black text-sm hover:brightness-110 active:scale-[0.99] shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري إرسال وتأكيد الطلب بأمان...</span>
              </>
            ) : (
              <>
                <span>تأكيد الطلب الآن ({totalAmount.toLocaleString()} ر.ي)</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Guarantee Footer */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>طلبك موثق ومضمون من شركة فحم الذهب الأسود بصنعاء</span>
          </div>

        </form>

      </div>
    </div>
  );
};
