import React, { useState, useMemo } from 'react';
import { Order, Language } from '../types';
import { 
  X, Package, Truck, CheckCircle2, Clock, MapPin, 
  Phone, AlertCircle, ShoppingBag, ArrowLeft, RefreshCw,
  Search, Filter, Trash2, ExternalLink, Check, Navigation, Printer
} from 'lucide-react';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  lang: Language;
  userName?: string;
  customerPhone?: string;
  isOwner?: boolean;
  focusOrderId?: string | null;
  onShopNow: () => void;
  onCleanOldOrders?: () => void;
  onOpenInvoice?: (order: Order) => void;
}

interface PublicTrackResult {
  orderNumber: string;
  status: string;
  date: string;
  itemsSummary: string;
  district: string;
  driverName: string | null;
  timeline: Array<{
    status: string;
    time?: string;
    titleAr?: string;
    titleEn?: string;
  }>;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orders = [],
  lang,
  userName,
  customerPhone,
  isOwner,
  focusOrderId,
  onShopNow,
  onCleanOldOrders,
  onOpenInvoice,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'my-orders' | 'live-search'>(
    orders.length > 0 ? 'my-orders' : 'live-search'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [liveQuery, setLiveQuery] = useState('');
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [liveResult, setLiveResult] = useState<PublicTrackResult | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  const statusLabels: Record<string, { text: string; color: string; bg: string; step: number }> = {
    pending: { text: 'قيد المراجعة والتأكيد', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', step: 1 },
    received: { text: 'تم استلام وتأكيد الطلب', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', step: 1 },
    preparing: { text: 'جاري تجهيز وتغليف الفحم', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', step: 2 },
    assigned: { text: 'تم تكليف مندوب التوصيل', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30', step: 2 },
    on_way: { text: 'المندوب في الطريق إليك 🛵', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', step: 3 },
    delivering: { text: 'المندوب في الطريق إليك 🛵', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', step: 3 },
    shipped: { text: 'خرج للتوصيل 🛵', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', step: 3 },
    delivered: { text: 'تم التسليم بنجاح ✅', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', step: 4 },
    cancelled: { text: 'تم الإلغاء', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', step: 0 },
  };

  const steps = [
    { num: 1, label: 'تأكيد الطلب' },
    { num: 2, label: 'التجهيز والتغليف' },
    { num: 3, label: 'في الطريق' },
    { num: 4, label: 'تم التسليم' }
  ];

  const handleLookupLive = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQ = liveQuery.trim();
    if (!cleanQ) return;

    setIsSearchingLive(true);
    setLiveError(null);
    setLiveResult(null);

    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(cleanQ)}`);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setLiveResult(data.data);
      } else {
        setLiveError(data.message || 'لم يتم العثور على طلب بهذا الرقم. تأكد من إدخال رقم الطلب بشكل صحيح (مثال: BG-2026-1407).');
      }
    } catch {
      setLiveError('تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSearchingLive(false);
    }
  };

  // Safe date formatter (never displays "Invalid Date")
  const formatOrderDate = (raw?: string) => {
    if (!raw) return 'اليوم';
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('ar-YE');
    }
    return String(raw);
  };

  // Safe total getter
  const getOrderTotal = (order: Order) => {
    const val = order.totalAmount ?? order.total ?? 0;
    if (typeof val === 'number' && val > 0) {
      return `${val.toLocaleString()} ريال`;
    }
    return 'محدد في الفاتورة';
  };

  // Filter valid orders and apply search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const num = (order.orderNumber || order.id || '').toLowerCase();
        const phone = (order.customerPhone || '').toLowerCase();
        const name = (order.customerName || '').toLowerCase();
        return num.includes(q) || phone.includes(q) || name.includes(q);
      }
      return true;
    });
  }, [orders, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 sm:p-6 my-6 max-h-[90vh] overflow-y-auto text-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">تتبع الطلبات والشحنات</h2>
            <p className="text-xs text-zinc-400">متابعة مسار شحنات فحم الذهب الأسود في صنعاء مباشرة من الخادم</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('my-orders')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'my-orders'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
            }`}
          >
            سجل طلباتي ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('live-search')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'live-search'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>استعلام مباشر برقم الفاتورة</span>
          </button>
        </div>

        {/* TAB 1: LIVE SEARCH DIRECT LOOKUP */}
        {activeTab === 'live-search' && (
          <div className="space-y-4">
            <form onSubmit={handleLookupLive} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="أدخل رقم الطلب (مثال: BG-2026-1407 أو 1407)..."
                  value={liveQuery}
                  onChange={(e) => setLiveQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingLive || !liveQuery.trim()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                {isSearchingLive ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري البحث...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>تتبع الآن</span>
                  </>
                )}
              </button>
            </form>

            {liveError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{liveError}</span>
              </div>
            )}

            {!liveResult && !liveError && (
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-sm">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-white">تتبع أي طلب صادر من فحم الذهب الأسود</h4>
                  <p className="text-[11px] text-zinc-400 max-w-md mx-auto leading-relaxed">
                    أدخل رقم الفاتورة أو الطلب (مثال: <span className="text-amber-400 font-mono font-bold">BG-2026-1407</span> أو <span className="text-amber-400 font-mono font-bold">1407</span>) لمشاهدة مرحلة التجهيز وموقع مندوب التوصيل المكلف في صنعاء فورياً.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap justify-center gap-2 text-[10px] text-zinc-400">
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800">✓ استعلام لحظي مباشر</span>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800">✓ اسم وهاتف المندوب</span>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800">✓ خط زمني كامل للطلب</span>
                </div>
              </div>
            )}

            {liveResult && (
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/40 shadow-lg shadow-amber-500/5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-[11px] text-zinc-500 block">رقم الشحنة المؤكد</span>
                    <span className="font-mono font-black text-amber-400 text-sm">#{liveResult.orderNumber}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] text-zinc-500 block">منطقة التوصيل</span>
                    <span className="font-bold text-white text-xs">{liveResult.district}</span>
                  </div>
                </div>

                {/* Stepper */}
                {(() => {
                  const currentStep = statusLabels[liveResult.status]?.step || 1;
                  const isCancelled = liveResult.status === 'cancelled';

                  if (isCancelled) {
                    return (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 text-center font-bold">
                        تم إلغاء هذا الطلب وإرجاع المخزون للمتجر.
                      </div>
                    );
                  }

                  return (
                    <div className="py-2">
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {steps.map((s) => {
                          const isDone = currentStep >= s.num;
                          const isCurrent = currentStep === s.num;
                          return (
                            <div key={s.num} className="flex flex-col items-center gap-1.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                  isDone
                                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                    : 'bg-zinc-800 text-zinc-500'
                                } ${isCurrent ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-900' : ''}`}
                              >
                                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                              </div>
                              <span className={`text-[10px] font-bold leading-tight ${isDone ? 'text-amber-400' : 'text-zinc-500'}`}>
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Items & Driver info */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-500 text-[11px] block">الأصناف:</span>
                    <p className="text-zinc-200">{liveResult.itemsSummary || 'فحم الذهب الأسود'}</p>
                  </div>
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-400">حالة المندوب:</span>
                    <span className="font-bold text-amber-300">
                      {liveResult.driverName ? `المندوب المكلف: ${liveResult.driverName}` : 'جاري تعيين مندوب التوصيل في منطقتك بصنعاء'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY ORDERS LIST */}
        {activeTab === 'my-orders' && (
          <div className="space-y-4">
            {/* Owner mode notice if active */}
            {isOwner && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <span>👑 وضع إدارة المتجر</span>
                  <span className="text-zinc-400">|</span>
                  <span className="text-zinc-300">عرض جميع طلبات النظام ({orders.length} طلب)</span>
                </span>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-md">حساب المدير</span>
              </div>
            )}

            {/* Search within my orders */}
            {orders.length > 1 && (
              <div className="flex items-center gap-2 bg-zinc-900/90 p-2 rounded-xl border border-zinc-800">
                <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-1" />
                <input
                  type="text"
                  placeholder="بحث في طلباتي برقم الطلب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder:text-zinc-500 outline-none flex-1 py-1"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-zinc-500 hover:text-white text-xs px-2"
                  >
                    مسح
                  </button>
                )}
              </div>
            )}

            {/* Empty State */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 px-5 space-y-4 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/5">
                  <Package className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <p className="text-sm font-black text-white">
                    {searchQuery ? 'لم يتم العثور على طلب مطابق لبحثك.' : 'لا توجد طلبات مسجلة في جلستك الحالية بعد.'}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {searchQuery 
                      ? 'يرجى التأكد من كتابة رقم الطلب بشكل صحيح، أو استخدم تبويب "استعلام مباشر" بالأعلى.'
                      : 'عند إتمام أي طلب في المتجر، ستتمكن من تتبعه هنا فورياً مع مسار مندوب التوصيل في صنعاء.'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={onShopNow}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer active:scale-95"
                  >
                    تسوق منتجات الفحم الآن 🔥
                  </button>
                  <button
                    onClick={() => setActiveTab('live-search')}
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-amber-300 font-bold text-xs hover:bg-zinc-800 transition-all cursor-pointer"
                  >
                    استعلام مباشر برقم الفاتورة
                  </button>
                </div>

                {/* Delivery Guarantee Info Bar inside Empty Tracker */}
                <div className="pt-4 mt-2 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-zinc-400">
                  <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-400" />
                    <span>توصيل سريع لكافة مديريات صنعاء</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>تتبع فوري لمراحل الطلب</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>فحم أصلي بضمان الاسترجاع</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredOrders.map((order) => {
                  const st = statusLabels[order.status] || statusLabels.pending;
                  const isFocused = focusOrderId && (order.id === focusOrderId || order.orderNumber === focusOrderId);
                  const districtName = order.district || order.address?.district || 'صنعاء';
                  const currentStep = st.step || 1;

                  return (
                    <div
                      key={order.id}
                      className={`p-4 rounded-2xl bg-zinc-900/90 border transition-all ${
                        isFocused 
                          ? 'border-amber-500/70 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40' 
                          : 'border-zinc-800 hover:border-zinc-700'
                      } space-y-3`}
                    >
                      {/* Order Top Bar */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm">
                            طلب #{order.orderNumber || order.id?.slice(-6)}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${st.bg} ${st.color}`}>
                            {st.text}
                          </span>
                          {isFocused && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                              طلبك الأخير
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {formatOrderDate(order.createdAt || order.date)}
                        </span>
                      </div>

                      {/* Visual Stepper */}
                      {order.status !== 'cancelled' && (
                        <div className="py-1 px-1 bg-zinc-950/40 rounded-xl border border-zinc-800/40">
                          <div className="grid grid-cols-4 gap-1 text-center">
                            {steps.map((s) => {
                              const isDone = currentStep >= s.num;
                              const isCurrent = currentStep === s.num;
                              return (
                                <div key={s.num} className="flex flex-col items-center gap-1">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                      isDone
                                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                                        : 'bg-zinc-800 text-zinc-500'
                                    } ${isCurrent ? 'ring-2 ring-amber-400' : ''}`}
                                  >
                                    {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                                  </div>
                                  <span className={`text-[9px] font-bold leading-tight ${isDone ? 'text-amber-400' : 'text-zinc-500'}`}>
                                    {s.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Summary of Items */}
                      <div className="text-xs text-zinc-300 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
                        <p className="font-semibold text-amber-400 mb-1">المنتجات المطلوبة:</p>
                        <p className="text-zinc-200 leading-relaxed text-xs">
                          {order.itemsSummary || (Array.isArray(order.items) 
                            ? order.items.map((i: any) => `${i.product?.nameAr || i.productNameAr || 'فحم الذهب الأسود'} × ${i.quantity}`).join('، ') 
                            : 'منتجات فحم الذهب الأسود الفاخر')}
                        </p>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                          <span className="text-zinc-500 text-[10px] block">منطقة التوصيل</span>
                          <span className="font-bold text-zinc-200">{districtName}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                          <span className="text-zinc-500 text-[10px] block">طريقة الدفع</span>
                          <span className="font-bold text-zinc-200">
                            {order.paymentMethod === 'cash_on_delivery' ? 'عند الاستلام (كاش)' : 'تحويل بنكي / إلكتروني'}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 col-span-2 sm:col-span-1">
                          <span className="text-zinc-500 text-[10px] block">المبلغ الإجمالي</span>
                          <span className="font-black text-amber-400">{getOrderTotal(order)}</span>
                        </div>
                      </div>

                      {/* Driver Status Note */}
                      <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-xs flex items-center justify-between text-zinc-300">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                          <Truck className="w-3.5 h-3.5 text-amber-400" />
                          <span>مندوب التوصيل:</span>
                        </div>
                        <span className="font-bold text-amber-300 text-xs">
                          {order.driverName ? order.driverName : 'جاري تعيين مندوب التوصيل في منطقتك'}
                        </span>
                      </div>

                      {/* Print Invoice / Receipt Button */}
                      {onOpenInvoice && (
                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => onOpenInvoice(order)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                            <span>عرض وطباعة الفاتورة 🖨️</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Clean old legacy test orders button if provided */}
            {onCleanOldOrders && orders.length > 0 && (
              <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                <span>هل تظهر طلبات تجريبية قديمة؟</span>
                <button
                  type="button"
                  onClick={onCleanOldOrders}
                  className="text-zinc-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تنظيف السجل التجريبي القديم</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
