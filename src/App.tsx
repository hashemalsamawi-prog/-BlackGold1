/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem, Order, DeliveryAddress, Review, Language, DeliveryAgent, MarketingCampaign, StoreSettings, ThemeMode, ProductSortOption } from './types';
import { INITIAL_PRODUCTS, MOCK_ADDRESSES, INITIAL_DELIVERY_AGENTS, INITIAL_CAMPAIGNS, INITIAL_STORE_SETTINGS, INITIAL_GALLERY_ITEMS } from './data/mockData';
import { GalleryItem } from './types';

// Components
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { InteractiveMapModal } from './components/InteractiveMapModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { MandoubPortal } from './components/MandoubPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { AiAdvisorModal } from './components/AiAdvisorModal';
import { AuthModal } from './components/AuthModal';
import { WelcomeModal } from './components/WelcomeModal';
import { AndroidSimulatorWrapper } from './components/AndroidSimulatorWrapper';
import { Logo } from './components/Logo';
import { MarketingGallery } from './components/MarketingGallery';
import { MobileBottomNav } from './components/MobileBottomNav';
import { B2BProfitCalculator } from './components/B2BProfitCalculator';
import { QualityProtocolSection } from './components/QualityProtocolSection';
import { playOrderAlertSound } from './utils/soundAlert';
import { safeGetLocalStorage, safeSetLocalStorage, safeRemoveLocalStorage } from './utils/storage';

