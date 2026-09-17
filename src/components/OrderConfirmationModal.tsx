import React, { useState } from 'react';
import { Order, Language } from '../types';
import { 
  CheckCircle2, Package, MapPin, Phone, MessageSquare, 
  ArrowLeft, Clock, ShieldCheck, X, Truck, Printer,
  Copy, Check
} from 'lucide-react';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  lang: Language;
  onTrackOrder: (order: Order) => void;
  onOpenMyOrders?: () => void;
  onOpenInvoice?: (order: Order) => void;
  whatsappNumber?: string;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  onClose,
  order,
  lang,
  onTrackOrder,
  onOpenInvoice,
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

  const [hasCopied, setHasCopied] = useState(false);

  const handleCopyOrderNum = () => {
    navigator.clipboard.writeText(orderNum);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleWhatsAppSend = () => {
    const rawItems = Array.isArray(order.items)
      ? order.items.map((i: any) => {
          const name = i.product?.nameAr || i.productNameAr || 'فحم الذهب الأسود الفاخر';
          const weight = i.selectedWeight || i.weightOption || i.weight || '250g';
          const qty = i.quantity || 1;
          const price = i.unitPrice || i.product?.price || 0;
          return `• ${name} (${weight}) × ${qty} = ${(price * qty).toLocaleString()} ر.ي`;
        }).join('\n')
      : (order.itemsSummary || 'منتجات فحم الذهب الأسود');

    const msg = `*طلب شراء جديد ومؤكد - فحم الذهب الأسود* 👑
---------------------------------
رقم الفاتورة: #${orderNum}
👤 *اسم العميل:* ${customerName}
📞 *رقم الهاتف:* ${customerPhone}
📍 *منطقة التوصيل:* صنعاء - ${districtName}
📝 *تفاصيل العنوان:* ${order.addressDetails || order.address?.street || 'أمانة العاصمة'}
---------------------------------
📦 *المنتجات المطلوبة:*
${rawItems}
---------------------------------
💵 *المجموع الفرعي:* ${subtotalVal.toLocaleString()} ر.ي
🛵 *رسوم التوصيل:* ${shippingVal.toLocaleString()} ر.ي
💰 *المبلغ الإجمالي:* ${totalVal.toLocaleString()} ر.ي
💳 *طريقة الدفع:* ${order.paymentMethod === 'cash_on_delivery' ? 'عند الاستلام (كاش)' : 'تحويل بنكي / إلكتروني'}
${order.notes ? `\n💬 *ملاحظات خاصة:* ${order.notes}` : ''}
---------------------------------
يرجى تأكيد التجهيز وتحديد موعد وصول المندوب`;

    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div id="order-confirmation-modal" className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0F0F16] border border-[#262638] shadow-2xl p-4 sm:p-6 my-2 sm:my-3 text-right overflow-hidden">
        
        {/* Subtle top gold highlight */}
        <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-[#161622] border border-[#242436] text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Confirmation Header */}
        <div className="text-center space-y-3 pb-5">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-black text-white">
            تم استلام وتأكيد طلبك بنجاح
          </h2>

          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-xs text-slate-400">رقم الفاتورة:</span>
            <span className="text-amber-400 font-mono font-bold text-sm bg-[#161622] px-2.5 py-1 rounded-lg border border-[#242436]">
              #{orderNum}
            </span>
            <button
              type="button"
              onClick={handleCopyOrderNum}
              className="p-1 px-2 rounded-lg bg-[#161622] border border-[#242436] text-slate-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
              title="نسخ رقم الطلب"
            >
              {hasCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span className="text-[10px]">{hasCopied ? 'تم النسخ' : 'نسخ'}</span>
            </button>
          </div>
        </div>

        {/* 4-Step Pipeline Summary */}
        <div className="p-3.5 rounded-2xl bg-[#14141E] border border-[#20202E] space-y-2 mb-4">
          <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] font-semibold">
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-400 block">1. مؤكد ✓</span>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-amber-400" />
              <span className="text-amber-400 block">2. التجهيز</span>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-[#262638]" />
              <span className="text-slate-500 block">3. مع المندوب</span>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-[#262638]" />
              <span className="text-slate-500 block">4. تم التسليم</span>
            </div>
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="p-4 rounded-2xl bg-[#14141E] border border-[#20202E] space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>منطقة التوصيل:</span>
            <span className="font-bold text-white">صنعاء - {districtName}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>المبلغ الإجمالي:</span>
            <span className="font-bold text-amber-400 font-mono text-sm">{totalVal.toLocaleString()} ر.ي</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>طريقة الدفع:</span>
            <span className="text-slate-200">
              {order.paymentMethod === 'cash_on_delivery' ? 'كاش عند الاستلام' : 'تحويل إلكتروني / الكريمي'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={() => onTrackOrder(order)}
            className="w-full py-3.5 px-4 rounded-xl gold-gradient-bg text-[#09090D] font-extrabold text-xs hover:brightness-105 shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Truck className="w-4 h-4" />
            <span>متابعة مسار التوصيل والطلب الآن</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleWhatsAppSend}
              className="py-2.5 px-3 rounded-xl bg-[#181824] hover:bg-[#222232] text-emerald-400 border border-[#28283C] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>إشعار عبر واتساب</span>
            </button>

            {onOpenInvoice && (
              <button
                type="button"
                onClick={() => onOpenInvoice(order)}
                className="py-2.5 px-3 rounded-xl bg-[#181824] hover:bg-[#222232] text-slate-300 border border-[#28283C] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>طباعة الفاتورة</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
