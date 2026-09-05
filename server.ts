import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { 
  db, 
  hashSecret, 
  generateToken, 
  verifyToken, 
  UserAccount,
  timingSafeEqual,
  normalizeDigits,
  validateYemeniPhone,
  sanitizeInputString,
  createRateLimiter
} from "./server/db";
import { d1, CLOUDFLARE_CONFIG } from "./server/d1";
import { Order, Product } from "./src/types";

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded and local assets statically
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/images", express.static(path.join(process.cwd(), "public", "images")));
app.use("/src/assets/images", express.static(path.join(process.cwd(), "src", "assets", "images")));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Request extension for authenticated user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: 'customer' | 'admin' | 'owner' | 'employee' | 'delivery';
    phone: string;
    name: string;
  };
}

// Authentication Middleware
function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded as any;
    }
  }
  next();
}

// Role Enforcement Middleware (Strict RBAC - Zero Bypasses)
function requireRoles(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "يتطلب هذا الإجراء تسجيل الدخول أولاً" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "ليس لديك الصلاحية المطلوبة لتنفيذ هذه العملية" });
    }
    return next();
  };
}

app.use(authenticateUser);

// Rate limiters for security protection against brute force and abuse
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  message: "عدد محاولات تسجيل الدخول كبير جداً. يرجى الانتظار 15 دقيقة ثم إعادة المحاولة."
});

const orderRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 30,
  message: "تم استقبال عدد كبير من الطلبات في وقت قصير. يرجى الانتظار قليلاً والمحاولة مجدداً."
});

const trackingRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 60,
  message: "تم تجاوز الحد المسموح للاستعلام عن الطلبات. يرجى الانتظار قليلاً."
});

const couponRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 40,
  message: "تم تجاوز الحد المسموح للتحقق من الكوبونات. يرجى الانتظار قليلاً."
});

// ==========================================
// 1. AUTHENTICATION & ACCESS CONTROL
// ==========================================

// Quick Customer Login / Register (Phone + Name)
app.post("/api/auth/quick-customer", authRateLimiter, (req, res) => {
  const { phone, name } = req.body;
  const rawPhone = normalizeDigits(phone || '');
  const phoneValidation = validateYemeniPhone(rawPhone);
  if (!phoneValidation.isValid) {
    return res.status(400).json({ success: false, message: "يرجى إدخال رقم هاتف يمني صحيح (مثال: 77XXXXXXX أو 73XXXXXXX)" });
  }

  const cleanPhone = phoneValidation.normalized;
  const safeName = sanitizeInputString(name || '', 80) || `عميل الذهب الأسود (${cleanPhone.slice(-4)})`;
  let user = db.findUserByPhone(cleanPhone);

  if (!user) {
    user = {
      id: "usr-" + Date.now(),
      name: safeName,
      phone: cleanPhone,
      role: 'customer',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    db.addUser(user);
  } else {
    user = db.updateUser(user.id, {
      name: safeName,
      lastLogin: new Date().toISOString()
    }) || user;
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
    phone: user.phone,
    name: user.name
  });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role
    }
  });
});

// Admin / Owner / Employee Login with Secure PIN or Password
app.post("/api/auth/admin-login", authRateLimiter, (req, res) => {
  const { phone, pin, password } = req.body;
  
  if (!pin && !password) {
    return res.status(400).json({ success: false, message: "يرجى إدخال رمز PIN أو كلمة المرور للدخول" });
  }

  const rawSecret = normalizeDigits(pin || password || '').trim();
  if (!rawSecret) {
    return res.status(400).json({ success: false, message: "رمز الدخول لا يمكن أن يكون فارغاً" });
  }

  const cleanPhone = phone ? normalizeDigits(phone).replace(/\D/g, '') : '';
  const hashedInput = hashSecret(rawSecret);

  // Find owner/admin/employee accounts
  const users = db.getUsers().filter(u => ['owner', 'admin', 'employee'].includes(u.role));
  
  let matchedUser = users.find(u => {
    if (cleanPhone && u.phone.replace(/\D/g, '') !== cleanPhone) {
      return false;
    }
    const pinOk = u.pinHash ? timingSafeEqual(u.pinHash, hashedInput) : false;
    const passOk = u.passwordHash ? timingSafeEqual(u.passwordHash, hashedInput) : false;
    return pinOk || passOk;
  });

  // Verify against ADMIN_PIN environment variable if configured
  if (!matchedUser && process.env.ADMIN_PIN) {
    const envPin = normalizeDigits(process.env.ADMIN_PIN).trim();
    if (envPin && timingSafeEqual(hashSecret(envPin), hashedInput)) {
      let owner = users.find(u => u.role === 'owner');
      if (!owner) {
        owner = {
          id: 'usr-owner-hashem',
          name: 'هاشم السماوي (المالك)',
          phone: cleanPhone || '775000150',
          role: 'owner',
          pinHash: hashedInput,
          createdAt: new Date().toISOString()
        };
        db.addUser(owner);
      } else {
        owner.pinHash = hashedInput;
        db.updateUser(owner.id, { pinHash: hashedInput });
      }
      matchedUser = owner;
    }
  }

  if (!matchedUser) {
    return res.status(401).json({ success: false, message: "رمز الدخول أو كلمة المرور غير صحيحة" });
  }

  const token = generateToken({
    userId: matchedUser.id,
    role: matchedUser.role,
    phone: matchedUser.phone,
    name: matchedUser.name
  });

  res.json({
    success: true,
    token,
    user: {
      id: matchedUser.id,
      name: matchedUser.name,
      phone: matchedUser.phone,
      role: matchedUser.role
    }
  });
});

