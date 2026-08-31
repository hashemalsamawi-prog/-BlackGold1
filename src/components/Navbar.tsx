import React, { useState } from 'react';
import { Product, StoreSettings, Language, ThemeMode, ProductSortOption } from '../types';
import { Logo } from './Logo';
import { 
  ShoppingCart, MapPin, Package, ShieldAlert, Truck, Bot, User, 
  Search, SlidersHorizontal, Sun, Moon, Sparkles, Smartphone, Monitor,
  X, Check, Flame, ChevronDown, RotateCcw
} from 'lucide-react';

interface NavbarProps {
  lang: Language;
  onLanguageToggle: () => void;
  deviceMode: 'web' | 'android';
  onDeviceModeToggle: () => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenMap: () => void;
  onOpenOrders: () => void;
  onOpenAdmin: () => void;
  onOpenMandoub: () => void;
  onOpenAiAdvisor: () => void;
  onOpenAuth: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  minPrice: number | '';
  setMinPrice: (p: number | '') => void;
  maxPrice: number | '';
  setMaxPrice: (p: number | '') => void;
  sortBy: ProductSortOption;
  setSortBy: (s: ProductSortOption) => void;
  onResetFilters: () => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  userName: string;
  userRole: 'owner' | 'mandoub' | 'customer';
  products: Product[];
  onSelectProduct: (p: Product) => void;
  storeSettings: StoreSettings;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onLanguageToggle,
  deviceMode,
  onDeviceModeToggle,
  cartCount,
  onOpenCart,
  onOpenMap,
  onOpenOrders,
  onOpenAdmin,
  onOpenMandoub,
  onOpenAiAdvisor,
  onOpenAuth,
  searchQuery,
  setSearchQuery,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
  onResetFilters,
  activeCategory,
  setActiveCategory,
  userName,
  userRole,
  products,
  onSelectProduct,
  storeSettings,
  theme,
  onToggleTheme,
}) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const searchResults = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.nameAr.includes(searchQuery) ||
          p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.descriptionAr.includes(searchQuery)
      )
    : [];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-black/80 backdrop-blur-xl transition-colors">
      {/* Top Banner */}
      {storeSettings.announcementAr && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-4 py-1 text-center text-xs font-bold text-black shadow-inner">
          {storeSettings.announcementAr}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Logo size="md" />
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder="ابحث عن الفحم الملكي، الأحجام، التوريد..."
                className="w-full bg-zinc-900/90 border border-zinc-700/70 focus:border-amber-500 rounded-xl py-2 px-4 pr-10 text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            </div>

            {/* Live Search Popup */}
            {searchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-2 z-50 max-h-72 overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProduct(p);
                      setSearchQuery('');
                    }}
                    className="w-full text-right p-2.5 rounded-lg hover:bg-amber-500/10 flex items-center justify-between text-xs text-zinc-200 transition-colors"
                  >
                    <span className="font-bold text-amber-400">{p.nameAr}</span>
                    <span className="text-zinc-400">{p.price} ريال</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* AI Advisor Button */}
            <button
              onClick={onOpenAiAdvisor}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-all shadow-sm"
              title="مستشار الفحم الذكي"
            >
              <Bot className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="hidden lg:inline">المستشار الذكي</span>
            </button>

            {/* Map & Delivery coverage */}
            <button
              onClick={onOpenMap}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs font-semibold hover:border-amber-500/40 hover:text-white transition-all"
              title="مناطق التوصيل في صنعاء"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">صنعاء</span>
            </button>

            {/* Orders Tracker */}
            <button
              onClick={onOpenOrders}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs font-semibold hover:border-amber-500/40 hover:text-white transition-all"
              title="تتبع الطلبات"
            >
              <Package className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">طلباتي</span>
            </button>

            {/* Role / Portals */}
            {userRole === 'owner' && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-black hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">لوحة الإدارة</span>
              </button>
            )}

            {userRole === 'mandoub' && (
              <button
                onClick={onOpenMandoub}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 transition-all"
              >
                <Truck className="w-4 h-4" />
                <span className="hidden sm:inline">بوابة المندوب</span>
              </button>
            )}

            {/* User Profile / Login */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs font-semibold hover:border-amber-500/40 transition-all"
            >
              <User className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">{userName || 'تسجيل الدخول'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors"
              title="تبديل المظهر"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center justify-center p-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 transition-all"
            >
              <ShoppingCart className="w-4 h-4 sm:ml-1.5" />
              <span className="hidden sm:inline">السلة</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-black text-amber-400 border border-amber-400 text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
