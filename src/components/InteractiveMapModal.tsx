import React from 'react';
import { StoreSettings, Language, DeliveryAddress } from '../types';
import { SANAA_DISTRICTS } from '../data/mockData';
import { X, MapPin, Navigation, Clock, ShieldCheck, Phone, Truck } from 'lucide-react';

interface InteractiveMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: DeliveryAddress[];
  onSelectAddress: (addr: DeliveryAddress) => void;
  storeSettings: StoreSettings;
  lang: Language;
}

export const InteractiveMapModal: React.FC<InteractiveMapModalProps> = ({
  isOpen,
  onClose,
  addresses,
  onSelectAddress,
  storeSettings,
  lang,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto text-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">تغطية التوصيل الفوري في صنعاء</h2>
              <p className="text-xs text-zinc-400">أسطول متكامل لتوصيل الفحم خلال 20-35 دقيقة لجميع الأحياء</p>
            </div>
          </div>

          {/* Interactive Simulated Map Banner */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-zinc-800 p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 animate-pulse">
              <Navigation className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-black text-white">تغطية شاملة لأمانة العاصمة</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              يصل مندوبنا إليك مع حقيبة حفظ حرارية معزولة لضمان أعلى درجات الجفاف والنقاء للفحم.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> متوسط الوصول 25 دقيقة
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> رسوم تبدأ من 800 ريال
              </span>
            </div>
          </div>

          {/* Districts Grid */}
          <div className="pt-2">
            <h3 className="text-sm font-black text-white mb-3">الأحياء والمناطق المتاحة فوراً:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SANAA_DISTRICTS.map((d) => (
                <div
                  key={d.id}
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-zinc-200">{d.nameAr}</span>
                  <span className="text-[10px] text-amber-400 font-semibold">{d.fee} ريال</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
            <span>للتوصيل المباشر أو خارج صنعاء:</span>
            <a
              href="tel:777000111"
              className="flex items-center gap-1 font-bold text-amber-400 hover:underline"
            >
              <Phone className="w-3.5 h-3.5" /> 777000111
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