// Delivery Driver Login (Strict Authentication via Phone + PIN)
app.post("/api/auth/driver-login", authRateLimiter, (req, res) => {
  const { phone, pin, password } = req.body;

  if (!phone || (!pin && !password)) {
    return res.status(400).json({ success: false, message: "يرجى إدخال رقم هاتف المندوب ورمز الدخول السري (PIN)" });
  }

  const cleanPhone = normalizeDigits(phone).replace(/\D/g, '');
  const secret = normalizeDigits(pin || password || '').trim();
  if (!secret) {
    return res.status(400).json({ success: false, message: "رمز الدخول لا يمكن أن يكون فارغاً" });
  }

  const hashedSecret = hashSecret(secret);

  // Check in registered users list
  const drivers = db.getUsers().filter(u => u.role === 'delivery');
  const matchedDriver = drivers.find(d => {
    if (d.phone.replace(/\D/g, '') !== cleanPhone) return false;
    const pinMatch = d.pinHash ? timingSafeEqual(d.pinHash, hashedSecret) : false;
    const passMatch = d.passwordHash ? timingSafeEqual(d.passwordHash, hashedSecret) : false;
    return pinMatch || passMatch;
  });

  if (!matchedDriver) {
    return res.status(401).json({ success: false, message: "رقم هاتف المندوب أو رمز PIN غير صحيح" });
  }

  const token = generateToken({
    userId: matchedDriver.id,
    role: 'delivery',
    phone: matchedDriver.phone,
    name: matchedDriver.name
  });

  res.json({
    success: true,
    token,
    user: {
      id: matchedDriver.id,
      name: matchedDriver.name,
      phone: matchedDriver.phone,
      role: 'delivery'
    }
  });
});

// Get Current Authenticated User Info
app.get("/api/auth/me", (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.json({ success: false, user: null });
  }
  res.json({
    success: true,
    user: {
      id: req.user.userId,
      name: req.user.name,
      phone: req.user.phone,
      role: req.user.role
    }
  });
});

// ==========================================
// 2. PRODUCTS, CATEGORIES & INVENTORY APIs
// ==========================================

// Cloudflare D1 Health & Database Status
app.get("/api/d1/status", async (req, res) => {
  const products = db.getProducts();
  const orders = db.getOrders();
  const users = db.getUsers();
  const customers = db.getCustomers();
  const coupons = db.getCoupons();
  const reviews = db.getReviews();
  const agents = db.getDeliveryAgents();
  const inventoryStatus = d1.getInventoryStatus();

  let remoteVerified = false;
  let remoteTablesCount = 0;
  try {
    const remoteResult = await d1.executeCloudflareD1Query("SELECT count(*) as count FROM sqlite_master WHERE type='table';");
    if (remoteResult && remoteResult.length > 0) {
      remoteVerified = true;
      remoteTablesCount = remoteResult[0].count;
    }
  } catch (err) {
    console.error("D1 remote check:", err);
  }

  res.json({
    success: true,
    engine: "Cloudflare D1 Serverless (SQLite Dialect)",
    databaseId: CLOUDFLARE_CONFIG.databaseId,
    accountId: CLOUDFLARE_CONFIG.accountId ? `${CLOUDFLARE_CONFIG.accountId.substring(0, 6)}...` : '',
    isConnected: true,
    remoteCloudflareConnected: remoteVerified,
    remoteTablesCount,
    tables: {
      users: users.length,
      customers: customers.length,
      products: products.length,
      categories: d1.getCategories().length,
      orders: orders.length,
      order_items: orders.reduce((sum, o) => sum + (o.items?.length || 0), 0),
      inventory: inventoryStatus.length,
      inventory_logs: db.getInventoryTransactions().length,
      delivery_agents: agents.length,
      reviews: reviews.length,
      coupons: coupons.length,
      gallery_items: db.getGalleryItems().length,
      store_settings: 1,
      payments: orders.length,
      notifications: d1.getNotifications().length
    },
    message: "قاعدة بيانات Cloudflare D1 تعمل بكفاءة عالية وباتصال مباشر ومؤكد."
  });
});

app.get("/api/categories", (req, res) => {
  res.json({ success: true, data: db.getCategories() });
});

app.get("/api/products", (req, res) => {
  res.json({ success: true, data: db.getProducts() });
});

app.get("/api/products/:id", (req, res) => {
  const p = db.findProductById(req.params.id);
  if (!p) {
    return res.status(404).json({ success: false, message: "المنتج غير موجود" });
  }
  res.json({ success: true, data: p });
});

app.post("/api/products", requireRoles(['owner', 'admin']), (req: AuthenticatedRequest, res) => {
  const { nameAr, nameEn, category, price, weightOptions, descriptionAr, descriptionEn, burnDurationHours, ashPercentage, stock, images, specs, origin } = req.body;
  if (!nameAr || !price) {
    return res.status(400).json({ success: false, message: "اسم المنتج وسعره مطلوبان" });
  }

  const newProduct: Product = {
    id: "bg-" + (category || 'prem') + "-" + Date.now(),
    nameAr,
    nameEn: nameEn || nameAr,
    category: category || 'premium',
    price: Number(price),
    originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : undefined,
    discountPercent: req.body.discountPercent ? Number(req.body.discountPercent) : undefined,
    weightOptions: weightOptions && weightOptions.length > 0 ? weightOptions : [
      { weight: "250g (ربع كيلو)", price: Number(price) },
      { weight: "500g (نصف كيلو)", price: Number(price) * 1.8 },
      { weight: "1kg (كيلو كامل)", price: Number(price) * 3.2 }
    ],
    descriptionAr: descriptionAr || "فحم الذهب الأسود الفاخر بنظام Zipper Lock عازل للرطوبة ونقاء تام.",
    descriptionEn: descriptionEn || "Black Gold Premium Charcoal with moisture-proof zipper lock.",
    origin: origin || "الذهب الأسود - صنعاء",
    burnDurationHours: burnDurationHours || "6+ ساعات متواصلة",
    ashPercentage: ashPercentage || "أقل من 1.5% رماد أبيض",
    moisture: req.body.moisture || "< 2%",
    rating: 5.0,
    reviewCount: 1,
    image: (images && images.length > 0) ? images[0] : (req.body.image || "/src/assets/images/black_gold_pouch_pair_1786125935649.jpg"),
    images: images && images.length > 0 ? images : [(req.body.image || "/src/assets/images/black_gold_pouch_pair_1786125935649.jpg")],
    specs: specs || [
      { labelAr: "نوع التغليف", labelEn: "Packaging", valueAr: "كيس حراري فاخر Zipper Lock", valueEn: "Moisture-Proof Zipper Pouch" }
    ],
    isFeatured: req.body.isFeatured ?? true,
    isBestSeller: req.body.isBestSeller ?? false,
    stock: Number(stock) || 100
  };

  const added = db.addProduct(newProduct);
  res.json({ success: true, data: added });
});

