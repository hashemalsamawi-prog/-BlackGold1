import React, { useState } from 'react';
import { Logo } from './Logo';
import { 
  MessageSquare, Mail, MapPin, Phone, ShieldCheck, 
  Truck, Award, FileText, CheckCircle2, X, Sparkles, CreditCard
} from 'lucide-react';
import { Language } from '../types';

interface FooterProps {
  lang: Language;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
  onOpenCalculator?: () => void;
  onScrollToQuality?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  lang,
  onOpenTracker,
  onOpenAdmin,
  onOpenCalculator,
  onScrollToQuality,
}) => {
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | 'quality' | null>(null);

  const paymentBadges = [
    { name: 'الكريمي / حاسب', desc: 'سداد فوري عبر بنك الكريمي' },
    { name: 'ون كاش (OneCash)', desc: 'محفظة بنك إم تي بي' },
    { name: 'فلوسك (Floosak)', desc: 'محفظة بنك اليمن والبحرين' },
    { name: 'الدفع نقداً عند الاستلام', desc: 'فحص الفحم والتسديد للكابتن' },
  ];

  return (
    <footer className="bg-[#08080C] border-t border-[#1C1C26] text-right text-slate-400 text-xs mt-12">
      {/* Upper Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand & Identity Column */}
          <div className="space-y-3.5">
            <Logo variant="horizontal" size="md" />
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              شركة فحم الذهب الأسود للتجارة والتوزيع المباشر. رواد الفحم النباتي الطبيعي الخالي من المواد الكيميائية بدرجة نقاء ملكية واشتعال مستمر يفوق 3 ساعات في أمانة العاصمة صنعاء.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-amber-400 font-semibold pt-1">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>فحم نباتي طبيعي 100% مطابق للمواصفات القياسية</span>
            </div>
          </div>

          {/* Direct Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400" />
              <span>خدمة العملاء والتوصيل السريع</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="https://wa.me/967775000150?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D9%85%D9%86%D8%AA%D8%AC%D8%A7%D8%AA%20%D9%81%D8%AD%D9%85%20%D8%A7%D9%84%D8%B0%D9%87%D8%A8%20%D8%A7%D9%84%D8%A3%D8%B3%D9%88%D8%AF"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>واتساب المبيعات: 775000150 💬</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:blackgoled.ye@gmail.com"
                  className="flex items-center gap-2 text-slate-300 hover:text-amber-400 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>blackgoled.ye@gmail.com</span>
                </a>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>أمانة العاصمة - تغطية لكافة مديريات صنعاء</span>
              </li>
              <li className="text-[11px] text-slate-500 pt-1">
                ساعات العمل: 9:00 صباحاً - 12:00 منتصف الليل (يومياً)
              </li>
            </ul>
          </div>

          {/* Quick Navigation & Services */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>خدمات المتجر والأدوات</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onOpenTracker}
                  className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5 text-amber-400/80" />
                  <span>تتبع الشحنات والطلبات الجارية</span>
                </button>
              </li>
              {onOpenCalculator && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenCalculator}
                    className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>حاسبة الفحم الذكية للمنازل والمقاهي</span>
                  </button>
                </li>
              )}
              {onScrollToQuality && (
                <li>
                  <button
                    type="button"
                    onClick={onScrollToQuality}
                    className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400/80" />
                    <span>معايير وبروتوكول الجودة الملكية</span>
                  </button>
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="text-amber-400/90 hover:text-amber-300 transition-colors cursor-pointer inline-flex items-center gap-1.5 mt-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>بوابة المالك وإدارة العمليات</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Official Policies */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>السياسات والضمان المعتمد</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy('quality')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer underline-offset-4 hover:underline"
                >
                  ضمان الجودة الملكية والاسترجاع
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy('terms')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer underline-offset-4 hover:underline"
                >
                  شروط التوصيل في صنعاء
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy('privacy')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer underline-offset-4 hover:underline"
                >
                  سياسة الخصوصية وأمان البيانات
                </button>
              </li>
            </ul>
            <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
              منتجاتنا مغلفة بأكياس Zipper ألمنيوم متعددة الطبقات لحمايتها من الرطوبة وضمان أقصى اشتعال ممكن.
            </p>
          </div>

        </div>
      </div>

      {/* Local Payment Badges Strip */}
      <div className="border-t border-[#181822] bg-[#0A0A0F] py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>طرق الدفع المحلية المعتمدة في صنعاء:</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {paymentBadges.map((badge, idx) => (
              <div
                key={idx}
                title={badge.desc}
                className="px-3 py-1.5 rounded-xl bg-[#12121A] border border-[#222232] text-[11px] font-bold text-slate-300 flex items-center gap-1.5 hover:border-amber-500/30 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                <span>{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="border-t border-[#14141E] py-4 bg-[#060609] text-center text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            شركة فحم الذهب الأسود © {new Date().getFullYear()} • جميع الحقوق محفوظة لعلامة الذهب الأسود المسجلة
          </span>
          <span className="text-slate-600">
            فحم نباتي طبيعي فاخر • صنعاء، الجمهورية اليمنية
          </span>
        </div>
      </div>

      {/* Policy Modal Popups */}
      {activePolicy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActivePolicy(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-[#0F0F16] border border-[#28283C] p-6 text-right space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#20202E] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">
                  {activePolicy === 'quality' && 'بروتوكول وضمان الجودة الملكية'}
                  {activePolicy === 'terms' && 'شروط التوصيل والخدمة بأمانة العاصمة'}
                  {activePolicy === 'privacy' && 'سياسة الخصوصية وسرية بيانات العميل'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="p-1.5 rounded-xl bg-[#181824] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed space-y-3 max-h-72 overflow-y-auto pr-1">
              {activePolicy === 'quality' && (
                <>
                  <p>
                    نلتزم في شركة فحم الذهب الأسود بتقديم فحم نقي 100% خالٍ تماماً من أي مواد كيميائية أو نترات ضارة.
                  </p>
                  <p>
                    <strong className="text-amber-400">ضمان التجربة والاسترجاع:</strong> في حال لم يكن الفحم مطابقاً للمواصفات المعلنة (حرارة مستمرة تفوق 3 ساعات، رماد أبيض متماسك، انعدام الرائحة الكيميائية)، يحق للعميل استبدال العبوة أو استرجاع كامل المبلغ فورياً دون أي تعقيد.
                  </p>
                  <p>
                    يصلكم الفحم مغلفاً بأكياس Zipper ألمنيوم متعددة الطبقات لمنع الرطوبة والحفاظ على جفاف الفحم.
                  </p>
                </>
              )}

              {activePolicy === 'terms' && (
                <>
                  <p>
                    نوفر التوصيل المباشر لكافة مديريات وأحياء صنعاء (السبعين، التحرير، حدة، الصافية، الوحدة، شملان، الحصبة، مذبح، دار سلم، بني الحارث).
                  </p>
                  <p>
                    <strong className="text-amber-400">وقت التوصيل:</strong> يتم تسليم الطلب خلال 30 إلى 45 دقيقة من تأكيد المندوب عبر الاتصال أو الواتساب.
                  </p>
                  <p>
                    <strong className="text-amber-400">فحص العبوة:</strong> يمكنك فحص كيس الفحم والتأكد من سلامة القفل والسعر قبل تسليم المبلغ للكابتن.
                  </p>
                </>
              )}

              {activePolicy === 'privacy' && (
                <>
                  <p>
                    نحترم خصوصيتك التامة. رقم هاتفك واسمك وعنوانك في صنعاء يتم استخدامها حصرياً لإيصال طلبك من قبل مندوب التوصيل المعتمد.
                  </p>
                  <p>
                    لا نقوم بمشاركة أي من بياناتك مع أي أطراف ثالثة، ولا نرسل رسائل إعلانية مزعجة.
                  </p>
                  <p>
                    جميع أرقام الفواتير ومسارات الطلب مشفرة ومحفوظة بأمان.
                  </p>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-[#20202E] flex justify-end">
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="px-5 py-2 rounded-xl gold-gradient-bg text-[#09090D] text-xs font-bold cursor-pointer"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
