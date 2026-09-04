-- =================================================================
-- متجر فحم الذهب الأسود - صنعاء (BLACK GOLD CHARCOAL STORE)
-- CLOUDFLARE D1 DATABASE SCHEMA
-- Database ID: Configured via CLOUDFLARE_DATABASE_ID
-- Engine: Cloudflare Serverless D1 (SQLite Dialect)
-- =================================================================

PRAGMA foreign_keys = ON;

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    slug TEXT UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category_id TEXT,
    category TEXT NOT NULL CHECK (category IN ('pouches', 'wholesale', 'b2b', 'local', 'premium', 'bbq', 'incense')),
    price REAL NOT NULL,
    original_price REAL,
    discount_percent INTEGER DEFAULT 0,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    origin TEXT DEFAULT 'الذهب الأسود - صنعاء',
    burn_duration_hours TEXT DEFAULT '6+ ساعات متواصلة',
    ash_percentage TEXT DEFAULT 'أقل من 1.5% رماد أبيض',
    moisture TEXT DEFAULT '< 2%',
    rating REAL DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    images TEXT NOT NULL DEFAULT '[]', -- JSON array of image URLs
    specs TEXT NOT NULL DEFAULT '[]',  -- JSON array of specifications
    weight_options TEXT NOT NULL DEFAULT '[]', -- JSON array of { weight, price }
    is_featured INTEGER DEFAULT 1,
    is_best_seller INTEGER DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 100,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 3. USERS TABLE (Owners, Admins, Employees, Drivers, Registered Customers)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'employee', 'delivery', 'mandoub', 'customer')),
    pin_hash TEXT,
    password_hash TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT
);

-- 4. CUSTOMERS TABLE (Customer CRM, loyalty, total spend, address directory)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    district TEXT,
    street TEXT,
    landmark TEXT,
    notes TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent REAL DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_district TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    location_lat REAL,
    location_lng REAL,
    items_json TEXT NOT NULL DEFAULT '[]', -- Snapshot of ordered items
    subtotal REAL NOT NULL,
    shipping_fee REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'confirmed', 'failed', 'refunded')),
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'pending', 'preparing', 'shipped', 'delivering', 'on_way', 'delivered', 'completed', 'cancelled')),
    is_stock_rolled_back INTEGER DEFAULT 0,
    coupon_code TEXT,
    driver_id TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    notes TEXT DEFAULT '',
    driver_notes TEXT DEFAULT '',
    timeline_json TEXT NOT NULL DEFAULT '[]',
    completed_at TEXT,
    cancelled_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- 6. ORDER_ITEMS TABLE (Independent relational item rows per order)
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name_ar TEXT NOT NULL,
    product_name_en TEXT,
    weight_option TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- 7. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS inventory (
    product_id TEXT PRIMARY KEY,
    current_stock INTEGER NOT NULL DEFAULT 0,
    reserved_stock INTEGER NOT NULL DEFAULT 0,
    min_threshold INTEGER NOT NULL DEFAULT 10,
    last_counted_at TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 8. INVENTORY_LOGS TABLE (Full audit trail / transactions ledger)
CREATE TABLE IF NOT EXISTS inventory_logs (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('initial', 'purchase', 'sale', 'adjustment', 'damage', 'return', 'STOCK_ROLLBACK')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT NOT NULL,
    order_id TEXT,
    performed_by TEXT NOT NULL DEFAULT 'system',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- 9. DELIVERY_AGENTS TABLE
CREATE TABLE IF NOT EXISTS delivery_agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    vehicle_type TEXT DEFAULT 'دراجة نارية',
    is_active INTEGER DEFAULT 1,
    active_orders_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 5.0,
    total_deliveries INTEGER DEFAULT 0,
    current_lat REAL,
    current_lng REAL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 10. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    is_verified INTEGER DEFAULT 0,
    is_published INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 11. COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
    code TEXT PRIMARY KEY,
    discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    max_discount REAL NOT NULL DEFAULT 0,
    min_order_amount REAL NOT NULL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    valid_until TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 12. GALLERY_ITEMS TABLE
CREATE TABLE IF NOT EXISTS gallery_items (
    id TEXT PRIMARY KEY,
    title_ar TEXT NOT NULL,
    title_en TEXT,
    image_url TEXT NOT NULL,
    category TEXT DEFAULT 'factory' CHECK (category IN ('factory', 'fleet', 'sessions', 'retail', 'merch', 'general')),
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 13. STORE_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default_settings',
    store_name_ar TEXT NOT NULL,
    store_name_en TEXT,
    slogan_ar TEXT,
    logo_text TEXT,
    custom_logo_url TEXT,
    top_banner_notice_ar TEXT,
    top_banner_notice_en TEXT,
    whatsapp_phone TEXT NOT NULL,
    call_phone TEXT NOT NULL,
    contact_email TEXT,
    free_delivery_threshold REAL DEFAULT 8000,
    is_store_open INTEGER DEFAULT 1,
    default_coupon_code TEXT DEFAULT 'GOLD2026',
    delivery_districts TEXT NOT NULL DEFAULT '[]', -- JSON array of districts & fees
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 14. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    amount REAL NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('cash', 'cod', 'kuraimi', 'haseb', 'jawali', 'floosak', 'other')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'failed', 'refunded')),
    reference_number TEXT,
    proof_image_url TEXT,
    notes TEXT,
    confirmed_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 15. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    recipient_role TEXT DEFAULT 'all', -- 'all', 'admin', 'delivery', 'customer'
    recipient_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'order', 'stock', 'alert', 'system'
    is_read INTEGER DEFAULT 0,
    link TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- =================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_is_rolled_back ON orders(is_stock_rolled_back);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_role, recipient_id);

-- =================================================================
-- TRIGGERS FOR ATOMIC INVENTORY CONSISTENCY
-- =================================================================

CREATE TRIGGER IF NOT EXISTS prevent_negative_stock
BEFORE UPDATE ON products
FOR EACH ROW
WHEN NEW.stock < 0
BEGIN
    SELECT RAISE(ABORT, 'Insufficient stock: product stock cannot be negative');
END;
