/**
 * Cloudflare Worker Native Atomic Order & Transaction Handler
 * 
 * Provides official D1 native batch execution (`env.DB.batch([ ... ])`)
 * which executes all statements within a single atomic SQLite transaction
 * in the native Cloudflare Workers V8 runtime.
 * 
 * Used when deployed to Cloudflare Workers / Cloudflare Pages to ensure
 * true native ACID atomicity.
 */

export interface Env {
  DB: D1Database;
  AUTH_SECRET?: string;
}

export interface AtomicOrderItem {
  productId: string;
  productNameAr: string;
  productNameEn?: string;
  weight: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: { district: string; street?: string; landmark?: string };
  validatedItems: AtomicOrderItem[];
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
}

export interface RollbackOrderPayload {
  orderId: string;
  actor: string;
  reason?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/worker/health' && request.method === 'GET') {
      return Response.json({ success: true, engine: 'Cloudflare D1 Native Worker Engine' });
    }

    // Atomic Create Order Endpoint
    if (url.pathname === '/worker/orders/create-atomic' && request.method === 'POST') {
      try {
        const payload: CreateOrderPayload = await request.json();
        const result = await handleCreateOrderAtomic(env.DB, payload);
        return Response.json(result, { status: result.success ? 200 : 400 });
      } catch (err: any) {
        return Response.json({ success: false, message: err.message || 'Worker atomic transaction error' }, { status: 500 });
      }
    }

    // Atomic Rollback Order Endpoint
    if (url.pathname === '/worker/orders/rollback-atomic' && request.method === 'POST') {
      try {
        const payload: RollbackOrderPayload = await request.json();
        const result = await handleRollbackOrderAtomic(env.DB, payload);
        return Response.json(result, { status: result.success ? 200 : 400 });
      } catch (err: any) {
        return Response.json({ success: false, message: err.message || 'Worker atomic rollback error' }, { status: 500 });
      }
    }

    return Response.json({ success: false, message: 'Not Found' }, { status: 404 });
  }
};

/**
 * Executes order creation inside a native D1 batch transaction
 */
async function handleCreateOrderAtomic(db: D1Database, data: CreateOrderPayload) {
  // 1. Check idempotency
  if (data.idempotencyKey) {
    const existing = await db.prepare("SELECT * FROM orders WHERE idempotency_key = ? LIMIT 1;")
      .bind(data.idempotencyKey)
      .first();

    if (existing) {
      return {
        success: true,
        isDuplicate: true,
        order: existing,
        message: 'طلب مكرر تم إنشاؤه مسبقاً'
      };
    }
  }

  // 2. Prepare atomic batch statements
  const statements: D1PreparedStatement[] = [];

  // Stock decrement enforced by prevent_negative_stock trigger & CHECK(stock >= 0)
  for (const it of data.validatedItems) {
    statements.push(
      db.prepare("UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ?;")
        .bind(it.quantity, it.productId)
    );
    statements.push(
      db.prepare("UPDATE inventory SET current_stock = current_stock - ?, updated_at = datetime('now') WHERE product_id = ?;")
        .bind(it.quantity, it.productId)
    );
  }

  // Upsert customer
  const cleanPhone = data.customerPhone.replace(/\D/g, '');
  const customerId = `cust-${cleanPhone}`;
  statements.push(
    db.prepare(`
      INSERT INTO customers (id, name, phone, district, street, notes, total_orders, total_spent, loyalty_points, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(phone) DO UPDATE SET
        name = excluded.name,
        district = excluded.district,
        total_orders = customers.total_orders + 1,
        total_spent = customers.total_spent + excluded.total_spent,
        loyalty_points = customers.loyalty_points + excluded.loyalty_points,
        updated_at = datetime('now');
    `).bind(
      customerId,
      data.customerName,
      cleanPhone,
      data.address.district,
      data.address.street || '',
      data.notes || '',
      data.total,
      Math.floor(data.total / 100)
    )
  );

  // Insert order
  statements.push(
    db.prepare(`
      INSERT INTO orders (
        id, order_number, customer_id, customer_name, customer_phone, delivery_district,
        delivery_address, items_json, subtotal, shipping_fee, discount, total,
        payment_method, payment_status, status, is_stock_rolled_back, idempotency_key,
        coupon_code, driver_id, driver_name, driver_phone, notes, driver_notes,
        timeline_json, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'received', 0, ?, ?, ?, ?, ?, ?, '', ?, datetime('now'), datetime('now')
      );
    `).bind(
      data.orderId,
      data.orderNumber,
      customerId,
      data.customerName,
      cleanPhone,
      data.address.district,
      data.address.street || data.address.district,
      JSON.stringify(data.validatedItems),
      data.subtotal,
      data.shippingFee,
      data.discount,
      data.total,
      data.paymentMethod || 'cash',
      data.idempotencyKey || null,
      data.couponCode || null,
      data.assignedDriver.id,
      data.assignedDriver.name,
      data.assignedDriver.phone,
      data.notes || '',
      JSON.stringify(data.timeline)
    )
  );

  // Insert order items
  for (const it of data.validatedItems) {
    const itemId = `oi-${data.orderId}-${it.productId}-${Math.random().toString(36).substring(2, 7)}`;
    statements.push(
      db.prepare(`
        INSERT INTO order_items (id, order_id, product_id, productId, product_name_ar, product_name_en, weight_option, quantity, unit_price, total_price, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));
      `).bind(
        itemId,
        data.orderId,
        it.productId,
        it.productId,
        it.productNameAr,
        it.productNameEn || '',
        it.weight,
        it.quantity,
        it.unitPrice,
        it.unitPrice * it.quantity
      )
    );
  }

  // Insert inventory logs
  for (const it of data.validatedItems) {
    const logId = `tx-sale-${Date.now()}-${it.productId}-${Math.random().toString(36).substring(2, 6)}`;
    statements.push(
      db.prepare(`
        INSERT INTO inventory_logs (id, product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id, performed_by, created_at)
        VALUES (?, ?, ?, 'sale', ?, 0, 0, ?, ?, 'نظام الطلبات الذري', datetime('now'));
      `).bind(
        logId,
        it.productId,
        it.productNameAr,
        -it.quantity,
        `مبيعات طلب جديد #${data.orderNumber}`,
        data.orderId
      )
    );
  }

  // Update coupon usage if provided
  if (data.couponCode) {
    statements.push(
      db.prepare("UPDATE coupons SET usage_count = usage_count + 1 WHERE code = ?;")
        .bind(data.couponCode)
    );
  }

  // 3. Execute all statements in native D1 batch transaction:
  // Triggers and CHECK constraints guarantee complete atomic rollback if stock or coupon limits are violated
  await db.batch(statements);

  // 4. Read-after-write from D1
  const createdOrder = await db.prepare("SELECT * FROM orders WHERE id = ? LIMIT 1;").bind(data.orderId).first();

  return {
    success: true,
    order: createdOrder,
    message: 'تم إنشاء الطلب بنجاح عبر D1 Batch Transaction'
  };
}