import { Flame, Sparkles, CheckCircle2, ShieldCheck, MapPin, Truck, Phone, Award, MessageSquare, Store, Calculator, Sun, Moon, Mail, SlidersHorizontal, ArrowUpDown, RotateCcw, Filter, X, AlertTriangle, RefreshCw, Clock, WifiOff, AlertCircle } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [deviceMode, setDeviceMode] = useState<'web' | 'android'>('web');
  const [userName, setUserName] = useState<string>(() => {
    return safeGetLocalStorage('bg_customer_name', '');
  });
  const [userRole, setUserRole] = useState<'owner' | 'mandoub' | 'customer'>(() => {
    const saved = safeGetLocalStorage('bg_user_role', 'customer');
    if (saved === 'owner' || saved === 'mandoub' || saved === 'customer') return saved;
    return 'customer';
  });

  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = safeGetLocalStorage('bg_theme', 'dark');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      safeSetLocalStorage('bg_theme', next);
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    }
  }, [theme]);

  const calculatorRef = useRef<HTMLDivElement>(null);

  // State with LocalStorage Persistence for Products
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = safeGetLocalStorage('bg_saved_products', '');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse bg_saved_products', e);
      }
    }
    return INITIAL_PRODUCTS;
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = safeGetLocalStorage('bg_saved_orders', '');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse bg_saved_orders', e);
      }
    }
    return [];
  });
  // Address State with localStorage persistence
  const [addresses, setAddresses] = useState<DeliveryAddress[]>(() => {
    const saved = safeGetLocalStorage('bg_saved_addresses', '');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return MOCK_ADDRESSES;
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
    const saved = safeGetLocalStorage('bg_selected_address_id', '');
    if (saved) return saved;
    return MOCK_ADDRESSES[0]?.id || '';
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>(INITIAL_DELIVERY_AGENTS);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(INITIAL_CAMPAIGNS);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    const saved = safeGetLocalStorage('bg_saved_gallery', '');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse bg_saved_gallery', e);
      }
    }
    return INITIAL_GALLERY_ITEMS;
  });
  const [selectedDriverName, setSelectedDriverName] = useState<string>('أحمد الكبسي');
  const [isOwnerDriverPreview, setIsOwnerDriverPreview] = useState<boolean>(false);

  const handleLoginSuccess = (name: string, phone?: string, role: 'owner' | 'mandoub' | 'customer' = 'customer') => {
    setUserName(name);
    setUserRole(role);
    if (name) safeSetLocalStorage('bg_customer_name', name);
    if (phone) safeSetLocalStorage('bg_customer_phone', phone);
    safeSetLocalStorage('bg_user_role', role);
    if (role === 'owner') {
      setToastMessage("مرحباً بك يا مدير المتجر! تم تفعيل لوحة الإدارة 👑");
    } else {
      setToastMessage(`مرحباً بك ${name}! نتمنى لك تسوقاً ممتعاً 🔥`);
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLogout = () => {
    setUserName('');
    setUserRole('customer');
    safeRemoveLocalStorage('bg_customer_name');
    safeRemoveLocalStorage('bg_customer_phone');
    safeRemoveLocalStorage('bg_user_role');
    setToastMessage("تم تسجيل الخروج بنجاح");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<ProductSortOption>('popular');

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('popular');
  };

  // Modals
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [mandoubOpen, setMandoubOpen] = useState(false);
  const [aiAdvisorOpen, setAiAdvisorOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState<boolean>(() => {
    const seen = safeGetLocalStorage('bg_welcome_seen', '');
    return !seen;
  });

  const handleContinueAsGuest = () => {
    safeSetLocalStorage('bg_welcome_seen', 'true');
    setWelcomeOpen(false);
  };

  // Checkout Params
  const [checkoutShippingFee, setCheckoutShippingFee] = useState(1000);
  const [checkoutDiscount, setCheckoutDiscount] = useState(0);
  const [checkoutCustomerNotes, setCheckoutCustomerNotes] = useState('');
  const [checkoutDistrictName, setCheckoutDistrictName] = useState('حدة');

  // Toast Push Notification (No automatic popup on first visit)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [fetchAttempt, setFetchAttempt] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    // Fetch from Express server with seamless local fallback
    fetch('/api/products')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setProducts(data.data);
          safeSetLocalStorage('bg_saved_products', JSON.stringify(data.data));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Products background sync note:', err);
      });

    fetch('/api/orders')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.data)) {
          setOrders(data.data);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Orders fetch note:', err);
      });

    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && isMounted) {
          setReviews(data.data);
        }
      })
      .catch(() => {});

    // Fetch gallery items
    fetch('/api/gallery')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0 && isMounted) {
          const savedLocalGal = safeGetLocalStorage('bg_saved_gallery', '');
          if (savedLocalGal) {
            try {
              const parsed = JSON.parse(savedLocalGal);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setGalleryItems(parsed);
                return;
              }
            } catch (e) {
              console.error(e);
            }
          }
          setGalleryItems(data.data);
          safeSetLocalStorage('bg_saved_gallery', JSON.stringify(data.data));
        }
      })
      .catch(() => {});

    // Fetch store settings & custom logo
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && isMounted) {
          const storedLogo = safeGetLocalStorage('bg_custom_logo', '');
          setStoreSettings({
            ...INITIAL_STORE_SETTINGS,
            ...data.data,
            customLogoUrl: storedLogo || data.data.customLogoUrl || ''
          });
        }
      })
      .catch(() => {
        const storedLogo = safeGetLocalStorage('bg_custom_logo', '');
        if (storedLogo && isMounted) {
          setStoreSettings(prev => ({ ...prev, customLogoUrl: storedLogo }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchAttempt]);

  const handleUpdateStoreSettings = async (newSettings: StoreSettings) => {
    setStoreSettings(newSettings);
    if (newSettings.customLogoUrl) {
      safeSetLocalStorage('bg_custom_logo', newSettings.customLogoUrl);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('bg_logo_updated'));
      }
    } else {
      safeRemoveLocalStorage('bg_custom_logo');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('bg_logo_updated'));
      }
    }

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
    } catch (e) {
      console.log('Settings save local fallback', e);
    }

    setToastMessage("تم تحديث وتطبيق شعار وهوية المتجر بنجاح في كافة الشاشات! 👑✨");
    setTimeout(() => setToastMessage(null), 4000);
  };


  // Cart operations
  const handleAddToCart = (product: Product, selectedWeight: string, quantity: number, price: number) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedWeight === selectedWeight
      );
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, selectedWeight, quantity, unitPrice: price }];
    });
    setToastMessage(`تمت إضافة ${product.nameAr} (${selectedWeight}) إلى السلة!`);
    // Automatically open cart drawer for immediate feedback to customer
    setCartOpen(true);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleQuickWholesaleSample = () => {
    const wholesaleBox = products.find(p => p.id === 'bg-retail-box') || products[0];
    handleAddToCart(wholesaleBox, wholesaleBox.weightOptions?.[0]?.weight || "24 عبوة مشكلة", 1, wholesaleBox.price);
    setToastMessage("تم تجهيز كرتون العرض الترويجي للبقالات مع الستاند المجاني!");
  };

  const scrollToCalculator = () => {
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProceedToCheckout = (
    shippingFee: number,
    discountVal: number,
    notes: string,
    districtName: string
  ) => {
    setCheckoutShippingFee(shippingFee);
    setCheckoutDiscount(discountVal);
    setCheckoutCustomerNotes(notes);
    setCheckoutDistrictName(districtName);
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleOrderPlaced = (newOrder: Order) => {
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      safeSetLocalStorage('bg_saved_orders', JSON.stringify(updated));
      return updated;
    });
    setCart([]);
    playOrderAlertSound(0.85);
    setToastMessage(`🔔 تم وصول وإرسال الطلب ${newOrder.orderNumber} للمندوب في صنعاء بنجاح! 🎉`);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status'], driverNotes?: string) => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, status, driverNotes: driverNotes || o.driverNotes } : o));
      safeSetLocalStorage('bg_saved_orders', JSON.stringify(updated));
      return updated;
    });

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, driverNotes, bypassForPreview: true })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOrders((prev) => {
          const updated = prev.map((o) => (o.id === orderId ? data.data : o));
          safeSetLocalStorage('bg_saved_orders', JSON.stringify(updated));
          return updated;
        });
      }

      // If cancelled, refresh products to reflect restored stock levels
      if (status === 'cancelled') {
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (prodData.success && prodData.data) {
          setProducts(prodData.data);
          safeSetLocalStorage('bg_saved_products', JSON.stringify(prodData.data));
        }
      }
    } catch {
      // Offline fallback
    }

    if (status === 'cancelled') {
      setToastMessage('⚠️ تم إلغاء الطلب واسترجاع كافة الكميات إلى المخزون بنجاح!');
    } else if (status === 'delivered') {
      setToastMessage('✅ تم تحديث حالة الطلب إلى: تم التسليم بنجاح');
    } else {
      setToastMessage(`تم تحديث حالة الطلب إلى: ${status === 'delivering' ? 'في الطريق مع المندوب' : status}`);
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddProduct = async (p: any) => {
    const mockNew = { id: "p_" + Date.now(), ...p };
    setProducts((prev) => {
      const updated = [mockNew, ...prev];
      safeSetLocalStorage('bg_saved_products', JSON.stringify(updated));
      return updated;
    });

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProducts((prev) => {
          const updated = prev.map((item) => item.id === mockNew.id ? data.data : item);
          safeSetLocalStorage('bg_saved_products', JSON.stringify(updated));
          return updated;
        });
      }
    } catch {
      // Local copy already saved in state and localStorage
    }
    setToastMessage("تم إضافة المنتج الجديد وحفظه بنجاح إلى القائمة!");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUpdateProduct = async (id: string, updatedPayload: any) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updatedPayload } : p));
      safeSetLocalStorage('bg_saved_products', JSON.stringify(updated));
      return updated;
    });

    // If modal is currently viewing this product, update it in realtime
    setSelectedProductDetails((prev) => (prev && prev.id === id ? { ...prev, ...updatedPayload } : prev));

    try {
      await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload)
      });
    } catch (e) {
      console.log('Offline fallback for product update', e);
    }
    setToastMessage("تم حفظ وتحديث صورة وبيانات المنتج بنجاح! 📸✨");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteProduct = async (id: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      safeSetLocalStorage('bg_saved_products', JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch {
      // Offline fallback
    }
    setToastMessage("تم حذف المنتج وحفظ التغييرات بنجاح!");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddGalleryItem = async (item: Omit<GalleryItem, 'id'>) => {
    const newItem: GalleryItem = {
      id: 'g_' + Date.now(),
      ...item
    };
    setGalleryItems(prev => {
      const updated = [newItem, ...prev];
      safeSetLocalStorage('bg_saved_gallery', JSON.stringify(updated));
      return updated;
    });

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGalleryItems(prev => {
          const updated = prev.map(it => it.id === newItem.id ? data.data : it);
          safeSetLocalStorage('bg_saved_gallery', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.log('Gallery local fallback', e);
    }
    setToastMessage("تمت إضافة صورة المعرض الجديدة بنجاح! 📸✨");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUpdateGalleryItem = async (id: string, updatedPayload: Partial<GalleryItem>) => {
    setGalleryItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, ...updatedPayload } : item);
      safeSetLocalStorage('bg_saved_gallery', JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch(`/api/gallery/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload)
      });
    } catch (e) {
      console.log('Gallery update fallback', e);
    }
    setToastMessage("تم تعديل وحفظ صورة المعرض بنجاح! 📸✨");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteGalleryItem = async (id: string) => {
    setGalleryItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      safeSetLocalStorage('bg_saved_gallery', JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.log('Gallery delete fallback', e);
    }
    setToastMessage("تم حذف الصورة من المعرض بنجاح!");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddReview = async (productId: string, rating: number, comment: string, name: string) => {
    const newRev = {
      id: "rev-" + Date.now(),
      productId,
      userName: name,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0],
      verifiedPurchase: true
    };
    setReviews((prev) => [newRev, ...prev]);
  };

  const handleSaveAddress = (newAddr: DeliveryAddress) => {
    setAddresses((prev) => {
      const updated = [newAddr, ...prev.filter(a => a.id !== newAddr.id)];
      safeSetLocalStorage('bg_saved_addresses', JSON.stringify(updated));
      return updated;
    });
    setSelectedAddressId(newAddr.id);
    safeSetLocalStorage('bg_selected_address_id', newAddr.id);
  };

  const handleUpdateAddress = (updatedAddr: DeliveryAddress) => {
    setAddresses((prev) => {
      const updated = prev.map(a => a.id === updatedAddr.id ? updatedAddr : a);
      safeSetLocalStorage('bg_saved_addresses', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses((prev) => {
      const updated = prev.filter(a => a.id !== id);
      safeSetLocalStorage('bg_saved_addresses', JSON.stringify(updated));
      if (selectedAddressId === id && updated.length > 0) {
        setSelectedAddressId(updated[0].id);
        safeSetLocalStorage('bg_selected_address_id', updated[0].id);
      }
      return updated;
    });
  };

  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
    safeSetLocalStorage('bg_selected_address_id', id);
  };

  // Filter and sort products by search, category, price range, and sort option
  const filteredProducts = React.useMemo(() => {
    let result = products.filter((p) => {
      // Category filter
      const matchesCat = activeCategory === 'all' || p.category === activeCategory;
      
      // Text search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.descriptionAr.toLowerCase().includes(q) ||
        p.origin.toLowerCase().includes(q) ||
        (p.weight && p.weight.toLowerCase().includes(q));

      // Price range filter
      const matchesMin = minPrice === '' || p.price >= Number(minPrice);
      const matchesMax = maxPrice === '' || p.price <= Number(maxPrice);

      return matchesCat && matchesSearch && matchesMin && matchesMax;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'newest') return (b.id || '').localeCompare(a.id || '');
      // Default: 'popular' (best sellers first, then sales count, then rating)
      const aScore = (a.isBestSeller ? 1000 : 0) + (a.salesCount || 0) * 2 + (a.rating || 0) * 10;
      const bScore = (b.isBestSeller ? 1000 : 0) + (b.salesCount || 0) * 2 + (b.rating || 0) * 10;
      return bScore - aScore;
    });

    return result;
  }, [products, activeCategory, searchQuery, minPrice, maxPrice, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== '' || minPrice !== '' || maxPrice !== '' || sortBy !== 'popular';

  return (
    <AndroidSimulatorWrapper deviceMode={deviceMode} onToggleDeviceMode={() => setDeviceMode(deviceMode === 'web' ? 'android' : 'web')}>
      <div className={`min-h-screen ${theme === 'light' ? 'light bg-[#F8F9FC] text-slate-900' : 'bg-[#0A0A0C] text-slate-100'} flex flex-col justify-between selection:bg-amber-500 selection:text-black transition-colors duration-300`}>
        
        {/* Push Notification Toast */}
        {toastMessage && (
          <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md bg-slate-900/95 border border-amber-500/50 p-3.5 rounded-2xl shadow-2xl text-xs font-bold text-amber-300 flex items-center justify-between gap-3 animate-bounce">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Main Sticky Navbar */}
        <Navbar
          lang={lang}
          onLanguageToggle={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          deviceMode={deviceMode}
          onDeviceModeToggle={() => setDeviceMode(deviceMode === 'web' ? 'android' : 'web')}
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          onOpenCart={() => setCartOpen(true)}
          onOpenMap={() => setMapOpen(true)}
          onOpenOrders={() => setOrdersOpen(true)}
          onOpenAdmin={() => setAdminOpen(true)}
          onOpenMandoub={() => {
            setIsOwnerDriverPreview(false);
            setMandoubOpen(true);
          }}
          onOpenAiAdvisor={() => setAiAdvisorOpen(true)}
          onOpenAuth={() => setAuthOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onResetFilters={handleResetFilters}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          userName={userName}
          userRole={userRole}
          products={products}
          onSelectProduct={(p) => setSelectedProductDetails(p)}
          storeSettings={storeSettings}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Hero Banner Header */}
        <HeroBanner
          lang={lang}
          userName={userName}
          onOpenAiAdvisor={() => setAiAdvisorOpen(true)}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            setSearchQuery('');
            const el = document.getElementById('products-grid-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        />

        {/* Main Products Grid Section */}
        <main id="products-grid-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 flex-1 w-full scroll-mt-28">
          
          {/* Category Switcher & Filter Headline */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Flame className="w-4 h-4 fill-amber-400/30" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {activeCategory === 'all'
                    ? '✨ جميع أصناف وعبوات فحم الذهب الأسود'
                    : activeCategory === 'premium'
                    ? '👑 الخط الفاخر الملكي (Zipper Lock)'
                    : activeCategory === 'local'
                    ? '🔥 الخط الشعبي الاقتصادي اليومي'
                    : activeCategory === 'wholesale'
                    ? '📦 خط الجملة وتجهيز البقالات والمطاعم'
                    : activeCategory === 'bbq'
                    ? '⚡ مكعبات ومستلزمات الإشعال السريع'
                    : 'منتجات الذهب الأسود'}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                {activeCategory === 'all' && 'استعرض جميع العبوات الملكية والشعبية وعروض التوريد للمحلات والمطاعم مع ضمان (+10g مجاناً)'}
                {activeCategory === 'premium' && 'أكياس Zipper الفاخرة العازلة للرطوبة (250g، 500g، 1kg) بأعلى درجات الفرز والنقاء'}
                {activeCategory === 'local' && 'فحم بلدي اقتصادي عالي الجودة ومغربل ميكانيكياً بدون أتربة أو دخان'}
                {activeCategory === 'wholesale' && 'صناديق نقاط البيع مع استاندات العرض الخشبية وشوالات المطاعم الكبرى 20kg بأسعار جملة'}
                {activeCategory === 'bbq' && 'مكعبات إشعال فورية آمنة وبدون روائح تدوم وتسهل إشعال الفحم خلال ثوانٍ'}
              </p>
            </div>

            {/* Category Quick Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full pb-1">
              {[
                { id: 'all', label: '🌟 الكل' },
                { id: 'premium', label: '👑 الفاخر الملكي' },
                { id: 'local', label: '🔥 الاقتصادي' },
                { id: 'bbq', label: '⚡ الإشعال' },
                { id: 'wholesale', label: '📦 الجملة' }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCategory(c.id);
                    setSearchQuery('');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === c.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-105 ring-2 ring-amber-400/60'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filter Indicators Strip */}
          {hasActiveFilters && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>الفلاتر النشطة ({filteredProducts.length} منتج):</span>
                </span>

                {searchQuery.trim() && (
                  <span className="bg-slate-900 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 font-medium">
                    <span>البحث: "{searchQuery}"</span>
                    <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-rose-400">✕</button>
                  </span>
                )}

                {(minPrice !== '' || maxPrice !== '') && (
                  <span className="bg-slate-900 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/40 flex items-center gap-1 font-medium">
                    <span>
                      السعر: {minPrice ? `من ${Number(minPrice).toLocaleString()} ر.ي` : ''} {maxPrice ? `إلى ${Number(maxPrice).toLocaleString()} ر.ي` : ''}
                    </span>
                    <button
                      onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {sortBy !== 'popular' && (
                  <span className="bg-slate-900 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/40 flex items-center gap-1 font-medium">
                    <span>
                      الترتيب: {sortBy === 'newest' ? '🆕 الأحدث وصولاً' : sortBy === 'price-asc' ? '📈 الأقل سعراً' : sortBy === 'price-desc' ? '📉 الأعلى سعراً' : '⭐ الأعلى تقييماً'}
                    </span>
                    <button onClick={() => setSortBy('popular')} className="text-slate-400 hover:text-rose-400">✕</button>
                  </span>
                )}
              </div>

              <button
                onClick={handleResetFilters}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold hover:underline cursor-pointer mr-auto sm:mr-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط الكل</span>
              </button>
            </div>
          )}

          {/* Grid Cards */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
              <Flame className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-400">لم يتم العثور على منتجات مطابقة للبحث.</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="text-xs text-amber-400 font-bold underline cursor-pointer"
              >
                عرض كافة منتجات الفحم
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  lang={lang}
                  onAddToCart={handleAddToCart}
                  onOpenDetails={(p) => setSelectedProductDetails(p)}
                />
              ))}
            </div>
          )}

          {/* B2B Profit Calculator is shown ONLY to authorized store owners and admins in the Wholesale section */}
          {(userRole === 'owner' || (userRole as string) === 'admin') && activeCategory === 'wholesale' && (
            <div ref={calculatorRef} className="space-y-6">
              <B2BProfitCalculator
                lang={lang}
                onOpenWholesaleOrder={handleQuickWholesaleSample}
              />
            </div>
          )}

          {/* Quality Protocol & Assurance Section */}
          <QualityProtocolSection lang={lang} />

          {/* Marketing & Real Product Photos Gallery */}
          <MarketingGallery lang={lang} />

          {/* B2B Grocery & Restaurant Wholesale Partner Banner */}
          {activeCategory !== 'wholesale' && (
            <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-[#161622] to-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6 text-right">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black">
                  <Store className="w-3.5 h-3.5" />
                  <span>خدمات التوريد المباشر للبقالات والمطاعم بصنعاء</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  هل تدير بقالة، سوبرماركت، أو مطعماً وتريد شحنات دورية منتظمة؟
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  نوفر صناديق التوزيع الفاخرة مع استاندات العرض المعدنية، وشوالات المطاعم الكبرى 20kg بأسعار جملة منافسة وتوصيل دوري مباشر.
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveCategory('wholesale');
                  window.scrollTo({ top: 350, behavior: 'smooth' });
                }}
                className="px-6 py-3.5 rounded-xl gold-gradient-bg text-slate-950 font-black text-sm hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Store className="w-4 h-4 fill-slate-950" />
                <span>تصفح عروض وأسعار الجملة</span>
              </button>
            </section>
          )}

          {/* Value Banners Footer Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-5 rounded-2xl bg-[#121218] border border-amber-500/20 space-y-2">
              <Truck className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="font-black text-white text-sm">توصيل فوري داخل صنعاء</h4>
              <p className="text-xs text-slate-400">تغطية شاملة لكافة مديريات وأحياء صنعاء خلال 45 دقيقة</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#121218] border border-amber-500/20 space-y-2">
              <Award className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="font-black text-white text-sm">جودة الذهب الأسود</h4>
              <p className="text-xs text-slate-400">حرارة فائقة الشدة ورماد أبيض كريستالي بدون أي رائحة</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#121218] border border-amber-500/20 space-y-2">
              <ShieldCheck className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="font-black text-white text-sm">طرق دفع محليّة متعددة</h4>
              <p className="text-xs text-slate-400">الدفع عند الاستلام كاش أو حاسب / بنك الكريمي والمحافظ الإلكترونية</p>
            </div>
          </section>

        </main>

        {/* Global Footer */}
        <footer className="bg-[#08080B] border-t border-slate-900 py-8 text-center text-xs text-slate-500 space-y-4">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Logo variant="horizontal" size="md" />
              <div className="text-right sm:border-r border-slate-800 sm:pr-4 text-slate-400">
                <span className="font-bold block text-slate-300">شركة الذهب الأسود - للتوصيل والحلول المتكاملة</span>
                <span className="text-[11px] text-slate-500">فحم فاخر درجة أولى • جميع الحقوق محفوظة © 2026</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 font-bold">
              <a 
                href="https://wa.me/967775000150?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D9%85%D9%86%D8%AA%D8%AC%D8%A7%D8%AA%20%D9%81%D8%AD%D9%85%20%D8%A7%D9%84%D8%B0%D9%87%D8%A8%20%D8%A7%D9%84%D8%A3%D8%B3%D9%88%D8%AF" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-black"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>واتساب المبيعات: 775000150 💬</span>
              </a>
              <span>•</span>
              <a 
                href="mailto:blackgoled.ye@gmail.com" 
                className="text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>blackgoled.ye@gmail.com</span>
              </a>
              <span>•</span>
              <span>أمانة العاصمة - صنعاء</span>
              <span>•</span>
              <button onClick={() => setOrdersOpen(true)} className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">
                تتبع حالة الطلب
              </button>
              <span>•</span>
              <button 
                onClick={() => setAdminOpen(true)} 
                className="text-amber-400/90 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30"
              >
                <span>لوحة تحكم المالك 👑 (PIN: 7777)</span>
              </button>
            </div>
          </div>
        </footer>

        {/* Modals & Slide-overs */}
        <ProductDetailModal
          product={selectedProductDetails}
          lang={lang}
          onClose={() => setSelectedProductDetails(null)}
          onAddToCart={handleAddToCart}
          reviews={reviews}
          onAddReview={handleAddReview}
        />

        <CartDrawer
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          cart={cart}
          lang={lang}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveCartItem}
          onProceedToCheckout={handleProceedToCheckout}
          onOpenMap={() => setMapOpen(true)}
          savedAddresses={addresses}
          selectedAddressId={selectedAddressId}
          setSelectedAddressId={handleSelectAddress}
        />

        <InteractiveMapModal
          isOpen={mapOpen}
          onClose={() => setMapOpen(false)}
          addresses={addresses}
          onSaveAddress={handleSaveAddress}
          onUpdateAddress={handleUpdateAddress}
          onDeleteAddress={handleDeleteAddress}
          selectedAddressId={selectedAddressId}
          onSelectAddress={handleSelectAddress}
        />

        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          cart={cart}
          lang={lang}
          shippingFee={checkoutShippingFee}
          discount={checkoutDiscount}
          customerNotes={checkoutCustomerNotes}
          selectedDistrictName={checkoutDistrictName}
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          onSelectAddress={handleSelectAddress}
          onSaveAddress={handleSaveAddress}
          onUpdateAddress={handleUpdateAddress}
          onDeleteAddress={handleDeleteAddress}
          onOrderPlaced={handleOrderPlaced}
          onOpenTracking={() => setOrdersOpen(true)}
        />

        <OrderTrackerModal
          isOpen={ordersOpen}
          onClose={() => setOrdersOpen(false)}
          orders={orders}
          lang={lang}
          userName={userName}
          onShopNow={() => {
            setOrdersOpen(false);
            window.scrollTo({ top: 400, behavior: 'smooth' });
          }}
        />

        <MandoubPortal
          isOpen={mandoubOpen}
          onClose={() => setMandoubOpen(false)}
          orders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          lang={lang}
          driverName={selectedDriverName}
          availableDrivers={deliveryAgents}
          onSelectDriver={(name) => setSelectedDriverName(name)}
          isOwnerPreview={isOwnerDriverPreview}
          onBackToAdmin={() => {
            setMandoubOpen(false);
            setAdminOpen(true);
          }}
        />

        <AdminDashboard
          isOpen={adminOpen}
          onClose={() => setAdminOpen(false)}
          products={products}
          orders={orders}
          reviews={reviews}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          lang={lang}
          storeSettings={storeSettings}
          onUpdateStoreSettings={handleUpdateStoreSettings}
          deliveryAgents={deliveryAgents}
          onUpdateDeliveryAgents={(d) => setDeliveryAgents(d)}
          campaigns={campaigns}
          onUpdateCampaigns={(c) => setCampaigns(c)}
          onOpenDriverScreen={(driverName) => {
            setSelectedDriverName(driverName);
            setIsOwnerDriverPreview(true);
            setAdminOpen(false);
            setMandoubOpen(true);
          }}
          userRole={userRole}
          onChangeUserRole={(r) => setUserRole(r)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <AiAdvisorModal
          isOpen={aiAdvisorOpen}
          onClose={() => setAiAdvisorOpen(false)}
          onSelectRecommendedProduct={(id) => {
            const p = products.find((prod) => prod.id === id);
            if (p) setSelectedProductDetails(p);
          }}
        />

        <AuthModal
          isOpen={authOpen}
          onClose={() => setAuthOpen(false)}
          currentUser={userName}
          userRole={userRole}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          onOpenMandoub={() => {
            setIsOwnerDriverPreview(false);
            setMandoubOpen(true);
          }}
          onOpenAdmin={() => setAdminOpen(true)}
          onOpenOrders={() => setOrdersOpen(true)}
          onOpenMap={() => setMapOpen(true)}
        />

        <WelcomeModal
          isOpen={welcomeOpen}
          onClose={handleContinueAsGuest}
          onOpenLogin={() => {
            handleContinueAsGuest();
            setAuthOpen(true);
          }}
          onContinueAsGuest={handleContinueAsGuest}
          lang={lang}
        />

        {/* Sticky Quick-Checkout Floating Bar (Appears when cart has items) */}
        {cart.length > 0 && (
          <div className="fixed bottom-16 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-[#161622]/95 border-2 border-amber-500/60 p-3 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-right animate-in fade-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
                {cart.reduce((sum, it) => sum + it.quantity, 0)}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">سلة الشراء ({cart.length} أصناف):</span>
                <span className="text-sm sm:text-base font-black text-amber-400 font-mono">
                  {cart.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0).toLocaleString()} YER
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCartOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
              >
                تعديل
              </button>

              <button
                onClick={() => {
                  setCartOpen(false);
                  setCheckoutOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl gold-gradient-bg text-slate-950 font-black text-xs hover:brightness-110 shadow-lg shadow-amber-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>إتمام الطلب ⚡</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Sticky Bottom Nav Bar */}
        <MobileBottomNav
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          onOpenCart={() => setCartOpen(true)}
          onOpenOrders={() => setOrdersOpen(true)}
          onOpenAdmin={() => setAdminOpen(true)}
          onOpenAuth={() => setAuthOpen(true)}
          userName={userName}
          userRole={userRole}
          theme={theme}
          onToggleTheme={toggleTheme}
          onScrollToProducts={() => {
            const el = document.getElementById('products-grid-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

      </div>
    </AndroidSimulatorWrapper>
  );
}
