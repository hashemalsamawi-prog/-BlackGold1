import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Product, Order, Review, Coupon, DeliveryAgent, StoreSettings, GalleryItem } from '../src/types';
import { INITIAL_PRODUCTS, INITIAL_GALLERY_ITEMS, INITIAL_STORE_SETTINGS, INITIAL_DELIVERY_AGENTS } from '../src/data/mockData';
import { hashSecret, normalizeDigits } from './security';

// Cloudflare D1 Configuration (strictly via environment variables only)
export const CLOUDFLARE_CONFIG = {
  databaseId: process.env.CLOUDFLARE_DATABASE_ID || '',
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
};

export interface UserAccount {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'customer' | 'admin' | 'owner' | 'employee' | 'delivery' | 'mandoub';
  passwordHash?: string;
  pinHash?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface CustomerRecord {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  district?: string;
  street?: string;
  landmark?: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  productId: string;
  productNameAr: string;
  productNameEn?: string;
  weightOption: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

export interface InventoryLogRecord {
  id: string;
  productId: string;
  productName: string;
  type: 'initial' | 'purchase' | 'sale' | 'return' | 'damage' | 'adjustment' | 'STOCK_IN' | 'STOCK_OUT' | 'STOCK_ROLLBACK';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  orderId?: string;
  performedBy: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  referenceNumber?: string;
  proofImageUrl?: string;
  notes?: string;
  confirmedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  recipientRole: string;
  recipientId?: string;
  title: string;
  message: string;
  type: 'order' | 'stock' | 'alert' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export const VALID_ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'assigned', 'received', 'preparing', 'shipped', 'cancelled'],
  received: ['confirmed', 'assigned', 'preparing', 'shipped', 'cancelled'],
  confirmed: ['assigned', 'preparing', 'shipped', 'delivering', 'cancelled'],
  assigned: ['preparing', 'shipped', 'delivering', 'on_way', 'delivered', 'cancelled'],
  preparing: ['assigned', 'shipped', 'delivering', 'on_way', 'delivered', 'cancelled'],
  shipped: ['delivering', 'on_way', 'delivered', 'cancelled'],
  delivering: ['delivered', 'cancelled'],
  on_way: ['delivering', 'delivered', 'cancelled'],
  delivered: ['completed'],
  completed: [],
  cancelled: []
};

// Memory / Local Persistent Store for D1 Entities
class D1DatabaseAccessLayer {
  private localDbPath = path.join(process.cwd(), 'data', 'db.json');
  private isInitialized = false;

  // In-memory relational tables matching D1 Schema
  // In production or when Cloudflare D1 credentials exist, start with clean empty tables to prevent mock data leakage
  private tables = {
    categories: [] as Array<{ id: string; name_ar: string; name_en?: string; slug: string; sort_order: number; is_active: number; created_at: string }>,
    products: (Boolean(CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId) || process.env.NODE_ENV === 'production')
      ? [] as Product[]
      : [...INITIAL_PRODUCTS] as Product[],
    users: [] as UserAccount[],
    customers: [] as CustomerRecord[],
    orders: [] as Order[],
    order_items: [] as OrderItemRecord[],
    inventory: new Map<string, { currentStock: number; reservedStock: number; minThreshold: number; lastCountedAt?: string }>(),
    inventory_logs: [] as InventoryLogRecord[],
    delivery_agents: (Boolean(CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId) || process.env.NODE_ENV === 'production')
      ? [] as DeliveryAgent[]
      : [...INITIAL_DELIVERY_AGENTS] as DeliveryAgent[],
    reviews: [] as Review[],
    coupons: (Boolean(CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId) || process.env.NODE_ENV === 'production')
      ? [] as Coupon[]
      : [
          { code: "GOLD2026", discountPercent: 10, maxDiscount: 2000, minOrderAmount: 2000, isActive: true },
          { code: "SANAA15", discountPercent: 15, maxDiscount: 3500, minOrderAmount: 5000, isActive: true },
          { code: "VIPBLACK", discountPercent: 20, maxDiscount: 5000, minOrderAmount: 10000, isActive: true }
        ] as Coupon[],
    gallery_items: (Boolean(CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId) || process.env.NODE_ENV === 'production')
      ? [] as GalleryItem[]
      : [...INITIAL_GALLERY_ITEMS] as GalleryItem[],
    store_settings: (Boolean(CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId) || process.env.NODE_ENV === 'production')
      ? {
          storeNameAr: 'فحم الذهب الأسود الملكي',
          storeNameEn: 'BLACK GOLD ROYAL CHARCOAL',
          whatsappPhone: '967775000150',
          supportPhone: '967775000150',
          workingHoursAr: 'يومياً: 8:00 ص - 11:30 م',
          workingHoursEn: 'Daily: 8:00 AM - 11:30 PM',
          freeDeliveryThreshold: 8000,
          freeShippingThreshold: 8000,
          defaultShippingFee: 800,
          isOrderingEnabled: true,
          deliveryDistricts: []
        } as StoreSettings
      : {
          ...INITIAL_STORE_SETTINGS,
          deliveryDistricts: [
            { id: "d1", nameAr: "حدة وشارع الخمسين والحي السياسي", nameEn: "Hadda & Political Area", fee: 500, etaMinutes: 35, isActive: true },
            { id: "d2", nameAr: "الأصبحي وشارع المقالح وبيت بوس", nameEn: "Asbahi & Bait Baws", fee: 500, etaMinutes: 40, isActive: true },
            { id: "d3", nameAr: "التحرير وشارع جمال والقاع", nameEn: "Tahrir & Al-Qaa", fee: 600, etaMinutes: 40, isActive: true },
            { id: "d4", nameAr: "صنعاء القديمة وباب اليمن وشعوب", nameEn: "Old Sanaa & Bab Al-Yaman", fee: 700, etaMinutes: 45, isActive: true },
            { id: "d5", nameAr: "شملان ومذبح وشارع الثلاثين", nameEn: "Shamlan & Madhbah", fee: 800, etaMinutes: 45, isActive: true },
            { id: "d6", nameAr: "الحصبة وشارع المطار والروضة", nameEn: "Hasaba & Airport Rd", fee: 900, etaMinutes: 50, isActive: true }
          ]
        } as StoreSettings,
    payments: [] as PaymentRecord[],
    notifications: [] as NotificationRecord[]
  };

  private initPromise: Promise<void> | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize Schema, migrate legacy data, and sync with Cloudflare D1
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const dataDir = path.dirname(this.localDbPath);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

      const hasD1Credentials = Boolean(
        CLOUDFLARE_CONFIG.accountId && 
        CLOUDFLARE_CONFIG.apiToken && 
        CLOUDFLARE_CONFIG.databaseId
      );

      // 1. Seed Categories strictly in development when D1 credentials are not present
      if (process.env.NODE_ENV !== 'production' && !hasD1Credentials) {
        this.tables.categories = [
          { id: 'cat-pouches', name_ar: 'العبوات الفاخرة Zipper Lock', name_en: 'Premium Pouches', slug: 'pouches', sort_order: 1, is_active: 1, created_at: new Date().toISOString() },
          { id: 'cat-wholesale', name_ar: 'التوريد والجملة للمطاعم والمقاهي', name_en: 'Wholesale & B2B', slug: 'wholesale', sort_order: 2, is_active: 1, created_at: new Date().toISOString() },
          { id: 'cat-local', name_ar: 'فحم بلدي طبيعي من مزارع اليمن', name_en: 'Yemeni Local Charcoal', slug: 'local', sort_order: 3, is_active: 1, created_at: new Date().toISOString() },
          { id: 'cat-premium', name_ar: 'الفحم الملكي الخاص بالشيشة', name_en: 'Royal Shisha Charcoal', slug: 'premium', sort_order: 4, is_active: 1, created_at: new Date().toISOString() },
          { id: 'cat-bbq', name_ar: 'فحم الشواء والمشاوي عالي الحرارة', name_en: 'High-Heat BBQ Charcoal', slug: 'bbq', sort_order: 5, is_active: 1, created_at: new Date().toISOString() },
          { id: 'cat-incense', name_ar: 'أقراص البخور والمباخر سريعة الاشتعال', name_en: 'Incense Charcoal Tablets', slug: 'incense', sort_order: 6, is_active: 1, created_at: new Date().toISOString() }
        ];
      }

      // 2. In production or when Cloudflare D1 credentials are provided, use Cloudflare D1 as PRIMARY data source
      if (hasD1Credentials) {
        console.log('⚡ Cloudflare D1 is active as PRIMARY authoritative database. Fetching remote tables...');
        const syncOk = await this.syncFromCloudflareD1();
        if (!syncOk && process.env.NODE_ENV === 'production') {
          console.error('CRITICAL: Cloudflare D1 initial sync failed in production environment!');
          throw new Error('فشل المزامنة الأولية مع قاعدة بيانات Cloudflare D1 في بيئة الإنتاج');
        }
      } else {
        if (process.env.NODE_ENV === 'production') {
          console.error('CRITICAL: Cloudflare D1 credentials missing in production environment!');
          throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
        }
        if (fs.existsSync(this.localDbPath)) {
        // Fallback to local db.json ONLY in local development when D1 credentials are not present
        try {
          const raw = fs.readFileSync(this.localDbPath, 'utf-8');
          const parsed = JSON.parse(raw);

          if (parsed.products && Array.isArray(parsed.products)) {
            this.tables.products = parsed.products;
          }
          if (parsed.users && Array.isArray(parsed.users)) {
            this.tables.users = parsed.users;
          }
          if (parsed.orders && Array.isArray(parsed.orders)) {
            this.tables.orders = parsed.orders;
          }
          if (parsed.reviews && Array.isArray(parsed.reviews)) {
            this.tables.reviews = parsed.reviews;
          }
          if (parsed.coupons && Array.isArray(parsed.coupons)) {
            this.tables.coupons = parsed.coupons;
          }
          if (parsed.deliveryAgents && Array.isArray(parsed.deliveryAgents)) {
            this.tables.delivery_agents = parsed.deliveryAgents;
          }
          if (parsed.storeSettings) {
            this.tables.store_settings = parsed.storeSettings;
          }
          if (parsed.galleryItems && Array.isArray(parsed.galleryItems)) {
            this.tables.gallery_items = parsed.galleryItems;
          }
          if (parsed.inventoryTransactions && Array.isArray(parsed.inventoryTransactions)) {
            this.tables.inventory_logs = parsed.inventoryTransactions.map((tx: any) => ({
              id: tx.id,
              productId: tx.productId,
              productName: tx.productName,
              type: tx.type,
              quantity: tx.quantity,
              previousStock: tx.previousStock,
              newStock: tx.newStock,
              reason: tx.reason,
              performedBy: tx.performedBy,
              createdAt: tx.date || new Date().toISOString()
            }));
          }
        } catch (err) {
          console.error('Error reading legacy db.json:', err);
        }
      }
    }

      // 3. Ensure Default Fallback Data ONLY in local development when D1 is NOT configured
      if (!hasD1Credentials && process.env.NODE_ENV !== 'production') {
        if (this.tables.products.length === 0) {
          this.tables.products = [...INITIAL_PRODUCTS];
        }

        if (this.tables.gallery_items.length === 0) {
          this.tables.gallery_items = [...INITIAL_GALLERY_ITEMS];
        }

        if (!this.tables.store_settings || !this.tables.store_settings.whatsappPhone) {
          this.tables.store_settings = { ...INITIAL_STORE_SETTINGS, deliveryDistricts: [
            { id: "d1", nameAr: "حدة وشارع الخمسين والحي السياسي", nameEn: "Hadda & Political Area", fee: 500, etaMinutes: 35, isActive: true },
            { id: "d2", nameAr: "الأصبحي وشارع المقالح وبيت بوس", nameEn: "Asbahi & Bait Baws", fee: 500, etaMinutes: 40, isActive: true },
            { id: "d3", nameAr: "التحرير وشارع جمال والقاع", nameEn: "Tahrir & Al-Qaa", fee: 600, etaMinutes: 40, isActive: true },
            { id: "d4", nameAr: "صنعاء القديمة وباب اليمن وشعوب", nameEn: "Old Sanaa & Bab Al-Yaman", fee: 700, etaMinutes: 45, isActive: true },
            { id: "d5", nameAr: "شملان ومذبح وشارع الثلاثين", nameEn: "Shamlan & Madhbah", fee: 800, etaMinutes: 45, isActive: true },
            { id: "d6", nameAr: "الحصبة وشارع المطار والروضة", nameEn: "Hasaba & Airport Rd", fee: 900, etaMinutes: 50, isActive: true }
          ] };
        }

        if (this.tables.delivery_agents.length === 0) {
          this.tables.delivery_agents = [...INITIAL_DELIVERY_AGENTS];
        }

        if (this.tables.coupons.length === 0) {
          this.tables.coupons = [
            { code: "GOLD2026", discountPercent: 10, maxDiscount: 2000, minOrderAmount: 2000, isActive: true },
            { code: "SANAA15", discountPercent: 15, maxDiscount: 3500, minOrderAmount: 5000, isActive: true },
            { code: "VIPBLACK", discountPercent: 20, maxDiscount: 5000, minOrderAmount: 10000, isActive: true }
          ];
        }

        this.saveLocal();
      }

