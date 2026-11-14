import assert from 'assert';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { DatabaseSync } from 'node:sqlite';

// Strictly configure isolated synthetic credentials BEFORE importing d1, security, or server
const ISOLATED_TEST_DB_ID = '00000000-0000-4000-8000-000000000099';
const ISOLATED_TEST_ACCOUNT_ID = 'isolated-release-test-account';
const ISOLATED_TEST_TOKEN = 'isolated-release-test-token';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'release-hardening-isolated-jwt-secret-2026';
process.env.ADMIN_PIN = '987654';
process.env.CI_TEST_CLOUDFLARE_ACCOUNT_ID = ISOLATED_TEST_ACCOUNT_ID;
process.env.CI_TEST_CLOUDFLARE_DATABASE_ID = ISOLATED_TEST_DB_ID;
process.env.CI_TEST_CLOUDFLARE_API_TOKEN = ISOLATED_TEST_TOKEN;
process.env.CI_TESTS_ALLOW_MUTATION = 'true';
process.env.CLOUDFLARE_ACCOUNT_ID = ISOLATED_TEST_ACCOUNT_ID;
process.env.CLOUDFLARE_DATABASE_ID = ISOLATED_TEST_DB_ID;
process.env.CLOUDFLARE_API_TOKEN = ISOLATED_TEST_TOKEN;

function buildLocalSqliteEngine() {
  const sqlite = new DatabaseSync(':memory:');
  const schemaPath = path.join(process.cwd(), 'server', 'd1_schema.sql');
  const rawSchema = fs.readFileSync(schemaPath, 'utf-8');
  sqlite.exec(rawSchema);
  return sqlite;
}

function runStatement(sqlite: DatabaseSync, sql: string, params: any[] = []) {
  const trimmed = sql.trim();
  const stmt = sqlite.prepare(trimmed);
  const firstWord = trimmed.split(/\s+/)[0]?.toUpperCase() || '';
  if (firstWord === 'SELECT' || firstWord === 'PRAGMA' || firstWord === 'WITH') {
    const rows = stmt.all(...params);
    return { results: rows, success: true, meta: { changes: 0 } };
  }
  const info = stmt.run(...params);
  return {
    results: [],
    success: true,
    meta: {
      changes: Number(info.changes ?? 0),
      last_row_id: Number(info.lastInsertRowid ?? 0),
    },
  };
}

function seedBaselineData(sqlite: DatabaseSync) {
  sqlite.exec(`
    INSERT INTO categories (id, name_ar, name_en, slug, sort_order, is_active)
    VALUES ('cat-pouches', 'العبوات الفاخرة', 'Premium Pouches', 'pouches', 1, 1);

    INSERT INTO products (id, name_ar, name_en, category_id, category, price, original_price, discount_percent, description_ar, description_en, images, specs, weight_options, is_featured, is_best_seller, stock)
    VALUES
      ('prod-1', 'فحم الذهب الأسود 250 جم', 'Black Gold 250g', 'cat-pouches', 'pouches', 600, 750, 20, 'وصف 1', 'Desc 1', '["/images/p1.jpg"]', '[]', '[{"weight":"250g (ربع كيلو)","price":600},{"weight":"500g (نصف كيلو)","price":1100},{"weight":"1kg (كيلو كامل)","price":2000}]', 1, 1, 25),
      ('prod-2', 'فحم الذهب الأسود 1 كجم', 'Black Gold 1kg', 'cat-pouches', 'pouches', 2800, 3000, 0, 'وصف 2', 'Desc 2', '["/images/p2.jpg"]', '[]', '[]', 1, 0, 5);

    INSERT INTO inventory (product_id, current_stock, reserved_stock, min_threshold)
    VALUES
      ('prod-1', 25, 0, 10),
      ('prod-2', 5, 0, 5);

    INSERT INTO delivery_agents (id, name, phone, vehicle_type, is_active, active_orders_count, rating, total_deliveries)
    VALUES
      ('da-1', 'سائق أ', '771111111', 'motorcycle', 1, 0, 4.9, 10),
      ('da-2', 'سائق ب', '772222222', 'car', 1, 0, 4.8, 5);

    INSERT INTO coupons (code, discount_percent, max_discount, min_order_amount, is_active, valid_until, usage_count, max_uses)
    VALUES ('GOLD2026', 10, 2000, 1000, 1, '2028-12-31', 0, 50);

    INSERT INTO store_settings (id, store_name_ar, store_name_en, slogan_ar, logo_text, whatsapp_phone, call_phone, contact_email, free_delivery_threshold, is_store_open, delivery_districts)
    VALUES ('default_settings', 'فحم الذهب الأسود', 'Black Gold', 'جودة عالية', 'الذهب الأسود', '967775000150', '967775000150', 'test@blackgold.ye', 15000, 1, '[{"id":"d1","nameAr":"حدة","fee":700}]');
  `);
}

