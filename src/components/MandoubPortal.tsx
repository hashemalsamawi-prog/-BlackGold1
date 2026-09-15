import React, { useState } from 'react';
import { Order, Language, DeliveryAgent } from '../types';
import { 
  X, Truck, CheckCircle2, Phone, MapPin, Navigation, 
  Clock, AlertTriangle, ShieldCheck, ArrowRight, UserCheck,
  Banknote, MessageSquare, ExternalLink, RefreshCw, Sparkles
} from 'lucide-react';

interface MandoubPortalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateOrderStatus: (
    orderId: string, 
    status: Order['status'], 
    driverNotes?: string,
    driverInfo?: { driverId?: string; driverName?: string; driverPhone?: string }
  ) => void;
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

  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'completed'>('active');
  const [confirmedCashOrderId, setConfirmedCashOrderId] = useState<string | null>(null);

  const currentDriverObj = availableDrivers.find(d => d.name === driverName) || availableDrivers[0];
  const isAssignedToThisDriver = (o: Order) => {
    if (!driverName) return true;
    return o.driverName === driverName || 
           (currentDriverObj && o.driverId === currentDriverObj.id) || 
           (!o.driverName && ['received', 'confirmed', 'pending'].includes(o.status));
  };

  const activeOrders = orders.filter((o) => 
    ['assigned', 'preparing', 'shipped', 'on_way', 'delivering'].includes(o.status) &&
    (o.driverName === driverName || (currentDriverObj && o.driverId === currentDriverObj.id))
  );

  const pendingOrders = orders.filter((o) => 
    ['pending', 'received', 'confirmed'].includes(o.status) &&
    isAssignedToThisDriver(o)
  );

  const completedOrders = orders.filter((o) => 
    o.status === 'delivered' && 
    (o.driverName === driverName || (currentDriverObj && o.driverId === currentDriverObj.id))
  );

  // Financial summary for this driver
  const totalCashCollectedToday = completedOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
  const pendingCashToCollect = activeOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);

  const displayedOrders = activeTab === 'active' ? activeOrders : activeTab === 'pending' ? pendingOrders : completedOrders;

  const getDriverInfoPayload = () => {
    if (!currentDriverObj) return undefined;
    return {
      driverId: currentDriverObj.id,
      driverName: currentDriverObj.name,
      driverPhone: currentDriverObj.phone
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-zinc-900 border border-amber-500/30 shadow-2xl p-4 sm:p-6 my-6 max-h-[92vh] overflow-y-auto text-right">
        {/* Header / Actions */}
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-4 mb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">بوابة كابتن التوصيل الميداني</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  متصل ومتاح 🟢
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                <span>الكابتن المعتمد:</span>
                <select
                  value={driverName}
                  onChange={(e) => onSelectDriver(e.target.value)}
                  className="bg-zinc-950 border border-amber-500/40 rounded-xl px-3 py-1 text-amber-300 font-bold text-xs outline-none cursor-pointer"
                >
                  {availableDrivers.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.phone} • {d.vehicleType === 'motorcycle' ? 'دراجة' : 'سيارة'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwnerPreview && onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-amber-300 border border-zinc-700 cursor-pointer"
              >
                العودة للوحة الإدارة 👑
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Daily Metrics for Captain */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4 text-xs">
          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-zinc-400 text-[11px] block">طلبات قيد التوصيل الآن</span>
              <span className="text-lg font-black text-amber-400">{activeOrders.length} طلبات</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-zinc-400 text-[11px] block">مبالغ قيد التحصيل (COD)</span>
              <span className="text-lg font-black text-white font-mono">{pendingCashToCollect.toLocaleString()} YER</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Banknote className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-emerald-400 text-[11px] block">تم تسليمها وتحصيلها اليوم</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{totalCashCollectedToday.toLocaleString()} YER</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-zinc-950 border border-zinc-800 mb-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>قيد التوصيل ({activeOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>شحنات جديدة للقبول ({pendingOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>المسلّمة اليوم ({completedOrders.length})</span>
          </button>
        </div>

        {/* Orders List */}
        {displayedOrders.length === 0 ? (
          <div className="text-center py-12 bg-zinc-950/60 rounded-2xl border border-zinc-800 text-zinc-400 text-xs font-semibold">
            {activeTab === 'active' && 'لا توجد شحنات جارية معك حالياً. اختر "شحنات جديدة للقبول" لاستلام طلب جديد!'}
            {activeTab === 'pending' && 'لا توجد طلبات جديدة معلقة حالياً في صنعاء.'}
            {activeTab === 'completed' && 'لم يتم تسليم شحنات بعد اليوم.'}
          </div>
        ) : (
          <div className="space-y-3.5">
            {displayedOrders.map((order) => {
              const safeTotal = order.totalAmount ?? order.total ?? 0;
              const customerPhoneClean = (order.customerPhone || '').replace(/\D/g, '');
              const destinationQuery = `صنعاء ${order.district || ''} ${order.addressDetails || order.address?.street || ''}`.trim();
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationQuery)}`;
              const whatsappMsg = `مرحباً يا ${order.customerName}، معك كابتن التوصيل (${driverName}) من فحم الذهب الأسود 🌟\nبخصوص طلبك رقم (${order.orderNumber || order.id}).\nالمبلغ المطلوب نقداً: ${safeTotal.toLocaleString()} ريال يمني.\nأنا في طريقي إليك إلى (${order.district || 'صنعاء'}).`;

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-lg"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-amber-400 text-sm">
                        {order.orderNumber || order.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        order.status === 'on_way' || order.status === 'delivering' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        order.status === 'shipped' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        order.status === 'assigned' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-zinc-800 text-zinc-300'
                      }`}>
                        {order.status === 'delivered' ? 'تم التسليم بنجاح ✅' :
                         order.status === 'on_way' || order.status === 'delivering' ? 'في الطريق للعميل 🛵' :
                         order.status === 'shipped' ? 'تم استلام الشحنة 📦' :
                         order.status === 'assigned' ? 'تم قبول التكليف 🤝' : 'بانتظار القبول'}
                      </span>
                    </div>

                    {/* Cash Collection Highlight */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">المبلغ نقداً:</span>
                      <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-black text-xs">
                        {safeTotal.toLocaleString()} ريال يمني
                      </span>
                    </div>
                  </div>

                  {/* Customer and Location Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-300">
                    <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                      <div className="text-[10px] text-zinc-500 font-bold">📍 عنوان التوصيل في صنعاء:</div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>حي {order.district || 'صنعاء'} - {order.addressDetails || order.address?.street || 'أمانة العاصمة'}</span>
                      </div>
                      {order.notes && (
                        <div className="text-[11px] text-amber-300/90 mt-1">
                          ملاحظة العميل: {order.notes}
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                      <div className="text-[10px] text-zinc-500 font-bold">👤 بيانات العميل:</div>
                      <div className="font-bold text-white">{order.customerName}</div>
                      <div className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{order.customerPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="p-2.5 rounded-xl bg-zinc-900/60 text-xs text-zinc-300 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">محتويات الشحنة:</span>
                      <span className="font-semibold text-slate-200">{order.itemsSummary || 'فحم الذهب الأسود الملكي الفاخر'}</span>
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      التوصيل: {(order.shippingFee || 0).toLocaleString()} ريال
                    </span>
                  </div>

                  {/* Navigation & Communication Quick Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Google Maps Button */}
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-400" />
                      <span>ملاحة خرائط Google 🗺️</span>
                    </a>

                    {/* Direct Call Button */}
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>اتصال فوري 📞</span>
                    </a>

                    {/* WhatsApp Button */}
                    <a
                      href={`https://wa.me/967${customerPhoneClean}?text=${encodeURIComponent(whatsappMsg)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>رسالة واتساب 💬</span>
                    </a>
                  </div>

                  {/* Lifecycle Action Buttons */}
                  <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Step 1: Accept / Claim Order */}
                      {['pending', 'received', 'confirmed'].includes(order.status) && (
                        <button
                          onClick={() => onUpdateOrderStatus(
                            order.id, 
                            'assigned', 
                            `قبل الكابتن (${driverName}) الشحنة`,
                            getDriverInfoPayload()
                          )}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>قبول واستلام الشحنة 🤝</span>
                        </button>
                      )}

                      {/* Step 2: Picked up package from warehouse */}
                      {['assigned', 'preparing'].includes(order.status) && (
                        <button
                          onClick={() => onUpdateOrderStatus(
                            order.id, 
                            'shipped', 
                            `استلم الكابتن (${driverName}) العبوات وبدأ التحرك`,
                            getDriverInfoPayload()
                          )}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
                        >
                          <Truck className="w-4 h-4" />
                          <span>استلام العبوات وبدء مسار التوصيل 📦</span>
                        </button>
                      )}

                      {/* Step 3: Heading directly to customer */}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => onUpdateOrderStatus(
                            order.id, 
                            'on_way', 
                            `الكابتن (${driverName}) في الطريق إلى موقع العميل`,
                            getDriverInfoPayload()
                          )}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer active:scale-95"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>الانطلاق نحو العميل (في الطريق) 🛵</span>
                        </button>
                      )}

                      {/* Step 4: Final Handover & Cash Collection */}
                      {['on_way', 'delivering'].includes(order.status) && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateOrderStatus(
                              order.id, 
                              'delivered', 
                              `تم تسليم الفحم واستلام مبلغ ${safeTotal} ريال نقداً بنجاح`,
                              getDriverInfoPayload()
                            )}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>تأكيد التسليم واستلام {safeTotal.toLocaleString()} ريال نقداً ✅</span>
                          </button>
                        </div>
                      )}

                      {order.status === 'delivered' && (
                        <span className="text-emerald-400 text-xs font-black flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>تم تسليم هذا الطلب وتحصيل مبلغه كاملاً</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