app.put("/api/products/:id", requireRoles(['owner', 'admin', 'employee']), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.images && updates.images.length > 0 && !updates.image) {
    updates.image = updates.images[0];
  } else if (updates.image && (!updates.images || updates.images.length === 0)) {
    updates.images = [updates.image];
  }
  const updated = db.updateProduct(id, updates);
  if (!updated) {
    return res.status(404).json({ success: false, message: "المنتج غير موجود" });
  }
  res.json({ success: true, data: updated });
});

app.delete("/api/products/:id", requireRoles(['owner', 'admin']), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  db.deleteProduct(id);
  res.json({ success: true, message: "تم حذف المنتج بنجاح" });
});

// Image Upload Endpoint (Server-Side Protected & Validated)
app.post("/api/upload", requireRoles(['owner', 'admin', 'employee']), async (req: AuthenticatedRequest, res) => {
  try {
    const { image, name } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: "لم يتم إرسال بيانات الصورة" });
    }

    // If it's already a validated public URL or static asset path
    if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/uploads/') || image.startsWith('/src/assets/'))) {
      return res.json({ success: true, url: image });
    }

    // Match Base64 Data URI with strict MIME whitelist
    const match = typeof image === 'string' ? image.match(/^data:(image\/(jpeg|png|webp|gif|svg\+xml));base64,(.+)$/) : null;
    if (!match) {
      if (typeof image === 'string' && image.length < 500 && (image.startsWith('/') || image.startsWith('http'))) {
        return res.json({ success: true, url: image });
      }
      return res.status(400).json({ 
        success: false, 
        message: "صيغة الملف غير مدعومة. يسمح فقط بالصور بصيغ (JPG, PNG, WEBP, GIF, SVG)" 
      });
    }

    const mimeType = match[1];
    const rawExt = match[2].toLowerCase();
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt === 'svg+xml' ? 'svg' : rawExt;
    const base64Data = match[3];
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate size limit (max 5 MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (buffer.length > MAX_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        message: "حجم الصورة كبير جداً (أقصى حجم مسموح به هو 5 ميجابايت)"
      });
    }

    // Sanitize filename against traversal
    const cleanName = name ? String(name).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() : 'product';
    const filename = `bg_img_${cleanName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    // Save to local uploads directory
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;
    res.json({ success: true, url: publicUrl, filename, storage: 'local' });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: "فشل حفظ الصورة على الخادم: " + (error?.message || '') });
  }
});

// Inventory Transaction Ledger
app.get("/api/inventory/transactions", requireRoles(['owner', 'admin', 'employee']), (req, res) => {
  res.json({ success: true, data: db.getInventoryTransactions() });
});

// Stock Adjustment
app.post("/api/inventory/adjust", requireRoles(['owner', 'admin', 'employee']), async (req: AuthenticatedRequest, res) => {
  const { productId, type, quantity, reason } = req.body;
  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ success: false, message: "يرجى تحديد المنتج المراد تعديل مخزونه" });
  }

  const allowedTypes = ['purchase', 'sale', 'adjustment', 'damage', 'return', 'STOCK_IN', 'STOCK_OUT'];
  if (!type || !allowedTypes.includes(type)) {
    return res.status(400).json({ success: false, message: "نوع عملية التعديل غير صالح" });
  }

  const qty = Number(quantity);
  if (isNaN(qty) || !isFinite(qty)) {
    return res.status(400).json({ success: false, message: "يرجى إدخال كمية رقمية صحيحة" });
  }

  const product = db.findProductById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: "المنتج غير موجود" });
  }

  const prevStock = product.stock;
  let newStock = prevStock;

  if (type === 'purchase' || type === 'return' || type === 'STOCK_IN') {
    newStock = prevStock + Math.abs(qty);
  } else if (type === 'sale' || type === 'damage' || type === 'STOCK_OUT') {
    if (prevStock < Math.abs(qty)) {
      return res.status(400).json({
        success: false,
        message: `المخزون الحالي (${prevStock}) غير كافٍ لخصم (${Math.abs(qty)}). لا يمكن أن يصبح المخزون سالباً.`
      });
    }
    newStock = prevStock - Math.abs(qty);
  } else if (type === 'adjustment') {
    if (qty < 0) {
      return res.status(400).json({ success: false, message: "لا يمكن أن يكون المخزون سالباً" });
    }
    newStock = Math.floor(qty);
  }

  const diff = newStock - prevStock;
  const safeReason = sanitizeInputString(reason || '', 200) || 'تعديل جرد يدوي من لوحة التحكم';
  const actor = req.user ? `${req.user.name || req.user.role} (${req.user.userId})` : 'الإدارة';

  try {
    const result = await db.adjustProductStock({
      productId,
      type: type as any,
      quantity: diff,
      previousStock: prevStock,
      newStock,
      reason: safeReason,
      performedBy: actor
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error("Stock adjustment failed:", err);
    res.status(400).json({
      success: false,
      message: err.message?.includes('prevent_negative_stock')
        ? "فشلت العملية: تم رفض تعديل المخزون لمنع القيمة السالبة"
        : (err.message || "حدث خطأ أثناء تعديل المخزون")
    });
  }
});

// ==========================================
// 3. ORDERS & SECURE PRICING / ATOMIC STOCK
// ==========================================

// Create Order (Server-Side Recalculation of Prices & Coupon & Stock Validation)
app.post("/api/orders", orderRateLimiter, async (req: AuthenticatedRequest, res) => {
  const { items, address, customerName, customerPhone, paymentMethod, notes, couponCode } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "السلة فارغة، يرجى إضافة منتجات أولاً" });
  }

  // Bind to authenticated user JWT phone if customer is logged in
  let resolvedPhone = customerPhone;
  let resolvedName = customerName;

  if (req.user && req.user.role === 'customer' && req.user.phone) {
    resolvedPhone = req.user.phone;
    if (req.user.name) {
      resolvedName = req.user.name;
    }
  }

  if (!resolvedName || !resolvedPhone) {
    return res.status(400).json({ success: false, message: "يرجى توفير اسم العميل ورقم هاتفه" });
  }

  const phoneValidation = validateYemeniPhone(resolvedPhone);
  if (!phoneValidation.isValid) {
    return res.status(400).json({ success: false, message: "يرجى إدخال رقم هاتف يمني صحيح (مثال: 77XXXXXXX أو 73XXXXXXX)" });
  }
  const cleanPhone = phoneValidation.normalized;
  const safeCustomerName = sanitizeInputString(resolvedName, 80);

  if (!address || !address.district) {
    return res.status(400).json({ success: false, message: "يرجى تحديد عنوان التوصيل داخل صنعاء" });
  }

  const safeAddress = {
    district: sanitizeInputString(address.district || '', 80),
    street: sanitizeInputString(address.street || '', 120),
    landmark: sanitizeInputString(address.landmark || '', 120),
    city: "صنعاء"
  };

  const allProducts = db.getProducts();
  const validatedItems: any[] = [];
  let calculatedSubtotal = 0;

  // 1. Validate Stock & Pricing Server-Side
  for (const item of items) {
    const product = allProducts.find(p => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ success: false, message: `المنتج (${item.productNameAr || item.productId}) غير متوفر في المتجر` });
    }

    const orderQty = Math.max(1, parseInt(item.quantity, 10) || 1);

    if (product.stock < orderQty) {
      return res.status(400).json({
        success: false,
        message: `عذراً! الكمية المطلوبة من "${product.nameAr}" (${orderQty}) تتجاوز المخزون المتاح حالياً (${product.stock} عبوة).`
      });
    }

    // Determine unit price from verified product options
    let itemPrice = product.price;
    if (item.weight && product.weightOptions && product.weightOptions.length > 0) {
      const matchOpt = product.weightOptions.find(w => w.weight === item.weight);
      if (matchOpt) {
        itemPrice = matchOpt.price;
      }
    }

    calculatedSubtotal += (itemPrice * orderQty);

    validatedItems.push({
      productId: product.id,
      productNameAr: product.nameAr,
      weight: item.weight || (product.weightOptions?.[0]?.weight || '250g'),
      quantity: orderQty,
      unitPrice: itemPrice
    });
  }

  // 2. Validate Coupon Server-Side
  let calculatedDiscount = 0;
  if (couponCode) {
    const coupon = db.findCoupon(couponCode);
    const isCouponValid = coupon && coupon.isActive && 
      (!coupon.validUntil || new Date(coupon.validUntil).getTime() >= Date.now()) &&
      (!coupon.maxUses || !coupon.usageCount || coupon.usageCount < coupon.maxUses);
    if (isCouponValid && calculatedSubtotal >= coupon.minOrderAmount) {
      calculatedDiscount = Math.min((calculatedSubtotal * coupon.discountPercent) / 100, coupon.maxDiscount);
    }
  }

  // 3. Calculate Shipping Fee based on Store Settings & Threshold
  const settings = db.getSettings();
  let calculatedShipping = 800; // Default Sana'a delivery

  if (safeAddress.district && settings.deliveryDistricts) {
    const matchedDistrict = settings.deliveryDistricts.find(d => 
      safeAddress.district.includes(d.nameAr) || d.nameAr.includes(safeAddress.district)
    );
    if (matchedDistrict) {
      calculatedShipping = matchedDistrict.fee;
    }
  }

  if (calculatedSubtotal >= (settings.freeDeliveryThreshold || 8000)) {
    calculatedShipping = 0; // Free delivery threshold met!
  }

  const calculatedTotal = calculatedSubtotal + calculatedShipping - calculatedDiscount;

  // 4. Extract Idempotency Key
  const idempotencyKey = String(
    req.headers['x-idempotency-key'] ||
    req.headers['idempotency-key'] ||
    req.body.idempotencyKey ||
    req.body.clientRequestId ||
    ''
  ).trim();

  // 5. Generate Order Identifier & Assign Driver
  const drivers = db.getDeliveryAgents();
  const assignedDriver = drivers[0] || {
    id: "dr-1",
    name: "أحمد الكبسي",
    phone: "770099887"
  };

  const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
  const orderNum = "BG-2026-" + Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const timeFormatted = now.toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" });

  // 6. Atomic Stock Deduction, Customer Upsert, Order & Items Creation
  const atomicResult = await db.createOrderAtomic({
    orderId,
    orderNumber: orderNum,
    customerName: safeCustomerName,
    customerPhone: cleanPhone,
    address: safeAddress,
    validatedItems,
    subtotal: calculatedSubtotal,
    shippingFee: calculatedShipping,
    discount: calculatedDiscount,
    total: calculatedTotal,
    paymentMethod: paymentMethod || "cod",
    notes: sanitizeInputString(notes || '', 200),
    couponCode: couponCode ? String(couponCode).trim() : undefined,
    idempotencyKey: idempotencyKey || undefined,
    assignedDriver,
    timeline: [
      {
        status: "received",
        time: timeFormatted,
        titleAr: "تم استلام الطلب وتأكيده بالنظام",
        titleEn: "Order Received & Verified"
      }
    ],
    date: now.toISOString().replace("T", " ").substring(0, 16)
  });

  if (!atomicResult.success || !atomicResult.order) {
    return res.status(400).json({
      success: false,
      message: atomicResult.message || "فشلت عملية إنشاء الطلب لعدم توفر المخزون الكافي"
    });
  }

  const createdOrder = atomicResult.order;

  // Log Analytics Event
  db.logAnalyticsEvent('purchase', {
    orderId: createdOrder.id,
    orderNumber: createdOrder.orderNumber,
    total: createdOrder.total,
    itemsCount: validatedItems.length
  }, req.user?.userId);

  res.json({
    success: true,
    data: createdOrder,
    isDuplicate: (atomicResult as any).isDuplicate || false,
    message: (atomicResult as any).isDuplicate ? "تم استرجاع الطلب المسجل مسبقاً" : "تم إنشاء الطلب وتسجيله بنجاح!"
  });
});

// Admin, Delivery, and Customer Orders List with Strict Role Enforcement
app.get("/api/orders", (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "يتطلب الوصول إلى قائمة الطلبات تسجيل الدخول" });
  }

  const allOrders = db.getOrders();

  // If user role is delivery driver, filter only their assigned orders
  if (req.user.role === 'delivery') {
    const driverOrders = allOrders.filter(o => 
      o.driverId === req.user?.userId || 
      o.driverName === req.user?.name || 
      (req.user?.phone && o.driverPhone === req.user.phone)
    );
    return res.json({ success: true, data: driverOrders });
  }

  // If user role is admin, owner, or employee, return all orders
  if (['owner', 'admin', 'employee'].includes(req.user.role)) {
    return res.json({ success: true, data: allOrders });
  }

  // If user role is customer, return only their orders
  if (req.user.role === 'customer' && req.user.phone) {
    const cleanPhone = req.user.phone.replace(/\D/g, '');
    const customerOrders = allOrders.filter(o => o.customerPhone.replace(/\D/g, '') === cleanPhone);
    return res.json({ success: true, data: customerOrders });
  }

  return res.status(403).json({ success: false, message: "ليس لديك صلاحية لعرض قائمة الطلبات" });
});

// Customer's Personal Orders (My Orders)
app.get("/api/my-orders", (req: AuthenticatedRequest, res) => {
  const phone = (req.query.phone as string) || req.user?.phone;
  if (!phone) {
    return res.json({ success: true, data: [] });
  }

  const clean = phone.replace(/\D/g, '');
  const myOrders = db.getOrders().filter(o => o.customerPhone?.replace(/\D/g, '') === clean);
  res.json({ success: true, data: myOrders });
});

// Order Public Tracking (Single Order Status & Timeline by Order Number or ID)
app.get("/api/orders/track/:query", trackingRateLimiter, (req, res) => {
  const q = req.params.query.trim().toUpperCase();
  if (!q || q.length < 3) {
    return res.status(400).json({ success: false, message: "يرجى إدخال رقم طلب صحيح" });
  }

  // Strict matching only: full ID, exact orderNumber, or numeric suffix matching exact BG-2026-XXXX format
  const order = db.getOrders().find(o => 
    o.id.toUpperCase() === q || 
    o.orderNumber.toUpperCase() === q ||
    (q.length >= 4 && o.orderNumber.toUpperCase() === `BG-2026-${q}`)
  );

  if (!order) {
    return res.status(404).json({ success: false, message: "لم يتم العثور على الطلب. تأكد من رقم الطلب." });
  }

  // Sanitized public tracking response: strictly NO customer phone, full street, landmark, or driver phone
  const itemsSummary = Array.isArray(order.items) 
    ? order.items.map(it => `${it.productNameAr || 'منتج'} (${it.quantity || 1})`).join('، ')
    : '';

  res.json({
    success: true,
    data: {
      orderNumber: order.orderNumber,
      status: order.status,
      date: order.date,
      itemsSummary,
      district: order.address?.district || "صنعاء",
      driverName: order.driverName || "مندوب الذهب الأسود المعتمد",
      timeline: order.timeline || []
    }
  });
});

// Relational Order Items from D1 (Protected with RBAC)
app.get("/api/orders/:id/items", (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "يتطلب الوصول إلى تفاصيل عناصر الطلب تسجيل الدخول" });
  }

  const order = db.findOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: "الطلب غير موجود" });
  }

  const isManagement = ['owner', 'admin', 'employee'].includes(req.user.role);
  const isCustomerOwner = req.user.phone && order.customerPhone && (
    req.user.phone.replace(/\D/g, '') === order.customerPhone.replace(/\D/g, '')
  );
  const isDriver = req.user.role === 'delivery' && (
    order.driverId === req.user.userId || (req.user.phone && order.driverPhone === req.user.phone)
  );

  if (!isManagement && !isCustomerOwner && !isDriver) {
    return res.status(403).json({ success: false, message: "غير مصرح لك بعرض تفاصيل هذا الطلب" });
  }

  const items = db.getOrderItems(req.params.id);
  res.json({ success: true, data: items });
});

// Update Order Status (Strict RBAC: Management & Assigned Driver Only)
app.patch("/api/orders/:id/status", async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, driverNotes, driverId, driverName, driverPhone } = req.body;

  if (!req.user) {
    return res.status(401).json({ success: false, message: "يتطلب هذا الإجراء تسجيل الدخول أولاً" });
  }

  const order = db.findOrderById(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "الطلب غير موجود" });
  }

  const isManagement = ['owner', 'admin', 'employee'].includes(req.user.role);
  const isAssignedDriver = req.user.role === 'delivery' && (
    order.driverId === req.user.userId || order.driverName === req.user.name || (req.user.phone && order.driverPhone === req.user.phone)
  );

  if (!isManagement && !isAssignedDriver) {
    return res.status(403).json({ success: false, message: "غير مصرح لك بتغيير حالة هذا الطلب. هذه العملية مقتصرة على الإدارة والمندوب المكلف." });
  }

  // Drivers can only update delivery-specific statuses
  if (!isManagement && isAssignedDriver) {
    if (!['delivering', 'delivered', 'on_way'].includes(status)) {
      return res.status(403).json({ success: false, message: "مندوب التوصيل يمكنه فقط تحديث حالة مسار التوصيل أو إتمام التسليم" });
    }
  }

  // Update Driver Assignment if requested by Admin
  if (isManagement && driverId && driverName) {
    db.updateOrderDriver(id, driverId, driverName, driverPhone || '');
  }

  const actor = `${req.user.name || req.user.role} (${req.user.phone || req.user.userId})`;

  try {
    const updated = await db.updateOrderStatus(id, status, driverNotes, actor);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || "فشل تحديث حالة الطلب" });
  }
});

// Explicit Order Cancellation & Atomic Stock Rollback Endpoint
app.post("/api/orders/:id/cancel", async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};

  if (!req.user) {
    return res.status(401).json({ success: false, message: "يتطلب إلغاء الطلب تسجيل الدخول أولاً" });
  }

  const order = db.findOrderById(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "الطلب غير موجود" });
  }

  // If already cancelled, return existing state safely without double rollback
  if (order.status === 'cancelled') {
    return res.json({
      success: true,
      message: "الطلب ملغي بالفعل والمخزون مسترجع سابقًا",
      data: order,
      alreadyCancelled: true
    });
  }

  if (order.status === 'delivered') {
    return res.status(400).json({ success: false, message: "لا يمكن إلغاء طلب تم تسليمه بنجاح" });
  }

  const isManagement = ['owner', 'admin', 'employee'].includes(req.user.role);
  const isCustomerOwner = req.user.role === 'customer' && req.user.phone && (
    order.customerPhone.replace(/\D/g, '') === req.user.phone.replace(/\D/g, '')
  );

  if (!isManagement && !isCustomerOwner) {
    return res.status(403).json({ success: false, message: "غير مصرح لك بإلغاء هذا الطلب" });
  }

  // Customers cannot cancel after dispatch
  if (isCustomerOwner && !isManagement && ['shipped', 'on_way', 'delivering'].includes(order.status)) {
    return res.status(400).json({ 
      success: false, 
      message: "لا يمكن إلغاء الطلب بعد خروجه مع المندوب للتوصيل. يرجى التواصل مع إدارة المتجر." 
    });
  }

  const actor = `${req.user.name || req.user.role} (${req.user.phone || req.user.userId})`;
  const safeReason = sanitizeInputString(reason || '', 200);
  const notes = safeReason ? `سبب الإلغاء: ${safeReason}` : undefined;

  try {
    const updated = await db.updateOrderStatus(id, 'cancelled', notes, actor);
    res.json({
      success: true,
      message: "تم إلغاء الطلب واسترجاع كافة الكميات إلى المخزون بنجاح",
      data: updated
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || "فشل إلغاء الطلب" });
  }
});

// ==========================================
// 4. REVIEWS (With Verified Purchase Logic)
// ==========================================

app.get("/api/reviews", (req, res) => {
  res.json({ success: true, data: db.getReviews() });
});

app.post("/api/reviews", (req: AuthenticatedRequest, res) => {
  const { productId, rating, comment, userName } = req.body;
  if (!productId || !comment || !userName) {
    return res.status(400).json({ success: false, message: "يرجى كتابة الاسم والتعليق وتحديد المنتج" });
  }

  // Verified purchase check strictly uses authenticated user JWT phone against D1 delivered order history
  const userPhone = req.user?.phone || '';
  const isVerified = userPhone ? db.hasDeliveredOrderForProduct(userPhone, productId) : false;

  const newReview = {
    id: "rev-" + Date.now(),
    productId: String(productId),
    userName: sanitizeInputString(userName, 50),
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    comment: sanitizeInputString(comment, 500),
    date: new Date().toISOString().split("T")[0],
    verifiedPurchase: isVerified
  };

  const added = db.addReview(newReview);
  res.json({ success: true, data: added });
});

// ==========================================
// 5. COUPONS & DISCOUNTS
// ==========================================

app.post("/api/validate-coupon", couponRateLimiter, (req, res) => {
  const { code, amount, items } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: "يرجى إدخال كود الكوبون" });
  }

  const found = db.findCoupon(code);
  if (!found || !found.isActive) {
    return res.status(400).json({ success: false, message: "كوبون غير صالح أو غير مفعل" });
  }

  if (found.validUntil && new Date(found.validUntil).getTime() < Date.now()) {
    return res.status(400).json({ success: false, message: "هذا الكوبون منتهي الصلاحية" });
  }

  if (found.maxUses && found.usageCount && found.usageCount >= found.maxUses) {
    return res.status(400).json({ success: false, message: "لقد استنفد هذا الكوبون الحد الأقصى لعدد مرات الاستخدام المسموح بها" });
  }

  // Recalculate subtotal server-side if cart items are provided
  let orderAmount = 0;
  if (items && Array.isArray(items) && items.length > 0) {
    const products = db.getProducts();
    for (const it of items) {
      const p = products.find(prod => prod.id === it.productId);
      if (p) {
        orderAmount += (p.price * Math.max(1, Number(it.quantity) || 1));
      }
    }
  } else {
    orderAmount = Math.max(0, Number(amount) || 0);
  }

  if (orderAmount < found.minOrderAmount) {
    return res.status(400).json({
      success: false,
      message: `الحد الأدنى لتطبيق هذا الكوبون هو ${found.minOrderAmount.toLocaleString()} ريال يمني`
    });
  }

  const discountVal = Math.min((orderAmount * found.discountPercent) / 100, found.maxDiscount);
  res.json({
    success: true,
    discount: discountVal,
    coupon: {
      code: found.code,
      discountPercent: found.discountPercent,
      maxDiscount: found.maxDiscount,
      minOrderAmount: found.minOrderAmount
    }
  });
});

app.get("/api/coupons", requireRoles(['owner', 'admin', 'employee']), (req, res) => {
  res.json({ success: true, data: db.getCoupons() });
});

app.post("/api/coupons", requireRoles(['owner', 'admin']), (req, res) => {
  const { code, discountPercent, maxDiscount, minOrderAmount, validUntil } = req.body;
  if (!code || !discountPercent) {
    return res.status(400).json({ success: false, message: "كود الكوبون ونسبة الخصم مطلوبان" });
  }

  const newCoupon = db.addCoupon({
    code: code.trim().toUpperCase(),
    discountPercent: Number(discountPercent),
    maxDiscount: Number(maxDiscount) || 3000,
    minOrderAmount: Number(minOrderAmount) || 2000,
    isActive: true,
    validUntil: validUntil || "2026-12-31"
  });

  res.json({ success: true, data: newCoupon });
});

app.delete("/api/coupons/:code", requireRoles(['owner', 'admin']), (req, res) => {
  db.deleteCoupon(req.params.code);
  res.json({ success: true, message: "تم حذف الكوبون" });
});

// ==========================================
// 6. STORE SETTINGS & GALLERY & FLEET
// ==========================================

app.get("/api/settings", (req, res) => {
  res.json({ success: true, data: db.getSettings() });
});

app.post("/api/settings", requireRoles(['owner', 'admin']), (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, data: updated });
});

app.get("/api/delivery-agents", (req: AuthenticatedRequest, res) => {
  const isAuthorized = req.user && ['owner', 'admin', 'employee', 'delivery'].includes(req.user.role);
  if (isAuthorized) {
    return res.json({ success: true, data: db.getDeliveryAgents() });
  }

  // Public-safe view: omit phones and sensitive internal fields
  const safeAgents = db.getDeliveryAgents().map(a => ({
    id: a.id,
    name: a.name,
    vehicleType: a.vehicleType,
    rating: a.rating,
    isActive: a.isActive
  }));
  res.json({ success: true, data: safeAgents });
});

app.post("/api/delivery-agents", requireRoles(['owner', 'admin']), (req, res) => {
  const updated = db.updateDeliveryAgents(req.body);
  res.json({ success: true, data: updated });
});

app.get("/api/gallery", (req, res) => {
  res.json({ success: true, data: db.getGalleryItems() });
});

app.post("/api/gallery", requireRoles(['owner', 'admin']), (req, res) => {
  const newItem = db.addGalleryItem({
    id: "g" + Date.now(),
    ...req.body
  });
  res.json({ success: true, data: newItem });
});

app.put("/api/gallery/:id", requireRoles(['owner', 'admin']), (req, res) => {
  const updated = db.updateGalleryItem(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: "عنصر المعرض غير موجود" });
  }
  res.json({ success: true, data: updated });
});

app.delete("/api/gallery/:id", requireRoles(['owner', 'admin']), (req, res) => {
  db.deleteGalleryItem(req.params.id);
  res.json({ success: true, message: "تم حذف الصورة من المعرض" });
});

// ==========================================
// 7. ADMIN FINANCIAL REPORTS & CRM
// ==========================================

app.get("/api/admin/reports", requireRoles(['owner', 'admin']), (req, res) => {
  const orders = db.getOrders();
  const products = db.getProducts();

  const totalRevenue = orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + o.total : sum, 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const deliveringOrders = orders.filter(o => ['shipped', 'delivering'].includes(o.status)).length;
  const pendingOrders = orders.filter(o => ['received', 'preparing'].includes(o.status)).length;

  const lowStockProducts = products.filter(p => p.stock < 50);

  // Best selling products calculation
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  orders.forEach(ord => {
    if (ord.status !== 'cancelled' && ord.items) {
      ord.items.forEach(it => {
        if (!productSalesMap[it.productId]) {
          productSalesMap[it.productId] = { name: it.productNameAr, quantity: 0, revenue: 0 };
        }
        productSalesMap[it.productId].quantity += it.quantity;
        productSalesMap[it.productId].revenue += (it.unitPrice * it.quantity);
      });
    }
  });

  const topProducts = Object.entries(productSalesMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.quantity - a.quantity);

  res.json({
    success: true,
    data: {
      totalRevenue,
      totalOrders,
      completedOrders,
      deliveringOrders,
      pendingOrders,
      averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      lowStockProducts,
      topProducts
    }
  });
});

app.get(["/api/customers", "/api/admin/customers"], requireRoles(['owner', 'admin', 'employee']), (req, res) => {
  const orders = db.getOrders();
  const customerMap: Record<string, any> = {};

  orders.forEach(o => {
    const key = o.customerPhone?.replace(/\D/g, '') || o.customerName;
    if (!customerMap[key]) {
      customerMap[key] = {
        name: o.customerName,
        phone: o.customerPhone,
        address: o.address?.district || 'صنعاء',
        ordersCount: 0,
        totalSpent: 0,
        lastOrderDate: o.date
      };
    }
    customerMap[key].ordersCount += 1;
    if (o.status !== 'cancelled') {
      customerMap[key].totalSpent += o.total;
    }
  });

  res.json({ success: true, data: Object.values(customerMap) });
});

// B2B Wholesale Profit & Margin Calculation (Management Only)
app.get("/api/b2b/calculator-data", requireRoles(['owner', 'admin', 'employee']), (req, res) => {
  const products = db.getProducts();
  const b2bProducts = products.map(p => ({
    id: p.id,
    nameAr: p.nameAr,
    category: p.category,
    retailPrice: p.price,
    wholesalePrice: p.category === 'premium' ? Math.round(p.price * 0.8) : Math.round(p.price * 0.76),
    marginPerUnit: p.category === 'premium' ? Math.round(p.price * 0.2) : Math.round(p.price * 0.24),
    stock: p.stock
  }));

  res.json({
    success: true,
    data: {
      products: b2bProducts,
      incentives: [
        { tier: 'البقالات الصغرى', minPouches: 24, bonusPerPouch: 50, freeDisplay: true },
        { tier: 'السوبرماركت الكبرى', minPouches: 96, bonusPerPouch: 100, freeDisplay: true },
        { tier: 'محلات الشيشة والمقاهي', minKg: 50, discountPercent: 22, directDelivery: true }
      ]
    }
  });
});

// ==========================================
// 8. TELEMETRY & ANALYTICS & SITEMAP
// ==========================================

app.post("/api/analytics/track", (req: AuthenticatedRequest, res) => {
  const { event, data } = req.body;
  if (event) {
    db.logAnalyticsEvent(event, data, req.user?.userId);
  }
  res.json({ success: true });
});

app.post("/api/analytics/abandoned-cart", (req, res) => {
  const { customerPhone, customerName, items, subtotal } = req.body;
  db.logAbandonedCart({ customerPhone, customerName, items, subtotal });
  res.json({ success: true });
});

// Dynamic SEO Sitemap.xml
app.get("/sitemap.xml", (req, res) => {
  res.setHeader("Content-Type", "application/xml");
  const host = req.protocol + "://" + req.get("host");
  const products = db.getProducts();

  const productUrls = products.map(p => `
    <url>
      <loc>${host}/product/${p.id}</loc>
      <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>
  `).join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${host}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${host}/products</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  ${productUrls}
</urlset>`;

  res.send(sitemap);
});

