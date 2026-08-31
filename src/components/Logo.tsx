import React from 'react';
import { resolveAsset, ASSETS } from '../assets/images';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-11 w-11',
    lg: 'h-16 w-16',
  };

  const textClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-black border border-amber-500/40 p-1.5 shadow-lg shadow-amber-500/10 ${sizeClasses[size]}`}>
        <img
          src={ASSETS.logo}
          alt="الذهب الأسود"
          className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback icon if image fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 ${textClasses[size]}`}>
            الذهب الأسود
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500/80 -mt-1">
            BLACK GOLD CHARCOAL
          </span>
        </div>
      )}
    </div>
  );
};
