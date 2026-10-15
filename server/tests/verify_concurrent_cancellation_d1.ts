import { d1 } from '../d1';
import { generateToken } from '../security';

const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${msg}`);
    failed++;
  }
}

async function req(url: string, options: any = {}) {
  const headers = { 'Content-Type': 'application/json', 'x-audit-test': 'local-audit', ...(options.headers || {}) };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${BASE_URL}${url}`, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);
    const text = await res.text();
    try {
      return { status: res.status, ok: res.ok, json: JSON.parse(text) };
    } catch {
      return { status: res.status, ok: res.ok, text };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    return { status: 500, ok: false, json: { success: false, message: err.message } };
  }
}

async function runRealConcurrencyAudit() {
  console.log('======================================================================');
  console.log('🧪 REAL CONCURRENCY AUDIT: CLOUDFLARE D1 ATOMIC ROLLBACK SAFETY');
  console.log('======================================================================\n');

  await d1.init();

  const customerPhone = '771554433';
  const customerName = 'عميل فحص التزامن الحقيقي';
  const custRes = await req('/api/auth/quick-customer', {
    method: 'POST',
    body: JSON.stringify({ phone: customerPhone, name: customerName })
  });
  const customerToken = custRes.json?.token;

  const testProductId = 'bg-prem-250g';

  // 1. Check Initial D1 Stock
  const initialRow = await d1.executeCloudflareD1Query("SELECT stock FROM products WHERE id = ?;", [testProductId]);
  const initialD1Stock = Number(initialRow?.[0]?.stock ?? 0);
  console.log(`  ℹ️ Initial D1 Stock for (${testProductId}): ${initialD1Stock}`);

  // 2. Create Order
  const orderQty = 4;
  const orderRes = await req('/api/orders', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({
      customerName,
      customerPhone,
      address: { district: 'حدة', street: 'شارع حدة' },
      items: [{ productId: testProductId, quantity: orderQty, weight: '250g' }]
    })
  });

  assert(orderRes.status === 200, 'Order created successfully');
  const orderId = orderRes.json?.data?.id;

  // Confirm stock decremented in D1
  const postOrderRow = await d1.executeCloudflareD1Query("SELECT stock FROM products WHERE id = ?;", [testProductId]);
  const stockAfterOrder = Number(postOrderRow?.[0]?.stock ?? 0);
  assert(stockAfterOrder === initialD1Stock - orderQty, `Stock in D1 decremented by ${orderQty} (${initialD1Stock} -> ${stockAfterOrder})`);

  // 3. REAL CONCURRENT CANCELLATION TEST
  // Fire 4 SIMULTANEOUS cancellation requests at the exact same millisecond
  console.log('\n--- EXECUTING 4 CONCURRENT CANCELLATION REQUESTS SIMULTANEOUSLY ---');
  const concurrentPromises = [1, 2, 3, 4].map(idx => 
    req(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` },
      body: JSON.stringify({ reason: `محاولة إلغاء متزامنة رقم ${idx}` })
    })
  );

  const results = await Promise.all(concurrentPromises);

  // Check responses: all must be HTTP 200, either successfully cancelled or identified as already cancelled
  const allHttp200 = results.every(r => r.status === 200);
  assert(allHttp200, 'All concurrent cancel requests returned HTTP 200 OK without unhandled server crash');

  const successfulRollbacks = results.filter(r => r.json?.alreadyCancelled !== true && r.json?.success === true);
  const alreadyCancelledResponses = results.filter(r => r.json?.alreadyCancelled === true);
  console.log(`  ℹ️ Primary rollback response: ${successfulRollbacks.length}, Idempotent duplicate responses: ${alreadyCancelledResponses.length}`);
  assert(successfulRollbacks.length >= 1, 'At least one primary cancel request processed the cancellation');

  // 4. CRITICAL DATABASE LEVEL INSPECTION IN CLOUDFLARE D1
  console.log('\n--- CRITICAL D1 DATABASE LEVEL AUDIT ---');
  // Check stock in D1: MUST BE EXACTLY initialD1Stock, NOT incremented multiple times!
  const finalStockRow = await d1.executeCloudflareD1Query("SELECT stock FROM products WHERE id = ?;", [testProductId]);
  const finalStock = Number(finalStockRow?.[0]?.stock ?? 0);
  assert(finalStock === initialD1Stock, `Stock in D1 restored EXACTLY ONCE (${finalStock} === ${initialD1Stock}) despite 4 concurrent requests!`);

  // Check inventory_logs in D1: MUST BE EXACTLY 1 STOCK_ROLLBACK RECORD!
  const rollbackLogsInD1 = await d1.executeCloudflareD1Query(
    "SELECT * FROM inventory_logs WHERE order_id = ? AND type = 'STOCK_ROLLBACK';",
    [orderId]
  );
  assert(rollbackLogsInD1.length === 1, `D1 contains EXACTLY 1 STOCK_ROLLBACK log record (found: ${rollbackLogsInD1.length}), zero duplicates created`);
  assert(Number(rollbackLogsInD1[0]?.quantity) === orderQty, `Rollback log record has quantity ${orderQty}`);

  // Check orders table in D1
  const orderRowInD1 = await d1.executeCloudflareD1Query(
    "SELECT status, is_stock_rolled_back FROM orders WHERE id = ?;",
    [orderId]
  );
  assert(orderRowInD1[0]?.status === 'cancelled', 'Order status in D1 is "cancelled"');
  assert(Number(orderRowInD1[0]?.is_stock_rolled_back) === 1, 'is_stock_rolled_back in D1 is 1');

  // 5. TEST CROSS-SERVER D1 CONDITIONAL PROTECTION (Direct Batch Simulation)
  console.log('\n--- TESTING D1 CONDITIONAL QUERY ATOMICS (Cross-Instance Simulation) ---');
  // If an external server instance executes the rollback batch for an order that was already rolled back in D1:
  // All WHERE EXISTS (is_stock_rolled_back = 0) checks must prevent updating any rows!
  const testOrderObject: any = {
    id: orderId,
    orderNumber: orderRes.json?.data?.orderNumber || orderId,
    status: 'cancelled',
    isStockRolledBack: false, // simulated server instance that did not have local flag updated yet
    items: [{ productId: testProductId, quantity: 4, productNameAr: 'فحم الذهب' }]
  };

  const rollbackResult = await d1.executeStockRollback(testOrderObject, 'فحص التزامن المباشر');
  assert(rollbackResult === false, 'executeStockRollback returned false when D1 order was already rolled back');

  const stockAfterDirectTest = await d1.executeCloudflareD1Query("SELECT stock FROM products WHERE id = ?;", [testProductId]);
  assert(Number(stockAfterDirectTest?.[0]?.stock) === initialD1Stock, 'Stock in D1 remained unchanged (zero duplicate additions in D1)');

  const finalLogsCount = await d1.executeCloudflareD1Query(
    "SELECT COUNT(*) as cnt FROM inventory_logs WHERE order_id = ? AND type = 'STOCK_ROLLBACK';",
    [orderId]
  );
  assert(Number(finalLogsCount?.[0]?.cnt) === 1, 'Still exactly 1 STOCK_ROLLBACK audit log in D1');

  console.log('\n======================================================================');
  console.log(`📊 REAL CONCURRENCY VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runRealConcurrencyAudit().catch(err => {
  console.error('Fatal concurrency audit error:', err);
  process.exit(1);
});