      // 6. Ensure Relational order_items exist for all orders
      for (const order of this.tables.orders) {
        if (order.items && Array.isArray(order.items)) {
          for (const it of order.items) {
            const existingItem = this.tables.order_items.find(oi => oi.orderId === order.id && oi.productId === it.productId);
            if (!existingItem) {
              this.tables.order_items.push({
                id: `oi-${order.id}-${it.productId}-${Math.random().toString(36).substring(2, 6)}`,
                orderId: order.id,
                productId: it.productId,
                productNameAr: it.productNameAr || 'فحم الذهب الأسود',
                productNameEn: 'Black Gold Premium Charcoal',
                weightOption: it.weight || '250g',
                quantity: it.quantity || 1,
                unitPrice: it.unitPrice || 600,
                totalPrice: (it.unitPrice || 600) * (it.quantity || 1),
                createdAt: order.date || new Date().toISOString()
              });
            }
          }
        }

        // Migrate customer record
        if (order.customerPhone) {
          const existingCust = this.tables.customers.find(c => c.phone === order.customerPhone);
          if (existingCust) {
            existingCust.totalOrders += 1;
            existingCust.totalSpent += (order.total || 0);
          } else {
            this.tables.customers.push({
              id: `cust-${order.customerPhone.replace(/\D/g, '')}`,
              name: order.customerName || 'عميل',
              phone: order.customerPhone,
              district: order.address?.district || 'صنعاء',
              totalOrders: 1,
              totalSpent: order.total || 0,
              loyaltyPoints: Math.floor((order.total || 0) / 100),
              createdAt: order.date || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
      }

      // 7. Ensure Inventory table is synced for all products
      for (const product of this.tables.products) {
        this.tables.inventory.set(product.id, {
          currentStock: product.stock,
          reservedStock: 0,
          minThreshold: 15,
          lastCountedAt: new Date().toISOString()
        });
      }

      // 8. Ensure Default Master Owner Account (هاشم السماوي) exists
      this.ensureDefaultUsers();

      this.isInitialized = true;
      this.saveLocal();
      console.log('✅ Cloudflare D1 Database Access Layer Initialized Successfully. Database ID:', CLOUDFLARE_CONFIG.databaseId);
    } catch (e) {
      console.error('Error during D1 DAL initialization:', e);
      if (process.env.NODE_ENV === 'production') {
        throw e;
      }
      this.isInitialized = true;
    }
  })();

  return this.initPromise;
}

  /**
   * Ensure Owner Account structure exists and loads credentials strictly from environment or D1
   */
  public ensureDefaultUsers() {
    const hasOwner = this.tables.users.some(u => u.role === 'owner');
    const envAdminPhone = process.env.ADMIN_PHONE ? normalizeDigits(process.env.ADMIN_PHONE.trim()) : '';
    const envAdminName = process.env.ADMIN_NAME ? process.env.ADMIN_NAME.trim() : 'مالك المتجر';
    const envAdminPin = process.env.ADMIN_PIN ? normalizeDigits(process.env.ADMIN_PIN.trim()) : '';

    if (!hasOwner) {
      if (process.env.NODE_ENV === 'production') {
        // In production, only provision owner if explicit ADMIN_PHONE environment variable is configured
        if (envAdminPhone) {
          const ownerAccount: UserAccount = {
            id: `usr-owner-${envAdminPhone}`,
            name: envAdminName,
            phone: envAdminPhone,
            role: 'owner',
            createdAt: new Date().toISOString()
          };
          if (envAdminPin) {
            ownerAccount.pinHash = hashSecret(envAdminPin);
          }
          this.tables.users.push(ownerAccount);
          if (this.isD1Configured()) {
            this.executeCloudflareD1Query(
              "INSERT OR IGNORE INTO users (id, name, phone, role, pin_hash, created_at) VALUES (?, ?, ?, ?, ?, ?);",
              [ownerAccount.id, ownerAccount.name, ownerAccount.phone, ownerAccount.role, ownerAccount.pinHash || null, ownerAccount.createdAt]
            ).catch((err) => { console.warn('Could not sync env owner to D1:', err); });
          }
        }
      } else {
        // Development only fallback
        const defaultOwner: UserAccount = {
          id: 'usr-owner-hashem',
          name: 'هاشم السماوي (المالك)',
          phone: envAdminPhone || '777000111',
          role: 'owner',
          createdAt: new Date().toISOString()
        };
        if (envAdminPin) {
          defaultOwner.pinHash = hashSecret(envAdminPin);
        }
        this.tables.users.push(defaultOwner);
        this.saveLocal();

        if (this.isD1Configured()) {
          this.executeCloudflareD1Query(
            "INSERT OR IGNORE INTO users (id, name, phone, role, pin_hash, created_at) VALUES (?, ?, ?, ?, ?, ?);",
            [defaultOwner.id, defaultOwner.name, defaultOwner.phone, defaultOwner.role, defaultOwner.pinHash || null, defaultOwner.createdAt]
          ).catch(() => {});
        }
      }
    } else if (envAdminPin) {
      // Sync environment ADMIN_PIN if owner user has no pin/password hash yet
      const owner = this.tables.users.find(u => u.role === 'owner');
      if (owner && !owner.pinHash && !owner.passwordHash) {
        owner.pinHash = hashSecret(envAdminPin);
        this.saveLocal();
        if (this.isD1Configured()) {
          this.executeCloudflareD1Query(
            "UPDATE users SET pin_hash = ? WHERE id = ?;",
            [owner.pinHash, owner.id]
          ).catch(() => {});
        }
      }
    }
  }

  public isD1Configured(): boolean {
    return !!(CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId);
  }

  /**
   * Fetch primary authoritative data directly from remote Cloudflare D1
   */
  public async syncFromCloudflareD1(): Promise<boolean> {
    if (!this.isD1Configured()) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
      }
      return false;
    }