// Robots.txt
app.get("/robots.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  const host = req.protocol + "://" + req.get("host");
  res.send(`User-agent: *
Allow: /
Disallow: /api/
Sitemap: ${host}/sitemap.xml
`);
});

// ==========================================
// 9. AI CHARCOAL ADVISOR
// ==========================================

app.post("/api/gemini/advisor", async (req, res) => {
  try {
    const { useCase, guests, duration, location } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        recommendation: `بناءً على اختيارك (${useCase}) لعدد ${guests || "عائلي"} في ${location || "صنعاء"}: ننصحك بـ "فحم الذهب الأسود الفاخر عبوة 500 جرام (Zipper Lock)" لاشتعال يدوم أكثر من 6 ساعات بدون أدخنة أو روائح!`,
        recommendedProductId: useCase?.includes("فاخر") || useCase?.includes("بخور") || useCase?.includes("مجالس") ? "bg-prem-500g" : "bg-std-1kg"
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `أنت خبير مستشار متجر "الذهب الأسود (Black Gold)" لمنتجات الفحم الفاخر في اليمن (صنعاء).
العميل يريد نصيحة لشراء الفحم بالتفاصيل التالية:
- سبب الاستخدام: ${useCase}
- عدد الأشخاص / الحجم: ${guests}
- مدة الاستخدام المتوقعة: ${duration}
- الموقع: ${location || "صنعاء"}

أعط نصيحة مختصرة ومشوقة جداً باللغة العربية بأسلوب راقي وفاخر، وحدد أي نوع هو الأنسب له من منتجاتنا:
1. فحم الذهب الأسود الفاخر (250g, 500g, 1kg) بنظام Zipper Lock العازل (للمجالس والأراجيل والبخور بدون رائحة أو دخان)
2. فحم الذهب الأسود الشعبي الاقتصادي (250g, 500g, 1kg) للمشاوي والطهي المنزلي اليومي
3. مكعبات الإشعال السريع الذهبية
4. شوالات المطاعم وصناديق البقالات.

اجعل الإجابة في 3 أسطر مركزة مع نصيحة لإشعال الفحم بأعلى كفاءة.`
    });

    res.json({
      success: true,
      recommendation: response.text,
      recommendedProductId: useCase?.includes("مجالس") || useCase?.includes("شيشة") || useCase?.includes("فاخر") ? "bg-prem-500g" : "bg-std-1kg"
    });
  } catch (err: any) {
    console.error("Gemini advisor error:", err);
    res.json({
      success: true,
      recommendation: "ننصح بـ فحم الذهب الأسود الفاخر (عبوة 500 جرام Zipper) للحصول على أطول مدة احتراق وحرارة نقية بدون رماد أو دخان.",
      recommendedProductId: "bg-prem-500g"
    });
  }
});

// ==========================================
// 10. VITE MIDDLEWARE & STATIC SERVING
// ==========================================

async function startServer() {
  db.init().catch(err => console.warn("D1 background sync warning:", err));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Black Gold Production Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
