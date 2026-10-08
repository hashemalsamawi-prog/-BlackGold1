import React from 'react';

interface WeightBonusBadgeProps {
  weight?: string | number;
  bonusGrams?: number;
  className?: string;
  bonusText?: string;
}

/**
 * Standardized component to render base weight and free bonus quantity
 * in authentic Arabic RTL order:
 * [اليمين: الوزن الأساسي مثل 250جم] ثم [+] ثم [اليسار: الكمية المجانية مثل 10 مجاني]
 * 
 * Using Flexbox with dir="rtl" and <bdi> guarantees that the layout engine
 * places the base weight FIRST on the right, '+' in the center, and free grams
 * on the left across all browsers, mobile screens, and operating systems.
 */
export const WeightBonusBadge: React.FC<WeightBonusBadgeProps> = ({
  weight = '250جم',
  bonusGrams,
  className = '',
  bonusText = 'مجاني'
}) => {
  const formattedWeight = typeof weight === 'number' ? `${weight}جم` : String(weight);

  if (!bonusGrams || bonusGrams <= 0) {
    return <span className={className}>{formattedWeight}</span>;
  }

  return (
    <span 
      className={`inline-flex items-center gap-1 font-bold ${className}`} 
      dir="rtl"
    >
      <bdi className="font-extrabold whitespace-nowrap">{formattedWeight}</bdi>
      <span className="text-amber-400 font-black select-none opacity-90 px-0.5">+</span>
      <bdi className="text-amber-300 font-bold whitespace-nowrap">{bonusGrams} {bonusText}</bdi>
    </span>
  );
};

/**
 * Plain text formatter with Right-to-Left Marks (\u200F) for non-DOM text contexts
 * (e.g., WhatsApp messages, PDF titles, meta tags).
 * Ensures that the '+' character doesn't trigger BiDi flipping.
 */
export function formatWeightBonusText(
  weight?: string | number, 
  bonusGrams?: number, 
  bonusText = 'مجاني'
): string {
  const formattedWeight = typeof weight === 'number' ? `${weight}جم` : String(weight || '250جم');
  if (!bonusGrams || bonusGrams <= 0) {
    return formattedWeight;
  }
  // \u200F is the Unicode Right-to-Left Mark (RLM)
  return `${formattedWeight} \u200F+\u200F ${bonusGrams} ${bonusText}`;
}
