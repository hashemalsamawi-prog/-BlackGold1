import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Lock, 
  ShieldCheck, 
  LogIn, 
  ChevronRight, 
  Sparkles, 
  LogOut, 
  KeyRound, 
  ShoppingBag, 
  Truck, 
  MapPin, 
  AlertCircle,
  UserCheck,
  CheckCircle2,
  HelpCircle,
  Store,
  Loader2
} from 'lucide-react';
import { safeGetLocalStorage, safeSetLocalStorage, safeRemoveLocalStorage } from '../utils/storage';
import { api, authStorage } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: string;
  userRole?: 'customer' | 'owner' | 'mandoub';
  onLoginSuccess: (userName: string, userPhone?: string, role?: 'customer' | 'owner' | 'mandoub') => void;
  onLogout?: () => void;
  onOpenMandoub?: () => void;
  onOpenAdmin?: () => void;
  onOpenOrders?: () => void;
  onOpenMap?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser = '',
  userRole = 'customer',
  onLoginSuccess,
  onLogout,
  onOpenMandoub,
  onOpenAdmin,
  onOpenOrders,
  onOpenMap
}) => {
  const [authTab, setAuthTab] = useState<'guest' | 'quick_phone' | 'owner_pin'>('quick_phone');
  const [customerName, setCustomerName] = useState(() => safeGetLocalStorage('bg_customer_name', ''));
  const [customerPhone, setCustomerPhone] = useState(() => safeGetLocalStorage('bg_customer_phone', ''));
  const [ownerPin, setOwnerPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessAnim, setIsSuccessAnim] = useState(false);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset errors on open
  useEffect(() => {
    if (isOpen) {
      setPinError(null);
      setPhoneError(null);
      setIsSuccessAnim(false);
      setIsLoading(false);
      const savedName = safeGetLocalStorage('bg_customer_name', '');
      const savedPhone = safeGetLocalStorage('bg_customer_phone', '');
      if (savedName) setCustomerName(savedName);
      if (savedPhone) setCustomerPhone(savedPhone);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Detect Yemen Telecom Provider
  const getCarrierBadge = (phoneStr: string) => {
    const clean = phoneStr.replace(/\D/g, '');
    if (clean.startsWith('77') || clean.startsWith('78')) return { name: 'يمن موبايل', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    if (clean.startsWith('73')) return { name: 'يو YOU (MTN)', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
    if (clean.startsWith('71')) return { name: 'سبأفون', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
    if (clean.startsWith('70')) return { name: 'واي Y', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    return null;
  };

  const carrier = getCarrierBadge(customerPhone);

  // 1. Easy Quick Phone Login (Server-Side Authenticated)
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 6) {
      setPhoneError('يرجى كتابة رقم هاتف يمني صحيح للتواصل وتأكيد التوصيل');
      return;
    }
    setPhoneError(null);
    setIsLoading(true);

    try {
      const res = await api.quickCustomerLogin(customerPhone.trim(), customerName.trim());
      if (res.token) {
        authStorage.setToken(res.token);
      }
      safeSetLocalStorage('bg_customer_name', res.user.name);
      safeSetLocalStorage('bg_customer_phone', res.user.phone);
      safeSetLocalStorage('bg_user_role', 'customer');

      setIsSuccessAnim(true);
      setTimeout(() => {
        onLoginSuccess(res.user.name, res.user.phone, 'customer');
        setIsSuccessAnim(false);
        setIsLoading(false);
        onClose();
      }, 300);
    } catch (err: any) {
      setIsLoading(false);
      setPhoneError(err.message || 'فشل تسجيل الدخول برقم الهاتف');
    }
  };

  // 2. Guest Mode Continue
  const handleGuestContinue = () => {
    onClose();
  };

  // 4. Owner / Admin PIN Authentication (Server-Side Verified)
  const handleOwnerPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerPin.trim()) {
      setPinError('يرجى إدخال رمز PIN للمالك');
      return;
    }
    setPinError(null);
    setIsLoading(true);

    try {
      const res = await api.adminLogin({ pin: ownerPin.trim() });
      if (res.token) {
        authStorage.setToken(res.token);
      }
      safeSetLocalStorage('bg_customer_name', res.user.name);
      safeSetLocalStorage('bg_customer_phone', res.user.phone);
      safeSetLocalStorage('bg_user_role', res.user.role || 'owner');

      setIsSuccessAnim(true);
      setTimeout(() => {
        onLoginSuccess(res.user.name, res.user.phone, (res.user.role as any) || 'owner');
        setIsSuccessAnim(false);
        setIsLoading(false);
        onClose();
        if (onOpenAdmin) onOpenAdmin();
      }, 300);
    } catch (err: any) {
      setIsLoading(false);
      setPinError(err.message || 'رمز المرور غير صحيح. الرمز الافتراضي للمالك هو: 7777');
    }
  };

  // 5. Logout
  const handleLogoutClick = () => {
    authStorage.removeToken();
    safeRemoveLocalStorage('bg_customer_name');
    safeRemoveLocalStorage('bg_customer_phone');
    safeRemoveLocalStorage('bg_user_role');
    if (onLogout) {
      onLogout();
    } else {
      onLoginSuccess('', '', 'customer');
    }
    setCustomerName('');
    setCustomerPhone('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-[#121218] border border-amber-500/40 rounded-3xl max-w-md w-full p-4 sm:p-6 text-slate-100 relative shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto text-right"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              title="الرجوع للتسوق"
            >
              <ChevronRight className="w-4 h-4 text-amber-400" />
              <span>رجوع للتسوق</span>
            </button>

            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                {currentUser ? 'حساب العميل' : 'حساب العميل أو الدخول كزائر'}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400">متجر فحم الذهب الأسود - صنعاء</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ALREADY LOGGED IN PROFILE VIEW */}
        {currentUser ? (
          <div className="space-y-4 py-2">
            
            {/* Customer Profile Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#181822] border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-lg shadow-lg shadow-amber-500/20">
                    {currentUser.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-white">{currentUser}</h3>
                      {userRole === 'owner' ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                          المالك 👑
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                          جلسة موثقة ⭐
                        </span>
                      )}
                    </div>
                    {customerPhone && (
                      <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-amber-400" />
                        <span>{customerPhone}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct Ordering Notice */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-300/90 font-medium">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>توجيه الطلبات:</span>
                </span>
                <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 font-mono">
                  واتساب المبيعات: 775000150
                </span>
              </div>
            </div>

            {/* Quick Actions for Logged in Customer */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {onOpenOrders && (
                <button
                  onClick={() => { onClose(); onOpenOrders(); }}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-200 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span>تتبع طلباتي</span>
                </button>
              )}

              {onOpenMap && (
                <button
                  onClick={() => { onClose(); onOpenMap(); }}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-200 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>عناوين التوصيل</span>
                </button>
              )}
            </div>

            {/* If Owner is logged in, show Owner Dashboard Access */}
            {userRole === 'owner' && onOpenAdmin && (
              <button
                onClick={() => { onClose(); onOpenAdmin(); }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/30 hover:from-amber-500/30 hover:to-amber-600/40 text-amber-300 border border-amber-500/50 font-black text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-transform cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>فتح لوحة تحكم وإدارة المتجر 👑</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogoutClick}
              className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>تسجيل الخروج والتحويل لوضع الزائر</span>
            </button>
          </div>
        ) : (
          /* NOT LOGGED IN - 3 CLEAR OPTIONS */
          <div className="space-y-4">
            
            {/* 3 Main Tabs: Guest Shopping | Phone Login | Owner PIN */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setAuthTab('guest')}
                className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  authTab === 'guest'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShoppingBag className="w-3 h-3" />
                <span>دخول كزائر 🛍️</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthTab('quick_phone')}
                className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  authTab === 'quick_phone'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Phone className="w-3 h-3" />
                <span>برقم الهاتف ⚡</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthTab('owner_pin')}
                className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  authTab === 'owner_pin'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>المالك (PIN) 👑</span>
              </button>
            </div>

            {/* TAB 1: GUEST SHOPPING (ZERO FRICTION) */}
            {authTab === 'guest' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 text-xs text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 font-black text-white text-sm">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>التسوق السريع كزائر (بدون حساب)</span>
                  </div>
                  <p className="leading-relaxed text-slate-300 text-[11px]">
                    يمكنك تصفح المنتجات وإضافتها للسلة وطلب التوصيل المباشر كزائر بكل سهولة. سيصل طلبك فوراً إلى رقم إدارة المبيعات المعتمد: <strong className="text-amber-300 font-mono">775000150</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>حرية كاملة لإضافة أي كمية من الفحم للسلة</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>كتابة العنوان ورقم التواصل وقت الدفع فقط</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>إرسال الفاتورة آلياً عبر واتساب المبيعات: 775000150</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGuestContinue}
                  className="w-full py-3.5 rounded-xl gold-gradient-bg text-slate-950 font-black text-xs sm:text-sm hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 fill-slate-950" />
                  <span>مواصلة التسوق الآن كزائر 🛒</span>
                </button>
              </div>
            )}

            {/* TAB 2: QUICK PHONE LOGIN (SERVER VERIFIED) */}
            {authTab === 'quick_phone' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-xs text-amber-300 flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="leading-relaxed text-[11px]">
                    سجل رقمك لحفظ عناوينك الدائمة في صنعاء وتتبع طلباتك السابقة بجلسة آمنة وموثوقة! 🔥
                  </p>
                </div>

                <form onSubmit={handlePhoneLogin} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      اسم العميل الكريم: <span className="text-slate-500 text-[10px]">(اختياري)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="مثال: أحمد الشامي"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white py-2.5 px-9 rounded-xl outline-none focus:border-amber-500 transition-colors text-xs font-bold"
                      />
                      <User className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-bold">
                        رقم الهاتف (واتساب / اتصال): <span className="text-amber-400">*</span>
                      </label>
                      {carrier && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${carrier.color}`}>
                          {carrier.name}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="77XXXXXXX أو 73XXXXXXX"
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value);
                          if (phoneError) setPhoneError(null);
                        }}
                        dir="ltr"
                        className={`w-full bg-slate-900 border text-white py-2.5 px-9 rounded-xl outline-none transition-colors text-right font-mono font-bold ${
                          phoneError ? 'border-red-500 ring-1 ring-red-500/40' : 'border-slate-800 focus:border-amber-500'
                        }`}
                      />
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                    {phoneError && (
                      <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{phoneError}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl gold-gradient-bg text-slate-950 font-black hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer mt-1 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 fill-slate-950" />
                        <span>دخول وتوثيق الحساب ومتابعة التسوق ⚡</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Continue as Guest Button */}
                <button
                  type="button"
                  onClick={handleGuestContinue}
                  className="w-full text-center py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 text-xs font-bold transition-all block cursor-pointer"
                >
                  تخطي والدخول للتسوق كزائر ←
                </button>
              </div>
            )}

            {/* TAB 3: OWNER / MANAGER ACCESS (PIN VERIFIED VIA BACKEND) */}
            {authTab === 'owner_pin' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-300 flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-white">بوابة إدارة المالك الموثقة</h4>
                    <p className="text-[11px] text-amber-300/80 mt-0.5">
                      مخصصة للمالك (هاشم السماوي) والإدارة للتحكم بالأسعار والمخزون والمناديب. الرمز الافتراضي: <strong className="text-amber-400 font-mono">7777</strong>
                    </p>
                  </div>
                </div>

                <form onSubmit={handleOwnerPinSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      رمز دخول الإدارة (PIN):
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        maxLength={8}
                        placeholder="أدخل رمز PIN (مثال: 7777)"
                        value={ownerPin}
                        onChange={(e) => {
                          setOwnerPin(e.target.value);
                          if (pinError) setPinError(null);
                        }}
                        dir="ltr"
                        className={`w-full bg-slate-900 border text-white py-2.5 px-9 rounded-xl outline-none text-center font-mono text-base tracking-widest transition-colors ${
                          pinError ? 'border-red-500 ring-1 ring-red-500/40' : 'border-slate-800 focus:border-amber-500'
                        }`}
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5 pointer-events-none" />
                    </div>
                    {pinError && (
                      <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{pinError}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 fill-slate-950" />
                        <span>تأكيد والتحقق من صلاحية المالك 👑</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Mandoub Driver Portal Link */}
            {onOpenMandoub && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMandoub();
                  }}
                  className="text-amber-400/90 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>🛵 بوابة كابتن التوصيل (المندوب)</span>
                </button>
                <span className="text-slate-500 text-[10px]">فحم الذهب الأسود صنعاء</span>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
