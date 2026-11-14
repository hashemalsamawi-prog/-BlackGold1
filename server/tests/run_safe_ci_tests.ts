import { enforceIsolatedTestEnvironment } from './testGuard';

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

async function req(baseUrl: string, url: string, options: any = {}) {
  const headers = { 'Content-Type': 'application/json', 'x-ci-test': 'safe-suite', ...(options.headers || {}) };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${baseUrl}${url}`, { ...options, headers, signal: controller.signal });
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

async function runSafeCiTests() {
  // Validate test environment BEFORE importing ../d1 or touching any DB/network
  const testConfig = await enforceIsolatedTestEnvironment({ requireMutationOptIn: false, requireBaseUrl: true });

  const { d1 } = await import('../d1');
  const { generateToken, hashSecret } = await import('../security');

  console.log('======================================================================');
  console.log('🛡️ BLACK GOLD ISOLATED CI TEST SUITE: SECURITY, ENUMERATION & INTEGRITY');
  console.log(`🎯 Target Test Base URL: ${testConfig.baseUrl}`);
  console.log(`🧪 Mutation Tests Enabled: ${testConfig.allowMutation}`);
  console.log('======================================================================\n');

  await d1.init();

  // -------------------------------------------------------------------
  // 1. CLOUDFLARE D1 ISOLATED TEST INTEGRITY (READ-ONLY)
  // -------------------------------------------------------------------
  console.log('--- 1. CLOUDFLARE D1 ISOLATED INTEGRITY (READ-ONLY) ---');
  assert(d1.isD1Configured(), 'Isolated test Cloudflare D1 is configured');

  const tablesRow = await d1.executeCloudflareD1Query("SELECT count(*) as count FROM sqlite_master WHERE type='table';");
  const tableCount = Number(tablesRow?.[0]?.count ?? 0);
  assert(tableCount >= 10, `Isolated test DB has ${tableCount} operational tables`);

  const products = await d1.getProductsAsync();
  assert(Array.isArray(products) && products.length > 0, `Products table returned ${products.length} products`);

  // -------------------------------------------------------------------
  // 2. ORDER TRACKING ENUMERATION & PRIVACY AUDIT (READ-ONLY)
  // -------------------------------------------------------------------
  console.log('\n--- 2. ORDER TRACKING ENUMERATION & PRIVACY AUDIT (READ-ONLY) ---');
  const shortProbe = await req(testConfig.baseUrl, '/api/orders/track/12');
  assert(shortProbe.status === 400, 'Short query probe (track/12) rejected with HTTP 400');

  const partialProbe = await req(testConfig.baseUrl, '/api/orders/track/88');
  assert(partialProbe.status === 400, 'Partial 2-digit probe rejected with HTTP 400');

  const notFoundProbe = await req(testConfig.baseUrl, '/api/orders/track/BG-2026-99999999');
  assert(notFoundProbe.status === 404, 'Non-existent order query returns HTTP 404');

  const allOrders = await d1.getOrdersAsync();
  const sampleOrder = allOrders?.[0];
  if (sampleOrder) {
    const validTrack = await req(testConfig.baseUrl, `/api/orders/track/${sampleOrder.orderNumber}`);
    assert(validTrack.status === 200, `Exact order tracking for (${sampleOrder.orderNumber}) succeeds with HTTP 200`);

    const trackData = validTrack.json?.data;
    assert(Boolean(trackData?.orderNumber), 'Returns orderNumber');
    assert(Boolean(trackData?.status), 'Returns order status');
    assert(Array.isArray(trackData?.timeline), 'Returns public milestones timeline');
    assert(!trackData?.customerPhone, 'Customer phone number is NOT exposed in public tracking');
    assert(!trackData?.driverName, 'Delivery driver name is NOT exposed in public tracking');
    assert(!trackData?.driverPhone, 'Delivery driver phone is NOT exposed in public tracking');
    assert(!trackData?.street, 'Street address is NOT exposed in public tracking');
  } else {
    console.log('  ℹ️ [INFO] No sample order present in isolated test DB; skipped sample tracking privacy check.');
  }

  // -------------------------------------------------------------------
  // 3. MUTATION TESTS (STRICTLY GATED BY CI_TESTS_ALLOW_MUTATION=true)
  // -------------------------------------------------------------------
  if (!testConfig.allowMutation) {
    console.log('\n--- 3. MUTATION TESTS SKIPPED ---');
    console.log('  ⏭️ [SKIP] Auth & stock write tests skipped (set CI_TESTS_ALLOW_MUTATION=true on an isolated test DB to enable).');
  } else {
    console.log('\n--- 3. ISOLATED MUTATION TESTS (SYNTHETIC DATA + CLEANUP) ---');
    const runTag = `ci-${Date.now()}`;
    const syntheticAdminPhone = '770009901';
    const syntheticCustomerPhone = '770009902';
    const syntheticAdminId = `usr-${runTag}-admin`;
    const syntheticReasonAdd = `CI_SAFE_TEST_ADD_${runTag}`;
    const syntheticReasonSub = `CI_SAFE_TEST_SUB_${runTag}`;
    const targetProduct = products[0];
    const initialStock = targetProduct.stock;

    try {
      // Seed synthetic admin strictly in isolated test DB (never use real admin phones like 777000111)
      await d1.executeCloudflareD1Query(
        "INSERT OR IGNORE INTO users (id, name, phone, role, password_hash, status, permissions_json) VALUES (?, ?, ?, 'owner', ?, 'active', '[]');",
        [syntheticAdminId, 'Synthetic CI Owner', syntheticAdminPhone, hashSecret(`ci-only-${runTag}`)]
      );

      // 3.1 Privilege Escalation Prevention (/api/auth/quick-customer)
      const exploitAttempt = await req(testConfig.baseUrl, '/api/auth/quick-customer', {
        method: 'POST',
        body: JSON.stringify({ phone: syntheticAdminPhone, name: 'Attacker Attempting Elevation' })
      });

      assert(exploitAttempt.status === 403, `Quick customer login with synthetic admin phone (${syntheticAdminPhone}) rejected with HTTP 403`);
      assert(exploitAttempt.json?.success === false, 'Response has success: false');
      assert(!exploitAttempt.json?.token, 'No authentication token issued for admin phone via quick customer login');

      const adminCheck = await d1.findUserByPhoneAsync(syntheticAdminPhone);
      if (adminCheck) {
        assert(adminCheck.role === 'owner', 'Synthetic owner role in isolated test DB remained strictly "owner"');
        assert(!adminCheck.name.includes('Attacker'), 'Synthetic owner name was NOT modified');
      }

      // 3.2 Legitimate synthetic customer login strictly gets role: 'customer'
      const customerLogin = await req(testConfig.baseUrl, '/api/auth/quick-customer', {
        method: 'POST',
        body: JSON.stringify({ phone: syntheticCustomerPhone, name: 'عميل اختبار معزول' })
      });
      assert(customerLogin.status === 200, 'Synthetic customer login succeeds with HTTP 200');
      assert(customerLogin.json?.user?.role === 'customer', 'Customer token has role strictly set to "customer"');

      // 3.3 Atomic inventory adjustment (+1 / -1) with zero net drift
      const adminToken = generateToken({
        userId: syntheticAdminId,
        role: 'owner',
        phone: syntheticAdminPhone,
        name: 'Synthetic CI Auditor'
      });

      const addRes = await req(testConfig.baseUrl, '/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
          productId: targetProduct.id,
          type: 'purchase',
          quantity: 1,
          reason: syntheticReasonAdd,
          performedBy: 'CI Safe Runner'
        })
      });
      assert(addRes.status === 200, 'Relative atomic stock increment (+1) succeeded in isolated test DB');

      const subRes = await req(testConfig.baseUrl, '/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
          productId: targetProduct.id,
          type: 'damage',
          quantity: 1,
          reason: syntheticReasonSub,
          performedBy: 'CI Safe Runner'
        })
      });
      assert(subRes.status === 200, 'Relative atomic stock decrement (-1) succeeded in isolated test DB');

      const finalProduct = await d1.findProductByIdAsync(targetProduct.id);
      assert(
        finalProduct?.stock === initialStock,
        `Stock in isolated test DB verified at EXACT initial value (${finalProduct?.stock} === ${initialStock})`
      );
    } finally {
      // Guaranteed cleanup of synthetic test rows on isolated test DB
      await d1.executeCloudflareD1Query(
        'DELETE FROM inventory_logs WHERE reason IN (?, ?);',
        [syntheticReasonAdd, syntheticReasonSub]
      ).catch(() => {});
      await d1.executeCloudflareD1Query(
        'DELETE FROM users WHERE phone IN (?, ?) OR id = ?;',
        [syntheticAdminPhone, syntheticCustomerPhone, syntheticAdminId]
      ).catch(() => {});
      await d1.executeCloudflareD1Query(
        "UPDATE products SET stock = ? WHERE id = ?; UPDATE inventory SET current_stock = ? WHERE product_id = ?;",
        [initialStock, targetProduct.id, initialStock, targetProduct.id]
      ).catch(() => {});
    }
  }

  console.log('\n======================================================================');
  console.log(`📊 ISOLATED CI AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runSafeCiTests().catch(err => {
  console.error('❌ Safe CI runner aborted:', err?.message || err);
  process.exit(1);
});

