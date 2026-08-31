import React from 'react';
import { ThemeMode } from '../types';
import { 
  Home, ShoppingBag, Package, ShieldAlert, User, 
  Sun, Moon, Flame
} from 'lucide-react';

interface MobileBottomNavProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  userName?: string;
  userRole?: 'owner' | 'mandoub' | 'customer';
  theme: ThemeMode;
  onToggleTheme: () => void;
  onScrollToProducts: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount,
  onOpenCart,
  onOpenOrders,
  onOpenAdmin,
  onOpenAuth,
  userName,
  userRole,
  theme,
  onToggleTheme,
  onScrollToProducts,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-xl px-2 py-2">
      <div className="flex items-center justify-around">
        {/* Store Home */}
        <button
          onClick={onScrollToProducts}
          className="flex flex-col items-center gap-1 p-1 text-zinc-400 hover:text-amber-400 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">المتجر</span>
        </button>

        {/* Orders Tracker */}
        <button
          onClick={onOpenOrders}
          className="flex flex-col items-center gap-1 p-1 text-zinc-400 hover:text-amber-400 transition-colors"
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-bold">طلباتي</span>
        </button>

        {/* Central Cart Icon */}
        <button
          onClick={onOpenCart}
          className="relative -top-4 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/30 border-2 border-black"
        >
          <ShoppingBag className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-black">
              {cartCount}
            </span>
          )}
        </button>

        {/* Admin or Mandoub if owner/mandoub, otherwise Profile */}
        {userRole === 'owner' ? (
          <button
            onClick={onOpenAdmin}
            className="flex flex-col items-center gap-1 p-1 text-amber-400 font-black"
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[10px]">الإدارة</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex flex-col items-center gap-1 p-1 text-zinc-400 hover:text-amber-400 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-bold">{userName ? 'حسابي' : 'دخول'}</span>
          </button>
        )}

        {/* Theme Switcher */}
        <button
          onClick={onToggleTheme}
          className="flex flex-col items-center gap-1 p-1 text-zinc-400 hover:text-amber-400 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-[10px] font-bold">المظهر</span>
        </button>
      </div>
    </nav>
  );
};
