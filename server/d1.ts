import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Product, Order, Review, Coupon, DeliveryAgent, StoreSettings, GalleryItem } from '../src/types';
import { INITIAL_PRODUCTS, INITIAL_GALLERY_ITEMS, INITIAL_STORE_SETTINGS, INITIAL_DELIVERY_AGENTS } from '../src/data/mockData';

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
  role: 'customer' | 'admin' | 'owner' | 'employee' | 'delivery';
  passwordHash?: string;
  pin?: string;
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
  type: 'initial' | 'purchase' | 'sale' | 'return' | 'damage' | 'adjustment' | 'STOCK_ROLLBACK';
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

// Memory / Local Persistent Store for D1 Entities
class D1DatabaseAccessLayer {
  private localDbPath = path.join(process.cwd(), 'data', 'db.json');
  private isInitialized = false;

  // In-memory relational tables matching D1 Schema
  private tables = {
    categories: [] as Array<{ id: string; name_ar: string; name_en?: string; slug: string; sort_order: number; is_active: number; created_at: string }>,
    products: [] as Product[],
    users: [] as UserAccount[],
    customers: [] as CustomerRecord[],
    orders: [] as Order[],
    order_items: [] as OrderItemRecord[],
    inventory: new Map<string, { currentStock: number; reservedStock: number; minThreshold: number; lastCountedAt?: string }>(),
    inventory_logs: [] as InventoryLogRecord[],
    delivery_agents: [] as DeliveryAgent[],
    reviews: [] as Review[],
    coupons: [] as Coupon[],
    gallery_items: [] as GalleryItem[],
    store_settings: {} as StoreSettings,
    payments: [] as PaymentRecord[],
    notifications: [] as NotificationRecord[]
  };

  constructor() {
    this.init();
  }

  /**
   * Initialize Schema, migrate legacy data, and sync with Cloudflare D1
   */
  public async init() {
    if (this.isInitialized) return;

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
    }
  }

  /**
   * Ensure Default Owner Account exists and is ready for login
   */
  public ensureDefaultUsers() {
    const hasOwner = this.tables.users.some(u => u.role === 'owner');
    if (!hasOwner) {
      const defaultOwner: UserAccount = {
        id: 'usr-owner-hashem',
        name: 'هاشم السماوي (المالك)',
        phone: '777000111',
        role: 'owner',
        pin: '7777',
        createdAt: new Date().toISOString()
      };
      this.tables.users.push(defaultOwner);
      this.saveLocal();

      if (CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId) {
        this.executeCloudflareD1Query(
          "INSERT OR IGNORE INTO users (id, name, phone, role, pin_hash, created_at) VALUES (?, ?, ?, ?, ?, ?);",
          [defaultOwner.id, defaultOwner.name, defaultOwner.phone, defaultOwner.role, defaultOwner.pin, defaultOwner.createdAt]
        ).catch(() => {});
      }
    }
  }

  /**
   * Fetch primary authoritative data directly from remote Cloudflare D1
   */
  public async syncFromCloudflareD1(): Promise<boolean> {
    if (!CLOUDFLARE_CONFIG.accountId || !CLOUDFLARE_CONFIG.apiToken || !CLOUDFLARE_CONFIG.databaseId) {
      return false;
    }

    try {
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
          date: r.created_at
        }));
      }

      // 4. Users & Owner
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
            pin: u.pin_hash || u.pin || undefined,
            createdAt: u.created_at || new Date().toISOString(),
            lastLogin: u.last_login || undefined
          }));
        }
      } catch (userErr) {
        console.warn('D1 remote users sync warning:', userErr);
      }

      this.ensureDefaultUsers();

      console.log('✅ Cloudflare D1 primary sync completed successfully.');
      return true;
    } catch (e) {
      console.warn('D1 remote sync warning:', e);
      return false;
    }
  }

  /**
   * Execute query directly on Cloudflare D1 HTTP REST API if token, account & database ID are provided
   */
  public async executeCloudflareD1Query(sql: string, params: any[] = []): Promise<any> {
    if (!CLOUDFLARE_CONFIG.accountId || !CLOUDFLARE_CONFIG.apiToken || !CLOUDFLARE_CONFIG.databaseId) {
      return null;
    }

    try {
      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/d1/database/${CLOUDFLARE_CONFIG.databaseId}/query`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql, params })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`Cloudflare D1 REST API returned ${res.status}: ${errText}`);
        return null;
      }

      const json = await res.json();
      return json.result?.[0]?.results || [];
    } catch (err) {
      console.warn('Cloudflare D1 HTTP query warning:', err);
      return null;
    }
  }

  private saveLocal() {
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
  public executeStockRollback(order: Order, actor: string = 'نظام إدارة الطلبات'): boolean {
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

    // 4. Iterate over all items in the order and restore stock
    for (const it of itemsToRollback) {
      const product = this.findProductById(it.productId);
      if (product) {
        const prevStock = product.stock;
        const restoredQty = Number(it.quantity) || 1;
        const newStock = prevStock + restoredQty;
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

        // Create and register audit transaction in inventory_logs
        const logRecord: InventoryLogRecord = {
          id: `tx-rollback-${Date.now()}-${product.id}-${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          productName: product.nameAr,
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

        // Asynchronously sync stock restoration and audit log directly to Cloudflare D1
        this.executeCloudflareD1Query(
          `UPDATE products SET stock = stock + ? WHERE id = ?`,
          [restoredQty, product.id]
        ).catch(e => console.warn('D1 stock restoration query note:', e));

        this.executeCloudflareD1Query(
          `UPDATE inventory SET current_stock = current_stock + ? WHERE product_id = ?`,
          [restoredQty, product.id]
        ).catch(e => console.warn('D1 inventory restoration query note:', e));

        this.executeCloudflareD1Query(
          `INSERT INTO inventory_logs (id, product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id, performed_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            logRecord.id,
            product.id,
            product.nameAr,
            'STOCK_ROLLBACK',
            restoredQty,
            prevStock,
            newStock,
            logRecord.reason,
            order.id,
            logRecord.performedBy,
            logRecord.createdAt
          ]
        ).catch(e => console.warn('D1 inventory_logs insert note:', e));
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

  public updateOrderStatus(orderId: string, status: Order['status'], driverNotes?: string, actor: string = 'الإدارة'): Order | null {
    const order = this.findOrderById(orderId);
    if (!order) return null;

    const previousStatus = order.status;

    // Execute Stock Rollback if transitioning to 'cancelled' from a non-cancelled status
    if (status === 'cancelled') {
      if (previousStatus !== 'cancelled' && !order.isStockRolledBack) {
        this.executeStockRollback(order, actor);
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
    this.executeCloudflareD1Query(
      `UPDATE orders SET status = ? WHERE id = ? OR order_number = ?`,
      [status, order.id, order.orderNumber]
    ).catch(e => console.warn('D1 orders update note:', e));

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
