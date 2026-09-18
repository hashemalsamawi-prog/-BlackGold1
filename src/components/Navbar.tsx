import React, { useState, useRef, useEffect } from 'react';
import { Product, StoreSettings, Language, ThemeMode, ProductSortOption } from '../types';
import { Logo } from './Logo';
import { 
  ShoppingCart, MapPin, Package, ShieldAlert, Truck, Bot, User, 
  Search, SlidersHorizontal, Sun, Moon, Sparkles, Smartphone, Monitor,
  X, Check, Flame, ChevronDown, RotateCcw, Compass, HelpCircle, Store
} from 'lucide-react';

interface NavbarProps {
  lang: Language;
  onLanguageToggle: () => void;
  deviceMode: 'web' | 'android';
  onDeviceModeToggle: () => void;
  cartCount: number;
  ordersCount?: number;
  pendingOrdersCount?: number;
  onOpenCart: () => void;
  onOpenMap: () => void;
  onOpenOrders: () => void;
  onOpenAdmin: () => void;
  onOpenMandoub: () => void;
  onOpenAiAdvisor: () => void;
  onOpenCalculator?: () => void;
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
  cartCount,
  ordersCount = 0,
  pendingOrdersCount = 0,
  onOpenCart,
  onOpenMap,
  onOpenOrders,
  onOpenAdmin,
  onOpenMandoub,
  onOpenAiAdvisor,
  onOpenCalculator,
  onOpenAuth,
  searchQuery,
  setSearchQuery,
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
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.nameAr.includes(searchQuery) ||
          (p.nameEn && p.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.descriptionAr && p.descriptionAr.includes(searchQuery))
      )
    : [];

  const handleNavCategory = (catId: string) => {
    setActiveCategory(catId);
    setSearchQuery('');
    const el = document.getElementById('products-grid-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScrollToQuality = () => {
    const el = document.getElementById('quality-protocol-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#222232] bg-[#09090D]/95 backdrop-blur-xl transition-all">
      {/* Top Luxury Announcement Bar */}
      {storeSettings.announcementAr && (
        <div className="bg-gradient-to-r from-[#1A1A24] via-[#242018] to-[#1A1A24] border-b border-amber-500/20 px-4 py-1.5 text-center text-xs font-semibold text-amber-200/90 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>{storeSettings.announcementAr}</span>
        </div>
      )}

      {/* Main Navbar Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 md:gap-6">
          
          {/* Brand Logo & Editorial Nav */}
          <div className="flex items-center gap-6 lg:gap-8 shrink-0">
            <button 
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-right flex items-center focus:outline-none cursor-pointer"
            >
              <Logo size="md" customLogoUrl={storeSettings.customLogoUrl || storeSettings.logo} />
            </button>

            {/* Desktop Editorial Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-bold tracking-wide">
              <button
                onClick={() => handleNavCategory('all')}
                className={`transition-colors cursor-pointer py-1 border-b-2 ${
                  activeCategory === 'all' && !searchQuery
                    ? 'text-amber-400 border-amber-400 font-extrabold'
                    : 'text-slate-300 border-transparent hover:text-white'
                }`}
              >
                {lang === 'ar' ? 'تشكيلة المنتجات' : 'Products'}
              </button>

              <button
                onClick={() => handleNavCategory('premium')}
                className={`transition-colors cursor-pointer py-1 border-b-2 ${
                  activeCategory === 'premium'
                    ? 'text-amber-400 border-amber-400 font-extrabold'
                    : 'text-slate-300 border-transparent hover:text-white'
                }`}
              >
                {lang === 'ar' ? 'الخط الملكي الفاخر' : 'Royal Charcoal'}
              </button>

              <button
                onClick={() => handleNavCategory('wholesale')}
                className={`transition-colors cursor-pointer py-1 border-b-2 flex items-center gap-1.5 ${
                  activeCategory === 'wholesale'
                    ? 'text-amber-400 border-amber-400 font-extrabold'
                    : 'text-slate-300 border-transparent hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-amber-400/80" />
                <span>{lang === 'ar' ? 'التوريد والمقاهي (B2B)' : 'Wholesale (B2B)'}</span>
              </button>

              <button
                onClick={handleScrollToQuality}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer py-1 border-b-2 border-transparent"
              >
                {lang === 'ar' ? 'بروتوكول الجودة' : 'Quality Protocol'}
              </button>
            </nav>
          </div>

          {/* Center Search Input (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md relative">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
                placeholder={lang === 'ar' ? "ابحث عن فحم، حجم، توريد..." : "Search charcoal, packs, wholesale..."}
                className="w-full bg-[#121218] border border-[#262638] focus:border-amber-500/80 rounded-xl py-2 px-4 pr-10 text-xs text-white placeholder-slate-400 focus:outline-none transition-all"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-rose-400 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Live Search Popup */}
            {searchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#14141E] border border-[#2B2B3D] rounded-2xl shadow-2xl p-2.5 z-50 max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400">
                  {lang === 'ar' ? `نتائج البحث (${searchResults.length}):` : `Search Results (${searchResults.length}):`}
                </div>
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProduct(p);
                      setSearchQuery('');
                    }}
                    className="w-full text-right p-2.5 rounded-xl hover:bg-amber-500/10 flex items-center justify-between text-xs text-slate-200 transition-colors cursor-pointer gap-2"
                  >
                    <div>
                      <span className="font-bold text-amber-400 block">{lang === 'ar' ? p.nameAr : (p.nameEn || p.nameAr)}</span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">{p.weightGrams}g • {p.category === 'premium' ? 'ملكي فاخر' : 'شحنات جملة'}</span>
                    </div>
                    <span className="text-white font-mono font-bold shrink-0">{p.price.toLocaleString()} {lang === 'ar' ? 'ر.ي' : 'YER'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Mobile Search Icon Toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 rounded-xl bg-[#14141E] border border-[#222232] text-slate-300 hover:text-white"
              title="بحث"
              aria-label="بحث"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Secondary Services & Tools Dropdown */}
            <div className="relative" ref={toolsRef}>
              <button
                type="button"
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  toolsDropdownOpen 
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
                    : 'bg-[#14141E] border-[#242434] text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
                title={lang === 'ar' ? 'الأدوات والخدمات' : 'Tools & Services'}
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">{lang === 'ar' ? 'الخدمات' : 'Services'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${toolsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {toolsDropdownOpen && (
                <div className="absolute left-0 sm:right-auto mt-2 w-64 rounded-2xl bg-[#14141E] border border-[#2B2B3D] shadow-2xl p-2 z-50 text-right space-y-1 divide-y divide-slate-800/50">
                  <div className="space-y-1 pb-1">
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenAiAdvisor();
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-amber-500/10 text-slate-200 hover:text-amber-300 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-amber-400" />
                        <span>{lang === 'ar' ? 'المستشار الذكي للفحم' : 'AI Charcoal Advisor'}</span>
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">AI</span>
                    </button>

                    {onOpenCalculator && (
                      <button
                        onClick={() => {
                          setToolsDropdownOpen(false);
                          onOpenCalculator();
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-amber-500/10 text-slate-200 hover:text-amber-300 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Flame className="w-4 h-4 text-amber-400" />
                        <span>{lang === 'ar' ? 'حاسبة استهلاك الفحم' : 'Charcoal Calculator'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenMap();
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-amber-500/10 text-slate-200 hover:text-amber-300 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span>{lang === 'ar' ? 'خريطة التوصيل في صنعاء' : "Sana'a Delivery Zones"}</span>
                    </button>
                  </div>

                  {/* Staff Portals Section */}
                  {(userRole === 'owner' || userRole === 'mandoub') && (
                    <div className="pt-1.5 space-y-1">
                      {userRole === 'owner' && (
                        <button
                          onClick={() => {
                            setToolsDropdownOpen(false);
                            onOpenAdmin();
                          }}
                          className="w-full p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                            <span>{lang === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Portal'}</span>
                          </div>
                          {pendingOrdersCount > 0 && (
                            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                              {pendingOrdersCount}
                            </span>
                          )}
                        </button>
                      )}

                      {userRole === 'mandoub' && (
                        <button
                          onClick={() => {
                            setToolsDropdownOpen(false);
                            onOpenMandoub();
                          }}
                          className="w-full p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Truck className="w-4 h-4 text-emerald-400" />
                          <span>{lang === 'ar' ? 'بوابة المندوب والتوصيل' : 'Driver Portal'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Orders Tracker Pill */}
            <button
              onClick={onOpenOrders}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#14141E] border border-[#242434] text-slate-300 hover:text-white hover:border-slate-700 text-xs font-medium transition-all cursor-pointer"
              title={lang === 'ar' ? "تتبع الطلبات" : "Track Orders"}
            >
              <Package className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">{lang === 'ar' ? 'طلباتي' : 'Orders'}</span>
              {ordersCount > 0 && (
                <span className="bg-amber-500 text-[#09090D] text-[10px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {ordersCount}
                </span>
              )}
            </button>

            {/* Account / Login Pill */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#14141E] border border-[#242434] text-slate-300 hover:text-white hover:border-slate-700 text-xs font-medium transition-all cursor-pointer"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline max-w-[100px] truncate">
                {userName || (lang === 'ar' ? 'حسابي' : 'Account')}
              </span>
            </button>

            {/* Subtle Language Toggle */}
            <button
              onClick={onLanguageToggle}
              className="px-2.5 py-1.5 rounded-xl bg-[#14141E] border border-[#242434] text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors cursor-pointer"
              title={lang === 'ar' ? "Switch to English" : "التبديل إلى العربية"}
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>

            {/* Theme Toggle (Subtle) */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-[#14141E] border border-[#242434] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer hidden sm:flex"
              title={lang === 'ar' ? "تبديل المظهر" : "Toggle Theme"}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Cart Luxury Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl gold-gradient-bg text-[#09090D] font-black text-xs hover:brightness-105 shadow-md shadow-amber-500/15 transition-all cursor-pointer shrink-0"
              title={lang === 'ar' ? "سلة المشتريات" : "Shopping Cart"}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'السلة' : 'Cart'}</span>
              {cartCount > 0 && (
                <span className="bg-[#09090D] text-amber-400 text-[10px] font-black rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center border border-amber-400/40">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Row (Expandable) */}
        {mobileSearchOpen && (
          <div className="md:hidden py-3 border-t border-[#1F1F2E] animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? "ابحث عن فحم، أحجام، توريد..." : "Search products..."}
                className="w-full bg-[#121218] border border-[#262638] focus:border-amber-500/80 rounded-xl py-2 px-4 pr-10 text-xs text-white placeholder-slate-400 focus:outline-none"
                autoFocus
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
