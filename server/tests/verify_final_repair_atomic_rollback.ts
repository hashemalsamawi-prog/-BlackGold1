import { d1 } from '../d1';
import { generateToken, hashSecret } from '../security';

const BASE_URL = 'http://localhost:3000';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${msg}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${msg}`);
    failedCount++;
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

async function runFinalRepairVerification() {
  console.log('======================================================================');
  console.log('🧪 FINAL AUDIT & VERIFICATION SUITE: BLACK GOLD STORE');
  console.log('======================================================================\n');

  await d1.init();

  // Tokens setup
  const adminToken = generateToken({
    userId: 'usr-admin-final-audit',
    role: 'owner',
    phone: '777000111',
    name: 'مالك المتجر التنفيذي'
  });

  const testCustomerPhone = '771998877';
  const testCustomerName = 'المهندس عبد الرحمن الصالحي';
  const custRes = await req('/api/auth/quick-customer', {
    method: 'POST',
    body: JSON.stringify({ phone: testCustomerPhone, name: testCustomerName })
  });
  const customerToken = custRes.json?.token;

  // -------------------------------------------------------------------
  // TEST 1: Real Cloudflare D1 Connection Deep Inspection
  // -------------------------------------------------------------------
  console.log('--- 1. REAL CLOUDFLARE D1 DEEP CONNECTIVITY CHECK ---');
  assert(d1.isD1Configured(), 'Cloudflare D1 is actively configured with valid credentials');
  
  const tablesRow = await d1.executeCloudflareD1Query("SELECT count(*) as count FROM sqlite_master WHERE type='table';");
  const tableCount = Number(tablesRow?.[0]?.count ?? 0);
  assert(tableCount >= 8, `Direct SQL query to Cloudflare D1 successful (detected ${tableCount} tables in D1)`);

  const prodCheck = await d1.executeCloudflareD1Query("SELECT COUNT(*) as count FROM products;");
  const d1ProductsCount = Number(prodCheck?.[0]?.count ?? 0);
  assert(d1ProductsCount > 0, `Direct query to Cloudflare D1 products table returned ${d1ProductsCount} products`);

  const testProductId = 'bg-prem-250g';
  const baseProductRow = await d1.executeCloudflareD1Query("SELECT stock FROM products WHERE id = ?;", [testProductId]);
  const initialD1Stock = Number(baseProductRow?.[0]?.stock ?? 0);
  console.log(`  ℹ️ Initial D1 Stock for (${testProductId}): ${initialD1Stock}`);

  // -------------------------------------------------------------------
  // TEST 2: Successful Order Cancellation & Single Stock Restoration
  // -------------------------------------------------------------------
  console.log('\n--- 2. ORDER CANCELLATION & ATOMIC STOCK RESTORATION ---');
  const orderQuantity = 3;
  const orderCreateRes = await req('/api/orders', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({
      customerName: testCustomerName,
      customerPhone: testCustomerPhone,
      address: { district: 'حدة', street: 'شارع حدة العام' },
      items: [{ productId: testProductId, quantity: orderQuantity, weight: '250g' }]
    })
  });

  assert(orderCreateRes.status === 200, 'Order created successfully');
  const createdOrderId = orderCreateRes.json?.data?.id;
  const createdOrderNum = orderCreateRes.json?.data?.orderNumber;

  // Verify stock decremented in D1
  const postOrderStockRow = await d1.executeCloudflareD1Query("SELECT stock FROM products WHERE id = ?;", [testProductId]);
  const postOrderStock = Number(postOrderStockRow?.[0]?.stock ?? 0);
  assert(postOrderStock === initialD1Stock - orderQuantity, `Stock in D1 decremented accurately from ${initialD1Stock} to ${postOrderStock}`);

  // Cancel Order via API
  const cancelRes = await req(`/api/orders/${createdOrderId}/cancel`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({ reason: 'تجربة الإلغاء الذري واسترجاع المخزون' })
  });

  assert(cancelRes.status === 200, 'Order cancelled successfully via /api/orders/:id/cancel');
  assert(cancelRes.json?.data?.status === 'cancelled', 'Order status is "cancelled" in API response');

  // Verify stock in D1 restored back to initialD1Stock
  const postCancelStockRow = await d1.executeCloudflareD1Query("SELECT stock FROM products WHERE id = ?;", [testProductId]);
  const postCancelStock = Number(postCancelStockRow?.[0]?.stock ?? 0);
  assert(postCancelStock === initialD1Stock, `Stock in D1 restored exactly once back to initial stock (${postCancelStock} === ${initialD1Stock})`);

  // Verify D1 order state
  const d1OrderRow = await d1.executeCloudflareD1Query("SELECT status, is_stock_rolled_back FROM orders WHERE id = ?;", [createdOrderId]);
  assert(d1OrderRow?.[0]?.status === 'cancelled', 'Order status in D1 is "cancelled"');
  assert(Number(d1OrderRow?.[0]?.is_stock_rolled_back) === 1, 'is_stock_rolled_back in D1 is set to 1');

  // Verify inventory_logs in D1
  const rollbackLogs = await d1.executeCloudflareD1Query(
    "SELECT * FROM inventory_logs WHERE order_id = ? AND type = 'STOCK_ROLLBACK';",
    [createdOrderId]
  );
  assert(rollbackLogs.length === 1, `Exactly 1 STOCK_ROLLBACK record in D1 inventory_logs for order ${createdOrderId}`);
  assert(Number(rollbackLogs[0]?.quantity) === orderQuantity, `Rollback quantity recorded as ${orderQuantity}`);

  // -------------------------------------------------------------------
  // TEST 3: Duplicate Cancellation Idempotency (No Double Restoration)
  // -------------------------------------------------------------------
  console.log('\n--- 3. DUPLICATE CANCELLATION IDEMPOTENCY ---');
  const secondCancelRes = await req(`/api/orders/${createdOrderId}/cancel`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({ reason: 'محاولة إلغاء ثانية لنفس الطلب' })
  });

  assert(secondCancelRes.status === 200, 'Duplicate cancel returns HTTP 200 without error');
  assert(secondCancelRes.json?.alreadyCancelled === true, 'Response flags alreadyCancelled: true');

  // Check stock again in D1
  const stockAfterSecondCancel = await d1.executeCloudflareD1Query("SELECT stock FROM products WHERE id = ?;", [testProductId]);
  assert(Number(stockAfterSecondCancel?.[0]?.stock) === initialD1Stock, 'Stock NOT restored a second time upon duplicate cancellation');

  // Check inventory_logs count in D1
  const rollbackLogsAfterSecond = await d1.executeCloudflareD1Query(
    "SELECT COUNT(*) as cnt FROM inventory_logs WHERE order_id = ? AND type = 'STOCK_ROLLBACK';",
    [createdOrderId]
  );
  assert(Number(rollbackLogsAfterSecond?.[0]?.cnt) === 1, 'Still exactly 1 STOCK_ROLLBACK audit log (zero duplicate logs)');

  // -------------------------------------------------------------------
  // TEST 4: Order Cancellation with No Items Aborts & Throws Clear Error
  // -------------------------------------------------------------------
  console.log('\n--- 4. CANCELLATION WITH NO ITEMS TO RESTORE ---');
  const emptyOrderMock: any = {
    id: `ord-empty-test-${Date.now()}`,
    orderNumber: `BG-EMPTY-${Date.now().toString().slice(-4)}`,
    status: 'received',
    items: [],
    isStockRolledBack: false
  };

  let caughtEmptyError = false;
  let emptyErrorMessage = '';
  try {
    await d1.executeStockRollback(emptyOrderMock, 'فحص الأصناف الفارغة');
  } catch (err: any) {
    caughtEmptyError = true;
    emptyErrorMessage = err.message;
  }

  assert(caughtEmptyError, 'executeStockRollback threw error when order has no items to rollback');
  assert(emptyErrorMessage.includes('لا توجد أصناف قابلة للاسترجاع'), `Clear Arabic error returned: "${emptyErrorMessage}"`);
  assert(emptyOrderMock.isStockRolledBack === false, 'isStockRolledBack remains false on empty items failure');
  assert(emptyOrderMock.status === 'received', 'Order status was NOT changed to cancelled on empty items failure');

  // -------------------------------------------------------------------
  // TEST 5: Atomic Failure Simulation - No Partial Inconsistent State
  // -------------------------------------------------------------------
  console.log('\n--- 5. D1 BATCH FAILURE SIMULATION & ATOMIC INTEGRITY ---');
  // Spy on executeCloudflareD1BatchRaw to simulate transient D1 failure
  const originalBatchRaw = d1.executeCloudflareD1BatchRaw.bind(d1);
  let simulatedFailureTriggered = false;

  (d1 as any).executeCloudflareD1BatchRaw = async () => {
    simulatedFailureTriggered = true;
    return { success: false, errors: [{ code: 19, message: 'D1 Simulated Disk Failure / Trigger Constraint' }] };
  };

  const failTestOrder: any = {
    id: `ord-fail-sim-${Date.now()}`,
    orderNumber: `BG-FAIL-SIM-${Date.now().toString().slice(-4)}`,
    status: 'pending',
    items: [{ productId: testProductId, quantity: 2, productNameAr: 'فحم تجريبي' }],
    isStockRolledBack: false
  };

  const stockBeforeSimulatedFail = (await d1.findProductByIdAsync(testProductId))?.stock ?? 0;
  let caughtSimulatedError = false;

  try {
    await d1.executeStockRollback(failTestOrder, 'اختبار فشل D1');
  } catch (err: any) {
    caughtSimulatedError = true;
  } finally {
    // Restore original method immediately
    (d1 as any).executeCloudflareD1BatchRaw = originalBatchRaw;
  }

  assert(simulatedFailureTriggered, 'Simulated D1 batch failure was triggered');
  assert(caughtSimulatedError, 'executeStockRollback aborted and threw error upon D1 batch failure');
  assert(failTestOrder.isStockRolledBack === false, 'Order was NOT marked isStockRolledBack = true in memory');
  assert(failTestOrder.status === 'pending', 'Order status remained "pending" (NOT set to cancelled)');
  
  const stockAfterSimulatedFail = (await d1.findProductByIdAsync(testProductId))?.stock ?? 0;
  assert(stockAfterSimulatedFail === stockBeforeSimulatedFail, 'Product stock was NOT modified upon D1 failure');

  // -------------------------------------------------------------------
  // TEST 6: New Order Creation & Single Stock Deduction (Idempotency)
  // -------------------------------------------------------------------
  console.log('\n--- 6. ORDER CREATION IDEMPOTENCY & SINGLE STOCK DEDUCTION ---');
  const idempKey = `IDEMP-FINAL-${Date.now()}`;
  const preIdempStockRow = await d1.executeCloudflareD1Query("SELECT stock FROM products WHERE id = ?;", [testProductId]);
  const preIdempStock = Number(preIdempStockRow?.[0]?.stock ?? 0);

  const idempOrder1 = await req('/api/orders', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}`, 'x-idempotency-key': idempKey },
    body: JSON.stringify({
      customerName: testCustomerName,
      customerPhone: testCustomerPhone,
      address: { district: 'حدة' },
      items: [{ productId: testProductId, quantity: 2, weight: '250g' }]
    })
  });
  assert(idempOrder1.status === 200, 'First request with idempotency key creates order');
  assert(idempOrder1.json?.isDuplicate === false, 'First order has isDuplicate: false');

  const postIdemp1StockRow = await d1.executeCloudflareD1Query("SELECT stock FROM products WHERE id = ?;", [testProductId]);
  assert(Number(postIdemp1StockRow?.[0]?.stock) === preIdempStock - 2, 'Stock deducted by 2 for first order');

  // Send exact duplicate
  const idempOrder2 = await req('/api/orders', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}`, 'x-idempotency-key': idempKey },
    body: JSON.stringify({
      customerName: testCustomerName,
      customerPhone: testCustomerPhone,
      address: { district: 'حدة' },
      items: [{ productId: testProductId, quantity: 2, weight: '250g' }]
    })
  });
  assert(idempOrder2.status === 200, 'Second request with same idempotency key returns HTTP 200');
  assert(idempOrder2.json?.isDuplicate === true, 'Second order flagged as isDuplicate: true');
  assert(idempOrder2.json?.data?.id === idempOrder1.json?.data?.id, 'Returned same order ID');

  const postIdemp2StockRow = await d1.executeCloudflareD1Query("SELECT stock FROM products WHERE id = ?;", [testProductId]);
  assert(Number(postIdemp2StockRow?.[0]?.stock) === preIdempStock - 2, 'Stock NOT deducted a second time');

  // Clean up order
  await req(`/api/orders/${idempOrder1.json?.data?.id}/cancel`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({ reason: 'تنظيف طلب اختبار المفتاح الذري' })
  });

  // -------------------------------------------------------------------
  // TEST 7: Owner & Driver Authentication & RBAC Hardening
  // -------------------------------------------------------------------
  console.log('\n--- 7. OWNER & DRIVER AUTHENTICATION & RBAC HARDENING ---');

  // 7.1 Owner Login with Wrong PIN rejected with 401
  const wrongAdminRes = await req('/api/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify({ phone: '777000111', pin: '000000_wrong' })
  });
  assert(wrongAdminRes.status === 401, 'Admin login with wrong PIN rejected with HTTP 401');

  // 7.2 Driver Login with Wrong PIN rejected with 401
  const wrongDriverRes = await req('/api/auth/driver-login', {
    method: 'POST',
    body: JSON.stringify({ phone: '771122445', pin: '000000_wrong' })
  });
  assert(wrongDriverRes.status === 401, 'Driver login with wrong PIN rejected with HTTP 401');

  // 7.3 Delivery Agent create and login with valid credentials
  const testDriverPhone = `7788${Date.now().toString().slice(-5)}`;
  const createAgentRes = await req('/api/delivery-agents', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      id: `da-audit-${Date.now().toString().slice(-4)}`,
      name: 'كابتن الفحص النهائي',
      phone: testDriverPhone,
      pin: '5566'
    })
  });
  assert(createAgentRes.status === 200, 'Admin creates delivery agent with PIN 5566');

  const driverLoginRes = await req('/api/auth/driver-login', {
    method: 'POST',
    body: JSON.stringify({ phone: testDriverPhone, pin: '5566' })
  });
  assert(driverLoginRes.status === 200, 'Driver logs in successfully with valid PIN');
  assert(driverLoginRes.json?.user?.role === 'delivery', 'Driver receives JWT with role "delivery"');
  const driverJwt = driverLoginRes.json?.token;

  // 7.4 RBAC: Driver forbidden from accessing admin reports
  const driverAdminReportRes = await req('/api/admin/reports', {
    headers: { 'Authorization': `Bearer ${driverJwt}` }
  });
  assert(driverAdminReportRes.status === 403, 'Driver blocked from admin reports with HTTP 403');

  // 7.5 RBAC: Header x-user-role CANNOT grant admin rights
  const spoofAdminRes = await req('/api/admin/reports', {
    headers: { 'x-user-role': 'owner' }
  });
  assert(spoofAdminRes.status === 401, 'Spoofed x-user-role header blocked with HTTP 401');

  // Clean up test driver
  await req(`/api/delivery-agents/${createAgentRes.json?.data?.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  // -------------------------------------------------------------------
  // TEST 8: Customers Loading, Names, Phones & Total Purchases
  // -------------------------------------------------------------------
  console.log('\n--- 8. CRM CUSTOMERS AGGREGATION & DATA INTEGRITY ---');
  const crmCustomersRes = await req('/api/crm/customers', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(crmCustomersRes.status === 200, 'GET /api/crm/customers returns HTTP 200');
  const crmList = crmCustomersRes.json?.data || [];
  assert(Array.isArray(crmList), 'Customers data returned as array');

  const foundCustomer = crmList.find((c: any) => c.phone.replace(/\D/g, '') === testCustomerPhone);
  assert(Boolean(foundCustomer), `Test customer (${testCustomerPhone}) found in CRM list`);
  assert(foundCustomer?.name === testCustomerName, `Customer name matches real name: "${foundCustomer?.name}"`);
  assert(typeof foundCustomer?.totalOrders === 'number', `Customer totalOrders is valid number (${foundCustomer?.totalOrders})`);
  assert(typeof foundCustomer?.totalSpent === 'number', `Customer totalSpent is valid number (${foundCustomer?.totalSpent} YER)`);

  console.log('\n======================================================================');
  console.log(`📊 FINAL REPAIR VERIFICATION: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('======================================================================');

  process.exit(failedCount > 0 ? 1 : 0);
}

runFinalRepairVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
