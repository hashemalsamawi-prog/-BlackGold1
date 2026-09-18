import React, { useState, useEffect } from 'react';
import { 
  Printer, Share2, Copy, Check, X, 
  MessageSquare, Flame, ShieldCheck, MapPin, Phone, User, Calendar, Truck,
  Award, FileText, CheckCircle2, QrCode, Receipt, Crown, Sparkles
} from 'lucide-react';
import QRCode from 'qrcode';
import { Order, Language, StoreSettings } from '../types';
import { resolveAsset, ASSETS } from '../assets/images';
import { safeGetLocalStorage } from '../utils/storage';

interface InvoiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  lang: Language;
  whatsappNumber?: string;
  storeLogo?: string;
  storeSettings?: StoreSettings;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  lang,
  whatsappNumber = '967775000150',
  storeLogo,
  storeSettings
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'a4' | 'thermal'>('a4');
  const [imgError, setImgError] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  if (!isOpen || !order) return null;

  const orderNum = order.orderNumber || order.id || '';
  const totalVal = order.totalAmount ?? order.total ?? 0;
  const shippingVal = order.shippingFee ?? 0;
  const discountVal = order.discount ?? order.discountAmount ?? 0;
  const subtotalVal = order.subtotal ?? (totalVal - shippingVal + discountVal);
  const districtName = order.district || order.address?.district || '';
  const streetName = order.address?.street || order.addressDetails || (typeof order.address === 'string' ? order.address : '') || '';
  const customerName = order.customerName?.trim() || '';
  const customerPhone = order.customerPhone?.trim() || '';
  const orderDate = order.createdAt || order.date || new Date().toLocaleString('ar-YE');
  const driverName = order.driverName?.trim() || (order.assignedDriver ? String(order.assignedDriver).trim() : '');
  const driverPhone = order.driverPhone?.trim() || '';
  const storeNameAr = storeSettings?.storeNameAr || 'فحم الذهب الأسود الملكي';
  const storeNameEn = storeSettings?.storeNameEn || 'BLACK GOLD ROYAL CHARCOAL';
  const officialPhone = storeSettings?.supportPhone || storeSettings?.whatsappNumber || whatsappNumber || '775000150';
  const orderStatus = order.status || 'pending';

  // Primary brand logo source: Custom uploaded logo -> Raster Luxury Emblem -> Vector Logo
  const resolvedLogo = storeLogo || storeSettings?.customLogoUrl || storeSettings?.logo || safeGetLocalStorage('bg_custom_logo', '') || ASSETS.logoRaster || ASSETS.logo;

  // Safe tracking URL without any sensitive customer PII
  const orderUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/?track=${encodeURIComponent(orderNum)}`
    : `https://blackgold-charcoal.ye/?track=${encodeURIComponent(orderNum)}`;

  // Generate QR code 100% client-side without external third-party services
  useEffect(() => {
    if (!orderNum) return;
    let isMounted = true;
    QRCode.toDataURL(orderUrl, {
      width: 160,
      margin: 1,
      color: {
        dark: '#0a0a0f',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    }).then(url => {
      if (isMounted) setQrCodeDataUrl(url);
    }).catch(err => {
      console.warn('Local QR generation error:', err);
    });
    return () => { isMounted = false; };
  }, [orderUrl, orderNum]);

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

  // Status mapping
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'قيد المراجعة والاعتماد', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'preparing':
        return { label: 'قيد التجهيز والتعبئة', badgeClass: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'on_way':
      case 'delivering':
      case 'shipped':
        return { label: 'في الطريق مع الكابتن', badgeClass: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 'delivered':
      case 'completed':
        return { label: 'تم التسليم بنجاح', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'cancelled':
        return { label: 'طلب ملغي', badgeClass: 'bg-rose-100 text-rose-900 border-rose-300' };
      default:
        return { label: status || 'معتمد', badgeClass: 'bg-zinc-100 text-zinc-900 border-zinc-300' };
    }
  };

  const statusInfo = getOrderStatusBadge(orderStatus);

  const handleSendWhatsApp = () => {
    const rawItems = Array.isArray(order.items) && order.items.length > 0
      ? order.items.map((i: any) => {
          const name = i.product?.nameAr || i.productNameAr || i.nameAr || 'فحم الذهب الأسود';
          const weight = i.weight || i.selectedWeight || i.weightOption || '';
          const qty = i.quantity || 1;
          const price = i.unitPrice || i.product?.price || i.price || 0;
          return `• ${name}${weight ? ` (${weight})` : ''} × ${qty} = ${(price * qty).toLocaleString()} ريال`;
        }).join('\n')
      : (order.itemsSummary || 'فحم الذهب الأسود الملكي');

    const locationLine = [districtName ? `صنعاء - ${districtName}` : '', streetName].filter(Boolean).join(' - ');

    const msg = `*👑 فاتورة مبيعات وسند استلام رسمي - ${storeNameAr}*
---------------------------------
رقم الفاتورة: #${orderNum}
تاريخ الإصدار: ${orderDate}
${customerName ? `👤 العميل: ${customerName}\n` : ''}${customerPhone ? `📞 هاتف التواصل: ${customerPhone}\n` : ''}${locationLine ? `📍 الموقع: ${locationLine}\n` : ''}---------------------------------
📦 الأصناف والكميات:
${rawItems}
---------------------------------
💵 المجموع الفرعي: ${subtotalVal.toLocaleString()} ريال
🛵 التوصيل: ${shippingVal > 0 ? `${shippingVal.toLocaleString()} ريال` : 'توصيل مجاني'}
${discountVal > 0 ? `🎁 الخصم: -${discountVal.toLocaleString()} ريال\n` : ''}💰 المبلغ الإجمالي النهائي: ${totalVal.toLocaleString()} ريال يمني
💳 طريقة السداد: ${order.paymentMethod === 'cash' || order.paymentMethod === 'cash_on_delivery' ? 'نقداً عند الاستلام (كاش)' : 'تحويل حاسب الكريمي / محفظة إلكترونية'}
${driverName ? `🛵 الكابتن المكلف: ${driverName}${driverPhone ? ` (${driverPhone})` : ''}` : '🛵 حالة التوصيل: قيد التعيين والتجهيز'}
---------------------------------
🔗 رابط الفاتورة والتتبع الرقمي:
${orderUrl}

${storeNameAr} - جودة معتمدة وضمان ملكي 👑`;

    const cleanNumber = (officialPhone || whatsappNumber).replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div id="invoice-receipt-modal" className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Precision Print Styles ensuring no bleed, no dark background, and exact A4/Thermal fit */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: ${viewMode === 'thermal' ? '3mm 4mm' : '8mm 10mm'};
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
            width: ${viewMode === 'thermal' ? '76mm' : '100%'} !important;
            max-width: ${viewMode === 'thermal' ? '76mm' : '100%'} !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: ${viewMode === 'thermal' ? '6px 8px' : '12px 18px'} !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: ${viewMode === 'thermal' ? '1px solid #000000' : '2px solid #b45309'} !important;
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
          className={`relative bg-white text-zinc-950 rounded-2xl shadow-xl font-sans border-2 border-amber-500/30 mx-auto transition-all ${
            viewMode === 'thermal' 
              ? 'max-w-[340px] p-3 text-[11px] space-y-2.5 leading-tight' 
              : 'w-full p-4 sm:p-6 text-xs space-y-3.5'
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
                <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-zinc-950 p-1 border-2 border-amber-500 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
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
                    <h1 className="text-base sm:text-lg font-black text-zinc-950 tracking-tight">{storeNameAr}</h1>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-black border border-amber-300">أصلي ومضمون 100%</span>
                  </div>
                  <p className="text-[11px] font-extrabold text-amber-800 tracking-wide font-mono">
                    {storeNameEn}
                  </p>
                  <p className="text-[10px] text-zinc-600 font-medium">
                    مؤسسة الذهب الأسود للتجارة والتوزيع • أمانة العاصمة - صنعاء
                  </p>
                </div>
              </div>

              {/* Invoice Number & Date Badge & Order Status */}
              <div className="text-center sm:text-left sm:border-r-2 sm:border-zinc-200 sm:pr-4 pt-1 sm:pt-0 shrink-0">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-950 text-amber-300 text-xs font-black shadow-sm mb-1">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>{viewMode === 'thermal' ? 'سند تسليم فوري' : 'فاتورة مبيعات رسمية'}</span>
                </div>
                <div className="font-mono text-sm font-black text-zinc-950 block" dir="ltr">
                  #{orderNum}
                </div>
                <div className="text-[10px] text-zinc-500 font-medium mb-1">
                  {orderDate}
                </div>
                {/* Order Status Badge */}
                <div className="mt-1">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black border ${statusInfo.badgeClass}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Customer & Delivery Coordinates */}
          <div className={`bg-amber-50/40 rounded-xl border border-amber-200/80 ${
            viewMode === 'thermal' ? 'p-2 space-y-1 text-[10px]' : 'p-3 sm:p-3.5 space-y-1.5 text-xs'
          }`}>
            <div className={`grid gap-1.5 pb-1 border-b border-amber-200/60 ${
              viewMode === 'thermal' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
            }`}>
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="text-zinc-600 font-semibold flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>العميل:</span>
                </span>
                <strong className="text-zinc-950 font-bold">
                  {customerName || 'عميل المتجر'}
                </strong>
              </div>
              {customerPhone ? (
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-zinc-600 font-semibold flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-700" />
                    <span>رقم الهاتف:</span>
                  </span>
                  <strong className="font-mono text-zinc-950 font-bold" dir="ltr">{customerPhone}</strong>
                </div>
              ) : null}
            </div>

            <div className={`grid gap-1.5 ${
              viewMode === 'thermal' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
            }`}>
              {districtName ? (
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-zinc-600 font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-700" />
                    <span>المنطقة:</span>
                  </span>
                  <span className="font-bold text-zinc-900">صنعاء - {districtName}</span>
                </div>
              ) : null}
              {streetName ? (
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-zinc-600 font-semibold">تفاصيل العنوان:</span>
                  <span className="text-zinc-800 text-[11px] truncate max-w-[220px] font-medium">{streetName}</span>
                </div>
              ) : null}
            </div>

            {order.notes && (
              <div className="text-[11px] text-amber-950 bg-amber-100/70 p-1.5 rounded-lg border border-amber-300 mt-1">
                <span className="font-bold">ملاحظات: </span>
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
                    const name = item.product?.nameAr || item.productNameAr || item.nameAr || 'فحم الذهب الأسود';
                    const weight = item.weight || item.selectedWeight || item.weightOption || '';
                    const qty = item.quantity || 1;
                    const unitPrice = item.unitPrice || item.product?.price || item.price || 0;
                    const itemTotal = item.totalPrice || (unitPrice * qty);

                    return (
                      <tr key={idx} className="hover:bg-amber-50/20">
                        <td className="p-2">
                          <strong className="text-zinc-950 block text-[11px] font-bold">{name}</strong>
                          {weight ? (
                            <span className="text-[10px] text-zinc-600 block">
                              العبوة / المواصفة: {weight}
                            </span>
                          ) : null}
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
              <span>رسوم التوصيل:</span>
              <span className="font-mono font-bold text-zinc-900">
                {shippingVal > 0 ? `${shippingVal.toLocaleString()} ريال` : 'توصيل مجاني'}
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
                <span className="text-amber-300 block text-xs font-extrabold">المبلغ الإجمالي المستحق:</span>
                <span className="text-[11px] text-zinc-400 font-normal">شامل الرسوم والتوصيل</span>
              </div>
              <div className="text-left font-mono text-lg sm:text-xl text-amber-300 font-black" dir="ltr">
                {totalVal.toLocaleString()} <span className="text-xs font-sans text-white">ر.ي</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-zinc-700 pt-0.5">
              <span>طريقة السداد:</span>
              <span className="font-bold bg-amber-50 px-2.5 py-1 rounded-md text-amber-950 border border-amber-200">
                {order.paymentMethod === 'cash' || order.paymentMethod === 'cash_on_delivery'
                  ? 'الدفع نقداً عند الاستلام (كاش)'
                  : 'تحويل حاسب بنك الكريمي / محفظة إلكترونية'}
              </span>
            </div>
          </div>

          {/* Captain, Authenticity Seal & Local QR Verification */}
          <div className="pt-2.5 border-t-2 border-dashed border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            
            {/* Courier Delivery Identity */}
            <div className="space-y-1 text-right w-full sm:w-auto">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                <Truck className="w-4 h-4 text-amber-700" />
                <span>كابتن التوصيل:</span>
              </div>
              {driverName ? (
                <div>
                  <p className="text-zinc-950 font-black">{driverName}</p>
                  {driverPhone ? (
                    <p className="font-mono text-zinc-700 text-[11px]" dir="ltr">📞 {driverPhone}</p>
                  ) : null}
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-medium border border-zinc-200">
                  <span>قيد التعيين والتجهيز</span>
                </div>
              )}
            </div>

            {/* Official Seal of Authenticity */}
            <div className="flex items-center gap-2 p-2 rounded-xl border border-amber-500/50 bg-amber-50/70 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-sm shadow shrink-0">
                👑
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-amber-950 block">ختم الأصالة والضمان</span>
                <span className="text-[9px] text-zinc-700 font-medium">فحم طبيعي 100% • جودة معتمدة ومضمونة</span>
              </div>
            </div>

            {/* Direct Verification Local QR Code (No external APIs, No PII) */}
            <div className="text-center shrink-0">
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code" 
                  className="w-14 h-14 rounded-lg border border-zinc-300 p-0.5 mx-auto bg-white shadow-sm object-contain" 
                />
              ) : (
                <div className="w-14 h-14 rounded-lg border border-zinc-200 p-1 mx-auto bg-zinc-50 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-zinc-400" />
                </div>
              )}
              <span className="text-[9px] text-zinc-500 block mt-0.5 font-mono">تتبع ومصادقة الطلب</span>
            </div>

          </div>

          {/* Store Guarantee Footnote with Official Settings Data */}
          <div className="text-center pt-1.5 text-[10px] text-zinc-600 border-t border-zinc-200 space-y-0.5">
            <p className="font-semibold text-zinc-800">
              {storeNameAr} • جودة معتمدة وضمان ملكي
            </p>
            <p className="text-zinc-500 font-mono text-[9px]">
              خدمة العملاء: {officialPhone} {storeSettings?.supportEmail ? `• ${storeSettings.supportEmail}` : ''}
            </p>
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
