import React from 'react';
import { Language } from '../types';
import { Flame, ShieldCheck, Zap, Award, Sparkles, CheckCircle2, Wind } from 'lucide-react';

interface QualityProtocolSectionProps {
  lang: Language;
}

export const QualityProtocolSection: React.FC<QualityProtocolSectionProps> = ({ lang }) => {
  const protocols = [
    {
      icon: <Wind className="w-6 h-6 text-amber-400" />,
      title: '0% انبعاثات أو روائح كيميائية',
      desc: 'فحم طبيعي عضوي مضغوط بدون نترات أو مسرعات كيميائية، يحافظ على نقاء الطعم وسلامة التنفس.',
    },
    {
      icon: <Flame className="w-6 h-6 text-amber-400" />,
      title: 'حرارة متجانسة تفوق 650°C',
      desc: 'توزيع حراري منتظم يضمن اشتعالاً متواصلاً لأكثر من 3 ساعات دون الحاجة لتبديل الفحم المتكرر.',
    },
    {
      icon: <Award className="w-6 h-6 text-amber-400" />,
      title: 'رماد أبيض ناصع لا يتطاير (<2%)',
      desc: 'كثافة كربونية فائقة تخلف أقل من 2% رماداً صلباً لا يتطاير على الملابس أو الجلسات.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-amber-400" />,
      title: 'تغليف ألمنيوم مقاوم للرطوبة',
      desc: 'أكياس محكمة الغلق تضمن وصول الفحم إليك جافاً 100% وجاهزاً للاشتعال السريع في كل فصول السنة.',
    },
  ];

  return (
    <section className="rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 text-right space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" /> بروتوكول الجودة الملكية
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">معايير فحم الذهب الأسود القياسية</h3>
        </div>
        <span className="text-xs text-zinc-400 font-semibold">مطابق للمواصفات والمقاييس الدولية</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {protocols.map((item, index) => (
          <div
            key={index}
            className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2.5 hover:border-amber-500/30 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              {item.icon}
            </div>
            <h4 className="text-sm font-black text-white">{item.title}</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
