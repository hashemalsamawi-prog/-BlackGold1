import React from 'react';
import { Order, Language } from '../types';
import { 
  CheckCircle2, Package, MapPin, Phone, MessageSquare, 
  ArrowRight, ArrowLeft, Clock, ShieldCheck, X, Truck, ExternalLink
} from 'lucide-react';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  lang: Language;
  onTrackOrder: (order: Order) => void;
  whatsappNumber?: string;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  onClose,
  order,
  lang,
  onTrackOrder,
  whatsappNumber = '967775000150',
}) => {
  if (!isOpen || !order) return null;

  const orderNum = order.orderNumber || order.id?.slice(-6) || 'BG-NEW';
  const totalVal = order.totalAmount ?? order.total ?? 0;
  const shippingVal = order.shippingFee ?? 0;
  const subtotalVal = order.subtotal ?? (totalVal - shippingVal);
  const districtName = order.district || order.address?.district || 'صنعاء';
  const customerName = order.customerName || 'عميل فحم الذهب الأسود';
  const customerPhone = order.customerPhone || '';
  const isAr = lang === 'ar';

  const handleWhatsAppSend = () => {
    const rawItems = Array.isArray(order.items)
      ? order.items.map((i: any) => {
          const name = i.product?.nameAr || i.productNameAr || 'فحم الذهب الأسود الفاخر';
          const weight = i.selectedWeight || i.weightOption || i.weight || 'العبوة';
          const qty = i.quantity || 1;
          const price = i.unitPrice || i.product?.price || 0;
          return `• ${name} (${weight}) × ${qty} = ${(price * qty).toLocaleString()} ريال`;
        }).join('\n')
      : (order.itemsSummary || 'منتجات فحم الذهب الأسود');

    const msg = `*طلب شراء جديد ومؤكد - فحم الذهب الأسود* 👑
---------------------------------
رقم الفاتورة: #${orderNum}
👤 *اسم العميل:* ${customerName}
📞 *رقم الهاتف:* ${customerPhone}
📍 *منطقة التوصيل:* صنعاء - ${districtName}
📝 *تفاصيل العنوان:* ${order.addressDetails || order.address?.street || 'حددها العميل'}
---------------------------------
📦 *المنتجات المطلوبة:*
${rawItems}
---------------------------------
💵 *المجموع الفرعي:* ${subtotalVal.toLocaleString()} ريال
🛵 *رسوم التوصيل:* ${shippingVal.toLocaleString()} ريال
💰 *المبلغ الإجمالي المطلوب:* ${totalVal.toLocaleString()} ريال
💳 *طريقة الدفع:* ${order.paymentMethod === 'cash_on_delivery' ? 'عند الاستلام (كاش)' : 'تحويل بنكي / إلكتروني'}
${order.notes ? `\n💬 *ملاحظات خاصة:* ${order.notes}` : ''}
---------------------------------
يرجى تأكيد التجهيز وسرعة إرسال المندوب 🚀`;

    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-amber-500/30 shadow-2xl p-5 sm:p-6 my-6 text-right overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon & Header */}
        <div className="text-center space-y-2 pt-2 pb-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20 animate-bounce-short">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            تم استلام وتأكيد طلبك بنجاح! 🎉
          </h2>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-black">
            <span>رقم الطلب:</span>
            <span className="text-white text-sm">#{orderNum}</span>
          </div>
        </div>

        {/* Where does the order go? Transparency Box */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5 text-xs mb-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>مسار الطلب الحالي:</span>
          </div>
          <div className="space-y-1.5 text-zinc-300 text-[11px] leading-relaxed pr-2">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>لوحة إدارة المتجر:</strong> تم إشعار المالك والمسؤولين فوراً لتجهيز شحنة الفحم الملكي.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">🛵</span>
              <span><strong>مندوب التوصيل في صنعاء:</strong> جاري التنسيق مع المندوب للتوصيل السريع (30 - 45 دقيقة).</span>
            </div>
          </div>
        </div>

        {/* Invoice Summary Card */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 mb-4 text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">العميل: <strong className="text-white">{customerName}</strong></span>
            <span className="text-zinc-400">المنطقة: <strong className="text-amber-300">{districtName}</strong></span>
          </div>

          <div className="space-y-1 text-zinc-300">
            <span className="text-[11px] text-zinc-500 font-bold block">المنتجات المحجوزة:</span>
            <p className="text-zinc-200 text-xs leading-relaxed">
              {order.itemsSummary || (Array.isArray(order.items) 
                ? order.items.map((i: any) => `${i.product?.nameAr || i.productNameAr || 'فحم الذهب الأسود'} × ${i.quantity}`).join('، ')
                : 'منتجات فحم الذهب الأسود الفاخر')}
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-sm">
            <span className="text-zinc-300 font-medium">المبلغ الإجمالي المطلوب:</span>
            <span className="text-amber-400 font-mono font-black text-base">
              {totalVal.toLocaleString()} ريال
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* WhatsApp Direct Confirmation */}
          <button
            type="button"
            onClick={handleWhatsAppSend}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-[0.99]"
          >
            <MessageSquare className="w-4 h-4" />
            <span>إرسال نسخة الفاتورة للمتجر عبر واتساب لتسريع التوصيل 💬</span>
          </button>

          {/* Track This Single Order */}
          <button
            type="button"
            onClick={() => {
              onTrackOrder(order);
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>متابعة تتبع هذا الطلب وحالة المندوب لحظة بلحظة</span>
          </button>

          {/* Continue Shopping */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-zinc-400 hover:text-zinc-200 text-xs font-semibold text-center transition-colors cursor-pointer"
          >
            العودة ومتابعة التسوّق
          </button>
        </div>
      </div>
    </div>
  );
};
