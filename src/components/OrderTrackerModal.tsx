import React, { useState, useMemo } from 'react';
import { Order, Language } from '../types';
import { 
  X, Package, Truck, CheckCircle2, Clock, MapPin, 
  Phone, AlertCircle, ShoppingBag, ArrowLeft, RefreshCw,
  Search, Filter, Trash2, ExternalLink
} from 'lucide-react';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  lang: Language;
  userName?: string;
  customerPhone?: string;
  focusOrderId?: string | null;
  onShopNow: () => void;
  onCleanOldOrders?: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orders = [],
  lang,
  userName,
  customerPhone,
  focusOrderId,
  onShopNow,
  onCleanOldOrders,
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');

  const statusLabels: Record<string, { text: string; color: string; bg: string }> = {
    pending: { text: 'قيد المراجعة والتجهيز', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
    received: { text: 'تم استلام وتأكيد الطلب', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    preparing: { text: 'جاري تغليف الفحم الملكي', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
    on_way: { text: 'المندوب في الطريق إليك 🛵', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
    delivered: { text: 'تم التسليم بنجاح ✅', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    cancelled: { text: 'تم الإلغاء', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  };

  // Safe date formatter (never displays "Invalid Date")
  const formatOrderDate = (order: Order) => {
    const raw = order.createdAt || order.date;
    if (!raw) return 'اليوم';
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('ar-YE');
    }
    return String(raw);
  };

  // Safe total getter (never displays empty "ريال")
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
      // Search matching
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
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">تتبع الشحنات والطلبات</h2>
            <p className="text-xs text-zinc-400">متابعة حالة شحنات الفحم الملكي ومسار المندوب في صنعاء لحظة بلحظة</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        {orders.length > 1 && (
          <div className="flex items-center gap-2 mb-4 bg-zinc-900/90 p-2 rounded-xl border border-zinc-800">
            <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-1" />
            <input
              type="text"
              placeholder="بحث برقم الطلب (مثال: BG-1407)..."
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
          <div className="text-center py-10 space-y-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto" />
            <p className="text-sm font-bold text-zinc-300">
              {searchQuery ? 'لم يتم العثور على طلب مطابق لبحثك.' : 'لا توجد طلبات مسجلة في هذا الجهاز بعد.'}
            </p>
            <p className="text-xs text-zinc-500">اختر من منتجات فحم الذهب الأسود وتمتع بتوصيل سريع في صنعاء.</p>
            <button
              onClick={onShopNow}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer"
            >
              تسوق الآن
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredOrders.map((order) => {
              const st = statusLabels[order.status] || statusLabels.pending;
              const isFocused = focusOrderId && (order.id === focusOrderId || order.orderNumber === focusOrderId);
              const districtName = order.district || order.address?.district || 'صنعاء';

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
                      {formatOrderDate(order)}
                    </span>
                  </div>

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

                  {/* Delivery Note if available */}
                  {order.driverNotes && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                      <Truck className="w-4 h-4 shrink-0" />
                      <span>ملاحظة المندوب: {order.driverNotes}</span>
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
    </div>
  );
};
