/**
 * Cloudflare Pages Functions Native D1 Atomic Handler
 * Route: /api/orders/atomic
 */

export interface PagesEnv {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<PagesEnv> = async (context) => {
  try {
    const { request, env } = context;
    const body: any = await request.json();

    if (body.action === 'create_order') {
      const { orderId, orderNumber, customerName, customerPhone, address, validatedItems, subtotal, shippingFee, discount, total, paymentMethod, idempotencyKey, couponCode, assignedDriver, timeline } = body;

      // 1. Idempotency
      if (idempotencyKey) {
        const existing = await env.DB.prepare("SELECT * FROM orders WHERE idempotency_key = ? LIMIT 1;")
          .bind(idempotencyKey)
          .first();
        if (existing) {
          return Response.json({ success: true, isDuplicate: true, data: existing });
        }
      }

      // 2. Prepare atomic batch statements
      const stmts: D1PreparedStatement[] = [];

      for (const it of validatedItems) {
        stmts.push(
          env.DB.prepare("UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ? AND stock >= ?;")
            .bind(it.quantity, it.productId, it.quantity)
        );
      }

      // Customer upsert
      const cleanPhone = customerPhone.replace(/\D/g, '');
      stmts.push(
        env.DB.prepare(`
          INSERT INTO customers (id, name, phone, district, street, notes, total_orders, total_spent, loyalty_points, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, '', 1, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(phone) DO UPDATE SET
            name = excluded.name,
            total_orders = customers.total_orders + 1,
            total_spent = customers.total_spent + excluded.total_spent,
            updated_at = datetime('now');
        `).bind(`cust-${cleanPhone}`, customerName, cleanPhone, address.district, address.street || '', total, Math.floor(total / 100))
      );

      // Order insert
      stmts.push(
        env.DB.prepare(`
          INSERT INTO orders (
            id, order_number, customer_id, customer_name, customer_phone, delivery_district,
            delivery_address, items_json, subtotal, shipping_fee, discount, total,
            payment_method, payment_status, status, is_stock_rolled_back, idempotency_key,
            coupon_code, driver_id, driver_name, driver_phone, notes, driver_notes,
            timeline_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'received', 0, ?, ?, ?, ?, ?, '', '', ?, datetime('now'), datetime('now'));
        `).bind(
          orderId, orderNumber, `cust-${cleanPhone}`, customerName, cleanPhone, address.district,
          address.street || address.district, JSON.stringify(validatedItems), subtotal, shippingFee,
          discount, total, paymentMethod || 'cash', idempotencyKey || null, couponCode || null,
          assignedDriver.id, assignedDriver.name, assignedDriver.phone, JSON.stringify(timeline)
        )
      );

      for (const it of validatedItems) {
        stmts.push(
          env.DB.prepare(`
            INSERT INTO order_items (id, order_id, product_id, productId, product_name_ar, weight_option, quantity, unit_price, total_price, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));
          `).bind(`oi-${orderId}-${it.productId}`, orderId, it.productId, it.productId, it.productNameAr, it.weight, it.quantity, it.unitPrice, it.unitPrice * it.quantity)
        );
      }

      if (couponCode) {
        stmts.push(
          env.DB.prepare("UPDATE coupons SET usage_count = usage_count + 1 WHERE code = ?;")
            .bind(couponCode)
        );
      }

      const batchResults = await env.DB.batch(stmts);

      for (let i = 0; i < validatedItems.length; i++) {
        if (!batchResults[i]?.meta?.changes) {
          return Response.json({ success: false, message: `الكمية غير متوفرة: ${validatedItems[i].productNameAr}` }, { status: 400 });
        }
      }

      // Read after write
      const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ? LIMIT 1;").bind(orderId).first();
      return Response.json({ success: true, data: order });
    }

    return Response.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
};