/**
 * Executes order rollback inside a native D1 batch transaction
 */
async function handleRollbackOrderAtomic(db: D1Database, payload: RollbackOrderPayload) {
  // Check if order exists and not already rolled back
  const order: any = await db.prepare("SELECT * FROM orders WHERE id = ? LIMIT 1;").bind(payload.orderId).first();
  if (!order) {
    return { success: false, message: 'الطلب غير موجود' };
  }

  if (order.is_stock_rolled_back === 1) {
    return { success: true, alreadyCancelled: true, message: 'الطلب ملغي ومسترجع مسبقاً' };
  }

  const items: AtomicOrderItem[] = typeof order.items_json === 'string' ? JSON.parse(order.items_json || '[]') : (order.items_json || []);

  const statements: D1PreparedStatement[] = [];

  // Update order status with atomic conditional flag
  statements.push(
    db.prepare("UPDATE orders SET status = 'cancelled', is_stock_rolled_back = 1, cancelled_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND is_stock_rolled_back = 0;")
      .bind(payload.orderId)
  );

  // Restore product stock and create inventory logs
  for (const it of items) {
    statements.push(
      db.prepare("UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?;")
        .bind(it.quantity, it.productId)
    );

    const logId = `tx-rollback-${Date.now()}-${it.productId}-${Math.random().toString(36).substring(2, 6)}`;
    statements.push(
      db.prepare(`
        INSERT INTO inventory_logs (id, product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id, performed_by, created_at)
        VALUES (?, ?, ?, 'STOCK_ROLLBACK', ?, 0, 0, ?, ?, ?, datetime('now'));
      `).bind(
        logId,
        it.productId,
        it.productNameAr,
        it.quantity,
        `استرجاع مخزون لإلغاء الطلب #${order.order_number || order.id}`,
        payload.orderId,
        payload.actor || 'نظام إدارة الطلبات'
      )
    );
  }

  // Notification
  const notifId = `notif-cancel-${Date.now()}`;
  statements.push(
    db.prepare(`
      INSERT INTO notifications (id, recipient_role, title, message, type, is_read, link, created_at)
      VALUES (?, 'admin', 'استرجاع مخزون - إلغاء طلب', ?, 'stock', 0, ?, datetime('now'));
    `).bind(
      notifId,
      `تم إلغاء الطلب #${order.order_number || order.id} وإعادة الكميات تلقائيًا للمخزون`,
      `/admin/orders/${order.id}`
    )
  );

  await db.batch(statements);

  // Read-after-write from D1
  const updatedOrder = await db.prepare("SELECT * FROM orders WHERE id = ? LIMIT 1;").bind(payload.orderId).first();

  return {
    success: true,
    order: updatedOrder,
    message: 'تم إلغاء الطلب واسترجاع المخزون ذرياً'
  };
}
