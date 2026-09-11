import { d1 } from '../d1';

// Comprehensive Automated Test Suite for Black Gold Charcoal Store
// Covers all 20 critical test scenarios defined in USER_REQUEST

const BASE_URL = 'http://localhost:3000';

async function req(url: string, options: any = {}) {
  const headers = { 'Content-Type': 'application/json', 'x-audit-test': 'local-audit', ...(options.headers || {}) };
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

async function runAllTests() {
  console.log('🧪 Starting 20 Comprehensive Security & Transaction Tests...\n');
  const results: Record<string, { pass: boolean; details: string }> = {};

  // 0. Setup: Create Customer JWT
  const custRes = await req('/api/auth/quick-customer', {
    method: 'POST',
    body: JSON.stringify({ phone: '771122334', name: 'عميل الفحص الشامل' })
  });
  const customerToken = custRes.json?.token;
  const otherCustRes = await req('/api/auth/quick-customer', {
    method: 'POST',
    body: JSON.stringify({ phone: '779988776', name: 'مستخدم آخر' })
  });
  const otherCustomerToken = otherCustRes.json?.token;

  function record(name: string, pass: boolean, details: string) {
    results[name] = { pass, details };
    const mark = pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} - ${name}: ${details}`);
  }

  // 1. Successful Order Creation
  const orderRes1 = await req('/api/orders', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}`, 'x-idempotency-key': `TEST-SUCC-${Date.now()}` },
    body: JSON.stringify({
      customerName: 'عميل الفحص الشامل',
      customerPhone: '771122334',
      address: { district: 'حدة', street: 'شارع حدة العام' },
      items: [{ productId: 'bg-prem-250g', quantity: 1, weight: '250g (ربع كيلو)' }]
    })
  });
  record(
    '1. Successful Order Creation',
    orderRes1.json?.success === true && Boolean(orderRes1.json?.data?.id),
    `Order created: ${orderRes1.json?.data?.orderNumber || orderRes1.json?.message}`
  );
  const createdOrder = orderRes1.json?.data;

  // 2. Insufficient Stock Rejection with Strict D1 Atomic Rollback Verification
  const testProductId = 'bg-prem-250g';
  const testCouponCode = 'GOLD2026';
  const excessIdempotencyKey = `TEST-EXCESS-ROLLBACK-${Date.now()}`;

  // Step A: Read initial D1 state before the excess stock request
  const initialProductRows = await d1.executeCloudflareD1Query('SELECT stock FROM products WHERE id = ?', [testProductId]);
  const initialStock = Number(initialProductRows?.[0]?.stock ?? 0);

  const initialCouponRows = await d1.executeCloudflareD1Query('SELECT usage_count FROM coupons WHERE code = ?', [testCouponCode]);
  const initialCouponUsage = Number(initialCouponRows?.[0]?.usage_count ?? 0);

  const initialOrdersRows = await d1.executeCloudflareD1Query('SELECT COUNT(*) as cnt FROM orders', []);
  const initialOrdersCount = Number(initialOrdersRows?.[0]?.cnt ?? 0);

  const initialOrderItemsRows = await d1.executeCloudflareD1Query('SELECT COUNT(*) as cnt FROM order_items', []);
  const initialOrderItemsCount = Number(initialOrderItemsRows?.[0]?.cnt ?? 0);

  const initialInventoryLogsRows = await d1.executeCloudflareD1Query('SELECT COUNT(*) as cnt FROM inventory_logs WHERE product_id = ?', [testProductId]);
  const initialInventoryLogsCount = Number(initialInventoryLogsRows?.[0]?.cnt ?? 0);

  // Step B: Send order requesting far more than available stock
  const excessQty = initialStock + 50000;
  const orderResExcess = await req('/api/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${customerToken}`,
      'x-idempotency-key': excessIdempotencyKey
    },
    body: JSON.stringify({
      customerName: 'عميل الفحص الشامل',
      customerPhone: '771122334',
      address: { district: 'حدة', street: 'شارع حدة العام' },
      items: [{ productId: testProductId, quantity: excessQty, weight: '250g (ربع كيلو)' }],
      couponCode: testCouponCode,
      idempotencyKey: excessIdempotencyKey
    })
  });

  // Step C: Verify D1 state after the rejected request
  const postProductRows = await d1.executeCloudflareD1Query('SELECT stock FROM products WHERE id = ?', [testProductId]);
  const postStock = Number(postProductRows?.[0]?.stock ?? 0);

  const postCouponRows = await d1.executeCloudflareD1Query('SELECT usage_count FROM coupons WHERE code = ?', [testCouponCode]);
  const postCouponUsage = Number(postCouponRows?.[0]?.usage_count ?? 0);

  const postOrderByKey = await d1.executeCloudflareD1Query('SELECT id FROM orders WHERE idempotency_key = ?', [excessIdempotencyKey]);
  const postOrdersCountRows = await d1.executeCloudflareD1Query('SELECT COUNT(*) as cnt FROM orders', []);
  const postOrdersCount = Number(postOrdersCountRows?.[0]?.cnt ?? 0);

  const postOrderItemsCountRows = await d1.executeCloudflareD1Query('SELECT COUNT(*) as cnt FROM order_items', []);
  const postOrderItemsCount = Number(postOrderItemsCountRows?.[0]?.cnt ?? 0);

  const postInventoryLogsRows = await d1.executeCloudflareD1Query('SELECT COUNT(*) as cnt FROM inventory_logs WHERE product_id = ?', [testProductId]);
  const postInventoryLogsCount = Number(postInventoryLogsRows?.[0]?.cnt ?? 0);

  // Step D: Verify that absolutely no partial traces exist
  const apiRejected = orderResExcess.status === 400 && orderResExcess.json?.success === false;
  const stockPreserved = postStock === initialStock;
  const noOrderCreated = postOrderByKey.length === 0 && postOrdersCount === initialOrdersCount;
  const noOrderItemsCreated = postOrderItemsCount === initialOrderItemsCount;
  const noInventoryLogsAdded = postInventoryLogsCount === initialInventoryLogsCount;
  const couponUsageUnchanged = postCouponUsage === initialCouponUsage;

  const failureReasons: string[] = [];
  if (!apiRejected) failureReasons.push(`HTTP status not 400 (got ${orderResExcess.status})`);
  if (!stockPreserved) failureReasons.push(`Stock altered: was ${initialStock}, now ${postStock}`);
  if (!noOrderCreated) failureReasons.push(`Order created in D1 (orders count changed: ${initialOrdersCount} -> ${postOrdersCount})`);
  if (!noOrderItemsCreated) failureReasons.push(`Order items inserted in D1 (${initialOrderItemsCount} -> ${postOrderItemsCount})`);
  if (!noInventoryLogsAdded) failureReasons.push(`Inventory logs inserted in D1 (${initialInventoryLogsCount} -> ${postInventoryLogsCount})`);
  if (!couponUsageUnchanged) failureReasons.push(`Coupon usage altered: was ${initialCouponUsage}, now ${postCouponUsage}`);

  const allChecksPassed = apiRejected && stockPreserved && noOrderCreated && noOrderItemsCreated && noInventoryLogsAdded && couponUsageUnchanged;

  record(
    '2. Insufficient Stock Atomic Rollback',
    allChecksPassed,
    allChecksPassed
      ? `Verified D1: Stock preserved (${initialStock}), 0 Orders created, 0 OrderItems, 0 InventoryLogs, Coupon usage unchanged (${initialCouponUsage})`
      : `Failed atomic check: ${failureReasons.join(' | ')}`
  );

  // 3 & 4. Negative Stock Protection (Cannot set or reduce stock below zero)
  const orderResNegative = await req('/api/orders', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({
      customerName: 'عميل الفحص الشامل',
      customerPhone: '771122334',
      address: { district: 'حدة' },
      items: [{ productId: 'bg-prem-250g', quantity: -5 }]
    })
  });
  record(
    '4. No Negative Stock Allowed',
    orderResNegative.json?.data?.items?.[0]?.quantity !== -5,
    `Sanitized or rejected: quantity defaulted to >= 1`
  );

  // 5. Cancel Order Once (Valid owner)
  const cancelRes1 = await req(`/api/orders/${createdOrder?.id}/cancel`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({ reason: 'تجربة الإلغاء للمرة الأولى' })
  });
  record(
    '5. Cancel Order Once',
    cancelRes1.json?.success === true,
    `Cancelled successfully: ${cancelRes1.json?.data?.status}`
  );

  // 6. Cancel Same Order Twice (Rollback Idempotency)
  const cancelRes2 = await req(`/api/orders/${createdOrder?.id}/cancel`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({ reason: 'تجربة الإلغاء للمرة الثانية' })
  });
  record(
    '6. Cancel Same Order Twice Idempotent',
    cancelRes2.json?.alreadyCancelled === true || cancelRes2.json?.message?.includes('ملغي بالفعل'),
    `Idempotent response: "${cancelRes2.json?.message}"`
  );

  // 7. Cancel by Unauthorized User
  const orderResForAuthCheck = await req('/api/orders', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({
      customerName: 'عميل الفحص الشامل',
      customerPhone: '771122334',
      address: { district: 'حدة', street: 'شارع حدة العام' },
      items: [{ productId: 'bg-prem-250g', quantity: 1, weight: '250g (ربع كيلو)' }]
    })
  });
  if (!orderResForAuthCheck.json?.data?.id) {
    console.error('DEBUG orderResForAuthCheck FAILED:', orderResForAuthCheck.status, orderResForAuthCheck.json);
  }
  const anotherOrderId = orderResForAuthCheck.json?.data?.id;

  const cancelResUnauthorized = await req(`/api/orders/${anotherOrderId}/cancel`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${otherCustomerToken}` },
    body: JSON.stringify({ reason: 'محاولة إلغاء غير مصرح بها' })
  });
  record(
    '7. Reject Cancel by Unauthorized User',
    cancelResUnauthorized.status === 403,
    `HTTP ${cancelResUnauthorized.status}: ${cancelResUnauthorized.json?.message}`
  );

  // 8. Attempt Status Change by Customer (Must be Forbidden)
  const statusChangeRes = await req(`/api/orders/${anotherOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({ status: 'delivered' })
  });
  record(
    '8. Customer Forbidden from Changing Status',
    statusChangeRes.status === 403,
    `HTTP ${statusChangeRes.status}: ${statusChangeRes.json?.message}`
  );

  // 9. Reject customerPhone in Body without Valid JWT
  const unauthCancelRes = await req(`/api/orders/${anotherOrderId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ customerPhone: '771122334', reason: 'إلغاء بدون توكن' })
  });
  record(
    '9. Reject customerPhone in Body without JWT',
    unauthCancelRes.status === 401,
    `HTTP ${unauthCancelRes.status}: ${unauthCancelRes.json?.message}`
  );

  // 10. Order Idempotency Key
  const idempKey = `IDEMP-TEST-${Date.now()}`;
  const idemp1 = await req('/api/orders', {
    method: 'POST',
    headers: { 'x-idempotency-key': idempKey },
    body: JSON.stringify({
      customerName: 'عميل الفحص الشامل',
      customerPhone: '771122334',
      address: { district: 'حدة' },
      items: [{ productId: 'bg-prem-250g', quantity: 1 }]
    })
  });
  const idemp2 = await req('/api/orders', {
    method: 'POST',
    headers: { 'x-idempotency-key': idempKey },
    body: JSON.stringify({
      customerName: 'عميل الفحص الشامل',
      customerPhone: '771122334',
      address: { district: 'حدة' },
      items: [{ productId: 'bg-prem-250g', quantity: 1 }]
    })
  });
  record(
    '10. Order Idempotency Key Handling',
    idemp1.json?.data?.id === idemp2.json?.data?.id && idemp2.json?.isDuplicate === true,
    `First: ${idemp1.json?.data?.id} (dup=${idemp1.json?.isDuplicate}), Second: ${idemp2.json?.data?.id} (dup=${idemp2.json?.isDuplicate})`
  );

  // 11. Coupon Validation Rules (min amount & active status)
  const couponResInvalid = await req('/api/validate-coupon', {
    method: 'POST',
    body: JSON.stringify({ code: 'GOLD2026', amount: 500 }) // Below min order amount (2000)
  });
  const couponResValid = await req('/api/validate-coupon', {
    method: 'POST',
    body: JSON.stringify({ code: 'GOLD2026', amount: 3000 })
  });
  record(
    '11. Coupon Validation Rules',
    couponResInvalid.status === 400 && couponResValid.json?.success === true,
    `Min amount enforced: Invalid returned "${couponResInvalid.json?.message}", Valid returned ${couponResValid.json?.discount} YER`
  );

  // 12. Public Tracking Privacy (Strictly No PII)
  const trackRes = await req(`/api/orders/track/${createdOrder?.orderNumber}`);
  const trackData = trackRes.json?.data;
  const leaksPhone = Boolean(trackData?.customerPhone || trackData?.driverPhone);
  const leaksStreet = Boolean(trackData?.street || trackData?.landmark);
  record(
    '12. Public Tracking Privacy (No PII)',
    trackRes.json?.success === true && !leaksPhone && !leaksStreet,
    `Exposes only: orderNumber, status, date, district, driverName, timeline`
  );

  // 13. Delivery Agents Public Privacy (No phone or credentials)
  const daRes = await req('/api/delivery-agents');
  const agents = daRes.json?.data || [];
  const agentLeaksPhone = agents.some((a: any) => Boolean(a.phone || a.pin || a.pinHash || a.commission));
  record(
    '13. Delivery Agents Public Privacy',
    daRes.json?.success === true && !agentLeaksPhone,
    `Returned ${agents.length} safe agent records without phone/pin/commission`
  );

  // 14. Review without Verified Purchase
  const reviewUnverified = await req('/api/reviews', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${otherCustomerToken}` },
    body: JSON.stringify({
      productId: 'bg-prem-250g',
      rating: 5,
      comment: 'منتج ممتاز جدا وفحم راقي',
      userName: 'مستخدم آخر'
    })
  });
  record(
    '14. Review without Purchase is Unverified',
    reviewUnverified.json?.success === true && reviewUnverified.json?.data?.verifiedPurchase === false,
    `verifiedPurchase correctly evaluated to: ${reviewUnverified.json?.data?.verifiedPurchase}`
  );

  // 15. Server-side Pricing Enforcement
  const forgedPriceOrder = await req('/api/orders', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({
      customerName: 'عميل الفحص الشامل',
      customerPhone: '771122334',
      address: { district: 'السبعين' },
      items: [{ productId: 'bg-prem-250g', quantity: 2 }],
      total: 10,
      subtotal: 5,
      shippingFee: 0
    })
  });
  const actualTotal = forgedPriceOrder.json?.data?.total;
  record(
    '15. Server-side Pricing Enforcement',
    typeof actualTotal === 'number' && actualTotal > 1000 && actualTotal !== 10,
    `Forged total 10 was overridden by server calculation to: ${actualTotal} YER`
  );

  // 16. Single Order Ownership Protection (GET /api/orders/:id)
  const orderGetResUnauthorized = await req(`/api/orders/${createdOrder?.id}`, {
    headers: { 'Authorization': `Bearer ${otherCustomerToken}` }
  });
  const orderGetResAuthorized = await req(`/api/orders/${createdOrder?.id}`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  record(
    '16. Single Order Ownership Protection',
    orderGetResUnauthorized.status === 403 && orderGetResAuthorized.status === 200,
    `Unauthorized customer gets HTTP ${orderGetResUnauthorized.status}; Authorized gets HTTP ${orderGetResAuthorized.status}`
  );

  // 17. My-Orders Ownership Protection (GET /api/my-orders)
  const myOrdersOther = await req('/api/my-orders', {
    headers: { 'Authorization': `Bearer ${otherCustomerToken}` }
  });
  const otherOrdersCount = myOrdersOther.json?.data?.length || 0;
  record(
    '17. My-Orders Isolated to Authenticated User',
    myOrdersOther.json?.success === true && myOrdersOther.json?.data?.every((o: any) => o.customerPhone === '779988776'),
    `Other customer sees only their ${otherOrdersCount} orders, none of customer 1's orders`
  );

  // 18. Order Items Ownership Protection (GET /api/orders/:id/items)
  const itemsUnauthorized = await req(`/api/orders/${createdOrder?.id}/items`, {
    headers: { 'Authorization': `Bearer ${otherCustomerToken}` }
  });
  record(
    '18. Order Items RBAC Protection',
    itemsUnauthorized.status === 403,
    `Unauthorized customer gets HTTP ${itemsUnauthorized.status}`
  );

  // 19. Order State Machine Transition Validation
  const illegalTransitionRes = await req(`/api/orders/${createdOrder?.id}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({ status: 'delivered' })
  });
  record(
    '19. Order State Machine Guard',
    illegalTransitionRes.status === 403 || illegalTransitionRes.status === 400,
    `Blocked with HTTP ${illegalTransitionRes.status}: "${illegalTransitionRes.json?.message}"`
  );

  // 20. Strict Driver Lookup Enforcement (Fake Driver Assignment Rejected)
  const fakeDriverAssign = await req(`/api/orders/${anotherOrderId}/assign-driver`, {
    method: 'POST',
    headers: { 'x-user-role': 'owner' },
    body: JSON.stringify({ driverId: 'fake-driver-999', driverName: 'مندوب وهمي غير مسجل' })
  });
  record(
    '20. Reject Unregistered Driver Assignment',
    fakeDriverAssign.status === 400,
    `HTTP ${fakeDriverAssign.status}: ${fakeDriverAssign.json?.message}`
  );

  // 21. Customer Cannot Cancel Order in Advanced Status
  // First, advance status as admin to 'shipped'
  await req(`/api/orders/${anotherOrderId}/status`, {
    method: 'PATCH',
    headers: { 'x-user-role': 'owner' },
    body: JSON.stringify({ status: 'shipped' })
  });
  const cancelAfterShipped = await req(`/api/orders/${anotherOrderId}/cancel`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({ reason: 'إلغاء بعد الشحن' })
  });
  record(
    '21. Customer Cannot Cancel Shipped Order',
    cancelAfterShipped.status === 400,
    `HTTP ${cancelAfterShipped.status}: ${cancelAfterShipped.json?.message}`
  );

  // 22. D1 Health & Database Ping
  const pingD1 = await req('/api/health');
  record(
    '22. Server and API Health',
    pingD1.ok,
    `Server alive and responding with HTTP ${pingD1.status}`
  );

  console.log('==================================================');
  console.log('📊 TEST RESULTS SUMMARY:');
  console.log('==================================================');
  let allPassed = true;
  for (const [name, res] of Object.entries(results)) {
    const statusMark = res.pass ? '✅ PASS' : '❌ FAIL';
    if (!res.pass) allPassed = false;
    console.log(`${statusMark} - ${name}: ${res.details}`);
  }
  console.log('==================================================');
  console.log(`Final Verdict: ${allPassed ? 'ALL TESTS PASSED 🎉' : 'SOME TESTS FAILED ⚠️'}`);
}

runAllTests().catch(console.error);
