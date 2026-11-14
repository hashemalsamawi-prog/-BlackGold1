import assert from 'assert';
import fs from 'fs';
import path from 'path';
import http from 'http';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';

// Strictly configure isolated synthetic credentials BEFORE importing d1 or server
const ISOLATED_TEST_DB_ID = '00000000-0000-4000-8000-000000000001';
const ISOLATED_TEST_ACCOUNT_ID = 'isolated-sqlite-test-account';
const ISOLATED_TEST_TOKEN = 'isolated-sqlite-test-token';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'phase1-isolated-test-jwt-secret-key-2026';
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
      last_row_id: Number(info.lastInsertRowid ?? 0)
    }
  };
}

function seedBaselineData(sqlite: DatabaseSync) {
  sqlite.exec(`
    INSERT INTO categories (id, name_ar, name_en, slug, sort_order, is_active)
    VALUES ('cat-pouches', 'العبوات الفاخرة', 'Premium Pouches', 'pouches', 1, 1);

    INSERT INTO products (id, name_ar, name_en, category_id, category, price, original_price, discount_percent, description_ar, description_en, images, specs, weight_options, is_featured, is_best_seller, stock)
    VALUES
      ('prod-1', 'فحم الذهب الأسود 500 جم', 'Black Gold 500g', 'cat-pouches', 'pouches', 1500, 1800, 10, 'وصف', 'Desc', '["/images/p1.jpg"]', '[]', '[]', 1, 1, 50),
      ('prod-2', 'فحم الذهب الأسود 1 كجم', 'Black Gold 1kg', 'cat-pouches', 'pouches', 2800, 3000, 0, 'وصف 2', 'Desc 2', '["/images/p2.jpg"]', '[]', '[]', 1, 0, 30);

    INSERT INTO inventory (product_id, current_stock, reserved_stock, min_threshold)
    VALUES
      ('prod-1', 50, 0, 10),
      ('prod-2', 30, 0, 10);

    INSERT INTO delivery_agents (id, name, phone, vehicle_type, is_active, active_orders_count, rating, total_deliveries)
    VALUES ('da-1', 'أحمد السائق', '771112233', 'دراجة نارية', 1, 2, 4.9, 42);

    INSERT INTO coupons (code, discount_percent, max_discount, min_order_amount, is_active, valid_until, usage_count, max_uses)
    VALUES ('GOLD2026', 10, 2000, 1000, 1, '2027-12-31', 0, 50);

    INSERT INTO gallery_items (id, title_ar, title_en, image_url, category, caption, sort_order, is_active)
    VALUES ('gal-1', 'صورة المصنع', 'Factory', '/images/g1.jpg', 'factory', 'صورة', 1, 1);

    INSERT INTO store_settings (id, store_name_ar, store_name_en, slogan_ar, logo_text, whatsapp_phone, call_phone, contact_email, free_delivery_threshold, is_store_open, delivery_districts)
    VALUES ('default_settings', 'متجر الذهب الأسود الاختباري', 'Black Gold Test', 'جودة عالية', 'الذهب الأسود', '967775000150', '967775000150', 'test@blackgold.ye', 9500, 1, '[{"id":"d1","nameAr":"حدة","fee":500}]');
  `);
}

