import React from 'react';
import { ThemeMode } from '../types';
import { 
  Home, ShoppingBag, Package, ShieldAlert, User, 
  Sun, Moon, Flame, Truck
} from 'lucide-react';

interface MobileBottomNavProps {
  cartCount: number;
  ordersCount?: number;
  pendingOrdersCount?: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenAdmin: () => void;
  onOpenMandoub?: () => void;
  onOpenAuth: () => void;
  userName?: string;
  userRole?: 'owner' | 'mandoub' | 'customer';
  theme: ThemeMode;
  onToggleTheme: () => void;
  onScrollToProducts: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount,
  ordersCount = 0,
  pendingOrdersCount = 0,
  onOpenCart,
  onOpenOrders,
  onOpenAdmin,
  onOpenMandoub,
  onOpenAuth,
  userName,
  userRole,
  theme,
  onToggleTheme,
  onScrollToProducts,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0B10]/95 border-t border-[#1E1E2C] backdrop-blur-xl px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl">
      <div className="flex items-center justify-around">
        {/* Store Home */}
        <button
          onClick={onScrollToProducts}
          className="flex flex-col items-center gap-1 p-1 text-slate-400 hover:text-amber-400 active:scale-95 transition-all cursor-pointer"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">المتجر</span>
        </button>

        {/* Orders Tracker */}
        <button
          onClick={onOpenOrders}
          className="relative flex flex-col items-center gap-1 p-1 text-slate-400 hover:text-amber-400 active:scale-95 transition-all cursor-pointer"
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-bold">طلباتي</span>
          {ordersCount > 0 && (
            <span className="absolute top-0 right-1 bg-amber-500 text-black font-black text-[9px] min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center shadow-sm">
              {ordersCount}
            </span>
          )}
        </button>

        {/* Central Cart Icon */}
        <button
          onClick={onOpenCart}
          className="relative -top-4 flex items-center justify-center w-12 h-12 rounded-full gold-gradient-bg text-[#09090D] shadow-lg shadow-amber-500/25 border-2 border-[#0B0B10] active:scale-90 transition-all cursor-pointer"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-black shadow-sm">
              {cartCount}
            </span>
          )}
        </button>

        {/* Admin or Mandoub if owner/mandoub, otherwise Profile */}
        {userRole === 'owner' ? (
          <button
            onClick={onOpenAdmin}
            className="relative flex flex-col items-center gap-1 p-1 text-amber-400 font-black active:scale-95 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[10px]">الإدارة</span>
            {pendingOrdersCount > 0 && (
              <span className="absolute top-0 right-1 bg-rose-600 text-white font-black text-[9px] min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center border border-black animate-pulse">
                {pendingOrdersCount}
              </span>
            )}
          </button>
        ) : userRole === 'mandoub' ? (
          <button
            onClick={onOpenMandoub || onOpenAdmin}
            className="relative flex flex-col items-center gap-1 p-1 text-emerald-400 font-black active:scale-95 transition-all cursor-pointer"
          >
            <Truck className="w-5 h-5" />
            <span className="text-[10px]">التوصيل</span>
            {pendingOrdersCount > 0 && (
              <span className="absolute top-0 right-1 bg-emerald-600 text-white font-black text-[9px] min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center border border-black animate-pulse">
                {pendingOrdersCount}
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex flex-col items-center gap-1 p-1 text-slate-400 hover:text-amber-400 active:scale-95 transition-all cursor-pointer"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-bold">{userName ? 'حسابي' : 'دخول'}</span>
          </button>
        )}

        {/* Theme Switcher */}
        <button
          onClick={onToggleTheme}
          className="flex flex-col items-center gap-1 p-1 text-slate-400 hover:text-amber-400 active:scale-95 transition-all cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-[10px] font-bold">المظهر</span>
        </button>
      </div>
    </nav>
  );
};
