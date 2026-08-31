import React from 'react';
import { Order, Language } from '../types';
import { 
  X, Package, Truck, CheckCircle2, Clock, MapPin, 
  Phone, AlertCircle, ShoppingBag, ArrowLeft, RefreshCw
} from 'lucide-react';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  lang: Language;
  userName?: string;
  onShopNow: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orders,
  lang,
  userName,
  onShopNow,
}) => {
  if (!isOpen) return null;

  const statusLabels: Record<Order['status'], { text: string; color: string; bg: string }> = {
    pending: { text: 'قيد المراجعة والتجهيز', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
    preparing: { text: 'جاري تغليف الفحم الملكي', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
    on_way: { text: 'المندوب في الطريق إليك 🛵', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
    delivered: { text: 'تم التسليم بنجاح ✅', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    cancelled: { text: 'تم الإلغاء', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto text-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">تتبع طلبات الفحم الحالية</h2>
            <p className="text-xs text-zinc-400">متابعة مسار المندوب وحالة الشحنات في صنعاء لحظة بلحظة</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 space-y-4 bg-zinc-950/60 rounded-2xl border border-zinc-800 p-6">
            <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto" />
            <p className="text-sm font-bold text-zinc-300">لا توجد طلبات سابقة مسجلة في هذا الجهاز بعد.</p>
            <p className="text-xs text-zinc-500">اختر من منتجات الفحم الملكي وتمتع بتوصيل فوري خلال نصف ساعة.</p>
            <button
              onClick={onShopNow}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all shadow-md"
            >
              تسوق الآن
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const st = statusLabels[order.status] || statusLabels.pending;
              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-sm">طلب #{order.orderNumber || order.id.slice(-6)}</span>
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${st.bg} ${st.color}`}>
                        {st.text}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500">{new Date(order.createdAt).toLocaleString('ar-YE')}</span>
                  </div>

                  {/* Summary of Items */}
                  <div className="text-xs text-zinc-300 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                    <p className="font-semibold text-amber-400 mb-1">المنتجات:</p>
                    <p className="text-zinc-300 leading-relaxed">
                      {order.itemsSummary || (Array.isArray(order.items) ? order.items.map((i: any) => `${i.product?.nameAr || i.productNameAr} × ${i.quantity}`).join('، ') : 'منتجات فحم الذهب الأسود')}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-zinc-900/40">
                      <span className="text-zinc-500 text-[10px] block">منطقة التوصيل</span>
                      <span className="font-bold text-zinc-200">{order.district}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900/40">
                      <span className="text-zinc-500 text-[10px] block">طريقة الدفع</span>
                      <span className="font-bold text-zinc-200">
                        {order.paymentMethod === 'cash_on_delivery' ? 'عند الاستلام (كاش)' : 'تحويل بنكي / إلكتروني'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900/40 col-span-2 sm:col-span-1">
                      <span className="text-zinc-500 text-[10px] block">الإجمالي</span>
                      <span className="font-black text-amber-400">{order.totalAmount?.toLocaleString()} ريال</span>
                    </div>
                  </div>

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
      </div>
    </div>
  );
};
