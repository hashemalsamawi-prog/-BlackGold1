import React, { useState } from 'react';
import { 
  Printer, Share2, Copy, Check, X, 
  MessageSquare, Flame, ShieldCheck, MapPin, Phone, User, Calendar, Truck,
  Award, FileText, CheckCircle2, QrCode, Receipt, Crown, Sparkles
} from 'lucide-react';
import { Order, Language } from '../types';
import { resolveAsset, ASSETS } from '../assets/images';
import { safeGetLocalStorage } from '../utils/storage';

interface InvoiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  lang: Language;
  whatsappNumber?: string;
  storeLogo?: string;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  lang,
  whatsappNumber = '967775000150',
  storeLogo
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'a4' | 'thermal'>('a4');
  const [imgError, setImgError] = useState(false);

  if (!isOpen || !order) return null;

  const orderNum = order.orderNumber || order.id || 'BG-2026';
  const totalVal = order.totalAmount ?? order.total ?? 0;
  const shippingVal = order.shippingFee ?? 0;
  const discountVal = order.discount ?? 0;
  const subtotalVal = order.subtotal ?? (totalVal - shippingVal + discountVal);
  const districtName = order.district || order.address?.district || 'صنعاء';
  const streetName = order.address?.street || order.addressDetails || 'حسب التنسيق المباشر مع الكابتن';
  const customerName = order.customerName || 'عميل فحم الذهب الأسود';
  const customerPhone = order.customerPhone || '';
  const orderDate = order.createdAt || order.date || new Date().toLocaleString('ar-YE');
  const driverName = order.driverName || 'أحمد الكبسي (كابتن أمانة العاصمة)';
  const driverPhone = order.driverPhone || '775000150';

  // Primary brand logo source: Custom uploaded logo -> Raster Luxury Emblem -> Vector Logo
  const resolvedLogo = storeLogo || safeGetLocalStorage('bg_custom_logo', '') || ASSETS.logoRaster || ASSETS.logo;

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
    const rawItems = Array.isArray(order.items) && order.items.length > 0
      ? order.items.map((i: any) => {
          const name = i.product?.nameAr || i.productNameAr || 'فحم الذهب الأسود الملكي';
          const weight = i.weight || i.selectedWeight || 'العبوة';
          const qty = i.quantity || 1;
          const price = i.unitPrice || i.product?.price || 0;
          return `• ${name} (${weight}) × ${qty} = ${(price * qty).toLocaleString()} ريال`;
        }).join('\n')
      : (order.itemsSummary || 'فحم الذهب الأسود الملكي');

    const msg = `*👑 فاتورة مبيعات وسند استلام رسمي - فحم الذهب الأسود الملكي*
---------------------------------
رقم الفاتورة: #${orderNum}
تاريخ الإصدار: ${orderDate}
👤 العميل: ${customerName}
📞 هاتف التواصل: ${customerPhone}
📍 الموقع: صنعاء - ${districtName} - ${streetName}
---------------------------------
📦 الأصناف والكميات:
${rawItems}
---------------------------------
💵 المجموع الفرعي: ${subtotalVal.toLocaleString()} ريال
🛵 التوصيل السريع (صنعاء): ${shippingVal.toLocaleString()} ريال
${discountVal > 0 ? `🎁 الخصم: -${discountVal.toLocaleString()} ريال\n` : ''}💰 المبلغ الإجمالي النهائي: ${totalVal.toLocaleString()} ريال يمني
💳 طريقة السداد: ${order.paymentMethod === 'cash' || order.paymentMethod === 'cash_on_delivery' ? 'نقداً عند الاستلام (كاش)' : 'تحويل حاسب الكريمي / محفظة إلكترونية'}
🛵 الكابتن المكلف بالتسليم: ${driverName} (${driverPhone})
---------------------------------
🔗 رابط الفاتورة والتتبع الرقمي المباشر:
${orderUrl}

فحم الذهب الأسود - حرارة متجانسة تفوق 650°C ورماد أبيض نقي 🔥`;

    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(orderUrl)}&color=0a0a0f`;

  return (
    <div id="invoice-receipt-modal" className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Precision Print Styles ensuring no bleed, no dark background, and exact A4/Thermal fit */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 8mm 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-card, #printable-invoice-card * {
            visibility: visible !important;
          }
          #printable-invoice-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            color: #09090d !important;
            padding: 12px 18px !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: 2px solid #b45309 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0B0B10] border border-amber-500/40 shadow-2xl p-3 sm:p-5 my-2 sm:my-3 text-right overflow-hidden">
        
        {/* Top Decorative Royal Gold Accent Line */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600" />

        {/* Action Header Bar (No-Print) */}
        <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-zinc-800 gap-2 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="print-invoice-btn"
              className="px-3.5 py-1.5 rounded-xl gold-gradient-bg text-[#09090D] font-extrabold text-xs flex items-center gap-1.5 shadow-md hover:brightness-105 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#09090D]" />
              <span>طباعة الفاتورة 🖨️</span>
            </button>

            <button
              onClick={handleCopyLink}
              id="copy-invoice-link-btn"
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
            </button>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl bg-zinc-900 p-0.5 border border-zinc-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setViewMode('a4')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'a4' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                A4 رسمي
              </button>
              <button
                type="button"
                onClick={() => setViewMode('thermal')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'thermal' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                سند حراري 80mm
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="إغلاق الفاتورة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* PRINTABLE INVOICE / RECEIPT CONTAINER                      */}
        {/* ========================================================= */}
        <div 
          id="printable-invoice-card" 
          className={`relative bg-white text-zinc-950 p-4 sm:p-6 rounded-2xl shadow-xl font-sans space-y-3.5 border-2 border-amber-500/30 mx-auto transition-all ${
            viewMode === 'thermal' ? 'max-w-[400px] text-xs' : 'w-full'
          }`}
          dir="rtl"
        >
          {/* Subtle Watermark in Center of Invoice */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
            <Crown className="w-72 h-72 text-zinc-950" strokeWidth={1} />
          </div>

          {/* Header with Official Logo, Royal Emblem & Verification Stamp */}
          <div className="relative pb-3 border-b-2 border-dashed border-amber-500/40 space-y-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              
              {/* Brand Logo & Commercial Identity */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-950 p-1 border-2 border-amber-500 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                  {!imgError ? (
                    <img 
                      src={resolveAsset(resolvedLogo)}
                      alt="شعار فحم الذهب الأسود الرسمي"
                      className="w-full h-full object-contain filter drop-shadow"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-amber-400">
                      <Crown className="w-6 h-6 text-amber-300" />
                      <span className="text-[8px] font-black tracking-widest text-amber-400 mt-0.5">BLACK GOLD</span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-base sm:text-lg font-black text-zinc-950 tracking-tight">فحم الذهب الأسود الملكي</h1>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-black border border-amber-300">أصلي ومضمون 100%</span>
                  </div>
                  <p className="text-[11px] font-extrabold text-amber-800 tracking-wide font-mono">
                    BLACK GOLD ROYAL CHARCOAL
                  </p>
                  <p className="text-[10px] text-zinc-600 font-medium">
                    مؤسسة الذهب الأسود للتجارة والتوزيع • أمانة العاصمة - صنعاء
                  </p>
                </div>
              </div>

              {/* Invoice Number & Date Badge */}
              <div className="text-center sm:text-left sm:border-r-2 sm:border-zinc-200 sm:pr-4 pt-1 sm:pt-0 shrink-0">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-950 text-amber-300 text-xs font-black shadow-sm mb-1">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>{viewMode === 'thermal' ? 'سند تسليم فوري' : 'فاتورة مبيعات رسمية'}</span>
                </div>
                <div className="font-mono text-sm font-black text-zinc-950 block" dir="ltr">
                  #{orderNum}
                </div>
                <div className="text-[10px] text-zinc-500 font-medium">
                  {orderDate}
                </div>
              </div>

            </div>
          </div>

          {/* Customer & Delivery Coordinates */}
          <div className="bg-amber-50/40 p-3 sm:p-3.5 rounded-xl border border-amber-200/80 text-xs space-y-1.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-1.5 border-b border-amber-200/60">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="text-zinc-600 font-semibold flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>اسم العميل:</span>
                </span>
                <strong className="text-zinc-950 font-bold">{customerName}</strong>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="text-zinc-600 font-semibold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-700" />
                  <span>رقم الهاتف:</span>
                </span>
                <strong className="font-mono text-zinc-950 font-bold" dir="ltr">{customerPhone}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="text-zinc-600 font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-700" />
                  <span>منطقة التوصيل:</span>
                </span>
                <span className="font-bold text-zinc-900">صنعاء - {districtName}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="text-zinc-600 font-semibold">تفاصيل العنوان:</span>
                <span className="text-zinc-800 text-[11px] truncate max-w-[220px] font-medium">{streetName}</span>
              </div>
            </div>

            {order.notes && (
              <div className="text-[11px] text-amber-950 bg-amber-100/70 p-1.5 rounded-lg border border-amber-300 mt-1">
                <span className="font-bold">ملاحظات خاصة: </span>
                <span>{order.notes}</span>
              </div>
            )}
          </div>

          {/* Items Breakdown Table */}
          <div className="space-y-1 pt-1 overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="border-b-2 border-zinc-400 text-zinc-800 bg-zinc-100 font-black">
                  <th className="p-2 text-right">الصنف ومواصفة العبوة</th>
                  <th className="p-2 text-center">الكمية</th>
                  <th className="p-2 text-center">السعر</th>
                  <th className="p-2 text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  order.items.map((item: any, idx: number) => {
                    const name = item.product?.nameAr || item.productNameAr || 'فحم الذهب الأسود';
                    const weight = item.weight || item.selectedWeight || 'العبوة القياسية';
                    const qty = item.quantity || 1;
                    const unitPrice = item.unitPrice || item.product?.price || 0;
                    const itemTotal = unitPrice * qty;

                    return (
                      <tr key={idx} className="hover:bg-amber-50/20">
                        <td className="p-2">
                          <strong className="text-zinc-950 block text-[11px] font-bold">{name}</strong>
                          <span className="text-[10px] text-zinc-600 block">
                            المواصفة: {weight} (حفظ Zipper محكم + 10g مجانية)
                          </span>
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-zinc-900">{qty}</td>
                        <td className="p-2 text-center font-mono text-zinc-800">{unitPrice.toLocaleString()}</td>
                        <td className="p-2 text-left font-mono font-black text-zinc-950">{itemTotal.toLocaleString()} ر.ي</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-zinc-700 font-medium">
                      {order.itemsSummary || 'أصناف فحم الذهب الأسود الملكي'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation & Total Amount */}
          <div className="pt-2 border-t-2 border-dashed border-zinc-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-700">
              <span>المجموع الفرعي للأصناف:</span>
              <span className="font-mono font-bold text-zinc-900">{subtotalVal.toLocaleString()} ريال</span>
            </div>

            <div className="flex justify-between text-zinc-700">
              <span>رسوم التوصيل السريع (أمانة العاصمة صنعاء):</span>
              <span className="font-mono font-bold text-zinc-900">
                {shippingVal > 0 ? `${shippingVal.toLocaleString()} ريال` : 'توصيل مجاني (عرض حصري)'}
              </span>
            </div>

            {discountVal > 0 && (
              <div className="flex justify-between text-emerald-800 font-bold">
                <span>الخصم المطبق (كوبون):</span>
                <span className="font-mono">-{discountVal.toLocaleString()} ريال</span>
              </div>
            )}

            {/* Total Highlight Box */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-950 text-white font-black text-sm sm:text-base border-2 border-amber-400 shadow-md">
              <div className="space-y-0.5">
                <span className="text-amber-300 block text-xs font-extrabold">المبلغ الإجمالي النهائي المستحق:</span>
                <span className="text-[11px] text-zinc-400 font-normal">شامل الرسوم والتوصيل داخل صنعاء</span>
              </div>
              <div className="text-left font-mono text-lg sm:text-xl text-amber-300 font-black" dir="ltr">
                {totalVal.toLocaleString()} <span className="text-xs font-sans text-white">ر.ي</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-zinc-700 pt-0.5">
              <span>طريقة السداد المعتمدة:</span>
              <span className="font-bold bg-amber-50 px-2.5 py-1 rounded-md text-amber-950 border border-amber-200">
                {order.paymentMethod === 'cash' || order.paymentMethod === 'cash_on_delivery'
                  ? 'الدفع نقداً عند الاستلام (كاش)'
                  : 'تحويل حاسب بنك الكريمي / محفظة إلكترونية'}
              </span>
            </div>
          </div>

          {/* Captain, Authenticity Seal & Live QR Verification */}
          <div className="pt-2.5 border-t-2 border-dashed border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            
            {/* Courier Delivery Identity */}
            <div className="space-y-1 text-right w-full sm:w-auto">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                <Truck className="w-4 h-4 text-amber-700" />
                <span>كابتن التوصيل المكلف:</span>
              </div>
              <p className="text-zinc-950 font-black">{driverName}</p>
              <p className="font-mono text-zinc-700 text-[11px]" dir="ltr">📞 {driverPhone}</p>
            </div>

            {/* Official Seal of Authenticity */}
            <div className="flex items-center gap-2 p-2 rounded-xl border-2 border-amber-500/60 bg-amber-50/70 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-sm shadow">
                👑
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-amber-950 block">ختم الأصالة والضمان الملكي</span>
                <span className="text-[9px] text-zinc-700 font-medium">فحم طبيعي نقي 100% بدون شوائب • حرارة &gt; 650°C</span>
              </div>
            </div>

            {/* Direct Verification QR Code */}
            <div className="text-center shrink-0">
              <img 
                src={qrSvgUrl} 
                alt="QR Code" 
                className="w-14 h-14 rounded-lg border border-zinc-300 p-0.5 mx-auto bg-white shadow-sm" 
              />
              <span className="text-[9px] text-zinc-500 block mt-0.5 font-mono">تتبع ومصادقة إلكترونية</span>
            </div>

          </div>

          {/* Store Guarantee Footnote */}
          <div className="text-center pt-1.5 text-[10px] text-zinc-500 border-t border-zinc-200">
            فحم الذهب الأسود الملكي • جودة تدوم وحرارة تبيض الوجه • خدمة العملاء والمبيعات: 775000150 • صنعاء
          </div>
        </div>

        {/* Bottom Actions (No-Print) */}
        <div className="mt-3 pt-1 space-y-2 no-print">
          <button
            onClick={handleSendWhatsApp}
            id="share-invoice-whatsapp-btn"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
          >
            <MessageSquare className="w-4 h-4" />
            <span>مشاركة الفاتورة للعميل عبر واتساب 💬</span>
          </button>
        </div>

      </div>
    </div>
  );
};
