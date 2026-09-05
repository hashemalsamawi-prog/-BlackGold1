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
  received: ['pending', 'preparing', 'cancelled'],
  pending: ['preparing', 'cancelled'],
  preparing: ['shipped', 'on_way', 'delivering', 'cancelled'],
  shipped: ['on_way', 'delivering', 'delivered', 'cancelled'],
  on_way: ['delivering', 'delivered', 'cancelled'],
  delivering: ['delivered', 'cancelled'],
  delivered: [],
  completed: [],
  cancelled: []
};

// Memory / Local Persistent Store for D1 Entities
class D1DatabaseAccessLayer {
  private localDbPath = path.join(process.cwd(), 'data', 'db.json');
  private isInitialized = false;

  // In-memory relational tables matching D1 Schema
  private tables = {
    categories: [] as Array<{ id: string; name_ar: string; name_en?: string; slug: string; sort_order: number; is_active: number; created_at: string }>,
    products: [...INITIAL_PRODUCTS] as Product[],
    users: [] as UserAccount[],
    customers: [] as CustomerRecord[],
    orders: [] as Order[],
    order_items: [] as OrderItemRecord[],
    inventory: new Map<string, { currentStock: number; reservedStock: number; minThreshold: number; lastCountedAt?: string }>(),
    inventory_logs: [] as InventoryLogRecord[],
    delivery_agents: [...INITIAL_DELIVERY_AGENTS] as DeliveryAgent[],
    reviews: [] as Review[],
    coupons: [
      { code: "GOLD2026", discountPercent: 10, maxDiscount: 2000, minOrderAmount: 2000, isActive: true },
      { code: "SANAA15", discountPercent: 15, maxDiscount: 3500, minOrderAmount: 5000, isActive: true },
      { code: "VIPBLACK", discountPercent: 20, maxDiscount: 5000, minOrderAmount: 10000, isActive: true }
    ] as Coupon[],
    gallery_items: [...INITIAL_GALLERY_ITEMS] as GalleryItem[],
    store_settings: {
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

      // 1. Seed Categories
      this.tables.categories = [
        { id: 'cat-pouches', name_ar: 'العبوات الفاخرة Zipper Lock', name_en: 'Premium Pouches', slug: 'pouches', sort_order: 1, is_active: 1, created_at: new Date().toISOString() },
        { id: 'cat-wholesale', name_ar: 'التوريد والجملة للمطاعم والمقاهي', name_en: 'Wholesale & B2B', slug: 'wholesale', sort_order: 2, is_active: 1, created_at: new Date().toISOString() },
        { id: 'cat-local', name_ar: 'فحم بلدي طبيعي من مزارع اليمن', name_en: 'Yemeni Local Charcoal', slug: 'local', sort_order: 3, is_active: 1, created_at: new Date().toISOString() },
        { id: 'cat-premium', name_ar: 'الفحم الملكي الخاص بالشيشة', name_en: 'Royal Shisha Charcoal', slug: 'premium', sort_order: 4, is_active: 1, created_at: new Date().toISOString() },
        { id: 'cat-bbq', name_ar: 'فحم الشواء والمشاوي عالي الحرارة', name_en: 'High-Heat BBQ Charcoal', slug: 'bbq', sort_order: 5, is_active: 1, created_at: new Date().toISOString() },
        { id: 'cat-incense', name_ar: 'أقراص البخور والمباخر سريعة الاشتعال', name_en: 'Incense Charcoal Tablets', slug: 'incense', sort_order: 6, is_active: 1, created_at: new Date().toISOString() }
      ];

      // 2. In production or when Cloudflare D1 credentials are provided, use Cloudflare D1 as PRIMARY data source
      const hasD1Credentials = Boolean(
        CLOUDFLARE_CONFIG.accountId && 
        CLOUDFLARE_CONFIG.apiToken && 
        CLOUDFLARE_CONFIG.databaseId
      );

      if (hasD1Credentials) {
        console.log('⚡ Cloudflare D1 is active as PRIMARY authoritative database. Fetching remote tables...');
        await this.syncFromCloudflareD1();
      } else if (process.env.NODE_ENV !== 'production' && fs.existsSync(this.localDbPath)) {
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

      // 3. Ensure Default Products if empty
      if (this.tables.products.length === 0) {
        this.tables.products = [...INITIAL_PRODUCTS];
      }

      // 4. Ensure Default Gallery Items if empty
      if (this.tables.gallery_items.length === 0) {
        this.tables.gallery_items = [...INITIAL_GALLERY_ITEMS];
      }

      // 5. Ensure Default Store Settings if empty
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

      // 6. Ensure Default Delivery Agents if empty
      if (this.tables.delivery_agents.length === 0) {
        this.tables.delivery_agents = [...INITIAL_DELIVERY_AGENTS];
      }

      this.saveLocal();

      // 5. Ensure Default Coupons if empty
      if (this.tables.coupons.length === 0) {
        this.tables.coupons = [
          { code: "GOLD2026", discountPercent: 10, maxDiscount: 2000, minOrderAmount: 2000, isActive: true },
          { code: "SANAA15", discountPercent: 15, maxDiscount: 3500, minOrderAmount: 5000, isActive: true },
          { code: "VIPBLACK", discountPercent: 20, maxDiscount: 5000, minOrderAmount: 10000, isActive: true }
        ];
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
    } finally {
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
    const envAdminPin = process.env.ADMIN_PIN ? normalizeDigits(process.env.ADMIN_PIN.trim()) : '';

    if (!hasOwner) {
      const defaultOwner: UserAccount = {
        id: 'usr-owner-hashem',
        name: 'هاشم السماوي (المالك)',
        phone: '777000111',
        role: 'owner',
        createdAt: new Date().toISOString()
      };
      if (envAdminPin) {
        defaultOwner.pinHash = hashSecret(envAdminPin);
      }
      this.tables.users.push(defaultOwner);
      this.saveLocal();

      if (CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId) {
        this.executeCloudflareD1Query(
          "INSERT OR IGNORE INTO users (id, name, phone, role, pin_hash, created_at) VALUES (?, ?, ?, ?, ?, ?);",
          [defaultOwner.id, defaultOwner.name, defaultOwner.phone, defaultOwner.role, defaultOwner.pinHash || null, defaultOwner.createdAt]
        ).catch(() => {});
      }
    } else if (envAdminPin) {
      // Sync environment ADMIN_PIN if owner user has no pin/password hash yet
      const owner = this.tables.users.find(u => u.role === 'owner');
      if (owner && !owner.pinHash && !owner.passwordHash) {
        owner.pinHash = hashSecret(envAdminPin);
        this.saveLocal();
        if (CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId) {
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
      return false;
    }

    try {
      // 0. Ensure Trigger for negative stock prevention exists on D1
      await this.executeCloudflareD1Query(
        "CREATE TRIGGER IF NOT EXISTS prevent_negative_stock BEFORE UPDATE ON products FOR EACH ROW WHEN NEW.stock < 0 BEGIN SELECT RAISE(ABORT, 'Insufficient stock: product stock cannot be negative'); END;"
      );

      // 1. Categories
      const categoriesResult = await this.executeCloudflareD1Query("SELECT * FROM categories ORDER BY sort_order ASC;");
      if (Array.isArray(categoriesResult) && categoriesResult.length > 0) {
        this.tables.categories = categoriesResult;
      }

      // 2. Products
      const productsResult = await this.executeCloudflareD1Query("SELECT * FROM products;");
      if (Array.isArray(productsResult) && productsResult.length > 0) {
        this.tables.products = productsResult.map((r: any) => {
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
        });

        for (const p of this.tables.products) {
          this.tables.inventory.set(p.id, {
            currentStock: p.stock,
            reservedStock: 0,
            minThreshold: 15,
            lastCountedAt: new Date().toISOString()
          });
        }
      }

      // 3. Orders
      const ordersResult = await this.executeCloudflareD1Query("SELECT * FROM orders ORDER BY created_at DESC;");
      if (Array.isArray(ordersResult) && ordersResult.length > 0) {
        this.tables.orders = ordersResult.map((r: any) => ({
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
          paymentMethod: r.payment_method,
          status: r.status,
          date: r.created_at,
          driverId: r.driver_id || undefined,
          driverName: r.driver_name || undefined,
          driverPhone: r.driver_phone || undefined,
          driverNotes: r.driver_notes || undefined,
          timeline: typeof r.timeline_json === 'string' ? JSON.parse(r.timeline_json || '[]') : (r.timeline_json || undefined),
          isStockRolledBack: Boolean(r.is_stock_rolled_back),
          cancelledAt: r.cancelled_at || undefined,
          completedAt: r.completed_at || undefined
        }));
      }

      // 4. Relational Order Items
      try {
        const itemsResult = await this.executeCloudflareD1Query("SELECT * FROM order_items;");
        if (Array.isArray(itemsResult) && itemsResult.length > 0) {
          this.tables.order_items = itemsResult.map((it: any) => ({
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
          }));
        }
      } catch (itemsErr) {
        console.warn('D1 remote order_items sync warning:', itemsErr);
      }

      // 5. Customers
      try {
        const custResult = await this.executeCloudflareD1Query("SELECT * FROM customers;");
        if (Array.isArray(custResult) && custResult.length > 0) {
          this.tables.customers = custResult.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            district: c.district,
            totalOrders: c.total_orders || 0,
            totalSpent: c.total_spent || 0,
            loyaltyPoints: c.loyalty_points || 0,
            createdAt: c.created_at || new Date().toISOString(),
            updatedAt: c.updated_at || new Date().toISOString()
          }));
        }
      } catch (custErr) {
        console.warn('D1 remote customers sync warning:', custErr);
      }

      // 6. Users & Owner
      try {
        const usersResult = await this.executeCloudflareD1Query("SELECT * FROM users;");
        if (Array.isArray(usersResult) && usersResult.length > 0) {
          this.tables.users = usersResult.map((u: any) => ({
            id: u.id,
            name: u.name,
            phone: u.phone,
            email: u.email || undefined,
            role: u.role,
            passwordHash: u.password_hash || undefined,
            pinHash: u.pin_hash || undefined,
            createdAt: u.created_at || new Date().toISOString(),
            lastLogin: u.last_login || undefined
          }));
        }
      } catch (userErr) {
        console.warn('D1 remote users sync warning:', userErr);
      }

      // 7. Inventory Logs
      try {
        const logsResult = await this.executeCloudflareD1Query("SELECT * FROM inventory_logs ORDER BY created_at DESC LIMIT 500;");
        if (Array.isArray(logsResult) && logsResult.length > 0) {
          this.tables.inventory_logs = logsResult.map((l: any) => ({
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
      } catch (logErr) {
        console.warn('D1 remote inventory_logs sync warning:', logErr);
      }

      // 8. Delivery Agents
      try {
        const daResult = await this.executeCloudflareD1Query("SELECT * FROM delivery_agents;");
        if (Array.isArray(daResult) && daResult.length > 0) {
          this.tables.delivery_agents = daResult.map((da: any) => ({
            id: da.id,
            name: da.name,
            phone: da.phone,
            vehicleType: da.vehicle_type || da.vehicle || 'motorcycle',
            assignedDistricts: typeof da.assigned_districts === 'string' ? JSON.parse(da.assigned_districts || '[]') : (da.assigned_districts || []),
            completedOrdersCount: da.total_delivered_count || da.completed_orders_count || 0,
            rating: da.rating || 5.0,
            isActive: da.is_available !== undefined ? Boolean(da.is_available) : (da.is_active !== undefined ? Boolean(da.is_active) : true)
          }));
        }
      } catch (daErr) {
        console.warn('D1 remote delivery_agents sync warning:', daErr);
      }

      // 9. Coupons
      try {
        const couponResult = await this.executeCloudflareD1Query("SELECT * FROM coupons;");
        if (Array.isArray(couponResult) && couponResult.length > 0) {
          this.tables.coupons = couponResult.map((cp: any) => ({
            code: cp.code,
            discountPercent: cp.discount_percent,
            maxDiscount: cp.max_discount,
            minOrderAmount: cp.min_order_amount,
            isActive: Boolean(cp.is_active),
            expiryDate: cp.expiry_date || undefined,
            usageCount: cp.usage_count || 0
          }));
        }
      } catch (cpErr) {
        console.warn('D1 remote coupons sync warning:', cpErr);
      }

      // 10. Reviews
      try {
        const revResult = await this.executeCloudflareD1Query("SELECT * FROM reviews ORDER BY created_at DESC;");
        if (Array.isArray(revResult) && revResult.length > 0) {
          this.tables.reviews = revResult.map((rv: any) => ({
            id: rv.id,
            productId: rv.product_id,
            userName: rv.user_name,
            userPhone: rv.user_phone || undefined,
            rating: rv.rating,
            comment: rv.comment,
            verifiedPurchase: Boolean(rv.verified_purchase),
            date: rv.created_at
          }));
        }
      } catch (rvErr) {
        console.warn('D1 remote reviews sync warning:', rvErr);
      }

      // 11. Store Settings
      try {
        const stResult = await this.executeCloudflareD1Query("SELECT * FROM store_settings WHERE id = 'default_settings';");
        if (Array.isArray(stResult) && stResult.length > 0) {
          const st = stResult[0];
          this.tables.store_settings = {
            ...this.tables.store_settings,
            storeNameAr: st.store_name_ar || this.tables.store_settings.storeNameAr,
            storeNameEn: st.store_name_en || this.tables.store_settings.storeNameEn,
            whatsappPhone: st.whatsapp_phone || this.tables.store_settings.whatsappPhone,
            whatsappNumber: st.whatsapp_phone || this.tables.store_settings.whatsappNumber,
            supportPhone: st.phone || this.tables.store_settings.supportPhone,
            supportEmail: st.email || this.tables.store_settings.supportEmail,
            freeDeliveryThreshold: st.free_delivery_threshold || this.tables.store_settings.freeDeliveryThreshold,
            freeShippingThreshold: st.free_delivery_threshold || this.tables.store_settings.freeShippingThreshold,
            defaultShippingFee: st.default_delivery_fee || this.tables.store_settings.defaultShippingFee,
            isOrderingEnabled: st.is_delivery_available !== undefined ? Boolean(st.is_delivery_available) : true,
            deliveryDistricts: typeof st.delivery_districts_json === 'string' ? JSON.parse(st.delivery_districts_json || '[]') : (st.delivery_districts_json || this.tables.store_settings.deliveryDistricts)
          };
        }
      } catch (stErr) {
        console.warn('D1 remote store_settings sync warning:', stErr);
      }

      this.ensureDefaultUsers();

      console.log('✅ Cloudflare D1 primary sync completed successfully for all operational tables.');
      return true;
    } catch (e) {
      console.warn('D1 remote sync warning:', e);
      return false;
    }
  }

  /**
   * Execute raw query or compound SQL batch directly on Cloudflare D1 HTTP REST API
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
        body: JSON.stringify(body)
      });

      const json = await res.json();
      return json;
    } catch (err: any) {
      console.warn('Cloudflare D1 HTTP query error:', err);
      return { success: false, errors: [{ code: 5000, message: err.message || 'Network error' }] };
    }
  }

  /**
   * Execute query directly on Cloudflare D1 HTTP REST API if token, account & database ID are provided
   */
  public async executeCloudflareD1Query(sql: string, params: any[] = []): Promise<any> {
    if (!this.isD1Configured()) {
      return null;
    }

    try {
      const json = await this.executeCloudflareD1Raw(sql, params);
      return json.result?.[0]?.results || [];
    } catch (err) {
      console.warn('Cloudflare D1 HTTP query warning:', err);
      return null;
    }
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

  public addProduct(product: Product): Product {
    const primaryImg = product.image || product.images?.[0] || '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg';
    product.image = primaryImg;
    product.images = (product.images && product.images.length > 0) ? product.images : [primaryImg];

    this.tables.products.push(product);
    this.tables.inventory.set(product.id, {
      currentStock: product.stock,
      reservedStock: 0,
      minThreshold: 15,
      lastCountedAt: new Date().toISOString()
    });

    // Log initial inventory entry
    this.logInventoryTransaction({
      id: `inv-init-${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.nameAr,
      type: 'initial',
      quantity: product.stock,
      previousStock: 0,
      newStock: product.stock,
      reason: 'إضافة منتج جديد للمتجر',
      performedBy: 'الإدارة',
      createdAt: new Date().toISOString()
    });

    this.saveLocal();
    return product;
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

    if (updates.stock !== undefined) {
      const inv = this.tables.inventory.get(id);
      if (inv) {
        inv.currentStock = updates.stock;
        inv.lastCountedAt = new Date().toISOString();
      }
    }

    if (CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId) {
      this.executeCloudflareD1Query(
        "UPDATE products SET name_ar = ?, price = ?, original_price = ?, images = ?, description_ar = ?, stock = ? WHERE id = ?;",
        [updated.nameAr, updated.price, updated.originalPrice || updated.price, JSON.stringify(updated.images || [finalImage]), updated.descriptionAr, updated.stock, id]
      ).catch(e => console.warn('D1 remote product update notice:', e));
    }

    this.saveLocal();
    return updated;
  }

  public deleteProduct(id: string): boolean {
    const prevLen = this.tables.products.length;
    this.tables.products = this.tables.products.filter(p => p.id !== id);
    this.tables.inventory.delete(id);
    this.saveLocal();
    return this.tables.products.length < prevLen;
  }

  public getCategories() {
    return this.tables.categories;
  }

  // ==========================================
  // 2. USERS & CUSTOMERS
  // ==========================================
  public getUsers(): UserAccount[] {
    return this.tables.users;
  }

  public findUserById(id: string): UserAccount | undefined {
    return this.tables.users.find(u => u.id === id);
  }

  public findUserByPhone(phone: string): UserAccount | undefined {
    const clean = phone.replace(/\D/g, '');
    return this.tables.users.find(u => u.phone.replace(/\D/g, '') === clean);
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

  public getCustomers(): CustomerRecord[] {
    return this.tables.customers;
  }

  public findOrCreateCustomer(name: string, phone: string, district?: string): CustomerRecord {
    const cleanPhone = phone.replace(/\D/g, '');
    let cust = this.tables.customers.find(c => c.phone.replace(/\D/g, '') === cleanPhone);

    if (!cust) {
      cust = {
        id: `cust-${cleanPhone}`,
        name: name.trim(),
        phone: phone.trim(),
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

  // ==========================================
  // 3. ORDERS & RELATIONAL ORDER ITEMS
  // ==========================================
  public getOrders(): Order[] {
    return this.tables.orders;
  }

  public findOrderById(id: string): Order | undefined {
    return this.tables.orders.find(o => o.id === id || o.orderNumber === id);
  }

  public getOrderItems(orderId: string): OrderItemRecord[] {
    return this.tables.order_items.filter(oi => oi.orderId === orderId);
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
    assignedDriver: { id: string; name: string; phone: string };
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
            status: row.status,
            items: typeof row.items_json === 'string' ? JSON.parse(row.items_json || '[]') : (row.items_json || []),
            subtotal: row.subtotal,
            shippingFee: row.shipping_fee || 0,
            discount: row.discount || 0,
            total: row.total,
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

    // If Cloudflare D1 is configured, execute atomic compound SQL directly on D1
    if (this.isD1Configured()) {
      const sqlEsc = (s: any) => String(s ?? '').replace(/'/g, "''");
      const statements: string[] = [];

      // 1. Stock check & conditional deduction for each item on BOTH products AND inventory tables
      // Using CASE WHEN stock >= qty THEN stock - qty ELSE -1 END
      // Combined with triggers `prevent_negative_stock` and `prevent_negative_inventory_stock`,
      // any insufficient stock immediately aborts the compound batch atomically!
      for (const it of orderData.validatedItems) {
        statements.push(
          `UPDATE products SET stock = CASE WHEN stock >= ${it.quantity} THEN stock - ${it.quantity} ELSE -1 END, updated_at = datetime('now') WHERE id = '${sqlEsc(it.productId)}';`
        );
        statements.push(
          `UPDATE inventory SET current_stock = CASE WHEN current_stock >= ${it.quantity} THEN current_stock - ${it.quantity} ELSE -1 END, updated_at = datetime('now') WHERE product_id = '${sqlEsc(it.productId)}';`
        );
      }

      // 2. Customer upsert
      const customerId = `cust-${cleanPhone}`;
      statements.push(
        `INSERT INTO customers (id, name, phone, district, street, notes, total_orders, total_spent, loyalty_points, created_at, updated_at) ` +
        `VALUES ('${customerId}', '${sqlEsc(orderData.customerName)}', '${sqlEsc(cleanPhone)}', '${sqlEsc(orderData.address.district)}', '${sqlEsc(orderData.address.street || '')}', '${sqlEsc(orderData.notes || '')}', 1, ${orderData.total}, ${Math.floor(orderData.total / 100)}, datetime('now'), datetime('now')) ` +
        `ON CONFLICT(phone) DO UPDATE SET ` +
        `name = excluded.name, ` +
        `district = excluded.district, ` +
        `total_orders = customers.total_orders + 1, ` +
        `total_spent = customers.total_spent + ${orderData.total}, ` +
        `loyalty_points = customers.loyalty_points + ${Math.floor(orderData.total / 100)}, ` +
        `updated_at = datetime('now');`
      );

      // 3. Insert order
      statements.push(
        `INSERT INTO orders (` +
        `id, order_number, customer_id, customer_name, customer_phone, delivery_district, delivery_address, items_json, subtotal, shipping_fee, discount, total, payment_method, payment_status, status, is_stock_rolled_back, idempotency_key, coupon_code, driver_id, driver_name, driver_phone, notes, driver_notes, timeline_json, created_at, updated_at` +
        `) VALUES (` +
        `'${orderData.orderId}', '${orderData.orderNumber}', '${customerId}', '${sqlEsc(orderData.customerName)}', '${sqlEsc(cleanPhone)}', ` +
        `'${sqlEsc(orderData.address.district)}', '${sqlEsc(orderData.address.street || orderData.address.district)}', '${sqlEsc(JSON.stringify(orderData.validatedItems))}', ` +
        `${orderData.subtotal}, ${orderData.shippingFee}, ${orderData.discount}, ${orderData.total}, ` +
        `'${sqlEsc(orderData.paymentMethod || 'cash')}', 'pending', 'received', 0, '${sqlEsc(orderData.idempotencyKey || '')}', '${sqlEsc(orderData.couponCode || '')}', ` +
        `'${sqlEsc(orderData.assignedDriver.id)}', '${sqlEsc(orderData.assignedDriver.name)}', '${sqlEsc(orderData.assignedDriver.phone)}', ` +
        `'${sqlEsc(orderData.notes || '')}', '', '${sqlEsc(JSON.stringify(orderData.timeline))}', datetime('now'), datetime('now')` +
        `);`
      );

      // 4. Insert order items (both product_id and productId for relational integrity)
      for (const it of orderData.validatedItems) {
        const itemRowId = `oi-${orderData.orderId}-${it.productId}-${Math.random().toString(36).substring(2, 7)}`;
        statements.push(
          `INSERT INTO order_items (id, order_id, product_id, productId, product_name_ar, product_name_en, weight_option, quantity, unit_price, total_price, created_at) ` +
          `VALUES ('${itemRowId}', '${orderData.orderId}', '${sqlEsc(it.productId)}', '${sqlEsc(it.productId)}', '${sqlEsc(it.productNameAr)}', '${sqlEsc(it.productNameEn || '')}', '${sqlEsc(it.weight)}', ${it.quantity}, ${it.unitPrice}, ${it.unitPrice * it.quantity}, datetime('now'));`
        );
      }

      // 5. Insert inventory logs
      for (const it of orderData.validatedItems) {
        const logId = `tx-sale-${Date.now()}-${it.productId}-${Math.random().toString(36).substring(2, 6)}`;
        const p = this.findProductById(it.productId);
        const prevStock = p ? p.stock : 0;
        const newStock = Math.max(0, prevStock - it.quantity);
        statements.push(
          `INSERT INTO inventory_logs (id, product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id, performed_by, created_at) ` +
          `VALUES ('${logId}', '${sqlEsc(it.productId)}', '${sqlEsc(it.productNameAr)}', 'sale', -${it.quantity}, ${prevStock}, ${newStock}, 'مبيعات طلب جديد #${orderData.orderNumber}', '${orderData.orderId}', 'نظام الطلبات الآلي', datetime('now'));`
        );
      }

      // 6. If coupon used, update usage_count safely
      if (orderData.couponCode) {
        statements.push(
          `UPDATE coupons SET usage_count = usage_count + 1 WHERE code = '${sqlEsc(orderData.couponCode)}' AND (max_uses IS NULL OR usage_count < max_uses);`
        );
      }

      const compoundSql = statements.join(' ');
      const rawRes = await this.executeCloudflareD1Raw(compoundSql);

      if (!rawRes.success) {
        const errMsg = rawRes.errors?.[0]?.message || 'فشلت عملية إنشاء الطلب في D1';
        if (errMsg.includes('Insufficient stock') || errMsg.includes('negative')) {
          return {
            success: false,
            message: 'عذراً! الكمية المطلوبة تتجاوز المخزون المتاح حالياً (Insufficient stock).'
          };
        }
        return {
          success: false,
          message: `خطأ أثناء تنفيذ العملية في D1: ${errMsg}`
        };
      }
    } else {
      // Local fallback verification: ensure sufficient stock before modifying
      for (const it of orderData.validatedItems) {
        const p = this.findProductById(it.productId);
        if (!p || p.stock < it.quantity) {
          return {
            success: false,
            message: `عذراً! الكمية المطلوبة من "${it.productNameAr}" تتجاوز المخزون المتاح حالياً.`
          };
        }
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
      status: "received",
      items: orderData.validatedItems,
      subtotal: orderData.subtotal,
      shippingFee: orderData.shippingFee,
      discount: orderData.discount,
      total: orderData.total,
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
      driverId: orderData.assignedDriver.id,
      driverName: orderData.assignedDriver.name,
      driverPhone: orderData.assignedDriver.phone,
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
    // 1. Guard against duplicate rollback execution
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

    // 2. Mark order as rolled back immediately to ensure transactional idempotency
    order.isStockRolledBack = true;
    order.cancelledAt = new Date().toISOString();

    // 3. Resolve order items: check in-order items array or relational order_items table
    let itemsToRollback = order.items;
    if (!itemsToRollback || itemsToRollback.length === 0) {
      const relationalItems = this.getOrderItems(order.id);
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

    const sqlEsc = (s: any) => String(s ?? '').replace(/'/g, "''");
    const statements: string[] = [];

    // 4. Iterate over all items in the order and restore stock
    for (const it of itemsToRollback) {
      const product = this.findProductById(it.productId);
      const prevStock = product ? product.stock : 0;
      const restoredQty = Number(it.quantity) || 1;
      const newStock = prevStock + restoredQty;
      if (product) {
        product.stock = newStock;

        // Update In-Memory / Local Inventory Map
        const existingInv = this.tables.inventory.get(product.id) || {
          currentStock: prevStock,
          reservedStock: 0,
          minThreshold: 15
        };
        this.tables.inventory.set(product.id, {
          ...existingInv,
          currentStock: newStock,
          lastCountedAt: new Date().toISOString()
        });
      }

      // Create and register audit transaction in inventory_logs
      const logRecord: InventoryLogRecord = {
        id: `tx-rollback-${Date.now()}-${it.productId}-${Math.random().toString(36).substring(2, 6)}`,
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
      };
      this.tables.inventory_logs.unshift(logRecord);

      statements.push(
        `UPDATE products SET stock = stock + ${restoredQty}, updated_at = datetime('now') WHERE id = '${sqlEsc(it.productId)}';`
      );
      statements.push(
        `UPDATE inventory SET current_stock = current_stock + ${restoredQty}, updated_at = datetime('now') WHERE product_id = '${sqlEsc(it.productId)}';`
      );
      statements.push(
        `INSERT INTO inventory_logs (id, product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id, performed_by, created_at) ` +
        `VALUES ('${logRecord.id}', '${sqlEsc(it.productId)}', '${sqlEsc(it.productNameAr)}', 'STOCK_ROLLBACK', ${restoredQty}, ${prevStock}, ${newStock}, '${sqlEsc(logRecord.reason)}', '${order.id}', '${sqlEsc(actor)}', datetime('now'));`
      );
    }

    statements.push(
      `UPDATE orders SET status = 'cancelled', is_stock_rolled_back = 1, cancelled_at = datetime('now'), updated_at = datetime('now') WHERE id = '${order.id}' AND is_stock_rolled_back = 0;`
    );

    const notifId = `notif-cancel-${Date.now()}`;
    statements.push(
      `INSERT INTO notifications (id, recipient_role, title, message, type, is_read, link, created_at) ` +
      `VALUES ('${notifId}', 'admin', 'استرجاع مخزون - إلغاء طلب', 'تم إلغاء الطلب #${order.orderNumber || order.id} وإعادة الكميات تلقائيًا للمخزون', 'stock', 0, '/admin/orders/${order.id}', datetime('now'));`
    );

    if (this.isD1Configured()) {
      const rollbackRes = await this.executeCloudflareD1Raw(statements.join(' '));
      if (!rollbackRes.success) {
        console.error('D1 Stock Rollback raw execution warning:', rollbackRes.errors);
      }
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

  public async updateOrderStatus(orderId: string, status: Order['status'], driverNotes?: string, actor: string = 'الإدارة'): Promise<Order | null> {
    const order = this.findOrderById(orderId);
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

    order.status = status;

    if (driverNotes) {
      order.driverNotes = driverNotes;
    }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" });

    if (!order.timeline) {
      order.timeline = [];
    }

    const titleMap: Record<string, { ar: string; en: string }> = {
      received: { ar: "تم استلام الطلب وتأكيده بالنظام", en: "Order Received" },
      preparing: { ar: "جاري تجهيز وتعبئة الفحم في المستودع", en: "Preparing Charcoal" },
      shipped: { ar: "خرج الفحم مع المندوب للتوصيل", en: "Out for Delivery" },
      delivering: { ar: "المندوب في الحي وقريب من موقعك", en: "Near Delivery Location" },
      delivered: { ar: "تم تسليم الطلب للعميل بنجاح", en: "Delivered Successfully" },
      cancelled: { ar: "تم إلغاء الطلب واسترجاع المخزون", en: "Order Cancelled & Stock Rolled Back" }
    };

    const statusInfo = titleMap[status] || { ar: `تم تحديث الحالة إلى: ${status}`, en: `Status: ${status}` };

    order.timeline.push({
      status,
      time: timeFormatted,
      titleAr: statusInfo.ar,
      titleEn: statusInfo.en
    });

    // Update payment status if delivered
    if (status === 'delivered') {
      const pay = this.tables.payments.find(p => p.orderId === order.id);
      if (pay) {
        pay.status = 'confirmed';
        pay.updatedAt = new Date().toISOString();
      }
    }

    // Sync order status to Cloudflare D1 SQL
    if (this.isD1Configured()) {
      const sqlEsc = (s: any) => String(s ?? '').replace(/'/g, "''");
      const compDateCol = status === 'delivered' ? ", completed_at = datetime('now')" : (status === 'cancelled' ? ", cancelled_at = datetime('now')" : "");
      await this.executeCloudflareD1Raw(
        `UPDATE orders SET status = '${status}', driver_notes = '${sqlEsc(order.driverNotes || '')}', timeline_json = '${sqlEsc(JSON.stringify(order.timeline))}'${compDateCol}, updated_at = datetime('now') WHERE id = '${order.id}' OR order_number = '${order.orderNumber}';`
      );
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

    // Execute on Cloudflare D1 with trigger protection
    if (this.isD1Configured()) {
      const statements = [
        `UPDATE products SET stock = ${params.newStock}, updated_at = datetime('now') WHERE id = '${sqlEsc(params.productId)}';`,
        `INSERT INTO inventory_logs (id, product_id, product_name, type, quantity, previous_stock, new_stock, reason, performed_by, created_at) ` +
        `VALUES ('${txId}', '${sqlEsc(params.productId)}', '${sqlEsc(product.nameAr)}', '${params.type}', ${params.quantity}, ${params.previousStock}, ${params.newStock}, '${sqlEsc(params.reason)}', '${sqlEsc(params.performedBy)}', datetime('now'));`
      ];
      await this.executeCloudflareD1Raw(statements.join(' '));
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

  // ==========================================
  // 5. DELIVERY AGENTS
  // ==========================================
  public getDeliveryAgents(): DeliveryAgent[] {
    return this.tables.delivery_agents;
  }

  // ==========================================
  // 6. REVIEWS & COUPONS
  // ==========================================
  public getReviews(): Review[] {
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

  public getCoupons(): Coupon[] {
    return this.tables.coupons;
  }

  public findCoupon(code: string): Coupon | undefined {
    return this.tables.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);
  }

  // ==========================================
  // 7. STORE SETTINGS & GALLERY
  // ==========================================
  public getSettings(): StoreSettings {
    return this.tables.store_settings;
  }

  public updateSettings(newSettings: Partial<StoreSettings>): StoreSettings {
    this.tables.store_settings = { ...this.tables.store_settings, ...newSettings };
    this.saveLocal();
    return this.tables.store_settings;
  }

  public getGalleryItems(): GalleryItem[] {
    return this.tables.gallery_items;
  }

  public getNotifications(): NotificationRecord[] {
    return this.tables.notifications;
  }
}

// Singleton D1 Database Access Instance
export const d1 = new D1DatabaseAccessLayer();
