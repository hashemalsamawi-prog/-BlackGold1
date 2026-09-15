import React, { useState, useMemo } from 'react';
import { 
  Flame, Sparkles, Users, Clock, ShoppingCart, 
  MessageSquare, Check, RotateCcw, X, Info,
  ShieldCheck, Zap, ChevronRight, Award, Compass
} from 'lucide-react';
import { Product, Language } from '../types';

interface CharcoalCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  lang: Language;
  onAddToCart: (product: Product, quantity?: number, selectedWeight?: string) => void;
  onOpenCart?: () => void;
  whatsappNumber?: string;
}

type OccasionType = 'bbq' | 'shisha' | 'majlis' | 'camping';

interface CalculationResult {
  recommendedPacks: {
    product: Product;
    quantity: number;
    weight: string;
    subtotal: number;
  }[];
  totalKg: number;
  totalCost: number;
  burnHours: number;
  heatSummary: string;
  ashLevel: string;
  tips: string[];
}

export const CharcoalCalculatorModal: React.FC<CharcoalCalculatorModalProps> = ({
  isOpen,
  onClose,
  products,
  lang,
  onAddToCart,
  onOpenCart,
  whatsappNumber = '967775000150'
}) => {
  const [occasion, setOccasion] = useState<OccasionType>('bbq');
  const [peopleCount, setPeopleCount] = useState<number>(8);
  const [sessionsCount, setSessionsCount] = useState<number>(4);
  const [durationHours, setDurationHours] = useState<number>(3);
  const [includeIgnition, setIncludeIgnition] = useState<boolean>(true);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  // Products lookup
  const prem500 = useMemo(() => 
    products.find(p => p.id === 'bg-prem-500g') || 
    products.find(p => p.weightGrams === 500) || 
    products[0], 
    [products]
  );

  const prem250 = useMemo(() => 
    products.find(p => p.id === 'bg-prem-250g') || 
    products.find(p => p.weightGrams === 250) || 
    products[0], 
    [products]
  );

  const local500 = useMemo(() => 
    products.find(p => p.id === 'bg-local-500g' || p.category === 'local') || 
    products[1] || 
    products[0], 
    [products]
  );

  const ignitionCubes = useMemo(() => 
    products.find(p => p.id === 'bg-ignition-cubes' || p.category === 'accessories') || null, 
    [products]
  );

  // Compute calculated recommendations
  const result: CalculationResult = useMemo(() => {
    const packs: CalculationResult['recommendedPacks'] = [];
    let totalKg = 1;
    let burnHours = 3;
    let heatSummary = 'حرارة مستمرة 650°C';
    let ashLevel = 'رماد أبيض متماسك أقل من 1.8%';
    let tips: string[] = [];

    if (occasion === 'bbq') {
      // 1 kg per ~4 people for a full rich BBQ
      const calculatedKg = Math.max(1, Math.ceil(peopleCount / 4));
      totalKg = calculatedKg;
      burnHours = Math.max(3, durationHours + 1);
      heatSummary = 'جمر سداسي كثيف بلهب مستقر ومثالي للتحمير';
      ashLevel = 'رماد فضي لا يتطاير على المشويات';
      tips = [
        'أشعل الفحم قبل بدء الشواء بـ 15 دقيقة حتى يتحول سطحه لطبقة رمادية خفيفة.',
        'فحم الذهب الأسود لا يحتاج إلى تهوية مستمرة نظراً لكثافة الكربون العالية (>88%).',
        'ننصح بوضع الغطاء على الشواية لحبس نكهة الشواء ورائحة السدر الزكية.'
      ];

      if (prem500) {
        const qty500 = calculatedKg * 2; // Each 500g pack
        packs.push({
          product: prem500,
          quantity: qty500,
          weight: '500g',
          subtotal: prem500.price * qty500
        });
      }
    } else if (occasion === 'shisha') {
      // ~250g lasts about 4-5 average shisha heads
      const needed250gPacks = Math.max(1, Math.ceil(sessionsCount / 4));
      totalKg = Number((needed250gPacks * 0.25).toFixed(2));
      burnHours = needed250gPacks * 3;
      heatSummary = 'حرارة متوازنة بدون طعم كربوني وبدون انبعاثات';
      ashLevel = 'صفر دخان 0% ورائحة طبيعية نقية 100%';
      tips = [
        'مكعبات متجانسة تحافظ على نقاوة المعسل بدون أي لسعة أو مرارة.',
        'رماد أبيض قليل جداً يمنع انسداد الفويل أو الشبك.',
        'تدوم الجمرة حتى 80 دقيقة لكل رأس بكل أريحية.'
      ];

      if (prem250) {
        packs.push({
          product: prem250,
          quantity: needed250gPacks,
          weight: '250g',
          subtotal: prem250.price * needed250gPacks
        });
      }
    } else if (occasion === 'majlis') {
      // Incense & Majlis: needs quick start & consistent glow
      const packsCount = Math.max(1, Math.ceil(sessionsCount / 3));
      totalKg = Number((packsCount * 0.25).toFixed(2));
      burnHours = 4;
      heatSummary = 'حرارة ناعمة مثالية لإظهار عبير العود والبخور العدني';
      ashLevel = 'بدون تطاير شرر لحماية السجاد والأثاث';
      tips = [
        'مثالي للمباخر اليدوية والكهربائية ومجالس الضيافة في صنعاء.',
        'لا يغير رائحة البخور المعتق بفضل نقاوة الخشب الطبيعي الخالي من الكيماويات.',
        'آمن ومضمون 100% داخل الغرف المغلقة مع تهوية طبيعية.'
      ];

      if (prem250) {
        packs.push({
          product: prem250,
          quantity: packsCount,
          weight: '250g',
          subtotal: prem250.price * packsCount
        });
      }
    } else if (occasion === 'camping') {
      // Camping / Outdoor
      const baseKg = Math.max(2, Math.ceil((peopleCount * durationHours) / 8));
      totalKg = baseKg;
      burnHours = durationHours * 2;
      heatSummary = 'مقاوم لرياح الجبال والبر مع طاقة حرارية عالية';
      ashLevel = 'يدوم مشتعلاً طوال الليل لتدفئة وطهي المخيم';
      tips = [
        'احتفظ بالأكياس مغلقة بسحاب الـ Ziplock لحمايتها من رطوبة وبرودة الجبال.',
        'استخدم مكعبات الإشعال لسهولة الإيقاد حتى في وجود رياح خفيفة.',
        'أمن ويدوم لساعات طويلة لتحضير الشاي اليمني المخدر على الجمر.'
      ];

      if (local500) {
        packs.push({
          product: local500,
          quantity: Math.max(1, Math.ceil(baseKg / 0.5)),
          weight: '500g',
          subtotal: local500.price * Math.max(1, Math.ceil(baseKg / 0.5))
        });
      } else if (prem500) {
        packs.push({
          product: prem500,
          quantity: Math.max(1, Math.ceil(baseKg / 0.5)),
          weight: '500g',
          subtotal: prem500.price * Math.max(1, Math.ceil(baseKg / 0.5))
        });
      }
    }

    // Add ignition cubes if selected
    if (includeIgnition && ignitionCubes) {
      packs.push({
        product: ignitionCubes,
        quantity: 1,
        weight: '24 مكعب',
        subtotal: ignitionCubes.price || 450
      });
    }

    const totalCost = packs.reduce((acc, p) => acc + p.subtotal, 0);

    return {
      recommendedPacks: packs,
      totalKg,
      totalCost,
      burnHours,
      heatSummary,
      ashLevel,
      tips
    };
  }, [occasion, peopleCount, sessionsCount, durationHours, includeIgnition, prem500, prem250, local500, ignitionCubes]);

  if (!isOpen) return null;

  const handleAddAllToCart = () => {
    result.recommendedPacks.forEach(pack => {
      onAddToCart(pack.product, pack.quantity, pack.weight);
    });
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
      if (onOpenCart) onOpenCart();
    }, 900);
  };

  const handleWhatsAppOrder = () => {
    const packsSummary = result.recommendedPacks
      .map(p => `• ${p.product.nameAr} (${p.weight}) × ${p.quantity} = ${p.subtotal.toLocaleString()} ريال`)
      .join('\n');

    const occasionTitle = 
      occasion === 'bbq' ? 'شواء وعزومة عائلية' :
      occasion === 'shisha' ? 'مداعة وشيشة وجلسات' :
      occasion === 'majlis' ? 'مجالس وبخور وضيافة' : 'رحلات وكشتات خارجية';

    const msg = `*طلب استهلاك فحم محسوب عبر حاسبة الذهب الأسود الذكية* 🧮👑
---------------------------------
📌 *المناسبة / الاستخدام:* ${occasionTitle}
👥 *عدد الأشخاص / الجلسات:* ${occasion === 'bbq' || occasion === 'camping' ? `${peopleCount} أشخاص` : `${sessionsCount} جلسات`}
⏳ *ساعات الاشتعال المطلوبة:* ${durationHours} ساعات
⚖️ *إجمالي الوزن المقترح:* ${result.totalKg} كجم
---------------------------------
📦 *الباقة الموصى بها:*
${packsSummary}
---------------------------------
💰 *المجموع التقديري:* ${result.totalCost.toLocaleString()} ريال يمني
📍 *التوصيل:* صنعاء
---------------------------------
يرجى تأكيد التوصيل السريع للموقع 🚀`;

    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div id="charcoal-calculator-modal" className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-zinc-950 border border-amber-500/30 shadow-2xl p-5 sm:p-7 my-6 text-right overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pb-5 border-b border-zinc-800/80 pr-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>حاسبة استهلاك الفحم الملكي الذكية</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            احسب كمية الفحم الموصى بها لجلستك بدقة ⚖️
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            حدد نوع المناسبة والعدد، وسنقترح عليك الوزن المثالي، ساعات الاشتعال، والباقة الأوفر مباشرة بصنعاء.
          </p>
        </div>

        <div className="py-5 space-y-6">
          {/* Step 1: Occasion Type */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-zinc-300 block">
              1. اختر نوع المناسبة أو الاستخدام:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'bbq', label: 'شواء وعزائم', icon: Flame, desc: 'حرارة قوية ومتواصلة' },
                { id: 'shisha', label: 'مداعة وشيشة', icon: Sparkles, desc: 'رماد أبيض 0% دخان' },
                { id: 'majlis', label: 'مجالس وبخور', icon: Award, desc: 'عبير العود بدون شرار' },
                { id: 'camping', label: 'كشتات ورحلات', icon: Compass, desc: 'مقاوم للهواء والبرد' },
              ].map(item => {
                const Icon = item.icon;
                const isSelected = occasion === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOccasion(item.id as OccasionType)}
                    className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected 
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10' 
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-zinc-500'}`} />
                      {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">{item.label}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Controls Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            {/* Control A */}
            {occasion === 'bbq' || occasion === 'camping' ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    عدد الأشخاص:
                  </span>
                  <span className="text-amber-400 font-mono font-black text-sm bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                    {peopleCount} أشخاص
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  step="2"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>2 أشخاص (عائلي صغير)</span>
                  <span>30 شخص (عزومة كبرى)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    عدد الرؤوس / الجلسات:
                  </span>
                  <span className="text-amber-400 font-mono font-black text-sm bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                    {sessionsCount} جلسات
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={sessionsCount}
                  onChange={(e) => setSessionsCount(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>جلسة واحدة</span>
                  <span>16 جلسة (أسبوعي/شهري)</span>
                </div>
              </div>
            )}

            {/* Control B: Duration */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  مدة الاشتعال المطلوبة:
                </span>
                <span className="text-amber-400 font-mono font-black text-sm bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                  {durationHours} ساعات
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={durationHours}
                onChange={(e) => setDurationHours(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>ساعة واحدة</span>
                <span>6 ساعات مستمرة</span>
              </div>
            </div>
          </div>

          {/* Ignition Accessory Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-white font-bold block">إضافة عبوة مكعبات الإشعال السريع (+450 ريال)</span>
                <span className="text-[10px] text-zinc-400">تسهل إشعال الفحم خلال دقيقتين فقط بدون كيروسين أو روائح</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIncludeIgnition(!includeIgnition)}
              className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                includeIgnition ? 'bg-amber-500' : 'bg-zinc-800'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                includeIgnition ? '-translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Calculation Result Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/30 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[11px] text-zinc-400 font-bold block">الوزن التقديري المطلوب:</span>
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {result.totalKg} <span className="text-sm font-sans font-bold text-zinc-300">كيلوجرام</span>
                </span>
              </div>
              <div className="text-left">
                <span className="text-[11px] text-zinc-400 font-bold block">المبلغ التقديري للباقة:</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {result.totalCost.toLocaleString()} <span className="text-sm font-sans font-bold text-zinc-300">ريال</span>
                </span>
              </div>
            </div>

            {/* Recommended Products Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-300 block">
                محتويات الباقة المحسوبة لطلبك:
              </span>
              <div className="space-y-2">
                {result.recommendedPacks.map((pack, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs">
                    <div className="flex items-center gap-3">
                      {pack.product.image && (
                        <img 
                          src={pack.product.image} 
                          alt={pack.product.nameAr} 
                          className="w-9 h-9 rounded-lg object-cover border border-zinc-700" 
                        />
                      )}
                      <div>
                        <span className="text-white font-bold block">{pack.product.nameAr}</span>
                        <span className="text-[10px] text-amber-400/90 font-mono">
                          الوزن: {pack.weight} × {pack.quantity} عبوة
                        </span>
                      </div>
                    </div>
                    <div className="text-left font-mono font-bold text-zinc-200">
                      {pack.subtotal.toLocaleString()} ريال
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality specs */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2 rounded-xl bg-zinc-950/50 border border-zinc-800 text-zinc-300">
                <span className="text-amber-400 font-bold block mb-0.5">⏱️ مدة الاشتعال المتوقعة:</span>
                <span>{result.burnHours} ساعات حرارة مستمرة</span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950/50 border border-zinc-800 text-zinc-300">
                <span className="text-emerald-400 font-bold block mb-0.5">🌿 مستوى النقاء:</span>
                <span>{result.ashLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            id="calc-add-all-to-cart-btn"
            onClick={handleAddAllToCart}
            disabled={addedSuccess}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-[0.99]"
          >
            {addedSuccess ? (
              <>
                <Check className="w-5 h-5 text-zinc-950 animate-scale-in" />
                <span>تمت إضافة الباقة إلى السلة بنجاح! 🎉</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>إضافة الباقة المحسوبة للسلة بضغطة واحدة 🛒</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="calc-whatsapp-order-btn"
            onClick={handleWhatsAppOrder}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>طلب هذه الباقة مباشرة عبر الواتساب مع التوصيل 💬</span>
          </button>
        </div>
      </div>
    </div>
  );
};
