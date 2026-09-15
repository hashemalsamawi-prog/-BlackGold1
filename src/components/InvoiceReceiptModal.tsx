import React, { useState } from 'react';
import { 
  Printer, Share2, Copy, Check, X, 
  MessageSquare, Flame, ShieldCheck, MapPin, Phone, User, Calendar, Truck
} from 'lucide-react';
import { Order, Language } from '../types';

interface InvoiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  lang: Language;
  whatsappNumber?: string;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  lang,
  whatsappNumber = '967775000150'
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const orderNum = order.orderNumber || order.id || 'BG-2026';
  const totalVal = order.totalAmount ?? order.total ?? 0;
  const shippingVal = order.shippingFee ?? 0;
  const discountVal = order.discount ?? 0;
  const subtotalVal = order.subtotal ?? (totalVal - shippingVal + discountVal);
  const districtName = order.district || order.address?.district || 'صنعاء';
  const streetName = order.address?.street || order.addressDetails || 'حسب التنسيق';
  const customerName = order.customerName || 'عميل المتجر';
  const customerPhone = order.customerPhone || '';
  const orderDate = order.createdAt || order.date || new Date().toLocaleString('ar-YE');
  const driverName = order.driverName || 'أحمد الكبسي (مندوب صنعاء)';
  const driverPhone = order.driverPhone || '770099887';

  const orderUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/?track=${encodeURIComponent(orderNum)}`
    : `https://blackgold-charcoal.ye/?track=${orderNum}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(orderUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendWhatsApp = () => {
    const rawItems = Array.isArray(order.items)
      ? order.items.map((i: any) => {
          const name = i.product?.nameAr || i.productNameAr || 'فحم الذهب الأسود';
          const weight = i.weight || i.selectedWeight || 'العبوة';
          const qty = i.quantity || 1;
          const price = i.unitPrice || i.product?.price || 0;
          return `• ${name} (${weight}) × ${qty} = ${(price * qty).toLocaleString()} ريال`;
        }).join('\n')
      : (order.itemsSummary || 'فحم الذهب الأسود');

    const msg = `*فاتورة طلب فحم الذهب الأسود الملكي* 👑
---------------------------------
رقم الفاتورة: #${orderNum}
التاريخ: ${orderDate}
👤 العميل: ${customerName}
📞 الهاتف: ${customerPhone}
📍 الموقع: صنعاء - ${districtName} - ${streetName}
---------------------------------
📦 الأصناف:
${rawItems}
---------------------------------
💵 المجموع: ${subtotalVal.toLocaleString()} ريال
🛵 التوصيل: ${shippingVal.toLocaleString()} ريال
💰 الإجمالي النهائي: ${totalVal.toLocaleString()} ريال يمني
💳 الدفع: ${order.paymentMethod === 'cash' || order.paymentMethod === 'cash_on_delivery' ? 'نقداً عند الاستلام' : 'تحويل بنكي / محفظة'}
🛵 المندوب: ${driverName} (${driverPhone})
🔗 رابط التتبع المباشر: ${orderUrl}`;

    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Generate SVG QR Code pattern mock that scans or links to the order
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(orderUrl)}&color=1a1a24`;

  return (
    <div id="invoice-receipt-modal" className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Print styles injected directly */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice-card, #printable-invoice-card * {
            visibility: visible;
          }
          #printable-invoice-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-amber-500/30 shadow-2xl p-4 sm:p-6 my-4 text-right overflow-hidden">
        {/* Action Header bar (no-print) */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="print-invoice-btn"
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الفاتورة 🖨️</span>
            </button>

            <button
              onClick={handleCopyLink}
              id="copy-invoice-link-btn"
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div 
          id="printable-invoice-card" 
          className="bg-white text-zinc-900 p-5 sm:p-6 rounded-2xl shadow-xl mt-3 font-sans space-y-4 border border-zinc-200"
          dir="rtl"
        >
          {/* Store Brand Header */}
          <div className="text-center pb-3 border-b-2 border-dashed border-zinc-300 space-y-1">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 text-amber-400 mb-1">
              <Flame className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
            <h1 className="text-lg font-black tracking-tight text-zinc-950">
              فحم الذهب الأسود الفاخر
            </h1>
            <p className="text-[11px] text-zinc-600 font-bold">
              Black Gold Royal Charcoal - صنعاء، اليمن
            </p>
            <p className="text-[10px] text-zinc-500">
              📞 خدمة العملاء والمبيعات: 775000150
            </p>
          </div>

          {/* Invoice Info Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
            <div>
              <span className="text-[10px] text-zinc-500 block">رقم الفاتورة:</span>
              <span className="font-mono font-black text-zinc-900">#{orderNum}</span>
            </div>
            <div className="text-left">
              <span className="text-[10px] text-zinc-500 block">تاريخ الطلب:</span>
              <span className="text-[11px] font-medium text-zinc-800">{orderDate}</span>
            </div>
          </div>

          {/* Customer & Delivery Details */}
          <div className="text-xs space-y-1.5 py-1 border-b border-dashed border-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-500">اسم العميل:</span>
              <span className="font-bold text-zinc-900">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">رقم الهاتف:</span>
              <span className="font-mono font-bold text-zinc-900" dir="ltr">{customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">منطقة التوصيل:</span>
              <span className="font-bold text-zinc-900">صنعاء - {districtName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">العنوان التفصيلي:</span>
              <span className="text-zinc-800 text-[11px] max-w-[240px] text-left">{streetName}</span>
            </div>
            {order.notes && (
              <div className="flex justify-between text-[11px] text-amber-800 bg-amber-50 p-1 rounded">
                <span>ملاحظات:</span>
                <span>{order.notes}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-zinc-900 pb-1 border-b border-zinc-300 flex justify-between">
              <span>الصنف والوزن</span>
              <span>الكمية × السعر = الإجمالي</span>
            </div>

            <div className="space-y-1.5 text-xs">
              {Array.isArray(order.items) && order.items.length > 0 ? (
                order.items.map((item: any, idx: number) => {
                  const name = item.product?.nameAr || item.productNameAr || 'فحم الذهب الأسود';
                  const weight = item.weight || item.selectedWeight || 'عبوة';
                  const qty = item.quantity || 1;
                  const unitPrice = item.unitPrice || item.product?.price || 0;
                  const itemTotal = unitPrice * qty;

                  return (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-zinc-100">
                      <div>
                        <span className="font-bold text-zinc-900 block text-[11px]">{name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">الوزن: {weight}</span>
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-zinc-600 text-[11px]">{qty} × {unitPrice.toLocaleString()} = </span>
                        <strong className="text-zinc-950">{itemTotal.toLocaleString()} ر.ي</strong>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-zinc-600">{order.itemsSummary || 'أصناف فحم الذهب الأسود'}</div>
              )}
            </div>
          </div>

          {/* Totals Calculation */}
          <div className="pt-2 border-t-2 border-dashed border-zinc-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>المجموع الفرعي:</span>
              <span className="font-mono font-medium">{subtotalVal.toLocaleString()} ريال</span>
            </div>

            <div className="flex justify-between text-zinc-600">
              <span>رسوم التوصيل المباشر (صنعاء):</span>
              <span className="font-mono font-medium">{shippingVal.toLocaleString()} ريال</span>
            </div>

            {discountVal > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>خصم الكوبون:</span>
                <span className="font-mono">-{discountVal.toLocaleString()} ريال</span>
              </div>
            )}

            <div className="flex justify-between text-base font-black text-zinc-950 pt-2 border-t border-zinc-300">
              <span>المبلغ الإجمالي المطلوب:</span>
              <span className="font-mono text-lg text-emerald-700">{totalVal.toLocaleString()} ريال يمني</span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-zinc-600 pt-1">
              <span>طريقة السداد:</span>
              <span className="font-bold bg-zinc-100 px-2 py-0.5 rounded text-zinc-800">
                {order.paymentMethod === 'cash' || order.paymentMethod === 'cash_on_delivery' 
                  ? 'الدفع نقداً عند الاستلام (كاش)' 
                  : 'تحويل بنكي / محفظة إلكترونية'}
              </span>
            </div>
          </div>

          {/* Delivery Driver Info & QR Code */}
          <div className="pt-3 border-t border-dashed border-zinc-300 flex items-center justify-between gap-3">
            <div className="space-y-1 text-right text-[11px]">
              <div className="flex items-center gap-1.5 font-bold text-zinc-800">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span>المندوب المكلف بالتوصيل:</span>
              </div>
              <p className="text-zinc-900 font-bold">{driverName}</p>
              <p className="font-mono text-zinc-600" dir="ltr">📞 {driverPhone}</p>
              <p className="text-[10px] text-zinc-500">مدة التوصيل المعتادة: 30 - 45 دقيقة</p>
            </div>

            {/* QR Code */}
            <div className="text-center shrink-0">
              <img 
                src={qrSvgUrl} 
                alt="QR Code" 
                className="w-16 h-16 rounded border border-zinc-300 p-0.5 mx-auto" 
              />
              <span className="text-[9px] text-zinc-500 block mt-0.5 font-mono">تتبع إلكتروني</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-2 text-[10px] text-zinc-500 border-t border-zinc-200">
            شكراً لثقتكم بفحم الذهب الأسود الملكي • جودة تدوم وحرارة تبيض الوجه
          </div>
        </div>

        {/* Bottom Actions (no-print) */}
        <div className="mt-4 space-y-2 no-print">
          <button
            onClick={handleSendWhatsApp}
            id="share-invoice-whatsapp-btn"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>مشاركة الفاتورة عبر واتساب 💬</span>
          </button>
        </div>
      </div>
    </div>
  );
};
