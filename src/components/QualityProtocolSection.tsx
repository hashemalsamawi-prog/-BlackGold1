import React from 'react';
import { Language } from '../types';
import { Flame, ShieldCheck, Award, Wind } from 'lucide-react';

interface QualityProtocolSectionProps {
  lang: Language;
}

export const QualityProtocolSection: React.FC<QualityProtocolSectionProps> = ({ lang }) => {
  const protocols = [
    {
      icon: <Wind className="w-5 h-5 text-amber-400" />,
      title: '0% انبعاثات أو روائح كيميائية',
      desc: 'فحم طبيعي نباتي مضغوط بدون نترات أو مسرعات كيميائية، يحافظ على نقاء الطعم وسلامة الجلسات.',
    },
    {
      icon: <Flame className="w-5 h-5 text-amber-400" />,
      title: 'حرارة متجانسة تفوق 650°C',
      desc: 'توزيع حراري منتظم يضمن اشتعالاً متواصلاً لأكثر من 3 ساعات دون الحاجة لتبديل الفحم المتكرر.',
    },
    {
      icon: <Award className="w-5 h-5 text-amber-400" />,
      title: 'رماد أبيض ناصع (< 1.5%)',
      desc: 'كثافة كربونية فائقة تخلف رماداً متماسكاً خفيفاً لا يتطاير على الملابس أو الأرضيات.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
      title: 'تغليف ألمنيوم محكم ومقاوم للرطوبة',
      desc: 'أكياس Zipper ألمنيوم متعددة الطبقات تضمن وصول الفحم جافاً تماماً وجاهزاً للاشتعال الفوري.',
    },
  ];

  return (
    <section className="rounded-3xl bg-[#0F0F16] border border-[#222232] p-6 sm:p-8 text-right space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#1E1E2C] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161622] border border-[#28283C] text-amber-400 text-xs font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>بروتوكول الجودة الملكية</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">معايير فحم الذهب الأسود القياسية</h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">فحم طبيعي نقي 100% مطابق للمواصفات</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {protocols.map((item, index) => (
          <div
            key={index}
            className="p-5 rounded-2xl bg-[#14141E] border border-[#20202E] space-y-2.5 hover:border-amber-500/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1A1A26] border border-[#28283C] flex items-center justify-center">
              {item.icon}
            </div>
            <h4 className="text-sm font-extrabold text-white">{item.title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