async function runReleaseHardeningSuite() {
  const { d1 } = await import('../d1');
  const { generateToken } = await import('../security');
  const { enforceIsolatedTestEnvironment, KNOWN_PROD_D1_DATABASE_ID } = await import('./testGuard');
  const { app } = await import('../../server');

  const sqlite = buildLocalSqliteEngine();
  seedBaselineData(sqlite);

  (d1 as any).executeCloudflareD1Raw = async (sql: string, params: any[] = []) => {
    try {
      const res = runStatement(sqlite, sql, params);
      return { success: true, result: [res] };
    } catch (err: any) {
      return { success: false, errors: [{ code: 7500, message: err?.message || String(err) }] };
    }
  };

  (d1 as any).executeCloudflareD1BatchRaw = async (statements: Array<{ sql: string; params?: any[] }>) => {
    try {
      sqlite.exec('BEGIN IMMEDIATE;');
      const results: any[] = [];
      for (const s of statements) {
        results.push(runStatement(sqlite, s.sql, s.params || []));
      }
      sqlite.exec('COMMIT;');
      return { success: true, result: results };
    } catch (err: any) {
      try {
        sqlite.exec('ROLLBACK;');
      } catch {}
      return { success: false, errors: [{ code: 7500, message: err?.message || String(err) }] };
    }
  };

  await d1.syncFromCloudflareD1();
  (d1 as any).isInitialized = true;

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const ownerToken = generateToken({
    userId: 'usr-owner-release',
    role: 'owner',
    phone: '770000001',
    name: 'مالك الاختبار'
  });

  const driverAToken = generateToken({
    userId: 'da-1',
    role: 'delivery',
    phone: '771111111',
    name: 'سائق أ'
  });

  const driverBToken = generateToken({
    userId: 'da-2',
    role: 'delivery',
    phone: '772222222',
    name: 'سائق ب'
  });

  const customerOtherToken = generateToken({
    userId: 'cust-779998887',
    role: 'customer',
    phone: '779998887',
    name: 'عميل آخر'
  });

  let passed = 0;
  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      throw err;
    }
  }

  console.log('======================================================================');
  console.log('🛡️ BLACK GOLD FINAL RELEASE HARDENING – 16-SCENARIO ISOLATED TEST SUITE');
  console.log(`🎯 Local Isolated Express Server: ${baseUrl}`);
  console.log('======================================================================\n');

  let guestAOrderId = '';
  let guestAOrderNumber = '';
  let guestAToken = '';
  let guestBToken = '';

  try {
    // 1. Guest order creation -> guestToken, D1 stock decrement, inventory_logs, payments, notifications
    await test('1. Guest order creates guestToken, decrements stock, writes inventory_logs + pending payment + admin notification', async () => {
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-audit-test': 'local-audit',
          'x-idempotency-key': 'idem-guest-a-1'
        },
        body: JSON.stringify({
          customerName: 'ضيف أ',
          customerPhone: '773000111',
          district: 'حدة',
          address: { district: 'حدة', street: 'شارع الخمسين' },
          items: [{ productId: 'prod-1', quantity: 3, weight: '500g' }],
          paymentMethod: 'cash_on_delivery',
          couponCode: 'GOLD2026'
        })
      });
      const json = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.success, true);
      assert.ok(json.guestToken, 'Must issue guestToken');
      assert.strictEqual(json.data.subtotal, 3300, 'Must match 500g weightOption price 1100 * 3 = 3300');
      assert.strictEqual(json.data.shippingFee, 700, 'Must match hadda district fee 700');
      assert.strictEqual(json.data.discount, 330, 'Must apply 10% GOLD2026 discount on 3300');
      assert.strictEqual(json.data.total, 3670);

      guestAOrderId = json.data.id;
      guestAOrderNumber = json.data.orderNumber;
      guestAToken = json.guestToken;

      const prodRow = sqlite.prepare("SELECT stock FROM products WHERE id = 'prod-1'").get() as any;
      const invRow = sqlite.prepare("SELECT current_stock FROM inventory WHERE product_id = 'prod-1'").get() as any;
      assert.strictEqual(prodRow.stock, 22);
      assert.strictEqual(invRow.current_stock, 22);

      const invLog = sqlite.prepare("SELECT * FROM inventory_logs WHERE order_id = ?").get(guestAOrderId) as any;
      assert.ok(invLog, 'inventory_logs row must exist');
      assert.strictEqual(invLog.previous_stock, 25);
      assert.strictEqual(invLog.new_stock, 22);

      const payRow = sqlite.prepare("SELECT * FROM payments WHERE order_id = ?").get(guestAOrderId) as any;
      assert.ok(payRow, 'payments row must exist');
      assert.strictEqual(payRow.status, 'pending');
      assert.strictEqual(payRow.method, 'cod');
      assert.strictEqual(payRow.amount, 3670);

      const notifRow = sqlite.prepare("SELECT * FROM notifications WHERE id = ?").get(`notif-order-${guestAOrderId}`) as any;
      assert.ok(notifRow, 'admin notification row must be persisted in D1');
      assert.strictEqual(notifRow.recipient_role, 'admin');
    });

    // 2. Guest A vs Guest B isolation
    await test('2. Guest B cannot view or cancel Guest A order (403)', async () => {
      const resCreateB = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-audit-test': 'local-audit' },
        body: JSON.stringify({
          customerName: 'ضيف ب',
          customerPhone: '774000222',
          district: 'حدة',
          address: { district: 'حدة', street: 'شارع حدة' },
          items: [{ productId: 'prod-1', quantity: 1, weight: '250g' }],
          paymentMethod: 'cod'
        })
      });
      const jsonB = await resCreateB.json();
      assert.strictEqual(resCreateB.status, 200);
      guestBToken = jsonB.guestToken;

      const viewRes = await fetch(`${baseUrl}/api/orders/${guestAOrderId}`, {
        headers: { 'Authorization': `Bearer ${guestBToken}` }
      });
      assert.strictEqual(viewRes.status, 403, 'Guest B must receive 403 when accessing Guest A order');

      const cancelRes = await fetch(`${baseUrl}/api/orders/${guestAOrderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${guestBToken}` },
        body: JSON.stringify({ reason: 'محاولة تطفل' })
      });
      assert.strictEqual(cancelRes.status, 403, 'Guest B must receive 403 when cancelling Guest A order');

      const guestAMyOrders = await fetch(`${baseUrl}/api/my-orders`, {
        headers: { 'Authorization': `Bearer ${guestAToken}` }
      });
      const guestAMyJson = await guestAMyOrders.json();
      assert.strictEqual(guestAMyJson.data.length, 1);
      assert.strictEqual(guestAMyJson.data[0].id, guestAOrderId);
    });

    // 3. Phone-only access without JWT rejected (401)
    await test('3. Phone-only access to /api/my-orders and /api/orders without JWT is rejected (401)', async () => {
      const r1 = await fetch(`${baseUrl}/api/my-orders?phone=773000111`);
      assert.strictEqual(r1.status, 401);
      const r2 = await fetch(`${baseUrl}/api/orders?phone=773000111`);
      assert.strictEqual(r2.status, 401);
      const r3 = await fetch(`${baseUrl}/api/orders/${guestAOrderId}`);
      assert.strictEqual(r3.status, 401);
    });

    // 4. Driver A vs Driver B isolation
    await test('4. Driver B cannot view, update status, or confirm payment for Driver A order (403)', async () => {
      // Driver B requests their /api/orders -> must not see guestAOrderId (which is assigned to da-1)
      const listB = await fetch(`${baseUrl}/api/orders`, {
        headers: { 'Authorization': `Bearer ${driverBToken}` }
      });
      const listBJson = await listB.json();
      assert.strictEqual(listBJson.data.some((o: any) => o.id === guestAOrderId), false, 'Driver B must not list Driver A orders');

      const getB = await fetch(`${baseUrl}/api/orders/${guestAOrderId}`, {
        headers: { 'Authorization': `Bearer ${driverBToken}` }
      });
      assert.strictEqual(getB.status, 403);

      const patchB = await fetch(`${baseUrl}/api/orders/${guestAOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driverBToken}` },
        body: JSON.stringify({ status: 'shipped' })
      });
      assert.strictEqual(patchB.status, 403);

      const payB = await fetch(`${baseUrl}/api/orders/${guestAOrderId}/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driverBToken}` },
        body: JSON.stringify({ amount: 3670 })
      });
      assert.strictEqual(payB.status, 403);
    });

    // 5. Out-of-stock atomic rollback
    await test('5. Out-of-stock order rolls back cleanly (zero partial rows across orders, items, logs, payments, coupons, notifications)', async () => {
      const ordersBefore = Number((sqlite.prepare('SELECT COUNT(*) as c FROM orders').get() as any).c);
      const itemsBefore = Number((sqlite.prepare('SELECT COUNT(*) as c FROM order_items').get() as any).c);
      const logsBefore = Number((sqlite.prepare('SELECT COUNT(*) as c FROM inventory_logs').get() as any).c);
      const payBefore = Number((sqlite.prepare('SELECT COUNT(*) as c FROM payments').get() as any).c);
      const notifBefore = Number((sqlite.prepare('SELECT COUNT(*) as c FROM notifications').get() as any).c);
      const cpBefore = Number((sqlite.prepare("SELECT usage_count FROM coupons WHERE code = 'GOLD2026'").get() as any).usage_count);

      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-audit-test': 'local-audit' },
        body: JSON.stringify({
          customerName: 'عميل نفاد مخزون',
          customerPhone: '775556667',
          district: 'حدة',
          address: { district: 'حدة', street: 'شارع الزبيري' },
          items: [
            { productId: 'prod-1', quantity: 2, weight: '250g' },
            { productId: 'prod-2', quantity: 999 } // exceeding prod-2 stock (5)
          ],
          paymentMethod: 'cod',
          couponCode: 'GOLD2026'
        })
      });
      assert.strictEqual(res.status, 400);

      assert.strictEqual(Number((sqlite.prepare('SELECT COUNT(*) as c FROM orders').get() as any).c), ordersBefore);
      assert.strictEqual(Number((sqlite.prepare('SELECT COUNT(*) as c FROM order_items').get() as any).c), itemsBefore);
      assert.strictEqual(Number((sqlite.prepare('SELECT COUNT(*) as c FROM inventory_logs').get() as any).c), logsBefore);
      assert.strictEqual(Number((sqlite.prepare('SELECT COUNT(*) as c FROM payments').get() as any).c), payBefore);
      assert.strictEqual(Number((sqlite.prepare('SELECT COUNT(*) as c FROM notifications').get() as any).c), notifBefore);
      assert.strictEqual(Number((sqlite.prepare("SELECT usage_count FROM coupons WHERE code = 'GOLD2026'").get() as any).usage_count), cpBefore);
      assert.strictEqual(Number((sqlite.prepare("SELECT stock FROM products WHERE id = 'prod-1'").get() as any).stock), 21);
    });

    // 6. Idempotency replay vs cross-user IDOR rejection
    await test('6. Same-caller idempotencyKey replays without duplicate deductions; cross-user reuse returns 409 without guestToken', async () => {
      const replayRes = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${guestAToken}`,
          'x-idempotency-key': 'idem-guest-a-1',
          'x-audit-test': 'local-audit'
        },
        body: JSON.stringify({
          customerName: 'ضيف أ',
          customerPhone: '773000111',
          district: 'حدة',
          address: { district: 'حدة', street: 'شارع الخمسين' },
          items: [{ productId: 'prod-1', quantity: 3, weight: '500g' }],
          paymentMethod: 'cash_on_delivery'
        })
      });
      const replayJson = await replayRes.json();
      assert.strictEqual(replayRes.status, 200);
      assert.strictEqual(replayJson.isDuplicate, true);
      assert.strictEqual(replayJson.data.id, guestAOrderId);
      assert.strictEqual(Number((sqlite.prepare("SELECT stock FROM products WHERE id = 'prod-1'").get() as any).stock), 21, 'Replay must not re-deduct stock');

      // Cross-user reuse of Guest A's idempotency key by another user!
      const idorRes = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerOtherToken}`,
          'x-idempotency-key': 'idem-guest-a-1',
          'x-audit-test': 'local-audit'
        },
        body: JSON.stringify({
          customerName: 'مهاجم',
          customerPhone: '779998887',
          district: 'حدة',
          address: { district: 'حدة', street: 'شارع الستين' },
          items: [{ productId: 'prod-1', quantity: 1, weight: '250g' }],
          paymentMethod: 'cod'
        })
      });
      const idorJson = await idorRes.json();
      assert.strictEqual(idorRes.status, 409, 'Cross-user idempotency key reuse MUST return 409');
      assert.strictEqual(idorJson.guestToken, undefined, 'Must NEVER leak guestToken on cross-user idempotency conflict');
      assert.strictEqual(idorJson.data, undefined, 'Must NEVER leak victim order data on cross-user idempotency conflict');
    });

    // 7. Unauthorized access to Admin/Products/Settings/Coupons/Inventory/Payments/Notifications
    await test('7. Unauthorized/customer access to management endpoints returns 401/403', async () => {
      const checks: Array<[string, string, number[]]> = [
        ['GET', '/api/admin/reports', [401, 403]],
        ['POST', '/api/products', [401, 403]],
        ['PUT', '/api/settings', [401, 403]],
        ['GET', '/api/coupons', [401, 403]],
        ['POST', '/api/inventory/adjust', [401, 403]],
        ['GET', '/api/payments', [401, 403]],
        ['GET', '/api/notifications', [401]],
      ];
      for (const [method, endpoint] of checks) {
        const unauthRes = await fetch(`${baseUrl}${endpoint}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: method === 'GET' ? undefined : JSON.stringify({})
        });
        assert.strictEqual(unauthRes.status, 401, `Unauth ${method} ${endpoint} expected 401, got ${unauthRes.status}`);

        if (endpoint !== '/api/notifications') {
          const custRes = await fetch(`${baseUrl}${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customerOtherToken}` },
            body: method === 'GET' ? undefined : JSON.stringify({})
          });
          assert.strictEqual(custRes.status, 403, `Customer ${method} ${endpoint} expected 403, got ${custRes.status}`);
        }
      }
    });

    // 8. Price, shipping, discount tampering ignored
    await test('8. Client-submitted price, shippingFee, discount, and total tampering are ignored', async () => {
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-audit-test': 'local-audit' },
        body: JSON.stringify({
          customerName: 'محاولة تلاعب أسعار',
          customerPhone: '776111222',
          district: 'حدة',
          address: { district: 'حدة', street: 'شارع بغداد' },
          items: [{ productId: 'prod-1', quantity: 2, weight: '500g', unitPrice: 1, price: 1 }],
          subtotal: 2,
          shippingFee: 0,
          discount: 50000,
          total: 1,
          paymentMethod: 'cod'
        })
      });
      const json = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.data.subtotal, 2200, 'Server must recalculate 2 * 1100 = 2200');
      assert.strictEqual(json.data.shippingFee, 700, 'Server must apply authoritative hadda shipping 700');
      assert.strictEqual(json.data.discount, 0, 'Fake discount without valid coupon must be 0');
      assert.strictEqual(json.data.total, 2900, 'Server total must be 2200 + 700 = 2900');
    });

    // 9. Manual adjustment optimistic concurrency conflict returns 409 & keeps products/inventory synchronized
    await test('9. Manual inventory adjustment detects concurrent stock edit (409) & succeeds cleanly otherwise', async () => {
      const origFind = d1.findProductByIdAsync.bind(d1);
      let reads = 0;
      (d1 as any).findProductByIdAsync = async (id: string) => {
        const res = await origFind(id);
        reads++;
        if (reads === 1 && res && id === 'prod-2') {
          setTimeout(() => {
            sqlite.prepare("UPDATE products SET stock = 4 WHERE id = 'prod-2'").run();
            sqlite.prepare("UPDATE inventory SET current_stock = 4 WHERE product_id = 'prod-2'").run();
          }, 0);
        }
        return res;
      };
      const origAdjust = d1.adjustProductStock.bind(d1);
      (d1 as any).adjustProductStock = async (p: any) => {
        await new Promise((r) => setTimeout(r, 15));
        return origAdjust(p);
      };

      try {
        const conflictRes = await fetch(`${baseUrl}/api/inventory/adjust`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
          body: JSON.stringify({ productId: 'prod-2', type: 'adjustment', quantity: 10, reason: 'جرد متزامن' })
        });
        assert.strictEqual(conflictRes.status, 409);
      } finally {
        (d1 as any).findProductByIdAsync = origFind;
        (d1 as any).adjustProductStock = origAdjust;
      }

      const okRes = await fetch(`${baseUrl}/api/inventory/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
        body: JSON.stringify({ productId: 'prod-2', type: 'adjustment', quantity: 12, reason: 'جرد سليم' })
      });
      assert.strictEqual(okRes.status, 200);
      const p2 = sqlite.prepare("SELECT stock FROM products WHERE id = 'prod-2'").get() as any;
      const i2 = sqlite.prepare("SELECT current_stock FROM inventory WHERE product_id = 'prod-2'").get() as any;
      assert.strictEqual(p2.stock, 12);
      assert.strictEqual(i2.current_stock, 12);
    });

    // 10. Concurrent order cancellations -> rollback once, coupon decremented once, pending payment marked failed, cancel notif created once
    await test('10. Concurrent order cancellations execute rollback ONCE and mark pending payment failed', async () => {
      const stockBefore = Number((sqlite.prepare("SELECT stock FROM products WHERE id = 'prod-1'").get() as any).stock);
      const cpBefore = Number((sqlite.prepare("SELECT usage_count FROM coupons WHERE code = 'GOLD2026'").get() as any).usage_count);

      const [c1, c2] = await Promise.all([
        fetch(`${baseUrl}/api/orders/${guestAOrderId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
          body: JSON.stringify({ reason: 'إلغاء أ' })
        }),
        fetch(`${baseUrl}/api/orders/${guestAOrderId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
          body: JSON.stringify({ reason: 'إلغاء ب' })
        })
      ]);
      const j1 = await c1.json();
      const j2 = await c2.json();
      assert.strictEqual(c1.status, 200);
      assert.strictEqual(c2.status, 200);
      assert.deepStrictEqual([Boolean(j1.alreadyCancelled), Boolean(j2.alreadyCancelled)].sort(), [false, true]);

      const stockAfter = Number((sqlite.prepare("SELECT stock FROM products WHERE id = 'prod-1'").get() as any).stock);
      const cpAfter = Number((sqlite.prepare("SELECT usage_count FROM coupons WHERE code = 'GOLD2026'").get() as any).usage_count);
      assert.strictEqual(stockAfter, stockBefore + 3, 'Must restore +3 quantity strictly ONCE');
      assert.strictEqual(cpAfter, cpBefore - 1, 'Coupon usage must decrement strictly ONCE');

      const payRow = sqlite.prepare("SELECT status FROM payments WHERE order_id = ?").get(guestAOrderId) as any;
      assert.strictEqual(payRow.status, 'failed', 'Pending payment must transition to failed on cancellation');

      const cancelNotif = sqlite.prepare("SELECT * FROM notifications WHERE id = ?").get(`notif-cancel-${guestAOrderId}`) as any;
      assert.ok(cancelNotif, 'Cancellation notification persisted in D1');
    });

    // 11. Negative/zero quantity rejected (400) + SQLite trigger prevents negative stock
    await test('11. Negative/zero quantity rejected (400) and DB trigger blocks negative stock', async () => {
      for (const badQty of [-5, 0, 1.5]) {
        const res = await fetch(`${baseUrl}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-audit-test': 'local-audit' },
          body: JSON.stringify({
            customerName: 'كمية غير صالحة',
            customerPhone: '776333444',
            district: 'حدة',
            address: { district: 'حدة', street: 'شارع المقالح' },
            items: [{ productId: 'prod-1', quantity: badQty }],
            paymentMethod: 'cod'
          })
        });
        assert.strictEqual(res.status, 400, `Quantity ${badQty} must return 400`);
      }

      let dbRejectedNegative = false;
      try {
        sqlite.prepare("UPDATE products SET stock = -1 WHERE id = 'prod-1'").run();
      } catch (err: any) {
        dbRejectedNegative = String(err.message).includes('negative') || String(err.message).includes('CONSTRAINT') || String(err.message).includes('CHECK');
      }
      assert.strictEqual(dbRejectedNegative, true, 'Schema CHECK/trigger must forbid negative stock');
    });

    // 12. Payment rules: delivered does NOT mark paid, explicit confirm enforces amount, duplicate rejected (409), refund lifecycle, cancelled confirm rejected (400)
    await test('12. Payment lifecycle rules (no auto-paid on delivery, amount check, duplicate confirm 409, refund 200/409, cancelled confirm 400)', async () => {
      // Create a fresh order to test full delivery + payment lifecycle
      const ordRes = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-audit-test': 'local-audit' },
        body: JSON.stringify({
          customerName: 'عميل الدفع',
          customerPhone: '777123987',
          district: 'حدة',
          address: { district: 'حدة', street: 'جولة المصباحي' },
          items: [{ productId: 'prod-1', quantity: 2, weight: '250g' }],
          paymentMethod: 'cash_on_delivery'
        })
      });
      const ordJson = await ordRes.json();
      assert.strictEqual(ordRes.status, 200);
      const orderId = ordJson.data.id;
      const expectedTotal = ordJson.data.total; // 2*600 + 700 = 1900

      // Follow valid order state machine transitions: received -> shipped -> on_way -> delivered
      for (const nextStatus of ['shipped', 'on_way']) {
        const stepRes = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driverAToken}` },
          body: JSON.stringify({ status: nextStatus })
        });
        assert.strictEqual(stepRes.status, 200, `Transition to ${nextStatus} should succeed`);
      }

      // Delivered MUST NOT auto-mark payment as confirmed/paid!
      const delivRes = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driverAToken}` },
        body: JSON.stringify({ status: 'delivered', driverNotes: 'تم التسليم بدون تأكيد الدفع بعد' })
      });
      const delivJson = await delivRes.json();
      assert.strictEqual(delivRes.status, 200);
      assert.strictEqual(delivJson.data.paymentStatus, 'pending', 'Delivered status must NOT automatically mark payment confirmed/paid');

      // Mismatched payment amount rejected (400)
      const badAmtRes = await fetch(`${baseUrl}/api/orders/${orderId}/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driverAToken}` },
        body: JSON.stringify({ amount: expectedTotal - 100, method: 'cod' })
      });
      assert.strictEqual(badAmtRes.status, 400, 'Mismatched payment amount must fail with 400');

      // Refund before confirm rejected (400)
      const earlyRefundRes = await fetch(`${baseUrl}/api/orders/${orderId}/payment/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
        body: JSON.stringify({ reason: 'محاولة قبل الدفع' })
      });
      assert.strictEqual(earlyRefundRes.status, 400, 'Cannot refund unconfirmed payment');

      // Assigned driver confirms COD payment with exact amount
      const confirmRes = await fetch(`${baseUrl}/api/orders/${orderId}/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driverAToken}` },
        body: JSON.stringify({ amount: expectedTotal, method: 'cod', notes: 'استلام كاش' })
      });
      const confirmJson = await confirmRes.json();
      assert.strictEqual(confirmRes.status, 200);
      assert.strictEqual(confirmJson.data.status, 'confirmed');
      assert.strictEqual(confirmJson.order.paymentStatus, 'paid');

      // Duplicate confirm rejected (409)
      const dupConfirmRes = await fetch(`${baseUrl}/api/orders/${orderId}/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
        body: JSON.stringify({ amount: expectedTotal, method: 'cod' })
      });
      assert.strictEqual(dupConfirmRes.status, 409, 'Duplicate payment confirmation must return 409');

      // Owner refunds confirmed payment
      const refundRes = await fetch(`${baseUrl}/api/orders/${orderId}/payment/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
        body: JSON.stringify({ reason: 'اتفاق مع العميل' })
      });
      const refundJson = await refundRes.json();
      assert.strictEqual(refundRes.status, 200);
      assert.strictEqual(refundJson.data.status, 'refunded');
      assert.strictEqual(refundJson.order.paymentStatus, 'refunded');

      // Duplicate refund rejected (409)
      const dupRefundRes = await fetch(`${baseUrl}/api/orders/${orderId}/payment/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
        body: JSON.stringify({ reason: 'محاولة ثانية' })
      });
      assert.strictEqual(dupRefundRes.status, 409);

      // Confirming payment for cancelled order rejected (400)
      const cancelConfirmRes = await fetch(`${baseUrl}/api/orders/${guestAOrderId}/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
        body: JSON.stringify({ amount: 3670 })
      });
      assert.strictEqual(cancelConfirmRes.status, 400, 'Confirming payment for cancelled order must fail with 400');
    });

    // 13. Notifications persistence across fresh sync, RBAC isolation, mark-read persistence, cross-user 403
    await test('13. Notifications persist in D1, survive sync, enforce RBAC, and isolate mark-read (403)', async () => {
      // Clear memory cache and re-sync cleanly from SQLite D1 to verify true persistence
      (d1 as any).tables.notifications = [];
      await d1.syncFromCloudflareD1();

      const ownerNotifsRes = await fetch(`${baseUrl}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      });
      const ownerNotifsJson = await ownerNotifsRes.json();
      assert.strictEqual(ownerNotifsRes.status, 200);
      assert.ok(ownerNotifsJson.data.length >= 2, 'Owner should see persisted order & cancel notifications');
      const targetNotif = ownerNotifsJson.data.find((n: any) => n.recipientRole === 'admin' || n.recipientRole === 'owner');
      assert.ok(targetNotif);

      // Customer/guest MUST NOT see owner notifications
      const custNotifsRes = await fetch(`${baseUrl}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${customerOtherToken}` }
      });
      const custNotifsJson = await custNotifsRes.json();
      assert.strictEqual(custNotifsRes.status, 200);
      assert.strictEqual(custNotifsJson.data.some((n: any) => n.id === targetNotif.id), false);

      // Customer trying to mark owner notification read -> 403!
      const crossReadRes = await fetch(`${baseUrl}/api/notifications/${targetNotif.id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${customerOtherToken}` }
      });
      assert.strictEqual(crossReadRes.status, 403, 'Cross-user mark-read must return 403');

      // Owner marking read updates D1 is_read = 1
      const readRes = await fetch(`${baseUrl}/api/notifications/${targetNotif.id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      });
      const readJson = await readRes.json();
      assert.strictEqual(readRes.status, 200);
      assert.strictEqual(readJson.data.isRead, true);
      const dbNotif = sqlite.prepare("SELECT is_read FROM notifications WHERE id = ?").get(targetNotif.id) as any;
      assert.strictEqual(dbNotif.is_read, 1);
    });

    // 14. Reviews: unauthenticated userPhone/orderId cannot spoof verifiedPurchase
    await test('14. Unauthenticated review body spoofing userPhone/orderId cannot forge verifiedPurchase=true', async () => {
      const res = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'prod-1',
          userName: 'مقيم بدون جلسة',
          userPhone: '777123987', // belongs to delivered order above!
          orderId: guestAOrderNumber,
          rating: 5,
          comment: 'محاولة تزييف شارة الشراء الموثق'
        })
      });
      const json = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.data.verifiedPurchase, false, 'Unauthenticated review MUST NOT set verifiedPurchase=true');
    });

    // 15. D1 failure simulation returns 503 (never stale cache)
    await test('15. D1 failure on products/orders/payments/notifications returns HTTP 503 (fail-closed, zero stale cache)', async () => {
      const origRaw = d1.executeCloudflareD1Raw.bind(d1);
      (d1 as any).executeCloudflareD1Raw = async () => ({ success: false, errors: [{ message: 'D1 outage simulated' }] });
      try {
        const pRes = await fetch(`${baseUrl}/api/products`);
        assert.strictEqual(pRes.status, 503);
        const oRes = await fetch(`${baseUrl}/api/orders`, { headers: { 'Authorization': `Bearer ${ownerToken}` } });
        assert.strictEqual(oRes.status, 503);
        const payRes = await fetch(`${baseUrl}/api/payments`, { headers: { 'Authorization': `Bearer ${ownerToken}` } });
        assert.strictEqual(payRes.status, 503);
        const nRes = await fetch(`${baseUrl}/api/notifications`, { headers: { 'Authorization': `Bearer ${ownerToken}` } });
        assert.strictEqual(nRes.status, 503);
      } finally {
        (d1 as any).executeCloudflareD1Raw = origRaw;
      }
    });

    // 16. testGuard rejects Prod D1 ID immediately
    await test('16. testGuard refuses to execute against Production D1 database ID', async () => {
      const prevTestDb = process.env.CI_TEST_CLOUDFLARE_DATABASE_ID;
      process.env.CI_TEST_CLOUDFLARE_DATABASE_ID = KNOWN_PROD_D1_DATABASE_ID;
      let rejected = false;
      try {
        await enforceIsolatedTestEnvironment({ requireMutationOptIn: false, requireBaseUrl: false });
      } catch (err: any) {
        rejected = String(err.message).includes('Production D1');
      } finally {
        process.env.CI_TEST_CLOUDFLARE_DATABASE_ID = prevTestDb;
      }
      assert.strictEqual(rejected, true, 'testGuard must throw on Production D1 DB ID');
    });

    console.log(`\n🎉 ALL ${passed}/16 RELEASE HARDENING TESTS PASSED IN 100% ISOLATED SQLITE MODE (ZERO PROD D1 CONTACT).`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    sqlite.close();
  }
}

runReleaseHardeningSuite().catch((err) => {
  console.error('Fatal release hardening test failure:', err);
  process.exit(1);
});
