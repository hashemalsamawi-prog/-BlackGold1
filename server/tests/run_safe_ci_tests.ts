import { d1 } from '../d1';
import { generateToken } from '../security';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

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
  const headers = { 'Content-Type': 'application/json', 'x-ci-test': 'safe-suite', ...(options.headers || {}) };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
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

async function runSafeCiTests() {
  console.log('======================================================================');
  console.log('🛡️ BLACK GOLD SAFE CI TEST SUITE: SECURITY, ENUMERATION & INTEGRITY');
  console.log('======================================================================\n');

  await d1.init();

  // -------------------------------------------------------------------
  // 1. SECURITY TEST: PRIVILEGE ESCALATION PREVENTION (/api/auth/quick-customer)
  // -------------------------------------------------------------------
  console.log('--- 1. PRIVILEGE ESCALATION PREVENTION (/api/auth/quick-customer) ---');
  // Attempt to login using known admin/owner phone number via customer quick-login
  const adminPhone = '777000111';
  const exploitAttempt = await req('/api/auth/quick-customer', {
    method: 'POST',
    body: JSON.stringify({ phone: adminPhone, name: 'Attacker Attempting Elevation' })
  });

  assert(exploitAttempt.status === 403, `Quick customer login with admin phone (${adminPhone}) rejected with HTTP 403 Forbidden`);
  assert(exploitAttempt.json?.success === false, 'Response has success: false');
  assert(!exploitAttempt.json?.token, 'No authentication token issued for admin phone via quick customer login');

  // Verify the admin account in D1 was NOT altered by the attempt
  const ownerAccount = await d1.findUserByPhoneAsync(adminPhone);
  if (ownerAccount) {
    assert(ownerAccount.role === 'owner', 'Owner role in database remained strictly "owner"');
    assert(!ownerAccount.name.includes('Attacker'), 'Owner name was NOT modified by the attack attempt');
  }

  // Legitimate Customer Login receives role: 'customer' strictly
  const legitimatePhone = '773344556';
  const customerLogin = await req('/api/auth/quick-customer', {
    method: 'POST',
    body: JSON.stringify({ phone: legitimatePhone, name: 'عميل الفحص الدوري' })
  });
  assert(customerLogin.status === 200, 'Legitimate customer login succeeds with HTTP 200');
  assert(customerLogin.json?.user?.role === 'customer', 'Customer token has role strictly set to "customer"');

  // -------------------------------------------------------------------
  // 2. ORDER TRACKING ENUMERATION & PRIVACY AUDIT (/api/orders/track/:query)
  // -------------------------------------------------------------------
  console.log('\n--- 2. ORDER TRACKING ENUMERATION & PRIVACY AUDIT ---');
  // 2.1 Substring / Short probing must be rejected
  const shortProbe = await req('/api/orders/track/12');
  assert(shortProbe.status === 400, 'Short query probe (track/12) rejected with HTTP 400');

  const partialProbe = await req('/api/orders/track/88');
  assert(partialProbe.status === 400, 'Partial 2-digit probe rejected with HTTP 400');

  // 2.2 Non-existent order must return 404
  const notFoundProbe = await req('/api/orders/track/BG-2026-99999999');
  assert(notFoundProbe.status === 404, 'Non-existent order query returns HTTP 404');

  // 2.3 Fetch a real order to test tracking privacy
  const allOrders = await d1.getOrdersAsync();
  const sampleOrder = allOrders?.[0];

  if (sampleOrder) {
    const validTrack = await req(`/api/orders/track/${sampleOrder.orderNumber}`);
    assert(validTrack.status === 200, `Exact order tracking for (${sampleOrder.orderNumber}) succeeds with HTTP 200`);
    
    const trackData = validTrack.json?.data;
    assert(Boolean(trackData?.orderNumber), 'Returns orderNumber');
    assert(Boolean(trackData?.status), 'Returns order status');
    assert(Array.isArray(trackData?.timeline), 'Returns public milestones timeline');

    // PRIVACY VERIFICATION: Sensitive fields must NOT exist in public response
    assert(!trackData?.customerPhone, 'Customer phone number is NOT exposed in public tracking');
    assert(!trackData?.driverName, 'Delivery driver name is NOT exposed in public tracking');
    assert(!trackData?.driverPhone, 'Delivery driver phone is NOT exposed in public tracking');
    assert(!trackData?.street, 'Street address is NOT exposed in public tracking');
  }

  // -------------------------------------------------------------------
  // 3. CLOUDFLARE D1 READ-ONLY ARCHITECTURAL INTEGRITY
  // -------------------------------------------------------------------
  console.log('\n--- 3. CLOUDFLARE D1 INTEGRITY & VERCEL READINESS ---');
  assert(d1.isD1Configured(), 'Cloudflare D1 is actively configured with valid credentials');
  
  const tablesRow = await d1.executeCloudflareD1Query("SELECT count(*) as count FROM sqlite_master WHERE type='table';");
  const tableCount = Number(tablesRow?.[0]?.count ?? 0);
  assert(tableCount >= 10, `Database has ${tableCount} authoritative operational tables in Cloudflare D1`);

  const products = await d1.getProductsAsync();
  assert(Array.isArray(products) && products.length > 0, `Products table returned ${products.length} live products`);

  // -------------------------------------------------------------------
  // 4. NON-DESTRUCTIVE CONCURRENCY & ADJUSTMENT AUDIT
  // -------------------------------------------------------------------
  console.log('\n--- 4. INVENTORY ADJUSTMENT ATOMICITY (ZERO NET CHANGE) ---');
  const targetProduct = products[0];
  const initialStock = targetProduct.stock;

  const adminToken = generateToken({
    userId: 'usr-ci-auditor',
    role: 'owner',
    phone: '777000111',
    name: 'فاحص النظام الآلي'
  });

  // Step 1: Add +1 unit
  const addRes = await req('/api/inventory/adjust', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      productId: targetProduct.id,
      type: 'purchase',
      quantity: 1,
      reason: 'فحص تكاملي آلي غير تدميري (+1)',
      performedBy: 'CI Safe Runner'
    })
  });
  assert(addRes.status === 200, 'Relative atomic stock increment (+1) succeeded in D1');

  // Step 2: Immediately Subtract -1 unit (Exact Zero Net Change!)
  const subRes = await req('/api/inventory/adjust', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      productId: targetProduct.id,
      type: 'damage',
      quantity: 1,
      reason: 'إلغاء أثر الفحص التكاملي الآلي (-1)',
      performedBy: 'CI Safe Runner'
    })
  });
  assert(subRes.status === 200, 'Relative atomic stock decrement (-1) succeeded in D1');

  // Verify stock is restored to EXACT initial value
  const finalProduct = await d1.findProductByIdAsync(targetProduct.id);
  assert(finalProduct?.stock === initialStock, `Stock in D1 verified at EXACT initial value (${finalProduct?.stock} === ${initialStock}) with zero net drift`);

  console.log('\n======================================================================');
  console.log(`📊 SAFE CI AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runSafeCiTests().catch(err => {
  console.error('Fatal Safe CI error:', err);
  process.exit(1);
});
