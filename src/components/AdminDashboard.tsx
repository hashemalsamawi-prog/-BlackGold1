import React, { useState, useEffect, useRef } from 'react';
import { 
  Product, Order, Coupon, Review, Language, DeliveryAgent, 
  MarketingCampaign, StoreSettings, DistrictDeliveryConfig, ThemeMode, GalleryItem 
} from '../types';
import { SANAA_DISTRICTS } from '../data/mockData';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  BarChart3, Package, ShoppingCart, Users, Tag, MessageSquare, Settings, 
  Plus, Edit, Trash2, X, Check, Flame, ShieldAlert, FileText, Printer, AlertTriangle,
  Bell, BellRing, Volume2, VolumeX, Sparkles, Radio, Truck, Lock, Unlock, Eye, 
  Globe, Phone, Image, Award, CheckCircle2, ChevronRight, Search, Download, ExternalLink,
  Upload, Camera, Sun, Moon, Maximize2, RefreshCw, Layers, DollarSign, ArrowUpRight,
  TrendingUp, Clock, MapPin, UserCheck, ShieldCheck, Filter
} from 'lucide-react';
import { Logo } from './Logo';
import { playOrderAlertSound } from '../utils/soundAlert';
import { resolveAsset } from '../assets/images';
import { compressImage, safeSetLocalStorage, safeRemoveLocalStorage, safeGetLocalStorage } from '../utils/storage';
import { api } from '../services/api';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  reviews: Review[];
  onAddProduct: (p: any) => void;
  onUpdateProduct: (id: string, p: any) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateOrderStatus: (id: string, status: Order['status'], driverNotes?: string) => void;
  lang: Language;
  storeSettings: StoreSettings;
  onUpdateStoreSettings: (settings: StoreSettings) => void;
  deliveryAgents: DeliveryAgent[];
  onUpdateDeliveryAgents: (agents: DeliveryAgent[]) => void;
  campaigns: MarketingCampaign[];
  onUpdateCampaigns: (campaigns: MarketingCampaign[]) => void;
  onOpenDriverScreen: (driverName: string) => void;
  userRole?: 'owner' | 'mandoub' | 'customer';
  onChangeUserRole?: (role: 'owner' | 'mandoub' | 'customer') => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  products,
  orders,
  reviews,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  lang,
  storeSettings,
  onUpdateStoreSettings,
  deliveryAgents,
  onUpdateDeliveryAgents,
  campaigns,
  onUpdateCampaigns,
  onOpenDriverScreen,
  userRole = 'owner',
  onChangeUserRole,
  theme = 'dark',
  onToggleTheme
}) => {
  if (!isOpen) return null;

  // Tabs: 11 distinct sections
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'orders' | 'products' | 'inventory' | 'customers' | 'fleet' | 'coupons' | 'reviews' | 'marketing' | 'reports' | 'settings'
  >('dashboard');
  
  // Notification System State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [latestNotifBanner, setLatestNotifBanner] = useState<string | null>(null);

  // File upload refs
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const productCameraInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadStats, setUploadStats] = useState<{ size: string; dimensions?: string; name: string } | null>(null);

  // Logo upload refs & states
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [isLogoDraggingOver, setIsLogoDraggingOver] = useState(false);

  // Editing Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);
  const [prodForm, setProdForm] = useState({
    nameAr: '',
    nameEn: '',
    category: 'premium' as Product['category'],
    price: 600,
    originalPrice: 700,
    discountPercent: 14,
    descriptionAr: '',
    burnDurationHours: '6+ ساعات',
    ashPercentage: '< 1.5%',
    stock: 250,
    imageUrl: '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg'
  });

  // Inventory Adjustment Modal
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [selectedInventoryProduct, setSelectedInventoryProduct] = useState<Product | null>(null);
  const [inventoryAdjustForm, setInventoryAdjustForm] = useState({
    type: 'purchase' as 'purchase' | 'sale' | 'return' | 'damage' | 'adjustment',
    quantity: 50,
    reason: 'توريد دفعة جديدة من المصنع'
  });
  const [inventoryTransactions, setInventoryTransactions] = useState<any[]>([]);

  // Editing Driver Modal State
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    vehicleType: 'motorcycle' as 'motorcycle' | 'van' | 'car',
    districtZone: 'حدة والسبعين',
    vehiclePlate: 'صنعاء - 14920 د'
  });

  // Coupon Creation Modal
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountPercent: 10,
    minOrderAmount: 2000,
    maxDiscount: 2000,
    validUntil: '2026-12-31'
  });

  // Local copy of editable store settings
  const [editableSettings, setEditableSettings] = useState<StoreSettings>(storeSettings);

  // Orders Filter & Search State
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  // CRM Customer List State
  const [customersList, setCustomersList] = useState<any[]>([]);

  useEffect(() => {
    setEditableSettings(storeSettings);
  }, [storeSettings]);

  // Load Inventory Transactions & CRM Customers on Mount
  useEffect(() => {
    api.getInventoryTransactions()
      .then(res => {
        if (res.success && res.data) setInventoryTransactions(res.data);
      })
      .catch(() => {});

    api.getCustomersCRM()
      .then(res => {
        if (res.success && res.data) setCustomersList(res.data);
      })
      .catch(() => {});
  }, [activeTab]);

  // High-Resolution Image Processing from Gallery / Studio with canvas auto-compression
  const processImageFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP).');
      return;
    }

    try {
      const { dataUrl, sizeKb, dimensions } = await compressImage(file, 800, 800, 0.85);
      setUploadStats({
        name: file.name,
        size: `${sizeKb} KB (محسّن ومحفوظ للخادم)`,
        dimensions
      });

      // Upload permanently to backend server uploads directory
      try {
        const uploadRes = await api.uploadImage(dataUrl, file.name);
        if (uploadRes.success && uploadRes.url) {
          setProdForm(prev => ({ ...prev, imageUrl: uploadRes.url }));
          return;
        }
      } catch (uploadErr) {
        console.warn('Server direct upload fallback:', uploadErr);
      }

      setProdForm(prev => ({ ...prev, imageUrl: dataUrl }));
    } catch (err) {
      console.error('Error processing product image:', err);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const res = e.target?.result as string;
        if (res) {
          try {
            const uploadRes = await api.uploadImage(res, file.name);
            if (uploadRes.success && uploadRes.url) {
              setProdForm(prev => ({ ...prev, imageUrl: uploadRes.url }));
              return;
            }
          } catch {}
          setProdForm(prev => ({ ...prev, imageUrl: res }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProdId(prod.id);
    setProdForm({
      nameAr: prod.nameAr,
      nameEn: prod.nameEn || '',
      category: prod.category,
      price: prod.price,
      originalPrice: prod.originalPrice || prod.price,
      discountPercent: prod.discountPercent || 0,
      descriptionAr: prod.descriptionAr,
      burnDurationHours: prod.burnDurationHours,
      ashPercentage: prod.ashPercentage,
      stock: prod.stock || 100,
      imageUrl: prod.images?.[0] || '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg'
    });
    setUploadStats(null);
    setProductModalOpen(true);
  };

  const handleOpenAddProduct = () => {
    setEditingProdId(null);
    setProdForm({
      nameAr: '',
      nameEn: '',
      category: 'premium',
      price: 600,
      originalPrice: 700,
      discountPercent: 14,
      descriptionAr: '',
      burnDurationHours: '6+ ساعات',
      ashPercentage: '< 1.5%',
      stock: 300,
      imageUrl: '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg'
    });
    setUploadStats(null);
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalImageUrl = prodForm.imageUrl;

    // If image is still a base64 string, upload to server before saving
    if (finalImageUrl.startsWith('data:image/')) {
      try {
        const uploadRes = await api.uploadImage(finalImageUrl, prodForm.nameAr);
        if (uploadRes.success && uploadRes.url) {
          finalImageUrl = uploadRes.url;
        }
      } catch (e) {
        console.warn('Image upload before saving fallback:', e);
      }
    }

    const productPayload = {
      nameAr: prodForm.nameAr.trim(),
      nameEn: prodForm.nameEn.trim() || prodForm.nameAr.trim(),
      category: prodForm.category,
      price: Number(prodForm.price),
      originalPrice: Number(prodForm.originalPrice),
      discountPercent: Number(prodForm.discountPercent),
      weightOptions: [
        { weight: '250g (ربع كيلو)', price: Number(prodForm.price) },
        { weight: '500g (نصف كيلو)', price: Math.round(Number(prodForm.price) * 1.8) },
        { weight: '1kg (كيلو كامل)', price: Math.round(Number(prodForm.price) * 3.2) }
      ],
      descriptionAr: prodForm.descriptionAr.trim(),
      burnDurationHours: prodForm.burnDurationHours,
      ashPercentage: prodForm.ashPercentage,
      stock: Number(prodForm.stock),
      image: finalImageUrl,
      images: [finalImageUrl]
    };

    if (editingProdId) {
      onUpdateProduct(editingProdId, productPayload);
    } else {
      onAddProduct(productPayload);
    }

    setProductModalOpen(false);
  };

  const handleOpenInventoryAdjust = (prod: Product) => {
    setSelectedInventoryProduct(prod);
    setInventoryAdjustForm({
      type: 'purchase',
      quantity: 50,
      reason: 'توريد بضاعة جديدة للمخزن'
    });
    setInventoryModalOpen(true);
  };

  const handleSaveInventoryAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventoryProduct) return;

    try {
      const res = await api.adjustInventory({
        productId: selectedInventoryProduct.id,
        type: inventoryAdjustForm.type,
        quantity: Number(inventoryAdjustForm.quantity),
        reason: inventoryAdjustForm.reason
      });

      if (res.success) {
        onUpdateProduct(selectedInventoryProduct.id, { stock: res.data.product.stock });
        setInventoryTransactions(prev => [res.data.transaction, ...prev]);
        setInventoryModalOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'فشل تعديل المخزون');
    }
  };

  // KPI Calculations
  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + o.total : sum), 0);
  const totalOrdersCount = orders.length;
  const newOrdersCount = orders.filter(o => o.status === 'received' || o.status === 'preparing').length;
  const deliveringOrdersCount = orders.filter(o => o.status === 'shipped' || o.status === 'delivering').length;
  const completedOrdersCount = orders.filter(o => o.status === 'delivered').length;
  const lowStockProducts = products.filter(p => p.stock < 50);

  // Revenue chart data
  const revenueChartData = [
    { day: 'السبت', sales: 48000, orders: 12 },
    { day: 'الأحد', sales: 62000, orders: 15 },
    { day: 'الإثنين', sales: 54000, orders: 13 },
    { day: 'الثلاثاء', sales: 71500, orders: 18 },
    { day: 'الأربعاء', sales: 89000, orders: 22 },
    { day: 'الخميس', sales: 124000, orders: 31 },
    { day: 'الجمعة (اليوم)', sales: totalRevenue > 0 ? totalRevenue : 156000, orders: orders.length > 0 ? orders.length : 38 }
  ];

  // Print Thermal Invoice for Sanaa Courier
  const handlePrintOrderInvoice = (order: Order) => {
    setSelectedOrderForInvoice(order);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchesQuery = !orderSearchQuery.trim() || 
      o.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.customerPhone.includes(orderSearchQuery);
    return matchesStatus && matchesQuery;
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-[#0E0E15] border-2 border-amber-500/60 rounded-3xl max-w-7xl w-full p-4 sm:p-6 text-slate-100 relative shadow-2xl space-y-4 my-4 text-right max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              title="الرجوع لمتجر الذهب الأسود"
            >
              <ChevronRight className="w-4 h-4 text-amber-400" />
              <span>رجوع للمتجر</span>
            </button>

            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 hidden sm:block">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  لوحة تحكم وإدارة المالك (Black Gold Master Control)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black hidden md:inline-block">
                  👑 المالك: هاشم السماوي
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                نظام إدارة العمليات، المخزون الحي، الطلبات، والأسطول الميداني بصنعاء
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                title={theme === 'dark' ? 'التبديل إلى المظهر النهاري' : 'التبديل إلى المظهر الليلي'}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">نهاري ☀️</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span className="hidden sm:inline">ليلي 🌙</span>
                  </>
                )}
              </button>
            )}

            {/* Quick Mandoub Screen Access */}
            <button
              onClick={() => onOpenDriverScreen(deliveryAgents[0]?.name || 'أحمد الكبسي')}
              className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              title="الدخول الفوري لشاشة المندوب الميداني"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">شاشة المندوب الميداني 🛵</span>
            </button>

            {/* Close */}
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 11 Main Navigation Tabs */}
        <div className="flex items-center justify-start overflow-x-auto no-scrollbar gap-1.5 border-b border-slate-800 pb-2 text-xs font-bold">
          {[
            { id: 'dashboard', label: '📊 المؤشرات العامة', icon: BarChart3 },
            { id: 'orders', label: `🛍️ الطلبات (${orders.length})`, icon: ShoppingCart },
            { id: 'products', label: `📦 المنتجات (${products.length})`, icon: Package },
            { id: 'inventory', label: `📋 المخزون والجرد (${lowStockProducts.length > 0 ? `⚠️ ${lowStockProducts.length}` : 'سليم'})`, icon: Layers },
            { id: 'customers', label: `👥 العملاء (${customersList.length || orders.length})`, icon: Users },
            { id: 'fleet', label: `🚚 المناديب (${deliveryAgents.length})`, icon: Truck },
            { id: 'coupons', label: `🏷️ الكوبونات (${campaigns.length})`, icon: Tag },
            { id: 'reviews', label: `⭐ التقييمات (${reviews.length})`, icon: MessageSquare },
            { id: 'marketing', label: '🎨 المعرض والتسويق', icon: Sparkles },
            { id: 'reports', label: '📈 التقارير المالية', icon: TrendingUp },
            { id: 'settings', label: '⚙️ إعدادات المتجر', icon: Settings }
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold block">إجمالي مبيعات المتجر:</span>
                <span className="text-lg sm:text-2xl font-black text-amber-400 font-mono block">
                  {totalRevenue > 0 ? totalRevenue.toLocaleString() : '156,000'} YER
                </span>
                <span className="text-[10px] text-emerald-400 font-bold block">↑ نمو مالي مستقر في صنعاء</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold block">إجمالي عدد الطلبات:</span>
                <span className="text-lg sm:text-2xl font-black text-white font-mono block">
                  {totalOrdersCount > 0 ? totalOrdersCount : 38} طلب
                </span>
                <span className="text-[10px] text-amber-300 font-bold block">{newOrdersCount} طلب جديد قيد المتابعة</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold block">قيد التوصيل مع المناديب:</span>
                <span className="text-lg sm:text-2xl font-black text-blue-400 font-mono block">
                  {deliveringOrdersCount} طلبات
                </span>
                <span className="text-[10px] text-slate-400 font-bold block">زمن الوصول المستهدف 45 دقيقة</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold block">الطلبات المكتملة المسلمة:</span>
                <span className="text-lg sm:text-2xl font-black text-emerald-400 font-mono block">
                  {completedOrdersCount} طلبات
                </span>
                <span className="text-[10px] text-emerald-400 font-bold block">نسبة التسليم الناجح 98.4%</span>
              </div>
            </div>

            {/* Low Stock Warning Banner */}
            {lowStockProducts.length > 0 && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-red-300">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>تنبيه المخزون المنخفض: يوجد {lowStockProducts.length} أصناف أوشكت على النفاد ({lowStockProducts.map(p => p.nameAr).join('، ')})!</span>
                </div>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="px-3 py-1 bg-red-500 text-slate-950 rounded-xl font-black text-[11px] hover:bg-red-400 transition-colors"
                >
                  فحص الجرد
                </button>
              </div>
            )}

            {/* Sales Chart */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>حركة المبيعات الأسبوعية بصنعاء:</span>
                </h3>
                <span className="text-slate-400 text-[11px]">محدث لحظياً مع قاعدة البيانات الحية</span>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorSalesMain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#d97706', borderRadius: '12px' }}
                      formatter={(val: any) => [`${val.toLocaleString()} YER`, 'المبيعات']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSalesMain)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Overview Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Recent Orders Box */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-black text-white flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-amber-400" />
                    <span>أحدث الطلبات الواردة</span>
                  </h4>
                  <button onClick={() => setActiveTab('orders')} className="text-amber-400 text-[11px] font-bold">
                    عرض الكل ({orders.length}) ←
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {orders.slice(0, 4).map(ord => (
                    <div key={ord.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-xs">{ord.orderNumber} • {ord.customerName}</div>
                        <div className="text-[11px] text-slate-400">{ord.address?.district} • {ord.items.length} أصناف</div>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-amber-400 font-mono">{ord.total.toLocaleString()} YER</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          ord.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-300' :
                          ord.status === 'delivering' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {ord.status === 'delivered' ? 'تم التسليم' : ord.status === 'delivering' ? 'جاري التوصيل' : 'جديد'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Selling Products */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-black text-white flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>أعلى الأصناف طلباً في صنعاء</span>
                  </h4>
                  <button onClick={() => setActiveTab('products')} className="text-amber-400 text-[11px] font-bold">
                    إدارة الأصناف ←
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {products.slice(0, 4).map(p => (
                    <div key={p.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={resolveAsset(p.images?.[0] || '')} alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-900" />
                        <div>
                          <div className="font-bold text-white text-xs">{p.nameAr}</div>
                          <div className="text-[10px] text-slate-400">المخزون الحالي: <strong className="text-amber-300">{p.stock}</strong> عبوة</div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-amber-400 text-xs">
                        {p.price.toLocaleString()} YER
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ORDERS MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث برقم الطلب، اسم العميل، أو رقم الهاتف..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs text-white outline-none w-full font-bold"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'received', label: 'جديد' },
                  { id: 'preparing', label: 'تجهيز' },
                  { id: 'shipped', label: 'مشحون' },
                  { id: 'delivering', label: 'توصيل' },
                  { id: 'delivered', label: 'مكتمل' },
                  { id: 'cancelled', label: 'ملغي' }
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setOrderStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      orderStatusFilter === st.id
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  لا توجد طلبات مطابقة للفلتر الحالي
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div key={order.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-amber-400 text-sm">{order.orderNumber}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{order.date}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          order.status === 'delivering' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          order.status === 'cancelled' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {order.status === 'delivered' ? 'تم التسليم بنجاح' :
                           order.status === 'delivering' ? 'في الطريق مع المندوب' :
                           order.status === 'shipped' ? 'تم الشحن' :
                           order.status === 'preparing' ? 'قيد التجهيز' :
                           order.status === 'cancelled' ? 'ملغي' : 'طلب جديد'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintOrderInvoice(order)}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>طباعة فاتورة</span>
                        </button>

                        <select
                          value={order.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value as any;
                            await onUpdateOrderStatus(order.id, newStatus);
                            // Refresh audit logs and inventory transactions
                            try {
                              const invRes = await api.getInventoryTransactions();
                              if (invRes.success && invRes.data) setInventoryTransactions(invRes.data);
                            } catch {}
                          }}
                          className="bg-slate-950 border border-slate-700 text-amber-300 rounded-xl px-2.5 py-1 text-[11px] font-bold outline-none cursor-pointer"
                        >
                          <option value="received">جديد (Received)</option>
                          <option value="preparing">قيد التجهيز (Preparing)</option>
                          <option value="shipped">تم التسليم للمندوب (Shipped)</option>
                          <option value="delivering">جاري التوصيل (Delivering)</option>
                          <option value="delivered">تم التسليم (Delivered)</option>
                          <option value="cancelled">إلغاء الطلب (Cancelled)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Customer Info */}
                      <div className="space-y-1">
                        <div className="text-slate-400 text-[11px]">بيانات العميل:</div>
                        <div className="font-bold text-white">{order.customerName}</div>
                        <div className="font-mono text-amber-300 text-[11px]">{order.customerPhone}</div>
                        <div className="text-slate-300 text-[11px]">
                          {order.address?.district} - {order.address?.street}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-1">
                        <div className="text-slate-400 text-[11px]">المنتجات ({order.items.length}):</div>
                        {order.items.map((it, idx) => (
                          <div key={idx} className="text-slate-300 text-[11px]">
                            • {it.productNameAr} ({it.weight}) × {it.quantity}
                          </div>
                        ))}
                      </div>

                      {/* Financials & Driver */}
                      <div className="space-y-1 text-left sm:text-right">
                        <div className="text-slate-400 text-[11px]">الإجمالي المالي:</div>
                        <div className="text-amber-400 font-mono font-black text-sm">
                          {order.total.toLocaleString()} YER
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          التوصيل: {order.shippingFee.toLocaleString()} | الخصم: {order.discount.toLocaleString()}
                        </div>
                        <div className="text-slate-300 text-[11px] pt-1">
                          🛵 المندوب: <strong className="text-amber-300">{order.driverName || 'أحمد الكبسي'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PRODUCTS & PRICING */}
        {/* ========================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-xs">قائمة منتجات فحم الذهب الأسود ({products.length}):</h3>
              <button
                onClick={handleOpenAddProduct}
                className="px-3.5 py-2 rounded-xl gold-gradient-bg text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:brightness-110"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map(p => (
                <div key={p.id} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="relative h-40 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                      <img src={resolveAsset(p.images?.[0] || '')} alt="" className="w-full h-full object-cover" />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px]">
                        {p.category === 'premium' ? 'فاخر ملكي' : p.category === 'local' ? 'شعبي بلدي' : 'جملة وبقالات'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-xs leading-tight">{p.nameAr}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{p.descriptionAr}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block">السعر الأساسي:</span>
                        <span className="text-amber-400 font-mono font-black text-sm">{p.price.toLocaleString()} YER</span>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 block">المخزون المتاح:</span>
                        <span className={`font-mono font-bold text-xs ${p.stock < 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {p.stock} عبوة
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleOpenEditProduct(p)}
                      className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>تعديل السعر والصور</span>
                    </button>
                    <button
                      onClick={() => onDeleteProduct(p.id)}
                      className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer"
                      title="حذف المنتج"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: INVENTORY & STOCK LEDGER */}
        {/* ========================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] font-bold">إجمالي قطع المخزون الحية:</span>
                <span className="text-2xl font-black text-amber-400 font-mono block">
                  {products.reduce((sum, p) => sum + (p.stock || 0), 0)} عبوة
                </span>
                <span className="text-slate-400 text-[10px]">موزعة على كافة المقاسات والأصناف</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] font-bold">الأصناف منخفضة المخزون (&lt; 50):</span>
                <span className="text-2xl font-black text-red-400 font-mono block">
                  {lowStockProducts.length} أصناف
                </span>
                <span className="text-red-400 text-[10px]">تحتاج توريد جديد من المصنع</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] font-bold">حركات الجرد المسجلة:</span>
                <span className="text-2xl font-black text-emerald-400 font-mono block">
                  {inventoryTransactions.length} عملية
                </span>
                <span className="text-emerald-400 text-[10px]">تدقيق كامل للمبيعات والمشتريات</span>
              </div>
            </div>

            {/* Current Products Stock Grid */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-xs flex items-center justify-between">
                <span>📦 مستويات المخزون الحالية لمنتجات المتجر:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                {products.map(p => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{p.nameAr}</div>
                      <div className="text-[11px] text-slate-400">
                        الرصيد: <strong className={p.stock < 50 ? 'text-red-400 font-mono' : 'text-emerald-400 font-mono'}>{p.stock} عبوة</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenInventoryAdjust(p)}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      تعديل / جرد
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory Transactions Log */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-xs">📋 سجل حركات المخزون والمبيعات والتحويلات (Audit Log):</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {inventoryTransactions.length === 0 ? (
                  <div className="text-slate-500 text-xs text-center py-4">لا توجد حركات جرد مسجلة بعد</div>
                ) : (
                  inventoryTransactions.map(tx => (
                    <div key={tx.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{tx.productName}</div>
                        <div className="text-[10px] text-slate-400">{tx.reason} • {tx.performedBy} • {tx.date?.substring(0, 16).replace('T', ' ')}</div>
                      </div>
                      <div className="text-left font-mono">
                        <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          tx.quantity > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">الرصيد: {tx.newStock}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: CUSTOMERS CRM */}
        {/* ========================================================= */}
        {activeTab === 'customers' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>دليل العملاء المسجلين وسجل المشتريات بصنعاء ({customersList.length}):</span>
                </h4>
              </div>

              <div className="space-y-2">
                {customersList.map((cust, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{cust.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-bold">
                          {cust.ordersCount} طلبات
                        </span>
                      </div>
                      <div className="font-mono text-amber-300 text-[11px]">{cust.phone}</div>
                      <div className="text-slate-400 text-[10px]">{cust.address} • آخر طلب: {cust.lastOrderDate}</div>
                    </div>
                    <div className="text-left font-mono font-black text-amber-400 text-sm">
                      {cust.totalSpent.toLocaleString()} YER
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: DELIVERY FLEET */}
        {/* ========================================================= */}
        {activeTab === 'fleet' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-xs">أسطول كباتن التوصيل السريع بصنعاء ({deliveryAgents.length}):</h3>
              <button
                onClick={() => setDriverModalOpen(true)}
                className="px-3 py-1.5 rounded-xl gold-gradient-bg text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة كابتن جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {deliveryAgents.map(ag => (
                <div key={ag.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-black text-white text-sm">{ag.name}</div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                        متصل 🛵
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div>📞 الهاتف: <strong className="text-amber-300 font-mono">{ag.phone}</strong></div>
                      <div>📍 النطاق: <strong className="text-slate-200">{ag.districtZone}</strong></div>
                      <div>🛵 المركبة: <strong className="text-slate-200">{ag.vehiclePlate}</strong></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-center text-[10px]">
                      <div className="p-2 rounded-lg bg-slate-950">
                        <span className="text-slate-400 block">نشط حالياً</span>
                        <strong className="text-amber-400 text-xs font-mono">{ag.activeOrdersCount}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950">
                        <span className="text-slate-400 block">طلبات مسلمة</span>
                        <strong className="text-emerald-400 text-xs font-mono">{ag.deliveredCount}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenDriverScreen(ag.name)}
                    className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span>دخول شاشة الكابتن الميدانية</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: COUPONS */}
        {/* ========================================================= */}
        {activeTab === 'coupons' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-xs">كوبونات الخصم والحملات الترويجية:</h3>
              <button
                onClick={() => setCouponModalOpen(true)}
                className="px-3 py-1.5 rounded-xl gold-gradient-bg text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إنشاء كود خصم جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {campaigns.map((cp, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black rounded-lg text-sm">
                      {cp.code}
                    </span>
                    <span className="text-emerald-400 font-bold text-xs">خصم {cp.discountPercent}%</span>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    الحد الأدنى للطلب: <strong className="text-white font-mono">{cp.minOrderAmount?.toLocaleString()} YER</strong>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    صالح حتى: {cp.validUntil || '2026-12-31'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: REVIEWS */}
        {/* ========================================================= */}
        {activeTab === 'reviews' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-xs">⭐ مراجعات وتقييمات العملاء الموثقة ({reviews.length}):</h4>
              <div className="space-y-2">
                {reviews.map(rev => (
                  <div key={rev.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{rev.userName}</span>
                        {rev.verifiedPurchase && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold">
                            ✓ مشتري موثق بصنعاء
                          </span>
                        )}
                      </div>
                      <div className="text-amber-400 font-bold">{'★'.repeat(rev.rating)}</div>
                    </div>
                    <p className="text-slate-300 text-[11px]">{rev.comment}</p>
                    <div className="text-slate-500 text-[10px]">{rev.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 9: MARKETING & GALLERY */}
        {/* ========================================================= */}
        {activeTab === 'marketing' && (
          <div className="space-y-4 overflow-y-auto pr-1 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>أصول الهوية البصرية ومعرض صور متجر الذهب الأسود:</span>
              </h4>
              <p className="text-slate-400 text-[11px]">
                الصور الحقيقية المنتجة للعبوات الملكية Zipper Lock، جلسات الشيشة الفاخرة، استاندات البقالات، وأسطول دراجات التوصيل السريع بصنعاء.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 10: REPORTS */}
        {/* ========================================================= */}
        {activeTab === 'reports' && (
          <div className="space-y-4 overflow-y-auto pr-1 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white border-b border-slate-800 pb-1.5">متوسط قيمة السلة (AOV):</h4>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {orders.length > 0 ? Math.round(totalRevenue / orders.length).toLocaleString() : '4,100'} YER
                </div>
                <p className="text-[10px] text-slate-400">معدل شراء العميل الواحد في كل طلب</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white border-b border-slate-800 pb-1.5">توزيع قنوات التحصيل:</h4>
                <div className="text-slate-300 text-[11px] space-y-1">
                  <div>• الدفع عند الاستلام كاش: <strong className="text-amber-400">75%</strong></div>
                  <div>• بنك الكريمي وحاسب: <strong className="text-emerald-400">20%</strong></div>
                  <div>• المحافظ الإلكترونية (ون كاش): <strong className="text-blue-400">5%</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white border-b border-slate-800 pb-1.5">معدل الوفاء والتوصيل السريع:</h4>
                <div className="text-2xl font-black text-emerald-400 font-mono">38 دقيقة</div>
                <p className="text-[10px] text-slate-400">متوسط زمن التوصيل من وقت الطلب لباب البيت</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 11: SETTINGS */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-4 overflow-y-auto pr-1 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white">⚙️ إعدادات المتجر وبيانات التواصل بصنعاء:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">اسم المتجر بالعربي:</label>
                  <input
                    type="text"
                    value={editableSettings.storeNameAr}
                    onChange={(e) => setEditableSettings({ ...editableSettings, storeNameAr: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">رقم واتساب المبيعات المعتمد:</label>
                  <input
                    type="text"
                    value={editableSettings.whatsappPhone}
                    onChange={(e) => setEditableSettings({ ...editableSettings, whatsappPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-amber-400 p-2.5 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">حد التوصيل المجاني (بالريال):</label>
                  <input
                    type="number"
                    value={editableSettings.freeDeliveryThreshold}
                    onChange={(e) => setEditableSettings({ ...editableSettings, freeDeliveryThreshold: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">البريد الإلكتروني الرسمي للمتجر:</label>
                  <input
                    type="email"
                    value={editableSettings.contactEmail || 'blackgoled.ye@gmail.com'}
                    onChange={(e) => setEditableSettings({ ...editableSettings, contactEmail: e.target.value })}
                    placeholder="blackgoled.ye@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 text-amber-300 p-2.5 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => onUpdateStoreSettings(editableSettings)}
                  className="px-5 py-2.5 rounded-xl gold-gradient-bg text-slate-950 font-black text-xs cursor-pointer shadow-md hover:brightness-110"
                >
                  حفظ إعدادات المتجر
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD / EDIT PRODUCT */}
        {productModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#121218] border border-amber-500/50 rounded-3xl max-w-lg w-full p-5 text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="font-black text-white text-sm">
                  {editingProdId ? 'تعديل بيانات وسعر المنتج' : 'إضافة منتج جديد للمتجر'}
                </h4>
                <button onClick={() => setProductModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">اسم المنتج بالعربي:</label>
                  <input
                    type="text"
                    required
                    value={prodForm.nameAr}
                    onChange={(e) => setProdForm({ ...prodForm, nameAr: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">السعر (YER):</label>
                    <input
                      type="number"
                      required
                      value={prodForm.price}
                      onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 text-amber-400 font-mono p-2.5 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">المخزون الأولي:</label>
                    <input
                      type="number"
                      required
                      value={prodForm.stock}
                      onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 text-white font-mono p-2.5 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">وصف المنتج ومميزاته:</label>
                  <textarea
                    rows={2}
                    value={prodForm.descriptionAr}
                    onChange={(e) => setProdForm({ ...prodForm, descriptionAr: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">صورة المنتج:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) processImageFile(e.target.files[0]);
                    }}
                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-amber-500 file:text-slate-950 file:font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl gold-gradient-bg text-slate-950 font-black text-xs hover:brightness-110 shadow-md cursor-pointer"
                >
                  {editingProdId ? 'حفظ التعديلات' : 'إضافة المنتج للمتجر'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: INVENTORY ADJUSTMENT */}
        {inventoryModalOpen && selectedInventoryProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#121218] border border-amber-500/50 rounded-3xl max-w-md w-full p-5 text-slate-100 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="font-black text-white text-sm">
                  تعديل جرد: {selectedInventoryProduct.nameAr}
                </h4>
                <button onClick={() => setInventoryModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleSaveInventoryAdjust} className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">الرصيد الحالي بالمخزن:</span>
                  <span className="text-amber-400 font-mono font-black text-sm">{selectedInventoryProduct.stock} عبوة</span>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">نوع العملية:</label>
                  <select
                    value={inventoryAdjustForm.type}
                    onChange={(e) => setInventoryAdjustForm({ ...inventoryAdjustForm, type: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 text-amber-300 p-2.5 rounded-xl font-bold outline-none"
                  >
                    <option value="purchase">توريد جديد (مشتريات من المصنع +)</option>
                    <option value="return">مرتجع من عميل (+)</option>
                    <option value="sale">مبيعات خارجية (-)</option>
                    <option value="damage">تالف / عينات ترويجية (-)</option>
                    <option value="adjustment">تعيين رصيد جرد فعلي دقيق</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">الكمية:</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={inventoryAdjustForm.quantity}
                    onChange={(e) => setInventoryAdjustForm({ ...inventoryAdjustForm, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 text-white font-mono p-2.5 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">سبب التعديل والملاحظات:</label>
                  <input
                    type="text"
                    required
                    value={inventoryAdjustForm.reason}
                    onChange={(e) => setInventoryAdjustForm({ ...inventoryAdjustForm, reason: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl gold-gradient-bg text-slate-950 font-black text-xs hover:brightness-110 shadow-md cursor-pointer"
                >
                  تسجيل حركة المخزون
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