    try {
      // 0. Ensure Trigger for negative stock prevention exists on D1
      await this.executeCloudflareD1Query(
        "CREATE TRIGGER IF NOT EXISTS prevent_negative_stock BEFORE UPDATE ON products FOR EACH ROW WHEN NEW.stock < 0 BEGIN SELECT RAISE(ABORT, 'Insufficient stock: product stock cannot be negative'); END;"
      );

      // 1. Categories (Authoritative D1)
      const categoriesResult = await this.executeCloudflareD1Query("SELECT * FROM categories ORDER BY sort_order ASC;");
      this.tables.categories = Array.isArray(categoriesResult) ? categoriesResult : [];

      // 2. Products (Authoritative D1)
      const productsResult = await this.executeCloudflareD1Query("SELECT * FROM products;");
      this.tables.products = Array.isArray(productsResult) ? productsResult.map((r: any) => {
        const parsedImages = typeof r.images === 'string' ? JSON.parse(r.images || '[]') : (r.images || []);
        const primaryImg = parsedImages[0] || r.image || '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg';
        return {
          id: r.id,
          nameAr: r.name_ar,
          nameEn: r.name_en,
          category: r.category,
          price: r.price,
          originalPrice: r.original_price,
          discountPercent: r.discount_percent,
          descriptionAr: r.description_ar,
          descriptionEn: r.description_en,
          origin: r.origin,
          burnDurationHours: r.burn_duration_hours,
          ashPercentage: r.ash_percentage,
          moisture: r.moisture,
          rating: r.rating,
          reviewCount: r.review_count,
          image: primaryImg,
          images: parsedImages.length > 0 ? parsedImages : [primaryImg],
          specs: typeof r.specs === 'string' ? JSON.parse(r.specs || '[]') : (r.specs || []),
          weightOptions: typeof r.weight_options === 'string' ? JSON.parse(r.weight_options || '[]') : (r.weight_options || []),
          isFeatured: Boolean(r.is_featured),
          isBestSeller: Boolean(r.is_best_seller),
          stock: r.stock
        };
      }) : [];

      this.tables.inventory.clear();
      for (const p of this.tables.products) {
        this.tables.inventory.set(p.id, {
          currentStock: p.stock,
          reservedStock: 0,
          minThreshold: 15,
          lastCountedAt: new Date().toISOString()
        });
      }

      // 3. Orders (Authoritative D1)
      const ordersResult = await this.executeCloudflareD1Query("SELECT * FROM orders ORDER BY created_at DESC;");
      this.tables.orders = Array.isArray(ordersResult) ? ordersResult.map((r: any) => ({
        id: r.id,
        orderNumber: r.order_number,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        customerAddress: r.delivery_address,
        address: {
          id: 'addr-d1',
          title: r.delivery_district,
          district: r.delivery_district,
          street: r.delivery_address,
          phone: r.customer_phone,
          isDefault: true
        },
        items: typeof r.items_json === 'string' ? JSON.parse(r.items_json || '[]') : (r.items_json || []),
        subtotal: r.subtotal,
        shippingFee: r.shipping_fee || 0,
        deliveryFee: r.shipping_fee || 0,
        discount: r.discount,
        total: r.total,
        totalAmount: r.total,
        district: r.delivery_district,
        paymentMethod: r.payment_method,
        status: r.status,
        date: r.created_at,
        createdAt: r.created_at,
        driverId: r.driver_id || undefined,
        driverName: r.driver_name || undefined,
        driverPhone: r.driver_phone || undefined,
        driverNotes: r.driver_notes || undefined,
        timeline: typeof r.timeline_json === 'string' ? JSON.parse(r.timeline_json || '[]') : (r.timeline_json || undefined),
        isStockRolledBack: Boolean(r.is_stock_rolled_back),
        cancelledAt: r.cancelled_at || undefined,
        completedAt: r.completed_at || undefined
      })) : [];

      // 4. Relational Order Items (Authoritative D1)
      const itemsResult = await this.executeCloudflareD1Query("SELECT * FROM order_items;");
      this.tables.order_items = Array.isArray(itemsResult) ? itemsResult.map((it: any) => ({
        id: it.id,
        orderId: it.order_id,
        productId: it.product_id,
        productNameAr: it.product_name_ar,
        productNameEn: it.product_name_en,
        weightOption: it.weight_option,
        quantity: it.quantity,
        unitPrice: it.unit_price,
        totalPrice: it.total_price,
        createdAt: it.created_at
      })) : [];

      // 5. Customers (Authoritative D1)
      const custResult = await this.executeCloudflareD1Query("SELECT * FROM customers;");
      this.tables.customers = Array.isArray(custResult) ? custResult.map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        district: c.district,
        totalOrders: c.total_orders || 0,
        totalSpent: c.total_spent || 0,
        loyaltyPoints: c.loyalty_points || 0,
        createdAt: c.created_at || new Date().toISOString(),
        updatedAt: c.updated_at || new Date().toISOString()
      })) : [];

      // 6. Users & Owner (Authoritative D1)
      const usersResult = await this.executeCloudflareD1Query("SELECT * FROM users;");
      this.tables.users = Array.isArray(usersResult) ? usersResult.map((u: any) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email || undefined,
        role: u.role,
        passwordHash: u.password_hash || undefined,
        pinHash: u.pin_hash || undefined,
        createdAt: u.created_at || new Date().toISOString(),
        lastLogin: u.last_login || undefined
      })) : [];

      // 7. Inventory Logs (Authoritative D1)
      const logsResult = await this.executeCloudflareD1Query("SELECT * FROM inventory_logs ORDER BY created_at DESC LIMIT 500;");
      this.tables.inventory_logs = Array.isArray(logsResult) ? logsResult.map((l: any) => ({
        id: l.id,
        productId: l.product_id,
        productName: l.product_name,
        type: l.type,
        quantity: l.quantity,
        previousStock: l.previous_stock,
        newStock: l.new_stock,
        reason: l.reason,
        orderId: l.order_id || undefined,
        performedBy: l.performed_by,
        createdAt: l.created_at
      })) : [];

      // 8. Delivery Agents (Authoritative D1)
      const daResult = await this.executeCloudflareD1Query("SELECT * FROM delivery_agents;");
      this.tables.delivery_agents = Array.isArray(daResult) ? daResult.map((da: any) => ({
        id: da.id,
        name: da.name,
        phone: da.phone,
        vehicleType: da.vehicle_type || da.vehicle || 'motorcycle',
        assignedDistricts: typeof da.assigned_districts === 'string' ? JSON.parse(da.assigned_districts || '[]') : (da.assigned_districts || []),
        completedOrdersCount: da.total_delivered_count || da.completed_orders_count || 0,
        rating: da.rating || 5.0,
        isActive: da.is_available !== undefined ? Boolean(da.is_available) : (da.is_active !== undefined ? Boolean(da.is_active) : true)
      })) : [];

      // 9. Coupons (Authoritative D1)
      const couponResult = await this.executeCloudflareD1Query("SELECT * FROM coupons;");
      this.tables.coupons = Array.isArray(couponResult) ? couponResult.map((cp: any) => ({
        code: cp.code,
        discountPercent: cp.discount_percent,
        maxDiscount: cp.max_discount,
        minOrderAmount: cp.min_order_amount,
        isActive: Boolean(cp.is_active),
        validUntil: cp.valid_until || undefined,
        usageCount: cp.usage_count || 0,
        maxUses: cp.max_uses !== undefined && cp.max_uses !== null ? Number(cp.max_uses) : undefined
      })) : [];

      // 10. Reviews (Authoritative D1)
      const revResult = await this.executeCloudflareD1Query("SELECT * FROM reviews ORDER BY created_at DESC;");
      this.tables.reviews = Array.isArray(revResult) ? revResult.map((rv: any) => ({
        id: rv.id,
        productId: rv.product_id,
        userName: rv.customer_name || rv.user_name || 'عميل المتجر',
        userPhone: rv.customer_phone || rv.user_phone || undefined,
        rating: Number(rv.rating || 5),
        comment: rv.comment || '',
        verifiedPurchase: Boolean(rv.is_verified ?? rv.verified_purchase),
        date: rv.created_at
      })) : [];

      // 11. Store Settings (Authoritative D1)
      const stResult = await this.executeCloudflareD1Query("SELECT * FROM store_settings WHERE id = 'default_settings';");
      if (Array.isArray(stResult) && stResult.length > 0) {
        const st = stResult[0];
        const districts = typeof st.delivery_districts === 'string'
          ? JSON.parse(st.delivery_districts || '[]')
          : (st.delivery_districts || this.tables.store_settings.deliveryDistricts);

        this.tables.store_settings = {
          ...this.tables.store_settings,
          storeNameAr: st.store_name_ar || this.tables.store_settings.storeNameAr,
          storeNameEn: st.store_name_en || this.tables.store_settings.storeNameEn,
          sloganAr: st.slogan_ar || this.tables.store_settings.sloganAr,
          logoText: st.logo_text || this.tables.store_settings.logoText,
          customLogoUrl: st.custom_logo_url || this.tables.store_settings.customLogoUrl,
          topBannerNoticeAr: st.top_banner_notice_ar || this.tables.store_settings.topBannerNoticeAr,
          topBannerNoticeEn: st.top_banner_notice_en || this.tables.store_settings.topBannerNoticeEn,
          whatsappPhone: st.whatsapp_phone || this.tables.store_settings.whatsappPhone,
          whatsappNumber: st.whatsapp_phone || this.tables.store_settings.whatsappNumber,
          supportPhone: st.call_phone || this.tables.store_settings.supportPhone,
          supportEmail: st.contact_email || this.tables.store_settings.supportEmail,
          freeDeliveryThreshold: Number(st.free_delivery_threshold || this.tables.store_settings.freeDeliveryThreshold),
          freeShippingThreshold: Number(st.free_delivery_threshold || this.tables.store_settings.freeShippingThreshold),
          defaultShippingFee: st.default_delivery_fee || this.tables.store_settings.defaultShippingFee,
          isOrderingEnabled: st.is_store_open !== undefined ? Boolean(st.is_store_open) : true,
          deliveryDistricts: districts
        };
      }

      // 12. Gallery Items (Authoritative D1)
      const galResult = await this.executeCloudflareD1Query("SELECT * FROM gallery_items ORDER BY sort_order ASC, created_at DESC;");
      this.tables.gallery_items = Array.isArray(galResult) ? galResult.map((g: any) => ({
        id: g.id,
        titleAr: g.title_ar,
        titleEn: g.title_en || undefined,
        image: g.image_url || '',
        imageUrl: g.image_url,
        category: g.category || 'factory',
        caption: g.caption || undefined,
        sortOrder: g.sort_order || 0,
        isActive: g.is_active !== undefined ? Boolean(g.is_active) : true,
        createdAt: g.created_at
      })) : [];

      this.ensureDefaultUsers();

      console.log('✅ Cloudflare D1 primary sync completed successfully for all operational tables.');
      return true;
    } catch (e) {
      console.error('CRITICAL: D1 remote sync failed on one or more tables:', e);
      if (process.env.NODE_ENV === 'production') {
        throw e;
      }
      return false;
    }
  }

  /**
   * Execute raw query directly on Cloudflare D1 HTTP REST API
   */
  public async executeCloudflareD1Raw(sql: string, params: any[] = []): Promise<{ success: boolean; result?: any[]; errors?: any[]; messages?: any[] }> {
    if (!this.isD1Configured()) {
      return { success: false, errors: [{ code: 5000, message: 'Cloudflare D1 is not configured' }] };
    }

    try {
      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/d1/database/${CLOUDFLARE_CONFIG.databaseId}/query`;
      const body: any = { sql };
      if (params && params.length > 0) {
        body.params = params;
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000)
      });

      const json = await res.json();
      return json;
    } catch (err: any) {
      console.warn('Cloudflare D1 HTTP query error:', err);
      return { success: false, errors: [{ code: 5000, message: err.message || 'Network error' }] };
    }
  }

  /**
   * Execute compound batch of SQL statements atomically on Cloudflare D1 HTTP REST API.
   * If any statement fails (e.g. check constraint or prevent_negative_stock trigger),
   * Cloudflare D1 rolls back the entire batch transaction and returns success: false.
   */
  public async executeCloudflareD1BatchRaw(
    statements: Array<{ sql: string; params?: any[] }>
  ): Promise<{ success: boolean; result?: any[]; errors?: any[]; messages?: any[] }> {
    if (!this.isD1Configured()) {
      return { success: false, errors: [{ code: 5000, message: 'Cloudflare D1 is not configured' }] };
    }

    try {
      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/d1/database/${CLOUDFLARE_CONFIG.databaseId}/query`;
      // Cloudflare D1 batch endpoint accepts { batch: [{ sql, params }] }
      const body: any = { batch: statements };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000)
      });

      const json = await res.json();
      return json;
    } catch (err: any) {
      console.warn('Cloudflare D1 HTTP batch query error:', err);
      return { success: false, errors: [{ code: 5000, message: err.message || 'Network error' }] };
    }
  }

  /**
   * Execute query directly on Cloudflare D1 HTTP REST API.
   * Throws an explicit error on failure or when D1 is unconfigured in production.
   * Returns empty array if query succeeded and returned no rows.
   */
  public async executeCloudflareD1Query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.isD1Configured()) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
      }
      throw new Error('Cloudflare D1 is not configured');
    }

    const json = await this.executeCloudflareD1Raw(sql, params);
    if (!json || json.success === false || !json.result) {
      const errMsg = (json?.errors || []).map((e: any) => e.message || JSON.stringify(e)).join('; ') || 'D1 query failed';
      console.error('Cloudflare D1 HTTP query failed:', errMsg, 'SQL:', sql);
      throw new Error(`فشل استعلام Cloudflare D1: ${errMsg}`);
    }
    return json.result?.[0]?.results ?? [];
  }

  private saveLocal() {
    // In production or when Cloudflare D1 is configured, do NOT write to or rely on local db.json
    if (process.env.NODE_ENV === 'production' || this.isD1Configured()) {
      return;
    }
    try {
      const payload = {
        products: this.tables.products,
        users: this.tables.users,
        orders: this.tables.orders,
        orderItems: this.tables.order_items,
        customers: this.tables.customers,
        reviews: this.tables.reviews,
        coupons: this.tables.coupons,
        deliveryAgents: this.tables.delivery_agents,
        storeSettings: this.tables.store_settings,
        galleryItems: this.tables.gallery_items,
        inventoryTransactions: this.tables.inventory_logs,
        payments: this.tables.payments,
        notifications: this.tables.notifications,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(this.localDbPath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write local database file:', err);
    }
  }

  // ==========================================
  // CLOUDFLARE D1 ROW MAPPERS (Pure Relational -> Domain Objects)
  // ==========================================

  public mapD1ProductToProduct(r: any): Product {
    const images = typeof r.images === 'string' ? (JSON.parse(r.images || '[]') || []) : (r.images || []);
    const primaryImg = images[0] || r.image || '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg';
    const specs = typeof r.specs === 'string' ? (JSON.parse(r.specs || '[]') || []) : (r.specs || []);
    const weightOptions = typeof r.weight_options === 'string' ? (JSON.parse(r.weight_options || '[]') || []) : (r.weight_options || []);

    return {
      id: r.id,
      nameAr: r.name_ar || r.nameAr || 'فحم الذهب الأسود',
      nameEn: r.name_en || r.nameEn || 'Black Gold Charcoal',
      category: r.category || 'pouches',
      price: Number(r.price),
      originalPrice: r.original_price ? Number(r.original_price) : undefined,
      discountPercent: r.discount_percent ? Number(r.discount_percent) : 0,
      descriptionAr: r.description_ar || r.descriptionAr || '',
      descriptionEn: r.description_en || r.descriptionEn || '',
      image: primaryImg,
      images: images.length > 0 ? images : [primaryImg],
      specs,
      weightOptions,
      isFeatured: Boolean(r.is_featured),
      isBestSeller: Boolean(r.is_best_seller),
      stock: Number(r.stock ?? 0),
      origin: r.origin || 'الذهب الأسود - صنعاء',
      burnDurationHours: r.burn_duration_hours || '6+ ساعات متواصلة',
      ashPercentage: r.ash_percentage || 'أقل من 1.5% رماد أبيض',
      moisture: r.moisture || '< 2%',
      rating: Number(r.rating || 5.0),
      reviewCount: Number(r.review_count || 0),
      updatedAt: r.updated_at
    };
  }

  public mapD1OrderToOrder(r: any): Order {
    const items = typeof r.items_json === 'string' ? (JSON.parse(r.items_json || '[]') || []) : (r.items_json || []);
    const timeline = typeof r.timeline_json === 'string' ? (JSON.parse(r.timeline_json || '[]') || []) : (r.timeline_json || []);

    return {
      id: r.id,
      orderNumber: r.order_number || r.orderNumber || r.id,
      date: r.created_at || r.date || new Date().toISOString(),
      createdAt: r.created_at || r.createdAt,
      status: r.status,
      items,
      subtotal: Number(r.subtotal || 0),
      shippingFee: Number(r.shipping_fee || 0),
      discount: Number(r.discount || 0),
      total: Number(r.total || 0),
      totalAmount: Number(r.total || 0),
      district: r.delivery_district || r.district || '',
      address: {
        id: `addr-${r.id}`,
        title: r.delivery_district || '',
        district: r.delivery_district || '',
        street: r.delivery_address || '',
        phone: r.customer_phone || '',
        isDefault: true
      },
      customerName: r.customer_name || r.customerName || '',
      customerPhone: r.customer_phone || r.customerPhone || '',
      paymentMethod: r.payment_method || r.paymentMethod || 'cash',
      paymentStatus: r.payment_status || r.paymentStatus || 'pending',
      couponCode: r.coupon_code || r.couponCode || undefined,
      notes: r.notes || '',
      driverNotes: r.driver_notes || '',
      driverId: r.driver_id || '',
      driverName: r.driver_name || '',
      driverPhone: r.driver_phone || '',
      timeline,
      idempotencyKey: r.idempotency_key || r.idempotencyKey,
      isStockRolledBack: Boolean(r.is_stock_rolled_back)
    };
  }

  public mapD1UserToUser(r: any): UserAccount {
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      role: r.role,
      pinHash: r.pin_hash || r.pinHash,
      passwordHash: r.password_hash || r.passwordHash,
      createdAt: r.created_at || r.createdAt,
      lastLogin: r.last_login || r.lastLogin
    };
  }

  public mapD1CustomerToCustomer(r: any): CustomerRecord {
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      district: r.district || '',
      street: r.street || '',
      notes: r.notes || '',
      totalOrders: Number(r.total_orders || 0),
      totalSpent: Number(r.total_spent || 0),
      loyaltyPoints: Number(r.loyalty_points || 0),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  public mapD1CouponToCoupon(r: any): Coupon {
    return {
      code: r.code,
      discountPercent: Number(r.discount_percent || 0),
      maxDiscount: r.max_discount ? Number(r.max_discount) : undefined,
      minOrderAmount: Number(r.min_order_amount || 0),
      isActive: Boolean(r.is_active),
      validUntil: r.valid_until || undefined,
      usageCount: Number(r.usage_count || 0),
      maxUses: r.max_uses !== undefined && r.max_uses !== null ? Number(r.max_uses) : undefined
    };
  }

  public mapD1ReviewToReview(r: any): Review {
    return {
      id: r.id,
      productId: r.product_id,
      userName: r.customer_name || r.user_name || 'عميل المتجر',
      userPhone: r.customer_phone || r.user_phone || undefined,
      rating: Number(r.rating || 5),
      comment: r.comment || '',
      verifiedPurchase: Boolean(r.is_verified ?? r.verified_purchase),
      date: r.created_at
    };
  }

  public mapD1DeliveryAgentToAgent(r: any): DeliveryAgent {
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      vehicleType: r.vehicle_type || 'motorcycle',
      assignedDistricts: typeof r.assigned_districts === 'string' ? (JSON.parse(r.assigned_districts || '[]') || []) : (r.assigned_districts || []),
      completedOrdersCount: Number(r.total_delivered_count || r.completed_orders_count || 0),
      rating: Number(r.rating || 5.0),
      isActive: Boolean(r.is_available !== undefined ? r.is_available : r.is_active)
    };
  }

  // ==========================================
  // 1. PRODUCTS & CATEGORIES
  // ==========================================

  public getProducts(): Product[] {
    return this.tables.products.map(p => {
      const primaryImg = p.image || p.images?.[0] || '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg';
      return {
        ...p,
        image: primaryImg,
        images: (p.images && p.images.length > 0) ? p.images : [primaryImg]
      };
    });
  }

  public async getProductsAsync(): Promise<Product[]> {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM products ORDER BY id ASC;");
        if (Array.isArray(rows)) {
          const prods = rows.map((r: any) => this.mapD1ProductToProduct(r));
          this.tables.products = prods;
          return prods;
        }
      } catch (e) {
        console.error('D1 getProductsAsync error:', e);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل استعلام المنتجات من قاعدة بيانات Cloudflare D1');
      }
      return this.tables.products;
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.getProducts();
  }

  public findProductById(id: string): Product | undefined {
    const p = this.tables.products.find(p => p.id === id);
    if (!p) return undefined;
    const primaryImg = p.image || p.images?.[0] || '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg';
    return {
      ...p,
      image: primaryImg,
      images: (p.images && p.images.length > 0) ? p.images : [primaryImg]
    };
  }

  public async findProductByIdAsync(id: string): Promise<Product | undefined> {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM products WHERE id = ? LIMIT 1;", [id]);
        if (Array.isArray(rows)) {
          if (rows.length > 0) {
            return this.mapD1ProductToProduct(rows[0]);
          }
          return undefined; // Not found in D1, do not fallback to mock in production
        }
      } catch (e) {
        console.error('D1 findProductByIdAsync error:', e);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل البحث عن المنتج في قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.findProductById(id);
  }

  public addProduct(product: Product): Product {
    const primaryImg = product.image || product.images?.[0] || '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg';
    product.image = primaryImg;
    product.images = (product.images && product.images.length > 0) ? product.images : [primaryImg];

    this.tables.products.push(product);
    this.saveLocal();
    return product;
  }

  public async addProductAsync(product: Product): Promise<Product> {
    const primaryImg = product.image || product.images?.[0] || '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg';
    product.image = primaryImg;
    product.images = (product.images && product.images.length > 0) ? product.images : [primaryImg];

    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `INSERT INTO products (id, name_ar, name_en, category, price, original_price, discount_percent, description_ar, description_en, origin, burn_duration_hours, ash_percentage, moisture, rating, review_count, images, specs, weight_options, is_featured, is_best_seller, stock, created_at, updated_at) ` +
        `VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'));`,
        [
          product.id,
          product.nameAr,
          product.nameEn || '',
          product.category || 'pouches',
          product.price,
          product.originalPrice || product.price,
          product.discountPercent || 0,
          product.descriptionAr || '',
          product.descriptionEn || '',
          product.origin || 'الذهب الأسود - صنعاء',
          product.burnDurationHours || '6+ ساعات متواصلة',
          product.ashPercentage || 'أقل من 1.5% رماد أبيض',
          product.moisture || '< 2%',
          product.rating || 5.0,
          product.reviewCount || 0,
          JSON.stringify(product.images || [primaryImg]),
          JSON.stringify(product.specs || []),
          JSON.stringify(product.weightOptions || []),
          product.isFeatured ? 1 : 0,
          product.isBestSeller ? 1 : 0,
          product.stock ?? 100
        ]
      );
      const created = await this.findProductByIdAsync(product.id);
      if (created) {
        // Keep inventory table in sync with new product
        await this.executeCloudflareD1Query(
          `INSERT INTO inventory (product_id, current_stock, min_threshold, updated_at) VALUES (?, ?, 10, datetime('now')) ` +
          `ON CONFLICT(product_id) DO UPDATE SET current_stock = excluded.current_stock, updated_at = datetime('now');`,
          [product.id, product.stock ?? 100]
        );
        this.tables.products.push(created);
        return created;
      }
      throw new Error('فشل تأكيد إضافة المنتج في قاعدة بيانات Cloudflare D1');
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    return this.addProduct(product);
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.tables.products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const current = this.tables.products[idx];
    const finalImage = updates.image || updates.images?.[0] || current.image || current.images?.[0] || '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg';
    const finalImages = (updates.images && updates.images.length > 0) ? updates.images : (current.images && current.images.length > 0 ? current.images : [finalImage]);

    const updated: Product = {
      ...current,
      ...updates,
      image: finalImage,
      images: finalImages
    };
    this.tables.products[idx] = updated;
    this.saveLocal();
    return updated;
  }

  public async updateProductAsync(id: string, updates: Partial<Product>): Promise<Product | null> {
    if (this.isD1Configured()) {
      const current = await this.findProductByIdAsync(id);
      if (!current) return null;

      const finalNameAr = updates.nameAr !== undefined ? updates.nameAr : current.nameAr;
      const finalNameEn = updates.nameEn !== undefined ? updates.nameEn : (current.nameEn || '');
      const finalCategory = updates.category !== undefined ? updates.category : (current.category || 'pouches');
      const finalPrice = updates.price !== undefined ? Number(updates.price) : current.price;
      const finalOrigPrice = updates.originalPrice !== undefined ? Number(updates.originalPrice) : (current.originalPrice || finalPrice);
      const finalDiscount = updates.discountPercent !== undefined ? Number(updates.discountPercent) : (current.discountPercent || 0);
      const finalDescAr = updates.descriptionAr !== undefined ? updates.descriptionAr : current.descriptionAr;
      const finalDescEn = updates.descriptionEn !== undefined ? updates.descriptionEn : (current.descriptionEn || '');
      const finalStock = updates.stock !== undefined ? Math.max(0, Number(updates.stock)) : current.stock;
      
      let finalImages = current.images || [];
      if (updates.images && updates.images.length > 0) {
        finalImages = updates.images;
      } else if (updates.image) {
        finalImages = [updates.image, ...(current.images?.filter(img => img !== updates.image) || [])];
      }

      const finalWeightOptions = updates.weightOptions !== undefined ? updates.weightOptions : (current.weightOptions || []);
      const finalSpecs = updates.specs !== undefined ? updates.specs : (current.specs || []);
      const finalIsFeatured = updates.isFeatured !== undefined ? (updates.isFeatured ? 1 : 0) : (current.isFeatured ? 1 : 0);
      const finalIsBestSeller = updates.isBestSeller !== undefined ? (updates.isBestSeller ? 1 : 0) : (current.isBestSeller ? 1 : 0);

      await this.executeCloudflareD1Query(
        `UPDATE products SET ` +
        `name_ar = ?, name_en = ?, category = ?, price = ?, original_price = ?, discount_percent = ?, ` +
        `description_ar = ?, description_en = ?, stock = ?, images = ?, weight_options = ?, specs = ?, ` +
        `is_featured = ?, is_best_seller = ?, updated_at = datetime('now') WHERE id = ?;`,
        [
          finalNameAr, finalNameEn, finalCategory, finalPrice, finalOrigPrice, finalDiscount,
          finalDescAr, finalDescEn, finalStock, JSON.stringify(finalImages), JSON.stringify(finalWeightOptions), JSON.stringify(finalSpecs),
          finalIsFeatured, finalIsBestSeller, id
        ]
      );

      // Keep inventory table in sync with product stock
      if (updates.stock !== undefined) {
        await this.executeCloudflareD1Query(
          `INSERT INTO inventory (product_id, current_stock, min_threshold, updated_at) VALUES (?, ?, 10, datetime('now')) ` +
          `ON CONFLICT(product_id) DO UPDATE SET current_stock = excluded.current_stock, updated_at = datetime('now');`,
          [id, finalStock]
        );
      }

      const updated = await this.findProductByIdAsync(id);
      if (updated) {
        const idx = this.tables.products.findIndex(p => p.id === id);
        if (idx !== -1) this.tables.products[idx] = updated;
        const inv = this.tables.inventory.get(id);
        if (inv && updates.stock !== undefined) {
          inv.currentStock = finalStock;
        }
        this.saveLocal();
        return updated;
      }
      return null;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    return this.updateProduct(id, updates);
  }

  public deleteProduct(id: string): boolean {
    const prevLen = this.tables.products.length;
    this.tables.products = this.tables.products.filter(p => p.id !== id);
    this.saveLocal();
    return this.tables.products.length < prevLen;
  }

  public async deleteProductAsync(id: string): Promise<boolean> {
    if (this.isD1Configured()) {
      // Remove dependent records first if any exist
      try {
        await this.executeCloudflareD1Query("DELETE FROM inventory WHERE product_id = ?;", [id]);
        await this.executeCloudflareD1Query("DELETE FROM inventory_logs WHERE product_id = ?;", [id]);
      } catch (e) {
        // Continue with product deletion
      }
      await this.executeCloudflareD1Query("DELETE FROM products WHERE id = ?;", [id]);
      this.tables.products = this.tables.products.filter(p => p.id !== id);
      return true;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    return this.deleteProduct(id);
  }

  public getCategories() {
    return this.tables.categories;
  }

  public async getCategoriesAsync(): Promise<any[]> {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM categories ORDER BY sort_order ASC;");
        if (Array.isArray(rows)) {
          return rows.map((c: any) => ({
            id: c.id,
            nameAr: c.name_ar,
            nameEn: c.name_en,
            slug: c.slug,
            sortOrder: c.sort_order,
            isActive: Boolean(c.is_active)
          }));
        }
      } catch (e) {
        console.error('D1 getCategoriesAsync error:', e);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل استعلام الأقسام من قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.getCategories();
  }

  // ==========================================
  // 2. USERS & CUSTOMERS (Pure D1 Authentication)
  // ==========================================

  public getUsers(): UserAccount[] {
    return this.tables.users;
  }

  public async getUsersAsync(): Promise<UserAccount[]> {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM users;");
        if (Array.isArray(rows)) {
          const userAccounts = rows.map((r: any) => this.mapD1UserToUser(r));
          this.tables.users = userAccounts;
          return userAccounts;
        }
      } catch (e) {
        console.error('D1 getUsersAsync error:', e);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل استعلام المستخدمين من قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.getUsers();
  }

  public findUserById(id: string): UserAccount | undefined {
    return this.tables.users.find(u => u.id === id);
  }

  public async findUserByIdAsync(id: string): Promise<UserAccount | undefined> {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM users WHERE id = ? LIMIT 1;", [id]);
        if (Array.isArray(rows)) {
          if (rows.length > 0) {
            return this.mapD1UserToUser(rows[0]);
          }
          return undefined;
        }
      } catch (e) {
        console.error('D1 findUserByIdAsync error:', e);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل التحقق من المستخدم في قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.findUserById(id);
  }

  public findUserByPhone(phone: string): UserAccount | undefined {
    const clean = phone.replace(/\D/g, '');
    return this.tables.users.find(u => u.phone.replace(/\D/g, '') === clean);
  }

  public async findUserByPhoneAsync(phone: string): Promise<UserAccount | undefined> {
    const clean = phone.replace(/\D/g, '');
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM users WHERE phone = ? LIMIT 1;", [clean]);
        if (Array.isArray(rows)) {
          if (rows.length > 0) {
            return this.mapD1UserToUser(rows[0]);
          }
          return undefined;
        }
      } catch (e) {
        console.error('D1 findUserByPhoneAsync error:', e);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل البحث عن المستخدم برقم الهاتف في قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.findUserByPhone(phone);
  }

  public addUser(user: UserAccount): UserAccount {
    const existing = this.findUserById(user.id) || this.findUserByPhone(user.phone);
    if (existing) {
      Object.assign(existing, user);
      this.saveLocal();
      return existing;
    }
    this.tables.users.push(user);
    this.saveLocal();
    return user;
  }

  public async addUserAsync(user: UserAccount): Promise<UserAccount> {
    const clean = user.phone.replace(/\D/g, '');
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `INSERT INTO users (id, name, phone, role, pin_hash, password_hash, created_at, last_login) ` +
        `VALUES (?, ?, ?, ?, ?, ?, ?, ?) ` +
        `ON CONFLICT(phone) DO UPDATE SET name = excluded.name, last_login = excluded.last_login;`,
        [user.id, user.name, clean, user.role, user.pinHash || null, user.passwordHash || null, user.createdAt || new Date().toISOString(), user.lastLogin || new Date().toISOString()]
      );
      const readBack = await this.findUserByPhoneAsync(clean);
      if (readBack) {
        const idx = this.tables.users.findIndex(u => u.phone.replace(/\D/g, '') === clean || u.id === user.id);
        if (idx >= 0) this.tables.users[idx] = readBack;
        else this.tables.users.push(readBack);
        return readBack;
      }
      throw new Error('فشل التحقق من إضافة المستخدم في قاعدة بيانات Cloudflare D1');
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    return this.addUser(user);
  }

  public updateUser(id: string, updates: Partial<UserAccount>): UserAccount | null {
    const user = this.tables.users.find(u => u.id === id);
    if (!user) return null;
    Object.assign(user, updates);
    this.saveLocal();
    return user;
  }

  public async updateUserAsync(id: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `UPDATE users SET name = COALESCE(?, name), pin_hash = COALESCE(?, pin_hash), password_hash = COALESCE(?, password_hash), last_login = COALESCE(?, last_login) WHERE id = ?;`,
        [updates.name || null, updates.pinHash || null, updates.passwordHash || null, updates.lastLogin || null, id]
      );
      const readBack = await this.findUserByIdAsync(id);
      if (readBack) {
        const idx = this.tables.users.findIndex(u => u.id === id);
        if (idx >= 0) this.tables.users[idx] = readBack;
        return readBack;
      }
      return null;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    return this.updateUser(id, updates);
  }

  public getCustomers(): CustomerRecord[] {
    return this.tables.customers;
  }

  public async getCustomersAsync(): Promise<CustomerRecord[]> {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM customers ORDER BY total_orders DESC;");
        if (Array.isArray(rows)) {
          const custs = rows.map((r: any) => this.mapD1CustomerToCustomer(r));
          this.tables.customers = custs;
          return custs;
        }
      } catch (e) {
        console.error('D1 getCustomersAsync error:', e);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل استعلام سجل العملاء من قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.getCustomers();
  }

  public findOrCreateCustomer(name: string, phone: string, district?: string): CustomerRecord {
    const cleanPhone = phone.replace(/\D/g, '');
    let cust = this.tables.customers.find(c => c.phone.replace(/\D/g, '') === cleanPhone);

    if (!cust) {
      cust = {
        id: `cust-${cleanPhone}`,
        name: name.trim(),
        phone: cleanPhone,
        district: district || 'صنعاء',
        totalOrders: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.tables.customers.push(cust);
      this.saveLocal();
    } else {
      if (name && name !== 'عميل زائر') {
        cust.name = name.trim();
      }
      if (district) {
        cust.district = district;
      }
      cust.updatedAt = new Date().toISOString();
      this.saveLocal();
    }

    return cust;
  }

  public async findOrCreateCustomerAsync(name: string, phone: string, district?: string): Promise<CustomerRecord> {
    const cleanPhone = phone.replace(/\D/g, '');
    const custId = `cust-${cleanPhone}`;

    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `INSERT INTO customers (id, name, phone, district, total_orders, total_spent, loyalty_points, created_at, updated_at) ` +
        `VALUES (?, ?, ?, ?, 0, 0, 0, datetime('now'), datetime('now')) ` +
        `ON CONFLICT(phone) DO UPDATE SET ` +
        `name = CASE WHEN ? != '' AND ? != 'عميل زائر' THEN ? ELSE customers.name END, ` +
        `district = COALESCE(?, customers.district), ` +
        `updated_at = datetime('now');`,
        [custId, name.trim(), cleanPhone, district || 'صنعاء', name.trim(), name.trim(), name.trim(), district || null]
      );

      const rows = await this.executeCloudflareD1Query("SELECT * FROM customers WHERE phone = ? LIMIT 1;", [cleanPhone]);
      if (Array.isArray(rows) && rows.length > 0) {
        const cust = this.mapD1CustomerToCustomer(rows[0]);
        const idx = this.tables.customers.findIndex(c => c.phone.replace(/\D/g, '') === cleanPhone);
        if (idx >= 0) this.tables.customers[idx] = cust;
        else this.tables.customers.push(cust);
        return cust;
      }
      throw new Error('فشل تسجيل أو استرجاع بيانات العميل من قاعدة بيانات Cloudflare D1');
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    return this.findOrCreateCustomer(name, phone, district);
  }

  // ==========================================
  // 3. ORDERS & RELATIONAL ORDER ITEMS
  // ==========================================
  public getOrders(): Order[] {
    return this.tables.orders;
  }

  public async getOrdersAsync(filter?: { phone?: string; driverId?: string }): Promise<Order[]> {
    if (this.isD1Configured()) {
      try {
        let sql = "SELECT * FROM orders";
        const params: any[] = [];
        const conditions: string[] = [];

        if (filter?.phone) {
          conditions.push("customer_phone = ?");
          params.push(filter.phone.replace(/\D/g, ''));
        }
        if (filter?.driverId) {
          conditions.push("driver_id = ?");
          params.push(filter.driverId);
        }

        if (conditions.length > 0) {
          sql += " WHERE " + conditions.join(" AND ");
        }
        sql += " ORDER BY created_at DESC;";

        const rows = await this.executeCloudflareD1Query(sql, params);
        if (Array.isArray(rows)) {
          return rows.map((r: any) => this.mapD1OrderToOrder(r));
        }
      } catch (e) {
        console.error('D1 getOrdersAsync error:', e);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل استعلام الطلبات من قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    let result = this.tables.orders;
    if (filter?.phone) {
      const clean = filter.phone.replace(/\D/g, '');
      result = result.filter(o => o.customerPhone.replace(/\D/g, '') === clean);
    }
    if (filter?.driverId) {
      result = result.filter(o => o.driverId === filter.driverId);
    }
    return result;
  }

  public findOrderById(id: string): Order | undefined {
    return this.tables.orders.find(o => o.id === id || o.orderNumber === id);
  }

  public async findOrderByIdAsync(id: string): Promise<Order | undefined> {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query(
          "SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1;",
          [id, id]
        );
        if (Array.isArray(rows)) {
          if (rows.length > 0) {
            return this.mapD1OrderToOrder(rows[0]);
          }
          return undefined;
        }
      } catch (e) {
        console.error('D1 findOrderByIdAsync error:', e);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل البحث عن الطلب في قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.findOrderById(id);
  }

  public getOrderItems(orderId: string): OrderItemRecord[] {
    return this.tables.order_items.filter(oi => oi.orderId === orderId);
  }

  public async getOrderItemsAsync(orderId: string): Promise<OrderItemRecord[]> {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query(
          "SELECT * FROM order_items WHERE order_id = ?;",
          [orderId]
        );
        if (Array.isArray(rows)) {
          return rows.map((r: any) => ({
            id: r.id,
            orderId: r.order_id,
            productId: r.product_id || r.productId,
            productNameAr: r.product_name_ar,
            productNameEn: r.product_name_en,
            weightOption: r.weight_option,
            quantity: r.quantity,
            unitPrice: r.unit_price,
            totalPrice: r.total_price,
            createdAt: r.created_at
          }));
        }
      } catch (e) {
        console.error('D1 getOrderItemsAsync error:', e);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل استعلام عناصر الطلب من قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.getOrderItems(orderId);
  }

  public async createOrderAtomic(orderData: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    address: { district: string; street?: string; landmark?: string };
    validatedItems: Array<{
      productId: string;
      productNameAr: string;
      productNameEn?: string;
      weight: string;
      quantity: number;
      unitPrice: number;
    }>;
    subtotal: number;
    shippingFee: number;
    discount: number;
    total: number;
    paymentMethod: string;
    notes?: string;
    couponCode?: string;
    idempotencyKey?: string;
    assignedDriver?: { id: string; name: string; phone: string };
    timeline: Array<{ status: string; time: string; titleAr: string; titleEn: string }>;
    date: string;
  }): Promise<{ success: boolean; order?: Order; message?: string; isDuplicate?: boolean }> {
    const cleanPhone = orderData.customerPhone.replace(/\D/g, '');

    // Idempotency check: if order with this idempotency key was already created, return it
    if (orderData.idempotencyKey) {
      if (this.isD1Configured()) {
        const existingD1 = await this.executeCloudflareD1Query(
          "SELECT * FROM orders WHERE idempotency_key = ? LIMIT 1;",
          [orderData.idempotencyKey]
        );
        if (Array.isArray(existingD1) && existingD1.length > 0) {
          const row = existingD1[0];
          const existingOrder: Order = {
            id: row.id,
            orderNumber: row.order_number,
            date: row.created_at,
            createdAt: row.created_at,
            status: row.status,
            items: typeof row.items_json === 'string' ? JSON.parse(row.items_json || '[]') : (row.items_json || []),
            subtotal: row.subtotal,
            shippingFee: row.shipping_fee || 0,
            discount: row.discount || 0,
            total: row.total,
            totalAmount: row.total,
            district: row.delivery_district,
            address: {
              id: `addr-${row.id}`,
              title: row.delivery_district,
              district: row.delivery_district,
              street: row.delivery_address,
              phone: row.customer_phone,
              isDefault: true
            },
            customerName: row.customer_name,
            customerPhone: row.customer_phone,
            paymentMethod: row.payment_method,
            notes: row.notes || '',
            driverId: row.driver_id,
            driverName: row.driver_name,
            driverPhone: row.driver_phone,
            timeline: typeof row.timeline_json === 'string' ? JSON.parse(row.timeline_json || '[]') : (row.timeline_json || []),
            idempotencyKey: row.idempotency_key
          };
          return { success: true, order: existingOrder, isDuplicate: true, message: 'طلب مكرر تم إنشاؤه مسبقاً' };
        }
      }
      const existingMem = this.tables.orders.find(o => o.idempotencyKey === orderData.idempotencyKey);
      if (existingMem) {
        return { success: true, order: existingMem, isDuplicate: true, message: 'طلب مكرر تم إنشاؤه مسبقاً' };
      }
    }

    // 1. ATOMIC BATCH EXECUTION ON CLOUDFLARE D1
    if (this.isD1Configured()) {
      const batchStatements: Array<{ sql: string; params?: any[] }> = [];

      // 1. Stock deduction statements (Enforced by database trigger prevent_negative_stock & CHECK(stock >= 0))
      for (const it of orderData.validatedItems) {
        batchStatements.push({
          sql: "UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ?;",
          params: [it.quantity, it.productId]
        });
        batchStatements.push({
          sql: "UPDATE inventory SET current_stock = current_stock - ?, updated_at = datetime('now') WHERE product_id = ?;",
          params: [it.quantity, it.productId]
        });
      }

      // 2. Customer Upsert statement
      const customerId = `cust-${cleanPhone}`;
      batchStatements.push({
        sql: `INSERT INTO customers (id, name, phone, district, street, notes, total_orders, total_spent, loyalty_points, created_at, updated_at) ` +
          `VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, datetime('now'), datetime('now')) ` +
          `ON CONFLICT(phone) DO UPDATE SET ` +
          `name = CASE WHEN ? != '' AND ? != 'عميل زائر' THEN ? ELSE customers.name END, ` +
          `district = COALESCE(?, customers.district), ` +
          `total_orders = customers.total_orders + 1, ` +
          `total_spent = customers.total_spent + ?, ` +
          `loyalty_points = customers.loyalty_points + ?, ` +
          `updated_at = datetime('now');`,
        params: [
          customerId, orderData.customerName, cleanPhone, orderData.address.district, orderData.address.street || '', orderData.notes || '',
          orderData.total, Math.floor(orderData.total / 100),
          orderData.customerName, orderData.customerName, orderData.customerName,
          orderData.address.district, orderData.total, Math.floor(orderData.total / 100)
        ]
      });

      // 3. Insert Order statement
      batchStatements.push({
        sql: `INSERT INTO orders (` +
          `id, order_number, customer_id, customer_name, customer_phone, delivery_district, delivery_address, items_json, subtotal, shipping_fee, discount, total, payment_method, payment_status, status, is_stock_rolled_back, idempotency_key, coupon_code, driver_id, driver_name, driver_phone, notes, driver_notes, timeline_json, created_at, updated_at` +
          `) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'received', 0, ?, ?, ?, ?, ?, ?, '', ?, datetime('now'), datetime('now'));`,
        params: [
          orderData.orderId, orderData.orderNumber, customerId, orderData.customerName, cleanPhone,
          orderData.address.district, orderData.address.street || orderData.address.district,
          JSON.stringify(orderData.validatedItems),
          orderData.subtotal, orderData.shippingFee, orderData.discount, orderData.total,
          orderData.paymentMethod || 'cash',
          orderData.idempotencyKey || null,
          orderData.couponCode || null,
          orderData.assignedDriver?.id || 'dr-unassigned', orderData.assignedDriver?.name || 'غير مسند', orderData.assignedDriver?.phone || '',
          orderData.notes || '',
          JSON.stringify(orderData.timeline)
        ]
      });

      // 4. Order items and inventory logs statements
      for (const it of orderData.validatedItems) {
        const itemRowId = `oi-${orderData.orderId}-${it.productId}-${Math.random().toString(36).substring(2, 7)}`;
        batchStatements.push({
          sql: `INSERT INTO order_items (id, order_id, product_id, productId, product_name_ar, product_name_en, weight_option, quantity, unit_price, total_price, created_at) ` +
            `VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
          params: [itemRowId, orderData.orderId, it.productId, it.productId, it.productNameAr, it.productNameEn || '', it.weight, it.quantity, it.unitPrice, it.unitPrice * it.quantity]
        });

        const currentProd = this.findProductById(it.productId);
        const prevStock = currentProd ? currentProd.stock : 0;
        const newStock = Math.max(0, prevStock - it.quantity);
        const logId = `tx-sale-${Date.now()}-${it.productId}-${Math.random().toString(36).substring(2, 6)}`;
        batchStatements.push({
          sql: `INSERT INTO inventory_logs (id, product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id, performed_by, created_at) ` +
            `VALUES (?, ?, ?, 'sale', ?, ?, ?, ?, ?, 'نظام الطلبات الذري', datetime('now'));`,
          params: [logId, it.productId, it.productNameAr, -it.quantity, prevStock, newStock, `مبيعات طلب جديد #${orderData.orderNumber}`, orderData.orderId]
        });
      }

      // 5. Coupon usage statement
      if (orderData.couponCode) {
        batchStatements.push({
          sql: "UPDATE coupons SET usage_count = usage_count + 1 WHERE UPPER(code) = UPPER(?);",
          params: [orderData.couponCode]
        });
      }

      // 6. Execute entire transaction atomically on Cloudflare D1
      const batchRes = await this.executeCloudflareD1BatchRaw(batchStatements);
      if (!batchRes.success) {
        const errStr = (batchRes.errors || []).map(e => e.message).join('; ');
        let arabicErr = "فشلت عملية إنشاء الطلب لعدم توفر المخزون الكافي للمنتجات المطلوبة.";
        if (errStr.includes('Insufficient stock') || errStr.includes('prevent_negative_stock') || errStr.includes('CHECK constraint failed')) {
          arabicErr = "عذراً! الكمية المطلوبة تتجاوز المخزون المتاح حالياً.";
        } else if (errStr.includes('Coupon usage limit') || errStr.includes('prevent_coupon_overuse')) {
          arabicErr = "عذراً! وصل هذا الكوبون للحد الأقصى من مرات الاستخدام المسموح بها.";
        }
        return { success: false, message: arabicErr };
      }

      // Read back created order directly from D1
      const createdFromD1 = await this.findOrderByIdAsync(orderData.orderId);
      if (createdFromD1) {
        this.tables.orders.unshift(createdFromD1);
        for (const it of orderData.validatedItems) {
          const p = this.findProductById(it.productId);
          const prev = p ? p.stock : 0;
          const next = Math.max(0, prev - it.quantity);
          if (p) p.stock = next;
          const inv = this.tables.inventory.get(it.productId);
          if (inv) {
            inv.currentStock = next;
            inv.lastCountedAt = new Date().toISOString();
          }
          this.tables.inventory_logs.unshift({
            id: `tx-sale-${Date.now()}-${it.productId}`,
            productId: it.productId,
            productName: it.productNameAr,
            type: 'sale',
            quantity: -it.quantity,
            previousStock: prev,
            newStock: next,
            reason: `مبيعات طلب جديد #${orderData.orderNumber}`,
            orderId: orderData.orderId,
            performedBy: 'نظام الطلبات الذري',
            createdAt: new Date().toISOString()
          });
        }
        return { success: true, order: createdFromD1 };
      }
      return { success: false, message: 'فشل استرجاع الطلب المعتمد من قاعدة بيانات Cloudflare D1' };
    }

    if (process.env.NODE_ENV === 'production') {
      return { success: false, message: 'قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج' };
    }

    // Local fallback verification: ONLY in development when D1 is unconfigured
    for (const it of orderData.validatedItems) {
      const p = this.findProductById(it.productId);
      if (!p || p.stock < it.quantity) {
        return {
          success: false,
          message: `عذراً! الكمية المطلوبة من "${it.productNameAr}" تتجاوز المخزون المتاح حالياً.`
        };
      }
    }

    if (orderData.couponCode) {
      const c = this.findCoupon(orderData.couponCode);
      if (c && c.maxUses && c.usageCount >= c.maxUses) {
        return {
          success: false,
          message: 'عذراً! وصل هذا الكوبون للحد الأقصى من مرات الاستخدام المسموح بها.'
        };
      }
    }

    // Update in-memory state so local cache reflects D1 immediately
    for (const it of orderData.validatedItems) {
      const p = this.findProductById(it.productId);
      if (p) {
        p.stock = Math.max(0, p.stock - it.quantity);
      }
      const inv = this.tables.inventory.get(it.productId);
      if (inv) {
        inv.currentStock = Math.max(0, inv.currentStock - it.quantity);
        inv.lastCountedAt = new Date().toISOString();
      }
    }

    const newOrder: Order = {
      id: orderData.orderId,
      orderNumber: orderData.orderNumber,
      date: orderData.date,
      createdAt: orderData.date,
      status: "pending",
      items: orderData.validatedItems,
      subtotal: orderData.subtotal,
      shippingFee: orderData.shippingFee,
      discount: orderData.discount,
      total: orderData.total,
      totalAmount: orderData.total,
      district: orderData.address.district,
      address: {
        id: `addr-${orderData.orderId}`,
        title: orderData.address.district,
        district: orderData.address.district,
        street: orderData.address.street || orderData.address.district,
        phone: cleanPhone,
        isDefault: true
      },
      customerName: orderData.customerName,
      customerPhone: cleanPhone,
      paymentMethod: orderData.paymentMethod || 'cash',
      notes: orderData.notes || '',
      driverId: orderData.assignedDriver?.id || 'dr-unassigned',
      driverName: orderData.assignedDriver?.name || 'غير مسند',
      driverPhone: orderData.assignedDriver?.phone || '',
      timeline: orderData.timeline,
      idempotencyKey: orderData.idempotencyKey,
      isStockRolledBack: false
    };

    this.tables.orders.unshift(newOrder);

    // Also add to order_items in memory
    for (const it of orderData.validatedItems) {
      this.tables.order_items.push({
        id: `oi-${orderData.orderId}-${it.productId}-${Math.random().toString(36).substring(2, 7)}`,
        orderId: orderData.orderId,
        productId: it.productId,
        productNameAr: it.productNameAr,
        productNameEn: 'Black Gold Premium Charcoal',
        weightOption: it.weight || '250g',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.unitPrice * it.quantity,
        createdAt: orderData.date
      });
    }

    // Customer spend update in memory
    const cust = this.findOrCreateCustomer(orderData.customerName, cleanPhone, orderData.address.district);
    cust.totalOrders += 1;
    cust.totalSpent += orderData.total;
    cust.loyaltyPoints += Math.floor(orderData.total / 100);

    return { success: true, order: newOrder };
  }

  public addOrder(order: Order): Order {
    this.tables.orders.unshift(order);

    // 1. Insert individual relational rows into order_items
    if (order.items && Array.isArray(order.items)) {
      for (const it of order.items) {
        const itemRecord: OrderItemRecord = {
          id: `oi-${order.id}-${it.productId}-${Math.random().toString(36).substring(2, 7)}`,
          orderId: order.id,
          productId: it.productId,
          productNameAr: it.productNameAr,
          productNameEn: 'Black Gold Premium Charcoal',
          weightOption: it.weight || '250g',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.unitPrice * it.quantity,
          createdAt: order.date || new Date().toISOString()
        };
        this.tables.order_items.push(itemRecord);
      }
    }

    // 2. Update Customer Lifetime Spend & Orders
    if (order.customerPhone) {
      const cust = this.findOrCreateCustomer(order.customerName, order.customerPhone, order.address?.district);
      cust.totalOrders += 1;
      cust.totalSpent += order.total;
      cust.loyaltyPoints += Math.floor(order.total / 100);
      cust.updatedAt = new Date().toISOString();
    }

    // 3. Insert Payment Record
    this.tables.payments.push({
      id: `pay-${order.id}`,
      orderId: order.id,
      amount: order.total,
      method: order.paymentMethod || 'cash',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 4. Create in-app Notification for Admin
    this.tables.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'admin',
      title: 'طلب جديد وارد',
      message: `طلب جديد #${order.orderNumber} بقيمة ${order.total.toLocaleString()} ر.ي من ${order.customerName}`,
      type: 'order',
      isRead: false,
      link: `/admin/orders/${order.id}`,
      createdAt: new Date().toISOString()
    });

    this.saveLocal();
    return order;
  }

  /**
   * Execute Stock Rollback when an order is cancelled
   * Guaranteed idempotency to prevent double-restoration of inventory
   */
  public async executeStockRollback(order: Order, actor: string = 'نظام إدارة الطلبات'): Promise<boolean> {
    // 1. Guard against duplicate rollback execution in memory
    if (order.isStockRolledBack) {
      console.log(`[D1 Stock Rollback] Order ${order.id} was already rolled back previously. Skipping.`);
      return false;
    }

    // Secondary check: verify if inventory_logs already has a rollback log for this orderId
    const alreadyLogged = this.tables.inventory_logs.some(
      log => log.orderId === order.id && log.type === 'STOCK_ROLLBACK'
    );
    if (alreadyLogged) {
      order.isStockRolledBack = true;
      console.log(`[D1 Stock Rollback] Audit log already contains rollback for order ${order.id}. Skipping duplicate.`);
      return false;
    }

    // 2. Atomic Idempotent Update on Cloudflare D1 or In-Memory
    if (this.isD1Configured()) {
      const rollbackRes = await this.executeCloudflareD1Raw(
        "UPDATE orders SET is_stock_rolled_back = 1, status = 'cancelled', cancelled_at = datetime('now'), updated_at = datetime('now') WHERE (id = ? OR order_number = ?) AND (is_stock_rolled_back = 0 OR is_stock_rolled_back IS NULL);",
        [order.id, order.orderNumber || order.id]
      );
      const changes = rollbackRes.result?.[0]?.meta?.changes ?? 0;
      if (!rollbackRes.success || changes === 0) {
        order.isStockRolledBack = true;
        console.log(`[D1 Stock Rollback] Order ${order.id} was already marked rolled back in D1. Skipping duplicate.`);
        return false;
      }
    }

    // 3. Resolve order items: check in-order items array or relational order_items table
    let itemsToRollback = order.items;
    if (!itemsToRollback || itemsToRollback.length === 0) {
      const relationalItems = await this.getOrderItemsAsync(order.id);
      if (relationalItems && relationalItems.length > 0) {
        itemsToRollback = relationalItems.map(ri => ({
          productId: ri.productId,
          productNameAr: ri.productNameAr,
          weight: ri.weightOption,
          quantity: ri.quantity,
          unitPrice: ri.unitPrice
        }));
      }
    }

    if (!itemsToRollback || itemsToRollback.length === 0) {
      console.warn(`[D1 Stock Rollback] No items found to rollback for order ${order.id}`);
      this.saveLocal();
      return true;
    }

    // 4. Batch restoration statements for D1
    const rollbackBatch: Array<{ sql: string; params?: any[] }> = [];
    const memoryUpdates: Array<{ product: Product | undefined; newStock: number; logRecord: InventoryLogRecord }> = [];

    for (const it of itemsToRollback) {
      const product = await this.findProductByIdAsync(it.productId);
      const prevStock = product ? product.stock : 0;
      const restoredQty = Number(it.quantity) || 1;
      const newStock = prevStock + restoredQty;
      const logId = `tx-rollback-${Date.now()}-${it.productId}-${Math.random().toString(36).substring(2, 6)}`;

      if (this.isD1Configured()) {
        rollbackBatch.push({
          sql: "UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?;",
          params: [restoredQty, it.productId]
        });
        rollbackBatch.push({
          sql: "UPDATE inventory SET current_stock = current_stock + ?, updated_at = datetime('now') WHERE product_id = ?;",
          params: [restoredQty, it.productId]
        });
        rollbackBatch.push({
          sql: `INSERT INTO inventory_logs (id, product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id, performed_by, created_at) ` +
            `VALUES (?, ?, ?, 'STOCK_ROLLBACK', ?, ?, ?, ?, ?, ?, datetime('now'));`,
          params: [logId, it.productId, it.productNameAr, restoredQty, prevStock, newStock, `استرجاع مخزون لإلغاء الطلب #${order.orderNumber || order.id}`, order.id, actor]
        });
      }

      memoryUpdates.push({
        product,
        newStock,
        logRecord: {
          id: logId,
          productId: it.productId,
          productName: it.productNameAr,
          type: 'STOCK_ROLLBACK',
          quantity: restoredQty,
          previousStock: prevStock,
          newStock: newStock,
          reason: `استرجاع مخزون لإلغاء الطلب #${order.orderNumber || order.id}`,
          orderId: order.id,
          performedBy: actor || 'نظام إدارة الطلبات',
          createdAt: new Date().toISOString()
        }
      });
    }

    // Restore coupon usage count if coupon was applied
    const appliedCoupon = order.couponCode || (order as any).coupon_code;
    if (appliedCoupon && this.isD1Configured()) {
      rollbackBatch.push({
        sql: "UPDATE coupons SET usage_count = MAX(0, usage_count - 1) WHERE UPPER(code) = UPPER(?);",
        params: [appliedCoupon]
      });
    }

    // Mark order as rolled back in D1 database
    if (this.isD1Configured()) {
      rollbackBatch.push({
        sql: "UPDATE orders SET is_stock_rolled_back = 1, status = 'cancelled', cancelled_at = datetime('now'), updated_at = datetime('now') WHERE id = ? OR order_number = ?;",
        params: [order.id, order.orderNumber || order.id]
      });
    }

    if (this.isD1Configured() && rollbackBatch.length > 0) {
      await this.executeCloudflareD1BatchRaw(rollbackBatch);
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    // ONLY after D1 execution succeeds, update memory cache
    order.isStockRolledBack = true;
    order.status = 'cancelled';
    order.cancelledAt = new Date().toISOString();

    if (appliedCoupon) {
      const c = this.tables.coupons.find(cp => cp.code.toUpperCase() === appliedCoupon.toUpperCase());
      if (c && c.usageCount && c.usageCount > 0) {
        c.usageCount--;
      }
    }

    for (const update of memoryUpdates) {
      if (update.product) {
        update.product.stock = update.newStock;
      }
      const inv = this.tables.inventory.get(update.logRecord.productId);
      if (inv) {
        inv.currentStock = update.newStock;
        inv.lastCountedAt = new Date().toISOString();
      }
      this.tables.inventory_logs.unshift(update.logRecord);
    }

    // 5. Update payment status if exists to cancelled / failed
    const pay = this.tables.payments.find(p => p.orderId === order.id);
    if (pay && pay.status !== 'confirmed') {
      pay.status = 'failed';
      pay.updatedAt = new Date().toISOString();
    }

    // 6. Create Admin In-App Stock Notification
    this.tables.notifications.unshift({
      id: `notif-cancel-${Date.now()}`,
      recipientRole: 'admin',
      title: 'استرجاع مخزون - إلغاء طلب',
      message: `تم إلغاء الطلب #${order.orderNumber || order.id} وإعادة الكميات تلقائيًا للمخزون`,
      type: 'stock',
      isRead: false,
      link: `/admin/orders/${order.id}`,
      createdAt: new Date().toISOString()
    });

    this.saveLocal();
    console.log(`✅ [D1 Stock Rollback] Successfully rolled back stock for Order ${order.orderNumber || order.id}`);
    return true;
  }

  public async updateOrderDriverAsync(orderId: string, driverId: string, driverName?: string, driverPhone?: string): Promise<Order | null> {
    const order = await this.findOrderByIdAsync(orderId) || this.findOrderById(orderId);
    if (!order) return null;

    // Verify driver from active delivery agents strictly
    const agents = await this.getDeliveryAgentsAsync();
    const verifiedAgent = agents.find(a => a.id === driverId || (driverName && a.name.trim() === driverName.trim()));

    if (!verifiedAgent) {
      throw new Error("المندوب المحدد غير موجود في قاعدة بيانات المناديب المعتمدة");
    }

    const finalDriverId = verifiedAgent.id;
    const finalDriverName = verifiedAgent.name;
    const finalDriverPhone = verifiedAgent.phone;

    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `UPDATE orders SET driver_id = ?, driver_name = ?, driver_phone = ?, updated_at = datetime('now') WHERE id = ? OR order_number = ?;`,
        [finalDriverId, finalDriverName, finalDriverPhone, order.id, order.orderNumber || order.id]
      );
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    order.driverId = finalDriverId;
    order.driverName = finalDriverName;
    order.driverPhone = finalDriverPhone;

    const inMem = this.findOrderById(orderId);
    if (inMem) {
      inMem.driverId = finalDriverId;
      inMem.driverName = finalDriverName;
      inMem.driverPhone = finalDriverPhone;
    }

    this.saveLocal();
    return order;
  }

  public async updateOrderStatus(
    orderId: string, 
    status: Order['status'], 
    driverNotes?: string, 
    actor: string = 'الإدارة',
    driverInfo?: { driverId?: string; driverName?: string; driverPhone?: string }
  ): Promise<Order | null> {
    const order = await this.findOrderByIdAsync(orderId) || this.findOrderById(orderId);
    if (!order) return null;

    const previousStatus = order.status;

    // Strict State Machine Verification
    if (status !== previousStatus) {
      const allowedNext = VALID_ORDER_STATUS_TRANSITIONS[previousStatus];
      if (allowedNext && !allowedNext.includes(status)) {
        throw new Error(`انتقال غير مسموح لحالة الطلب من (${previousStatus}) إلى (${status})`);
      }
    }

    // Execute Stock Rollback if transitioning to 'cancelled' from a non-cancelled status
    if (status === 'cancelled') {
      if (previousStatus !== 'cancelled' && !order.isStockRolledBack) {
        await this.executeStockRollback(order, actor);
      }
    }

    let finalDriverId = order.driverId;
    let finalDriverName = order.driverName;
    let finalDriverPhone = order.driverPhone;

    if (driverInfo && driverInfo.driverId) {
      const agents = await this.getDeliveryAgentsAsync();
      const verified = agents.find(a => a.id === driverInfo.driverId);
      if (!verified) {
        throw new Error("المندوب المحدد غير موجود في سجل المناديب المعتمدين");
      }
      finalDriverId = verified.id;
      finalDriverName = verified.name;
      finalDriverPhone = verified.phone;
    }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" });

    const newTimeline = [...(order.timeline || [])];

    const titleMap: Record<string, { ar: string; en: string }> = {
      pending: { ar: "تم استلام الطلب بانتظار التأكيد", en: "Order Pending" },
      received: { ar: "تم استلام الطلب وتأكيده بالنظام", en: "Order Received" },
      confirmed: { ar: "تم تأكيد واعتماد الطلب من الإدارة", en: "Order Confirmed" },
      assigned: { ar: `تم تكليف المندوب (${finalDriverName || 'المعتمد'}) للتوصيل`, en: "Driver Assigned" },
      preparing: { ar: "جاري تجهيز وتعبئة الفحم في المستودع", en: "Preparing Charcoal" },
      shipped: { ar: "خرج الفحم مع المندوب للتوصيل المباشر", en: "Out for Delivery" },
      on_way: { ar: "المندوب في الطريق إلى موقع العميل", en: "Driver On The Way" },
      delivering: { ar: "المندوب في الحي وقريب من موقعك", en: "Near Delivery Location" },
      delivered: { ar: "تم تسليم الطلب للعميل بنجاح", en: "Delivered Successfully" },
      completed: { ar: "تم إكمال الطلب وتأكيد الاستلام نهائياً", en: "Order Completed" },
      cancelled: { ar: "تم إلغاء الطلب واسترجاع المخزون", en: "Order Cancelled & Stock Rolled Back" }
    };

    const statusInfo = titleMap[status] || { ar: `تم تحديث الحالة إلى: ${status}`, en: `Status: ${status}` };

    newTimeline.push({
      status,
      time: timeFormatted,
      titleAr: statusInfo.ar,
      titleEn: statusInfo.en
    });

    // Sync order status to Cloudflare D1 SQL FIRST
    if (this.isD1Configured()) {
      const compDateCol = status === 'delivered' ? ", completed_at = datetime('now')" : (status === 'cancelled' ? ", cancelled_at = datetime('now')" : "");
      await this.executeCloudflareD1Query(
        `UPDATE orders SET status = ?, driver_notes = COALESCE(?, driver_notes), driver_id = COALESCE(?, driver_id), driver_name = COALESCE(?, driver_name), driver_phone = COALESCE(?, driver_phone), timeline_json = ?${compDateCol}, updated_at = datetime('now') WHERE id = ? OR order_number = ?;`,
        [status, driverNotes || null, finalDriverId || null, finalDriverName || null, finalDriverPhone || null, JSON.stringify(newTimeline), order.id, order.orderNumber || order.id]
      );
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    // Now update cache after D1 success
    order.status = status;
    if (driverNotes) order.driverNotes = driverNotes;
    order.driverId = finalDriverId;
    order.driverName = finalDriverName;
    order.driverPhone = finalDriverPhone;
    order.timeline = newTimeline;
    if (status === 'cancelled') order.isStockRolledBack = true;

    // Update payment status if delivered
    if (status === 'delivered') {
      const pay = this.tables.payments.find(p => p.orderId === order.id);
      if (pay) {
        pay.status = 'confirmed';
        pay.updatedAt = new Date().toISOString();
      }
    }

    const inMem = this.findOrderById(orderId);
    if (inMem) {
      inMem.status = status;
      if (driverNotes) inMem.driverNotes = driverNotes;
      if (finalDriverId) inMem.driverId = finalDriverId;
      if (finalDriverName) inMem.driverName = finalDriverName;
      if (finalDriverPhone) inMem.driverPhone = finalDriverPhone;
      inMem.timeline = newTimeline;
      if (status === 'cancelled') inMem.isStockRolledBack = true;
    }

    this.saveLocal();
    return order;
  }

  // ==========================================
  // 4. INVENTORY & AUDIT LOGS
  // ==========================================
  public getInventoryTransactions(): InventoryLogRecord[] {
    return this.tables.inventory_logs;
  }

  public logInventoryTransaction(tx: InventoryLogRecord): InventoryLogRecord {
    this.tables.inventory_logs.unshift(tx);
    this.saveLocal();
    return tx;
  }

  public getInventoryStatus() {
    return Array.from(this.tables.inventory.entries()).map(([productId, data]) => {
      const prod = this.findProductById(productId);
      return {
        productId,
        productNameAr: prod?.nameAr || 'منتج',
        currentStock: data.currentStock,
        minThreshold: data.minThreshold,
        isLowStock: data.currentStock <= data.minThreshold,
        lastCountedAt: data.lastCountedAt
      };
    });
  }

  public async adjustProductStock(params: {
    productId: string;
    type: 'initial' | 'purchase' | 'sale' | 'return' | 'damage' | 'adjustment' | 'STOCK_IN' | 'STOCK_OUT' | 'STOCK_ROLLBACK';
    quantity: number;
    previousStock: number;
    newStock: number;
    reason: string;
    performedBy: string;
  }): Promise<{ product: Product; transaction: InventoryLogRecord }> {
    const product = this.findProductById(params.productId);
    if (!product) throw new Error("المنتج غير موجود");

    if (params.newStock < 0) {
      throw new Error("لا يمكن تعيين المخزون لقيمة سالبة");
    }

    const txId = 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const sqlEsc = (s: any) => String(s ?? '').replace(/'/g, "''");

    // Execute on Cloudflare D1 with proper parameterized queries
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        "UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?;",
        [params.newStock, params.productId]
      );
      await this.executeCloudflareD1Query(
        "UPDATE inventory SET current_stock = ?, updated_at = datetime('now') WHERE product_id = ?;",
        [params.newStock, params.productId]
      );
      await this.executeCloudflareD1Query(
        "INSERT INTO inventory_logs (id, product_id, product_name, type, quantity, previous_stock, new_stock, reason, performed_by, created_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));",
        [
          txId,
          params.productId,
          product.nameAr,
          params.type,
          params.quantity,
          params.previousStock,
          params.newStock,
          params.reason,
          params.performedBy
        ]
      );
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    // Update in-memory state
    product.stock = params.newStock;
    product.updatedAt = new Date().toISOString();

    const inv = this.tables.inventory.get(params.productId);
    if (inv) {
      inv.currentStock = params.newStock;
      inv.lastCountedAt = new Date().toISOString();
    }

    const logRecord: InventoryLogRecord = {
      id: txId,
      productId: params.productId,
      productName: product.nameAr,
      type: params.type,
      quantity: params.quantity,
      previousStock: params.previousStock,
      newStock: params.newStock,
      reason: params.reason,
      performedBy: params.performedBy,
      createdAt: new Date().toISOString()
    };

    this.tables.inventory_logs.unshift(logRecord);
    this.saveLocal();

    return { product, transaction: logRecord };
  }

  public async getInventoryTransactionsAsync(): Promise<InventoryLogRecord[]> {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM inventory_logs ORDER BY created_at DESC LIMIT 500;");
        if (Array.isArray(rows)) {
          return rows.map((l: any) => ({
            id: l.id,
            productId: l.product_id,
            productName: l.product_name,
            type: l.type,
            quantity: l.quantity,
            previousStock: l.previous_stock,
            newStock: l.new_stock,
            reason: l.reason,
            orderId: l.order_id || undefined,
            performedBy: l.performed_by,
            createdAt: l.created_at
          }));
        }
      } catch (err) {
        console.error('Error fetching inventory_logs from D1:', err);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل استعلام حركات المخزون من قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.tables.inventory_logs;
  }

  // ==========================================
  // 5. DELIVERY AGENTS
  // ==========================================
  public getDeliveryAgents(): DeliveryAgent[] {
    return this.tables.delivery_agents;
  }

  public async getDeliveryAgentsAsync(): Promise<DeliveryAgent[]> {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM delivery_agents;");
        if (Array.isArray(rows)) {
          const agents = rows.map((da: any) => ({
            id: da.id,
            name: da.name,
            phone: da.phone,
            vehicleType: da.vehicle_type || da.vehicle || 'motorcycle',
            assignedDistricts: typeof da.assigned_districts === 'string' ? JSON.parse(da.assigned_districts || '[]') : (da.assigned_districts || []),
            completedOrdersCount: da.total_delivered_count || da.completed_orders_count || 0,
            rating: da.rating || 5.0,
            isActive: da.is_available !== undefined ? Boolean(da.is_available) : (da.is_active !== undefined ? Boolean(da.is_active) : true)
          }));
          this.tables.delivery_agents = agents;
          return agents;
        }
      } catch (err) {
        console.error('Error fetching delivery_agents from D1:', err);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل استعلام مناديب التوصيل من قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.tables.delivery_agents;
  }

  public async updateDeliveryAgentsAsync(agents: DeliveryAgent[]): Promise<DeliveryAgent[]> {
    if (this.isD1Configured()) {
      for (const da of agents) {
        await this.executeCloudflareD1Query(
          `INSERT INTO delivery_agents (id, name, phone, vehicle_type, total_deliveries, rating, is_active, created_at) ` +
          `VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now')) ` +
          `ON CONFLICT(id) DO UPDATE SET ` +
          `name = excluded.name, phone = excluded.phone, vehicle_type = excluded.vehicle_type, ` +
          `total_deliveries = excluded.total_deliveries, rating = excluded.rating, is_active = excluded.is_active;`,
          [
            da.id, da.name, da.phone, da.vehicleType,
            da.completedOrdersCount || 0, da.rating || 5.0, da.isActive ? 1 : 0
          ]
        );
      }
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    this.tables.delivery_agents = agents;
    this.saveLocal();
    return agents;
  }

  public async findDeliveryAgentByIdAsync(id: string): Promise<DeliveryAgent | undefined> {
    if (this.isD1Configured()) {
      const rows = await this.executeCloudflareD1Query("SELECT * FROM delivery_agents WHERE id = ? LIMIT 1;", [id]);
      if (Array.isArray(rows) && rows.length > 0) {
        const da = rows[0];
        return {
          id: da.id,
          name: da.name,
          phone: da.phone,
          vehicleType: da.vehicle_type || da.vehicle || 'motorcycle',
          assignedDistricts: typeof da.assigned_districts === 'string' ? JSON.parse(da.assigned_districts || '[]') : (da.assigned_districts || []),
          completedOrdersCount: da.total_deliveries || da.total_delivered_count || 0,
          rating: da.rating || 5.0,
          isActive: da.is_active !== undefined ? Boolean(da.is_active) : (da.is_available !== undefined ? Boolean(da.is_available) : true)
        };
      }
      return undefined;
    }
    return this.tables.delivery_agents.find(d => d.id === id);
  }

  public async addDeliveryAgentAsync(agent: DeliveryAgent, pin?: string): Promise<DeliveryAgent> {
    const cleanPhone = agent.phone.replace(/\D/g, '');
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `INSERT INTO delivery_agents (id, name, phone, vehicle_type, is_active, rating, total_deliveries, created_at) ` +
        `VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now')) ` +
        `ON CONFLICT(id) DO UPDATE SET ` +
        `name = excluded.name, phone = excluded.phone, vehicle_type = excluded.vehicle_type, is_active = excluded.is_active, rating = excluded.rating;`,
        [agent.id, agent.name, cleanPhone, agent.vehicleType || 'motorcycle', agent.isActive ? 1 : 0, agent.rating || 5.0, agent.completedOrdersCount || 0]
      );

      if (pin) {
        const hashed = hashSecret(normalizeDigits(pin).trim());
        await this.executeCloudflareD1Query(
          `INSERT INTO users (id, name, phone, role, pin_hash, created_at, last_login) ` +
          `VALUES (?, ?, ?, 'delivery', ?, datetime('now'), datetime('now')) ` +
          `ON CONFLICT(phone) DO UPDATE SET ` +
          `name = excluded.name, role = 'delivery', pin_hash = excluded.pin_hash;`,
          [agent.id, agent.name, cleanPhone, hashed]
        );
      }
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    const idx = this.tables.delivery_agents.findIndex(d => d.id === agent.id);
    if (idx !== -1) this.tables.delivery_agents[idx] = agent;
    else this.tables.delivery_agents.push(agent);
    this.saveLocal();
    return agent;
  }

  public async updateDeliveryAgentAsync(id: string, updates: Partial<DeliveryAgent>, pin?: string): Promise<DeliveryAgent | null> {
    if (this.isD1Configured()) {
      const cleanPhone = updates.phone ? updates.phone.replace(/\D/g, '') : null;
      await this.executeCloudflareD1Query(
        `UPDATE delivery_agents SET ` +
        `name = COALESCE(?, name), ` +
        `phone = COALESCE(?, phone), ` +
        `vehicle_type = COALESCE(?, vehicle_type), ` +
        `is_active = CASE WHEN ? IS NOT NULL THEN ? ELSE is_active END ` +
        `WHERE id = ?;`,
        [
          updates.name ?? null,
          cleanPhone,
          updates.vehicleType ?? null,
          updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : null,
          updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : null,
          id
        ]
      );

      if (pin && cleanPhone) {
        const hashed = hashSecret(normalizeDigits(pin).trim());
        await this.executeCloudflareD1Query(
          `UPDATE users SET pin_hash = ? WHERE phone = ?;`,
          [hashed, cleanPhone]
        );
      }

      const readBack = await this.findDeliveryAgentByIdAsync(id);
      if (readBack) {
        const idx = this.tables.delivery_agents.findIndex(d => d.id === id);
        if (idx !== -1) this.tables.delivery_agents[idx] = readBack;
        return readBack;
      }
      return null;
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    const d = this.tables.delivery_agents.find(da => da.id === id);
    if (!d) return null;
    Object.assign(d, updates);
    this.saveLocal();
    return d;
  }

  public async deleteDeliveryAgentAsync(id: string): Promise<boolean> {
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query("DELETE FROM delivery_agents WHERE id = ?;", [id]);
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    this.tables.delivery_agents = this.tables.delivery_agents.filter(d => d.id !== id);
    this.saveLocal();
    return true;
  }

  // ==========================================
  // 6. REVIEWS & COUPONS
  // ==========================================
  public getReviews(): Review[] {
    return this.tables.reviews;
  }

  public async getReviewsAsync(): Promise<Review[]> {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM reviews ORDER BY created_at DESC;");
        if (Array.isArray(rows)) {
          return rows.map((rv: any) => ({
            id: rv.id,
            productId: rv.product_id,
            userName: rv.customer_name || rv.user_name || 'عميل',
            userPhone: rv.customer_phone || rv.user_phone || undefined,
            rating: rv.rating,
            comment: rv.comment,
            verifiedPurchase: Boolean(rv.is_verified ?? rv.verified_purchase),
            date: rv.created_at
          }));
        }
      } catch (err) {
        console.error('Error fetching reviews from D1:', err);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل استعلام تقييمات المنتجات من قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.tables.reviews;
  }

  public addReview(review: Review): Review {
    this.tables.reviews.unshift(review);
    const prod = this.findProductById(review.productId);
    if (prod) {
      const prodReviews = this.tables.reviews.filter(r => r.productId === review.productId);
      const totalScore = prodReviews.reduce((sum, r) => sum + r.rating, 0);
      prod.rating = Number((totalScore / prodReviews.length).toFixed(1));
      prod.reviewCount = prodReviews.length;
      this.updateProduct(prod.id, { rating: prod.rating, reviewCount: prod.reviewCount });
    }
    this.saveLocal();
    return review;
  }

  public async addReviewAsync(review: Review): Promise<Review> {
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `INSERT INTO reviews (id, product_id, customer_name, customer_phone, rating, comment, is_verified, created_at) ` +
        `VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
        [review.id, review.productId, review.userName, (review as any).userPhone || null, review.rating, review.comment, review.verifiedPurchase ? 1 : 0]
      );
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    this.addReview(review);
    return review;
  }

  public getCoupons(): Coupon[] {
    return this.tables.coupons;
  }

  public async getCouponsAsync(): Promise<Coupon[]> {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM coupons;");
        if (Array.isArray(rows)) {
          const coupons = rows.map((cp: any) => ({
            code: cp.code,
            discountPercent: cp.discount_percent,
            maxDiscount: cp.max_discount,
            minOrderAmount: cp.min_order_amount,
            isActive: Boolean(cp.is_active),
            validUntil: cp.valid_until || cp.expiry_date || undefined,
            usageCount: cp.usage_count || 0,
            maxUses: cp.max_uses !== undefined && cp.max_uses !== null ? Number(cp.max_uses) : undefined
          }));
          this.tables.coupons = coupons;
          return coupons;
        }
      } catch (err) {
        console.error('Error fetching coupons from D1:', err);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل استعلام الكوبونات من قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.tables.coupons;
  }

  public findCoupon(code: string): Coupon | undefined {
    return this.tables.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);
  }

  public async findCouponAsync(code: string): Promise<Coupon | undefined> {
    const cleanCode = code.trim().toUpperCase();
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1 LIMIT 1;", [cleanCode]);
        if (Array.isArray(rows)) {
          if (rows.length > 0) {
            const cp = rows[0];
            return {
              code: cp.code,
              discountPercent: cp.discount_percent,
              maxDiscount: cp.max_discount,
              minOrderAmount: cp.min_order_amount,
              isActive: Boolean(cp.is_active),
              validUntil: cp.valid_until || cp.expiry_date || undefined,
              usageCount: cp.usage_count || 0,
              maxUses: cp.max_uses !== undefined && cp.max_uses !== null ? Number(cp.max_uses) : undefined
            };
          }
          return undefined;
        }
      } catch (err) {
        console.error('Error finding coupon in D1:', err);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل التحقق من الكوبون في قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.findCoupon(cleanCode);
  }

  public async addCouponAsync(coupon: Coupon): Promise<Coupon> {
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `INSERT INTO coupons (code, discount_percent, max_discount, min_order_amount, is_active, valid_until, usage_count, max_uses, created_at) ` +
        `VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now')) ` +
        `ON CONFLICT(code) DO UPDATE SET ` +
        `discount_percent = excluded.discount_percent, max_discount = excluded.max_discount, min_order_amount = excluded.min_order_amount, ` +
        `is_active = excluded.is_active, valid_until = excluded.valid_until, max_uses = excluded.max_uses;`,
        [
          coupon.code.toUpperCase(),
          coupon.discountPercent,
          coupon.maxDiscount || 0,
          coupon.minOrderAmount || 0,
          coupon.isActive !== false ? 1 : 0,
          coupon.validUntil || (coupon as any).expiresAt || (coupon as any).expiry_date || null,
          coupon.usageCount || 0,
          coupon.maxUses ?? 100
        ]
      );
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    const existingIdx = this.tables.coupons.findIndex(c => c.code.toUpperCase() === coupon.code.trim().toUpperCase());
    if (existingIdx >= 0) {
      this.tables.coupons[existingIdx] = coupon;
    } else {
      this.tables.coupons.push(coupon);
    }
    this.saveLocal();

    return coupon;
  }

  public async updateCouponAsync(code: string, updates: Partial<Coupon>): Promise<Coupon | null> {
    const cleanCode = code.trim().toUpperCase();
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `UPDATE coupons SET ` +
        `discount_percent = COALESCE(?, discount_percent), ` +
        `max_discount = COALESCE(?, max_discount), ` +
        `min_order_amount = COALESCE(?, min_order_amount), ` +
        `is_active = CASE WHEN ? IS NOT NULL THEN ? ELSE is_active END, ` +
        `valid_until = COALESCE(?, valid_until), ` +
        `max_uses = COALESCE(?, max_uses) ` +
        `WHERE UPPER(code) = ?;`,
        [
          updates.discountPercent ?? null,
          updates.maxDiscount ?? null,
          updates.minOrderAmount ?? null,
          updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : null,
          updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : null,
          updates.validUntil ?? null,
          updates.maxUses ?? null,
          cleanCode
        ]
      );

      const rows = await this.executeCloudflareD1Query("SELECT * FROM coupons WHERE UPPER(code) = ? LIMIT 1;", [cleanCode]);
      if (Array.isArray(rows) && rows.length > 0) {
        const cp = rows[0];
        const updated: Coupon = {
          code: cp.code,
          discountPercent: cp.discount_percent,
          maxDiscount: cp.max_discount,
          minOrderAmount: cp.min_order_amount,
          isActive: Boolean(cp.is_active),
          validUntil: cp.valid_until || cp.expiry_date || undefined,
          usageCount: cp.usage_count || 0,
          maxUses: cp.max_uses !== undefined && cp.max_uses !== null ? Number(cp.max_uses) : undefined
        };
        const idx = this.tables.coupons.findIndex(c => c.code.toUpperCase() === cleanCode);
        if (idx !== -1) this.tables.coupons[idx] = updated;
        else this.tables.coupons.push(updated);
        this.saveLocal();
        return updated;
      }
      return null;
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    const c = this.tables.coupons.find(cp => cp.code.toUpperCase() === cleanCode);
    if (!c) return null;
    Object.assign(c, updates);
    this.saveLocal();
    return c;
  }

  public async deleteCouponAsync(code: string): Promise<boolean> {
    const cleanCode = code.trim().toUpperCase();
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query("DELETE FROM coupons WHERE UPPER(code) = ?;", [cleanCode]);
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    this.tables.coupons = this.tables.coupons.filter(c => c.code.toUpperCase() !== cleanCode);
    this.saveLocal();
    return true;
  }

  // ==========================================
  // 7. STORE SETTINGS & GALLERY
  // ==========================================
  public getSettings(): StoreSettings {
    return this.tables.store_settings;
  }

  public async getSettingsAsync(): Promise<StoreSettings> {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM store_settings WHERE id = 'default_settings';");
        if (Array.isArray(rows) && rows.length > 0) {
          const st = rows[0];
          const districts = typeof st.delivery_districts === 'string'
            ? JSON.parse(st.delivery_districts || '[]')
            : (st.delivery_districts || this.tables.store_settings.deliveryDistricts);

          const mapped: StoreSettings = {
            ...this.tables.store_settings,
            storeNameAr: st.store_name_ar || this.tables.store_settings.storeNameAr,
            storeNameEn: st.store_name_en || this.tables.store_settings.storeNameEn,
            sloganAr: st.slogan_ar || this.tables.store_settings.sloganAr,
            logoText: st.logo_text || this.tables.store_settings.logoText,
            customLogoUrl: st.custom_logo_url || this.tables.store_settings.customLogoUrl,
            topBannerNoticeAr: st.top_banner_notice_ar || this.tables.store_settings.topBannerNoticeAr,
            topBannerNoticeEn: st.top_banner_notice_en || this.tables.store_settings.topBannerNoticeEn,
            whatsappPhone: st.whatsapp_phone || this.tables.store_settings.whatsappPhone,
            whatsappNumber: st.whatsapp_phone || this.tables.store_settings.whatsappNumber,
            supportPhone: st.call_phone || this.tables.store_settings.supportPhone,
            supportEmail: st.contact_email || this.tables.store_settings.supportEmail,
            freeDeliveryThreshold: Number(st.free_delivery_threshold || this.tables.store_settings.freeDeliveryThreshold),
            freeShippingThreshold: Number(st.free_delivery_threshold || this.tables.store_settings.freeShippingThreshold),
            defaultShippingFee: st.default_delivery_fee || this.tables.store_settings.defaultShippingFee,
            isOrderingEnabled: st.is_store_open !== undefined ? Boolean(st.is_store_open) : true,
            deliveryDistricts: districts
          };
          this.tables.store_settings = mapped;
          return mapped;
        }
      } catch (err) {
        console.error('Error fetching store_settings from D1:', err);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل استعلام إعدادات المتجر من قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.tables.store_settings;
  }

  public updateSettings(newSettings: Partial<StoreSettings>): StoreSettings {
    this.tables.store_settings = { ...this.tables.store_settings, ...newSettings };
    this.saveLocal();
    return this.tables.store_settings;
  }

  public async updateSettingsAsync(newSettings: Partial<StoreSettings>): Promise<StoreSettings> {
    if (this.isD1Configured()) {
      const current = await this.getSettingsAsync();
      const merged: StoreSettings = { ...current, ...newSettings };

      const storeNameAr = merged.storeNameAr || current.storeNameAr;
      const storeNameEn = merged.storeNameEn || current.storeNameEn;
      const sloganAr = merged.sloganAr || current.sloganAr || '';
      const logoText = merged.logoText || current.logoText || '';
      const customLogoUrl = merged.customLogoUrl || current.customLogoUrl || '';
      const topBannerNoticeAr = merged.topBannerNoticeAr || current.topBannerNoticeAr || '';
      const topBannerNoticeEn = merged.topBannerNoticeEn || current.topBannerNoticeEn || '';
      const whatsappPhone = merged.whatsappPhone || merged.whatsappNumber || current.whatsappPhone;
      const callPhone = merged.supportPhone || current.supportPhone;
      const contactEmail = merged.supportEmail || current.supportEmail || '';
      const freeDeliveryThreshold = Number(merged.freeDeliveryThreshold ?? merged.freeShippingThreshold ?? current.freeDeliveryThreshold ?? 8000);
      const isStoreOpen = merged.isOrderingEnabled !== undefined ? (merged.isOrderingEnabled ? 1 : 0) : 1;
      const districtsJson = JSON.stringify(merged.deliveryDistricts || current.deliveryDistricts || []);

      await this.executeCloudflareD1Query(
        `INSERT INTO store_settings (` +
        `id, store_name_ar, store_name_en, slogan_ar, logo_text, custom_logo_url, ` +
        `top_banner_notice_ar, top_banner_notice_en, whatsapp_phone, call_phone, ` +
        `contact_email, free_delivery_threshold, is_store_open, delivery_districts, updated_at` +
        `) VALUES ('default_settings', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')) ` +
        `ON CONFLICT(id) DO UPDATE SET ` +
        `store_name_ar = excluded.store_name_ar, ` +
        `store_name_en = excluded.store_name_en, ` +
        `slogan_ar = excluded.slogan_ar, ` +
        `logo_text = excluded.logo_text, ` +
        `custom_logo_url = excluded.custom_logo_url, ` +
        `top_banner_notice_ar = excluded.top_banner_notice_ar, ` +
        `top_banner_notice_en = excluded.top_banner_notice_en, ` +
        `whatsapp_phone = excluded.whatsapp_phone, ` +
        `call_phone = excluded.call_phone, ` +
        `contact_email = excluded.contact_email, ` +
        `free_delivery_threshold = excluded.free_delivery_threshold, ` +
        `is_store_open = excluded.is_store_open, ` +
        `delivery_districts = excluded.delivery_districts, ` +
        `updated_at = datetime('now');`,
        [
          storeNameAr, storeNameEn, sloganAr, logoText, customLogoUrl,
          topBannerNoticeAr, topBannerNoticeEn, whatsappPhone, callPhone,
          contactEmail, freeDeliveryThreshold, isStoreOpen, districtsJson
        ]
      );

      this.tables.store_settings = merged;
      this.saveLocal();
      return merged;
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    const updated = this.updateSettings(newSettings);
    return updated;
  }

  public getGalleryItems(): GalleryItem[] {
    return this.tables.gallery_items;
  }

  public async getGalleryItemsAsync(): Promise<GalleryItem[]> {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM gallery_items ORDER BY sort_order ASC, created_at DESC;");
        if (Array.isArray(rows)) {
          const items: GalleryItem[] = rows.map((g: any) => ({
            id: g.id,
            titleAr: g.title_ar,
            titleEn: g.title_en || undefined,
            image: g.image_url || '',
            imageUrl: g.image_url,
            category: g.category || 'factory',
            caption: g.caption || undefined,
            sortOrder: g.sort_order || 0,
            isActive: g.is_active !== undefined ? Boolean(g.is_active) : true,
            createdAt: g.created_at
          }));
          this.tables.gallery_items = items;
          return items;
        }
      } catch (err) {
        console.error('Error fetching gallery_items from D1:', err);
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('فشل استعلام صور المعرض من قاعدة بيانات Cloudflare D1');
      }
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }
    return this.tables.gallery_items;
  }

  public async addGalleryItemAsync(item: GalleryItem): Promise<GalleryItem> {
    const itemToAdd: GalleryItem = {
      ...item,
      image: item.image || item.imageUrl || '',
      imageUrl: item.imageUrl || item.image || ''
    };

    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `INSERT INTO gallery_items (id, title_ar, title_en, image_url, category, caption, sort_order, is_active, created_at) ` +
        `VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
        [
          itemToAdd.id,
          itemToAdd.titleAr,
          itemToAdd.titleEn || null,
          itemToAdd.imageUrl || itemToAdd.image,
          itemToAdd.category || 'factory',
          itemToAdd.caption || null,
          itemToAdd.sortOrder || 0,
          itemToAdd.isActive !== false ? 1 : 0
        ]
      );
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    this.tables.gallery_items.push(itemToAdd);
    this.saveLocal();
    return itemToAdd;
  }

  public async updateGalleryItemAsync(id: string, updates: Partial<GalleryItem>): Promise<GalleryItem | null> {
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `UPDATE gallery_items SET ` +
        `title_ar = COALESCE(?, title_ar), ` +
        `title_en = COALESCE(?, title_en), ` +
        `image_url = COALESCE(?, image_url), ` +
        `category = COALESCE(?, category), ` +
        `caption = COALESCE(?, caption), ` +
        `sort_order = COALESCE(?, sort_order), ` +
        `is_active = COALESCE(?, is_active) ` +
        `WHERE id = ?;`,
        [
          updates.titleAr || null,
          updates.titleEn || null,
          updates.imageUrl || updates.image || null,
          updates.category || null,
          updates.caption || null,
          updates.sortOrder !== undefined ? updates.sortOrder : null,
          updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : null,
          id
        ]
      );
      const rows = await this.executeCloudflareD1Query("SELECT * FROM gallery_items WHERE id = ? LIMIT 1;", [id]);
      if (Array.isArray(rows) && rows.length > 0) {
        const g = rows[0];
        const updatedItem: GalleryItem = {
          id: g.id,
          titleAr: g.title_ar,
          titleEn: g.title_en || undefined,
          image: g.image_url || '',
          imageUrl: g.image_url,
          category: g.category || 'factory',
          caption: g.caption || undefined,
          sortOrder: g.sort_order || 0,
          isActive: g.is_active !== undefined ? Boolean(g.is_active) : true,
          createdAt: g.created_at
        };
        const idx = this.tables.gallery_items.findIndex(item => item.id === id);
        if (idx !== -1) {
          this.tables.gallery_items[idx] = updatedItem;
        } else {
          this.tables.gallery_items.push(updatedItem);
        }
        return updatedItem;
      }
      return null;
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    const idx = this.tables.gallery_items.findIndex(g => g.id === id);
    if (idx !== -1) {
      this.tables.gallery_items[idx] = { ...this.tables.gallery_items[idx], ...updates };
      this.saveLocal();
      return this.tables.gallery_items[idx];
    }
    return null;
  }

  public async deleteGalleryItemAsync(id: string): Promise<boolean> {
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query("DELETE FROM gallery_items WHERE id = ?;", [id]);
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('قاعدة بيانات Cloudflare D1 غير مهيأة في بيئة الإنتاج');
    }

    this.tables.gallery_items = this.tables.gallery_items.filter(g => g.id !== id);
    this.saveLocal();
    return true;
  }

  public getNotifications(): NotificationRecord[] {
    return this.tables.notifications;
  }
}

// Singleton D1 Database Access Instance
export const d1 = new D1DatabaseAccessLayer();
