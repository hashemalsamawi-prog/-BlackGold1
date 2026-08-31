import React, { useState } from 'react';
import { Order, Language, DeliveryAgent } from '../types';
import { 
  X, Truck, CheckCircle2, Phone, MapPin, Navigation, 
  Clock, AlertTriangle, ShieldCheck, ArrowRight, UserCheck
} from 'lucide-react';

interface MandoubPortalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status'], driverNotes?: string) => void;
  lang: Language;
  driverName: string;
  availableDrivers: DeliveryAgent[];
  onSelectDriver: (name: string) => void;
  isOwnerPreview?: boolean;
  onBackToAdmin?: () => void;
}

export const MandoubPortal: React.FC<MandoubPortalProps> = ({
  isOpen,
  onClose,
  orders,
  onUpdateOrderStatus,
  lang,
  driverName,
  availableDrivers,
  onSelectDriver,
  isOwnerPreview,
  onBackToAdmin,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('active');
  const [driverNoteInput, setDriverNoteInput] = useState<Record<string, string>>({});

  const activeOrders = orders.filter((o) => o.status === 'preparing' || o.status === 'on_way');
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const completedOrders = orders.filter((o) => o.status === 'delivered');

  const displayedOrders = activeTab === 'active' ? activeOrders : activeTab === 'pending' ? pendingOrders : completedOrders;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-6 my-8 max-h-[92vh] overflow-y-auto text-right">
        {/* Header / Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">بوابة مندوب التوصيل الميداني</h2>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>الكابتن:</span>
                <select
                  value={driverName}
                  onChange={(e) => onSelectDriver(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-amber-400 font-bold"
                >
                  {availableDrivers.map((d) => (
                    <option key={d.id} value={d.name}>{d.name} ({d.vehicleType === 'motorcycle' ? 'دراجة' : 'فان'})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwnerPreview && onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300"
              >
                العودة للوحة الإدارة
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-zinc-950 border border-zinc-800 mb-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'active'
                ? 'bg-amber-500 text-black font-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            طلبات قيد التوصيل ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-black font-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            طلبات جديدة للقبول ({pendingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'completed'
                ? 'bg-amber-500 text-black font-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            مسلّمة اليوم ({completedOrders.length})
          </button>
        </div>

        {/* Orders List */}
        {displayedOrders.length === 0 ? (
          <div className="text-center py-12 bg-zinc-950/60 rounded-2xl border border-zinc-800 text-zinc-400 text-xs font-semibold">
            لا توجد شحنات في هذا القسم حالياً.
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-400 text-sm">طلب #{order.orderNumber || order.id.slice(-6)}</span>
                  <span className="text-xs text-zinc-400 font-bold">{order.totalAmount?.toLocaleString()} ريال</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{order.district} - {order.addressDetails}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <a href={`tel:${order.customerPhone}`} className="text-emerald-400 font-bold hover:underline">
                      {order.customerPhone} ({order.customerName})
                    </a>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900 text-xs text-zinc-300">
                  <span className="text-zinc-500 block text-[10px]">الأصناف:</span>
                  {order.itemsSummary || 'فحم الذهب الأسود الملكي'}
                </div>

                {/* Status Action Buttons */}
                <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => onUpdateOrderStatus(order.id, 'preparing', 'تم استلام وتجهيز الطلب من المستودع')}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs"
                      >
                        قبول وتجهيز الشحنة
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => onUpdateOrderStatus(order.id, 'on_way', 'المندوب انطلق متجهاً لموقع العميل')}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>الانطلاق نحو العميل (في الطريق)</span>
                      </button>
                    )}

                    {order.status === 'on_way' && (
                      <button
                        onClick={() => onUpdateOrderStatus(order.id, 'delivered', 'تم تسليم الفحم واستلام المبلغ')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تم تسليم الطلب واستلام المبلغ ✅</span>
                      </button>
                    )}
                  </div>

                  <a
                    href={`https://wa.me/967${order.customerPhone.replace(/\D/g, '')}?text=مرحباً%20${order.customerName}،%20معك%20مندوب%20توصيل%20فحم%20الذهب%20الأسود%20بخصوص%20طلبك`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20"
                  >
                    مراسلة واتساب
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