async function runPhase1Tests() {
  const { d1 } = await import('../d1');
  const { generateToken, createRateLimiter } = await import('../security');
  const { enforceIsolatedTestEnvironment, KNOWN_PROD_D1_DATABASE_ID } = await import('./testGuard');
  const { app } = await import('../../server');

  const sqlite = buildLocalSqliteEngine();
  seedBaselineData(sqlite);

  // Hook d1 directly to local SQLite engine (ZERO Cloudflare network calls!)
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

  // Boot isolated local HTTP server wrapping Express app on 127.0.0.1:0
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const ownerToken = generateToken({
    userId: 'usr-owner-test',
    role: 'owner',
    phone: '770000001',
    name: 'مالك الاختبار'
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
  console.log('🛡️ BLACK GOLD PHASE 1 PRODUCTION HARDENING – ISOLATED SQLITE SUITE');
  console.log(`🎯 Local Isolated Express Server: ${baseUrl}`);
  console.log('======================================================================\n');

  try {
    // 1. Atomic manual stock adjustment & optimistic concurrency (including matching newStock edge case)
    await test('1.1 adjustProductStock (adjustment): concurrent stock change rejects with conflict & leaves ALL tables untouched', async () => {
      const logCountBefore = Number((sqlite.prepare("SELECT COUNT(*) as c FROM inventory_logs").get() as any).c);

      // Simulate concurrent edit changing stock 50 -> 40 after caller read 50
      sqlite.prepare("UPDATE products SET stock = 40 WHERE id = 'prod-1'").run();
      sqlite.prepare("UPDATE inventory SET current_stock = 40 WHERE product_id = 'prod-1'").run();

      // Even if target newStock is ALSO 40, stale previousStock=50 MUST be rejected!
      let rejected = false;
      try {
        await d1.adjustProductStock({
          productId: 'prod-1',
          type: 'adjustment',
          quantity: -10,
          previousStock: 50,
          newStock: 40,
          reason: 'تعديل متعارض',
          performedBy: 'admin-1'
        });
      } catch (err: any) {
        rejected = err.message.includes('تغيّر بالتزامن');
      }
      assert.strictEqual(rejected, true, 'Must throw concurrency conflict when previousStock is stale');

      const prodRow = sqlite.prepare("SELECT stock FROM products WHERE id = 'prod-1'").get() as any;
      const invRow = sqlite.prepare("SELECT current_stock FROM inventory WHERE product_id = 'prod-1'").get() as any;
      const logCountAfter = Number((sqlite.prepare("SELECT COUNT(*) as c FROM inventory_logs").get() as any).c);
      assert.strictEqual(prodRow.stock, 40, 'products.stock unchanged on conflict');
      assert.strictEqual(invRow.current_stock, 40, 'inventory.current_stock unchanged on conflict');
      assert.strictEqual(logCountAfter, logCountBefore, 'ZERO inventory_logs rows written on conflict');
    });

    await test('1.2 POST /api/inventory/adjust returns HTTP 409 when concurrent edit modifies stock mid-flight', async () => {
      const origFind = d1.findProductByIdAsync.bind(d1);
      let calls = 0;
      (d1 as any).findProductByIdAsync = async (id: string) => {
        const res = await origFind(id);
        calls++;
        // On first call (route handler read), return stock 40; mutate D1 to 35 before adjustProductStock commits
        if (calls === 1 && res && id === 'prod-1') {
          setTimeout(() => {
            sqlite.prepare("UPDATE products SET stock = 35 WHERE id = 'prod-1'").run();
            sqlite.prepare("UPDATE inventory SET current_stock = 35 WHERE product_id = 'prod-1'").run();
          }, 0);
        }
        return res;
      };

      // Force deterministic yield inside findProductByIdAsync's second invocation so timeout runs before batch
      const origAdjust = d1.adjustProductStock.bind(d1);
      (d1 as any).adjustProductStock = async (p: any) => {
        await new Promise(r => setTimeout(r, 15));
        return origAdjust(p);
      };

      try {
        const res = await fetch(`${baseUrl}/api/inventory/adjust`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ownerToken}`,
            'x-audit-test': 'local-audit'
          },
          body: JSON.stringify({
            productId: 'prod-1',
            type: 'adjustment',
            quantity: 60,
            reason: 'جرد متعارض HTTP'
          })
        });
        assert.strictEqual(res.status, 409, `Expected HTTP 409 on stock conflict, got ${res.status}`);
        const prodRow = sqlite.prepare("SELECT stock FROM products WHERE id = 'prod-1'").get() as any;
        const invRow = sqlite.prepare("SELECT current_stock FROM inventory WHERE product_id = 'prod-1'").get() as any;
        assert.strictEqual(prodRow.stock, 35, 'products.stock stays 35');
        assert.strictEqual(invRow.current_stock, 35, 'inventory.current_stock stays 35');
      } finally {
        (d1 as any).findProductByIdAsync = origFind;
        (d1 as any).adjustProductStock = origAdjust;
      }
    });

    await test('2. products.stock and inventory.current_stock stay synchronized across add, update, adjust, order, and rollback', async () => {
      // Valid adjustment 35 -> 65
      await d1.adjustProductStock({
        productId: 'prod-1',
        type: 'adjustment',
        quantity: 30,
        previousStock: 35,
        newStock: 65,
        reason: 'جرد سليم',
        performedBy: 'admin-1'
      });
      // Relative +10 and -5
      await d1.adjustProductStock({
        productId: 'prod-1',
        type: 'purchase',
        quantity: 10,
        previousStock: 65,
        newStock: 75,
        reason: 'توريد',
        performedBy: 'admin-1'
      });
      await d1.adjustProductStock({
        productId: 'prod-1',
        type: 'damage',
        quantity: -5,
        previousStock: 75,
        newStock: 70,
        reason: 'تالف',
        performedBy: 'admin-1'
      });

      let pRow = sqlite.prepare("SELECT stock FROM products WHERE id = 'prod-1'").get() as any;
      let iRow = sqlite.prepare("SELECT current_stock FROM inventory WHERE product_id = 'prod-1'").get() as any;
      assert.strictEqual(pRow.stock, 70);
      assert.strictEqual(iRow.current_stock, 70);

      // Update product stock via updateProductAsync
      await d1.updateProductAsync('prod-1', { stock: 80 });
      pRow = sqlite.prepare("SELECT stock FROM products WHERE id = 'prod-1'").get() as any;
      iRow = sqlite.prepare("SELECT current_stock FROM inventory WHERE product_id = 'prod-1'").get() as any;
      assert.strictEqual(pRow.stock, 80);
      assert.strictEqual(iRow.current_stock, 80);
    });

    // 3. Settings fallback removal
    await test('3. getSettingsAsync never returns stale cached settings when row is missing and throws on D1 error', async () => {
      const liveSettings = await d1.getSettingsAsync();
      assert.strictEqual(liveSettings.storeNameAr, 'متجر الذهب الأسود الاختباري');

      // Poison cache and remove DB row
      (d1 as any).tables.store_settings.storeNameAr = 'STALE_POISONED_STORE';
      sqlite.prepare("DELETE FROM store_settings WHERE id = 'default_settings'").run();

      const fallbackSettings = await d1.getSettingsAsync();
      assert.notStrictEqual(fallbackSettings.storeNameAr, 'STALE_POISONED_STORE', 'Must NOT leak stale cache when D1 row is absent');
      assert.strictEqual(fallbackSettings.storeNameAr, 'فحم الذهب الأسود الملكي', 'Must return deterministic code defaults');

      // Restore row and test D1 failure -> 503
      sqlite.exec(`
        INSERT INTO store_settings (id, store_name_ar, whatsapp_phone, call_phone, free_delivery_threshold, is_store_open, delivery_districts)
        VALUES ('default_settings', 'متجر الذهب الأسود الاختباري', '967775000150', '967775000150', 9500, 1, '[]');
      `);

      const origRaw = d1.executeCloudflareD1Raw.bind(d1);
      (d1 as any).executeCloudflareD1Raw = async () => ({ success: false, errors: [{ message: 'D1 Down' }] });
      try {
        const res = await fetch(`${baseUrl}/api/settings`);
        assert.strictEqual(res.status, 503, 'GET /api/settings must return 503 on D1 failure');
      } finally {
        (d1 as any).executeCloudflareD1Raw = origRaw;
      }
    });

    // 4. Delivery agent total_deliveries metric
    await test('4. Delivery agent completedOrdersCount accurately reads total_deliveries across all methods', async () => {
      const agents = await d1.getDeliveryAgentsAsync();
      assert.strictEqual(agents.length, 1);
      assert.strictEqual(agents[0].completedOrdersCount, 42);

      const single = await d1.findDeliveryAgentByIdAsync('da-1');
      assert.strictEqual(single?.completedOrdersCount, 42);

      const mapped = d1.mapD1DeliveryAgentToAgent({ id: 'da-x', name: 'X', phone: '771', total_deliveries: 19, is_active: 1 });
      assert.strictEqual(mapped.completedOrdersCount, 19);

      await d1.syncFromCloudflareD1();
      assert.strictEqual(d1.getDeliveryAgents()[0].completedOrdersCount, 42);
    });

    // 5. Atomic product/inventory writes & honest deletes (404 on missing)
    await test('5.1 Failed inventory write rolls back products update/insert cleanly (zero partial state)', async () => {
      // Trigger failure on inventory write temporarily
      sqlite.exec(`
        CREATE TRIGGER test_fail_inventory_write BEFORE UPDATE ON inventory
        BEGIN
          SELECT RAISE(ABORT, 'Injected inventory failure');
        END;
      `);

      let updateFailed = false;
      try {
        await d1.updateProductAsync('prod-1', { nameAr: 'اسم جزئي يجب التراجع عنه', stock: 99 });
      } catch {
        updateFailed = true;
      } finally {
        sqlite.exec('DROP TRIGGER IF EXISTS test_fail_inventory_write;');
      }
      assert.strictEqual(updateFailed, true, 'updateProductAsync must fail when inventory statement fails');

      const prodRow = sqlite.prepare("SELECT name_ar, stock FROM products WHERE id = 'prod-1'").get() as any;
      assert.strictEqual(prodRow.name_ar, 'فحم الذهب الأسود 500 جم', 'products.name_ar rolled back on batch failure');
      assert.strictEqual(prodRow.stock, 80, 'products.stock rolled back on batch failure');

      // Test addProductAsync rollback on inventory insert error
      sqlite.exec(`
        CREATE TRIGGER test_fail_inventory_insert BEFORE INSERT ON inventory
        BEGIN
          SELECT RAISE(ABORT, 'Injected inventory insert failure');
        END;
      `);
      let addFailed = false;
      try {
        await d1.addProductAsync({
          id: 'prod-rollback-check',
          nameAr: 'منتج فاشل',
          nameEn: 'Fail Prod',
          category: 'pouches',
          price: 1000,
          descriptionAr: 'w',
          descriptionEn: 'd',
          stock: 10
        });
      } catch {
        addFailed = true;
      } finally {
        sqlite.exec('DROP TRIGGER IF EXISTS test_fail_inventory_insert;');
      }
      assert.strictEqual(addFailed, true);
      const phantom = sqlite.prepare("SELECT id FROM products WHERE id = 'prod-rollback-check'").get();
      assert.strictEqual(phantom, undefined, 'No orphaned product row left after batch rollback');
    });

    await test('5.2 deleteCouponAsync & deleteGalleryItemAsync return false/404 when target does not exist', async () => {
      const delMissingCoupon = await fetch(`${baseUrl}/api/coupons/DOES_NOT_EXIST`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      });
      assert.strictEqual(delMissingCoupon.status, 404, 'DELETE missing coupon returns 404');

      const delMissingGallery = await fetch(`${baseUrl}/api/gallery/missing-gal-id`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      });
      assert.strictEqual(delMissingGallery.status, 404, 'DELETE missing gallery item returns 404');

      const delValidGallery = await fetch(`${baseUrl}/api/gallery/gal-1`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      });
      assert.strictEqual(delValidGallery.status, 200, 'DELETE existing gallery item returns 200');

      const delRepeatGallery = await fetch(`${baseUrl}/api/gallery/gal-1`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      });
      assert.strictEqual(delRepeatGallery.status, 404, 'Repeated DELETE returns 404');
    });

    // 6. Concurrent order cancellation + non-cancel optimistic concurrency
    await test('6.1 Concurrent duplicate order cancellations restore stock & coupon ONCE and flag duplicate accurately', async () => {
      const created = await d1.createOrderAtomic({
        orderId: 'ORD-RACE-1',
        orderNumber: 'BG-2026-RACE1',
        customerName: 'عميل سباق الإلغاء',
        customerPhone: '771234567',
        address: { district: 'حدة', street: 'شارع الخمسين' },
        validatedItems: [{ productId: 'prod-1', productNameAr: 'فحم الذهب الأسود 500 جم', weight: '500g', quantity: 5, unitPrice: 1500 }],
        subtotal: 7500,
        shippingFee: 500,
        discount: 750,
        total: 7250,
        paymentMethod: 'cod',
        couponCode: 'GOLD2026',
        timeline: [{ status: 'received', time: '12:00', titleAr: 'تم', titleEn: 'Received' }],
        date: '2026-11-13'
      });
      assert.strictEqual(created.success, true);

      let prodRow = sqlite.prepare("SELECT stock FROM products WHERE id = 'prod-1'").get() as any;
      let invRow = sqlite.prepare("SELECT current_stock FROM inventory WHERE product_id = 'prod-1'").get() as any;
      let cpRow = sqlite.prepare("SELECT usage_count FROM coupons WHERE code = 'GOLD2026'").get() as any;
      assert.strictEqual(prodRow.stock, 75);
      assert.strictEqual(invRow.current_stock, 75);
      assert.strictEqual(cpRow.usage_count, 1);

      // Fire two concurrent POST /api/orders/:id/cancel calls simultaneously
      const [resA, resB] = await Promise.all([
        fetch(`${baseUrl}/api/orders/ORD-RACE-1/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}`, 'x-audit-test': 'local-audit' },
          body: JSON.stringify({ reason: 'إلغاء أ' })
        }),
        fetch(`${baseUrl}/api/orders/ORD-RACE-1/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}`, 'x-audit-test': 'local-audit' },
          body: JSON.stringify({ reason: 'إلغاء ب' })
        })
      ]);
      const jsonA = await resA.json();
      const jsonB = await resB.json();

      assert.strictEqual(resA.status, 200);
      assert.strictEqual(resB.status, 200);
      assert.strictEqual(jsonA.data?.status, 'cancelled');
      assert.strictEqual(jsonB.data?.status, 'cancelled');

      // Exactly one request rolled back (alreadyCancelled=false) and the other coalesced (alreadyCancelled=true)
      const dupFlags = [Boolean(jsonA.alreadyCancelled), Boolean(jsonB.alreadyCancelled)].sort();
      assert.deepStrictEqual(dupFlags, [false, true], 'Exactly one concurrent cancel must be flagged alreadyCancelled=true');

      // Third sequential cancel must also return alreadyCancelled: true and NOT double-restore
      const resC = await fetch(`${baseUrl}/api/orders/ORD-RACE-1/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}`, 'x-audit-test': 'local-audit' },
        body: JSON.stringify({ reason: 'إلغاء مكرر' })
      });
      const jsonC = await resC.json();
      assert.strictEqual(jsonC.alreadyCancelled, true);

      prodRow = sqlite.prepare("SELECT stock FROM products WHERE id = 'prod-1'").get() as any;
      invRow = sqlite.prepare("SELECT current_stock FROM inventory WHERE product_id = 'prod-1'").get() as any;
      cpRow = sqlite.prepare("SELECT usage_count FROM coupons WHERE code = 'GOLD2026'").get() as any;
      const rollbackLogs = Number((sqlite.prepare("SELECT COUNT(*) as c FROM inventory_logs WHERE order_id = 'ORD-RACE-1' AND type = 'STOCK_ROLLBACK'").get() as any).c);

      assert.strictEqual(prodRow.stock, 80, 'Stock restored strictly ONCE (75 -> 80)');
      assert.strictEqual(invRow.current_stock, 80, 'inventory.current_stock restored strictly ONCE (75 -> 80)');
      assert.strictEqual(cpRow.usage_count, 0, 'Coupon usage decremented strictly ONCE');
      assert.strictEqual(rollbackLogs, 1, 'Exactly 1 STOCK_ROLLBACK audit log row exists');
    });

    await test('6.2 Non-cancel updateOrderStatus enforces optimistic concurrency (returns 409) & cannot cancel delivered order', async () => {
      await d1.createOrderAtomic({
        orderId: 'ORD-CONC-2',
        orderNumber: 'BG-2026-CONC2',
        customerName: 'عميل حالة الطلب',
        customerPhone: '771234568',
        address: { district: 'حدة', street: 'شارع صفر' },
        validatedItems: [{ productId: 'prod-2', productNameAr: 'فحم الذهب الأسود 1 كجم', weight: '1kg', quantity: 2, unitPrice: 2800 }],
        subtotal: 5600,
        shippingFee: 500,
        discount: 0,
        total: 6100,
        paymentMethod: 'cod',
        timeline: [{ status: 'received', time: '12:05', titleAr: 'تم', titleEn: 'Received' }],
        date: '2026-11-13'
      });

      // Simulate concurrent transition received -> preparing between route/order read and D1 UPDATE
      const origFind = d1.findOrderByIdAsync.bind(d1);
      let patchCallCount = 0;
      (d1 as any).findOrderByIdAsync = async (id: string) => {
        const ord = await origFind(id);
        patchCallCount++;
        // Call 1: route check; Call 2: updateOrderStatus initial read; Call 3: fallback read after changes===0
        if (patchCallCount === 2 && ord && id === 'ORD-CONC-2') {
          setTimeout(() => {
            sqlite.prepare("UPDATE orders SET status = 'preparing' WHERE id = 'ORD-CONC-2'").run();
          }, 0);
        }
        return ord;
      };
      const origRaw = d1.executeCloudflareD1Raw.bind(d1);
      (d1 as any).executeCloudflareD1Raw = async (sql: string, params: any[] = []) => {
        if (sql.includes('UPDATE orders SET status =') && sql.includes('AND status = ?')) {
          await new Promise(r => setTimeout(r, 15));
        }
        return origRaw(sql, params);
      };

      try {
        const res = await fetch(`${baseUrl}/api/orders/ORD-CONC-2/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}`, 'x-audit-test': 'local-audit' },
          body: JSON.stringify({ status: 'confirmed' })
        });
        assert.strictEqual(res.status, 409, `Expected HTTP 409 on stale order status update, got ${res.status}`);
        const dbOrd = sqlite.prepare("SELECT status FROM orders WHERE id = 'ORD-CONC-2'").get() as any;
        assert.strictEqual(dbOrd.status, 'preparing', 'Concurrent status preparing must not be overwritten');
      } finally {
        (d1 as any).findOrderByIdAsync = origFind;
        (d1 as any).executeCloudflareD1Raw = origRaw;
      }

      // Now transition ORD-CONC-2 to delivered and verify cancel fails
      await d1.updateOrderStatus('ORD-CONC-2', 'delivered', undefined, 'المندوب');
      const cancelDeliveredRes = await fetch(`${baseUrl}/api/orders/ORD-CONC-2/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}`, 'x-audit-test': 'local-audit' },
        body: JSON.stringify({ reason: 'محاولة بعد التسليم' })
      });
      assert.strictEqual(cancelDeliveredRes.ok, false, 'Cannot cancel delivered order');
      const p2 = sqlite.prepare("SELECT stock FROM products WHERE id = 'prod-2'").get() as any;
      assert.strictEqual(p2.stock, 28, 'Delivered order stock must remain deducted (30 - 2 = 28)');
    });

    // 7. Test isolation verification & Rate limiter trust boundary
    await test('7.1 enforceIsolatedTestEnvironment proves localhost DB identity & fails closed on Prod/mismatch', async () => {
      const { CLOUDFLARE_CONFIG } = await import('../d1');
      const origDbIdDesc = Object.getOwnPropertyDescriptor(CLOUDFLARE_CONFIG, 'databaseId')!;
      let simulatedServerDbId = ISOLATED_TEST_DB_ID;
      Object.defineProperty(CLOUDFLARE_CONFIG, 'databaseId', {
        configurable: true,
        get: () => simulatedServerDbId
      });

      try {
        // Case A: Server runs on ISOLATED_TEST_DB_ID and caller passes matching CI_TEST_CLOUDFLARE_DATABASE_ID
        process.env.CI_TEST_BASE_URL = baseUrl;
        process.env.CI_TEST_CLOUDFLARE_DATABASE_ID = ISOLATED_TEST_DB_ID;
        delete process.env.CLOUDFLARE_DATABASE_ID;
        simulatedServerDbId = ISOLATED_TEST_DB_ID;
        const cfg = await enforceIsolatedTestEnvironment({ requireMutationOptIn: true, requireBaseUrl: true });
        assert.strictEqual(cfg.databaseId, ISOLATED_TEST_DB_ID);

        // Case B: Mismatched databaseId fails closed!
        delete process.env.CLOUDFLARE_DATABASE_ID;
        process.env.CI_TEST_CLOUDFLARE_DATABASE_ID = '11111111-1111-4000-8000-999999999999';
        simulatedServerDbId = ISOLATED_TEST_DB_ID;
        let mismatchRejected = false;
        try {
          await enforceIsolatedTestEnvironment({ requireMutationOptIn: false, requireBaseUrl: true });
        } catch (err: any) {
          mismatchRejected = err.message.includes('unverified D1 database') || err.message.includes('ABORTED - FAIL CLOSED');
        }
        assert.strictEqual(mismatchRejected, true, 'Must abort when target server DB does not match CI_TEST_CLOUDFLARE_DATABASE_ID');

        // Case C: Localhost server bound to KNOWN_PROD_D1_DATABASE_ID MUST abort immediately via /api/d1/health proof!
        delete process.env.CLOUDFLARE_DATABASE_ID;
        process.env.CI_TEST_CLOUDFLARE_DATABASE_ID = '22222222-2222-4000-8000-222222222222';
        simulatedServerDbId = KNOWN_PROD_D1_DATABASE_ID;
        let prodServerRejected = false;
        try {
          await enforceIsolatedTestEnvironment({ requireMutationOptIn: false, requireBaseUrl: true });
        } catch (err: any) {
          prodServerRejected = err.message.includes('Production Cloudflare D1');
        }
        assert.strictEqual(prodServerRejected, true, 'Must abort fail-closed when localhost server is bound to Production D1 ID');
      } finally {
        Object.defineProperty(CLOUDFLARE_CONFIG, 'databaseId', origDbIdDesc);
        process.env.CLOUDFLARE_DATABASE_ID = ISOLATED_TEST_DB_ID;
        process.env.CI_TEST_CLOUDFLARE_DATABASE_ID = ISOLATED_TEST_DB_ID;
      }
    });

    await test('7.2 createRateLimiter ignores spoofed X-Forwarded-For & X-Real-IP headers', () => {
      const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 });
      let blockedCount = 0;
      let passedCount = 0;

      const makeReq = (spoofIp: string) => ({
        headers: {
          'x-forwarded-for': spoofIp,
          'x-real-ip': spoofIp
        },
        ip: '203.0.113.10',
        socket: { remoteAddress: '203.0.113.10' }
      } as any);

      const res = {
        status(code: number) {
          if (code === 429) blockedCount++;
          return this;
        },
        json() { return this; }
      } as any;

      limiter(makeReq('1.1.1.1'), res, () => { passedCount++; });
      limiter(makeReq('2.2.2.2'), res, () => { passedCount++; });
      limiter(makeReq('3.3.3.3'), res, () => { passedCount++; });

      assert.strictEqual(passedCount, 2, 'First 2 requests allowed');
      assert.strictEqual(blockedCount, 1, 'Third request with spoofed X-Forwarded-For/X-Real-IP MUST still be rate-limited (429)');
    });

    console.log(`\n🎉 ALL ${passed} PHASE 1 PRODUCTION HARDENING TESTS PASSED IN 100% ISOLATION (ZERO PROD D1 CONTACT).`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    sqlite.close();
  }
}

runPhase1Tests().catch((err) => {
  console.error('Fatal Phase 1 test error:', err);
  process.exit(1);
});
