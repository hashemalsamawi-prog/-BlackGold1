import React, { useState, useEffect } from 'react';
import { resolveAsset, ASSETS } from '../assets/images';
import { Flame, Crown } from 'lucide-react';
import { safeGetLocalStorage } from '../utils/storage';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'horizontal' | 'vertical';
  customLogoUrl?: string;
  animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  showText = true,
  variant = 'horizontal',
  customLogoUrl,
  animated = true
}) => {
  const [logoSrc, setLogoSrc] = useState<string>(() => {
    return customLogoUrl || safeGetLocalStorage('bg_custom_logo', '') || ASSETS.logo;
  });
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (customLogoUrl) {
      setLogoSrc(customLogoUrl);
      setImageError(false);
    } else {
      const stored = safeGetLocalStorage('bg_custom_logo', '');
      if (stored) {
        setLogoSrc(stored);
        setImageError(false);
      }
    }

    const handleLogoUpdate = () => {
      const updated = safeGetLocalStorage('bg_custom_logo', '');
      setLogoSrc(updated || ASSETS.logo);
      setImageError(false);
    };

    window.addEventListener('bg_logo_updated', handleLogoUpdate);
    return () => window.removeEventListener('bg_logo_updated', handleLogoUpdate);
  }, [customLogoUrl]);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-11 w-11',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  const textClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex ${variant === 'vertical' ? 'flex-col items-center text-center' : 'items-center'} gap-3 select-none ${className}`}>
      <div 
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-black border border-amber-500/40 p-1.5 shadow-lg shadow-amber-500/10 shrink-0 overflow-hidden ${sizeClasses[size]} ${
          animated ? 'transition-all duration-500 hover:scale-105 hover:border-amber-400 hover:shadow-amber-500/25' : ''
        }`}
      >
        {/* Subtle glowing animated backdrop */}
        {animated && (
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent animate-pulse pointer-events-none" />
        )}

        {!imageError ? (
          <img
            src={resolveAsset(logoSrc)}
            alt="شعار فحم الذهب الأسود"
            className={`w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)] ${
              animated ? 'transition-transform duration-300' : ''
            }`}
            referrerPolicy="no-referrer"
            onError={() => {
              // Try raster fallback before showing SVG icon
              if (logoSrc !== ASSETS.logoRaster) {
                setLogoSrc(ASSETS.logoRaster);
              } else {
                setImageError(true);
              }
            }}
          />
        ) : (
          <div className="relative flex items-center justify-center w-full h-full text-amber-400">
            <Crown className="w-5 h-5 animate-pulse text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <Flame className="w-3 h-3 text-orange-500 absolute bottom-1 right-1" />
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 ${textClasses[size]}`}>
            الذهب الأسود
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500/80 -mt-0.5">
            BLACK GOLD CHARCOAL
          </span>
        </div>
      )}
    </div>
  );
};
