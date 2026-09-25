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
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  try {
    const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
    const text = await res.text();
    try {
      return { status: res.status, ok: res.ok, json: JSON.parse(text) };
    } catch {
      return { status: res.status, ok: res.ok, text };
    }
  } catch (err: any) {
    return { status: 500, ok: false, json: { success: false, message: err.message } };
  }
}

async function runCouponsDriversCustomersAudit() {
  console.log('======================================================================');
  console.log('🧪 Starting Dedicated Audit: Coupons, Drivers/Mandoub, & Customers');
  console.log('======================================================================\n');

  await d1.init();

  // Create management token for admin tests
  const adminToken = generateToken({
    userId: 'usr-admin-test',
    role: 'admin',
    phone: '770000000',
    name: 'مدير النظام'
  });

  // ===================================================================
  // SECTION 1: COUPONS (CRUD, Validation, Expiry, Min Amount, Usage & Rollback)
  // ===================================================================
  console.log('--- 1. COUPONS AUDIT ---');

  const testCode = `TESTCP${Date.now().toString().slice(-5)}`;

  // 1.1 Create Coupon (POST /api/coupons)
  const createCouponRes = await req('/api/coupons', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      code: testCode,
      discountPercent: 15,
      maxDiscount: 1500,
      minOrderAmount: 3000,
      validUntil: '2026-12-31',
      maxUses: 5,
      isActive: true
    })
  });
  assert(createCouponRes.status === 200, `Admin successfully creates coupon (${testCode})`);
  assert(createCouponRes.json?.data?.code === testCode, 'Created coupon code returned accurately');

  // Verify in D1
  const d1Coupon = await d1.findCouponAsync(testCode);
  assert(Boolean(d1Coupon), 'Coupon verified in Cloudflare D1 database');
  assert(d1Coupon?.discountPercent === 15, 'D1 coupon discount percent is 15%');
  assert(d1Coupon?.minOrderAmount === 3000, 'D1 coupon min order amount is 3000 YER');
  assert(d1Coupon?.maxUses === 5, 'D1 coupon max uses is 5');

  // 1.2 Read Coupons (GET /api/coupons)
  const getCouponsRes = await req('/api/coupons', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(getCouponsRes.status === 200, 'GET /api/coupons returns HTTP 200');
  const foundInList = Array.isArray(getCouponsRes.json?.data) && getCouponsRes.json.data.some((c: any) => c.code === testCode);
  assert(foundInList, 'Created coupon appears in coupons list');

  // 1.3 Update Coupon (PUT /api/coupons/:code)
  const updateCouponRes = await req(`/api/coupons/${testCode}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      discountPercent: 20,
      maxDiscount: 2000,
      minOrderAmount: 2500
    })
  });
  assert(updateCouponRes.status === 200, 'PUT /api/coupons/:code returns HTTP 200');
  const d1UpdatedCoupon = await d1.findCouponAsync(testCode);
  assert(d1UpdatedCoupon?.discountPercent === 20, 'D1 coupon discount percent updated to 20%');
  assert(d1UpdatedCoupon?.maxDiscount === 2000, 'D1 coupon max discount updated to 2000 YER');

  // 1.4 Coupon Validation: Min Order Amount Enforcement
  const minOrderFail = await req('/api/validate-coupon', {
    method: 'POST',
    body: JSON.stringify({ code: testCode, amount: 1500 }) // Below 2500 min
  });
  assert(minOrderFail.status === 400, 'Coupon rejected when order amount is below minimum');
  assert(minOrderFail.json?.message?.includes('الحد الأدنى'), 'Clear Arabic message explaining minimum order amount');

  // 1.5 Coupon Validation: Valid Order Calculation
  const validOrderCheck = await req('/api/validate-coupon', {
    method: 'POST',
    body: JSON.stringify({ code: testCode, amount: 4000 }) // 20% of 4000 is 800 <= max 2000
  });
  assert(validOrderCheck.status === 200, 'Valid coupon passes validation');
  assert(validOrderCheck.json?.discount === 800, 'Calculated discount matches 20% of 4,000 (800 YER)');

  // 1.6 Coupon Validation: Expiry Date Enforcement
  const expiredCode = `EXP${Date.now().toString().slice(-5)}`;
  await req('/api/coupons', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      code: expiredCode,
      discountPercent: 10,
      minOrderAmount: 1000,
      validUntil: '2020-01-01', // Expired!
      isActive: true
    })
  });
  const expiredCheck = await req('/api/validate-coupon', {
    method: 'POST',
    body: JSON.stringify({ code: expiredCode, amount: 5000 })
  });
  assert(expiredCheck.status === 400, 'Expired coupon rejected with HTTP 400');
  assert(expiredCheck.json?.message?.includes('منتهي'), 'Clear Arabic message for expired coupon');

  // 1.7 Coupon Validation: Inactive Status Enforcement
  const inactiveCode = `INACT${Date.now().toString().slice(-5)}`;
  await req('/api/coupons', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      code: inactiveCode,
      discountPercent: 10,
      minOrderAmount: 1000,
      isActive: false
    })
  });
  const inactiveCheck = await req('/api/validate-coupon', {
    method: 'POST',
    body: JSON.stringify({ code: inactiveCode, amount: 5000 })
  });
  assert(inactiveCheck.status === 400, 'Inactive coupon rejected with HTTP 400');

  // 1.8 Coupon Usage Increment on Order Creation & Rollback on Order Cancellation
  const usageBefore = (await d1.findCouponAsync(testCode))?.usageCount || 0;

  // Create order with coupon
  const custRes = await req('/api/auth/quick-customer', {
    method: 'POST',
    body: JSON.stringify({ phone: '772233445', name: 'مشتري الكوبون التجريبي' })
  });
  const custToken = custRes.json?.token;

  const orderRes = await req('/api/orders', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${custToken}` },
    body: JSON.stringify({
      customerName: 'مشتري الكوبون التجريبي',
      customerPhone: '772233445',
      address: { district: 'حدة', street: 'شارع بيروت' },
      items: [{ productId: 'bg-ignition-cubes', quantity: 1, weight: '1 علبة' }],
      couponCode: testCode
    })
  });
  assert(orderRes.status === 200, 'Order created successfully with coupon');
  const createdOrderId = orderRes.json?.data?.id;

  const usageAfterOrder = (await d1.findCouponAsync(testCode))?.usageCount || 0;
  assert(usageAfterOrder === usageBefore + 1, `Coupon usage count incremented in D1 from ${usageBefore} to ${usageAfterOrder}`);

  // Cancel order -> Coupon usage rollback
  const cancelRes = await req(`/api/orders/${createdOrderId}/cancel`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${custToken}` },
    body: JSON.stringify({ reason: 'إلغاء لاختبار استرجاع استخدام الكوبون' })
  });
  assert(cancelRes.status === 200, 'Order cancelled successfully');

  const usageAfterCancel = (await d1.findCouponAsync(testCode))?.usageCount || 0;
  assert(usageAfterCancel === usageBefore, `Coupon usage count accurately rolled back in D1 to ${usageAfterCancel}`);

  // 1.9 Delete Coupon (DELETE /api/coupons/:code)
  const delCouponRes = await req(`/api/coupons/${testCode}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(delCouponRes.status === 200, 'DELETE /api/coupons/:code returns HTTP 200');
  const d1DeletedCoupon = await d1.findCouponAsync(testCode);
  assert(!d1DeletedCoupon, 'Coupon verified deleted from Cloudflare D1');

  // ===================================================================
  // SECTION 2: DRIVERS / MANDOUB AUDIT (CRUD, Login, RBAC, Delivery & Collection)
  // ===================================================================
  console.log('\n--- 2. DRIVERS / MANDOUB AUDIT ---');

  const testDriverPhone = `7788${Date.now().toString().slice(-5)}`;
  const testDriverPin = '8899';
  const testDriverId = `da-test-${Date.now().toString().slice(-4)}`;

  // 2.1 Create Driver (POST /api/delivery-agents)
  const createDriverRes = await req('/api/delivery-agents', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      id: testDriverId,
      name: 'الكابتن مختار الصنعاني',
      phone: testDriverPhone,
      vehicleType: 'motorcycle',
      pin: testDriverPin,
      isActive: true
    })
  });
  assert(createDriverRes.status === 200, 'Admin creates driver in delivery_agents');

  // Verify driver in D1
  const d1Driver = await d1.findDeliveryAgentByIdAsync(testDriverId);
  assert(Boolean(d1Driver), 'Driver record verified in Cloudflare D1');
  assert(d1Driver?.name === 'الكابتن مختار الصنعاني', 'Driver name saved correctly');

  // 2.2 Driver Login (/api/auth/driver-login)
  const driverLoginRes = await req('/api/auth/driver-login', {
    method: 'POST',
    body: JSON.stringify({
      phone: testDriverPhone,
      pin: testDriverPin
    })
  });
  assert(driverLoginRes.status === 200, 'Driver logs in successfully with phone and PIN');
  assert(Boolean(driverLoginRes.json?.token), 'Driver receives authenticated JWT token');
  assert(driverLoginRes.json?.user?.role === 'delivery', 'Driver JWT has role: "delivery"');
  const driverToken = driverLoginRes.json?.token;

  // 2.3 Wrong PIN rejected
  const wrongPinRes = await req('/api/auth/driver-login', {
    method: 'POST',
    body: JSON.stringify({
      phone: testDriverPhone,
      pin: 'wrong-pin'
    })
  });
  assert(wrongPinRes.status === 401, 'Driver login with wrong PIN rejected with HTTP 401');

  // 2.4 Update Driver (PUT /api/delivery-agents/:id)
  const updateDriverRes = await req(`/api/delivery-agents/${testDriverId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      vehicleType: 'car'
    })
  });
  assert(updateDriverRes.status === 200, 'PUT /api/delivery-agents/:id returns HTTP 200');
  const d1UpdatedDriver = await d1.findDeliveryAgentByIdAsync(testDriverId);
  assert(d1UpdatedDriver?.vehicleType === 'car', 'Driver vehicle type updated to "car" in D1');

  // 2.5 Driver Order Assignment & RBAC Isolation
  // Create an order assigned to this driver
  const orderForDriverRes = await req('/api/orders', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${custToken}` },
    body: JSON.stringify({
      customerName: 'عميل التوصيل الميداني',
      customerPhone: '772233445',
      address: { district: 'حدة', street: 'جوار البريد' },
      items: [{ productId: 'bg-ignition-cubes', quantity: 1, weight: '1 علبة' }]
    })
  });
  const driverOrderId = orderForDriverRes.json?.data?.id;

  // Assign driver via Admin
  const assignRes = await req(`/api/orders/${driverOrderId}/assign-driver`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      driverId: testDriverId,
      setStatusToAssigned: true
    })
  });
  assert(assignRes.status === 200, 'Admin assigns order to driver');
  assert(assignRes.json?.data?.driverId === testDriverId, 'Order driverId set to driver ID');

  // Driver views assigned orders
  const driverOrdersRes = await req('/api/orders', {
    headers: { 'Authorization': `Bearer ${driverToken}` }
  });
  assert(driverOrdersRes.status === 200, 'Driver queries /api/orders');
  const myAssignedOrders = driverOrdersRes.json?.data || [];
  const foundMyOrder = myAssignedOrders.some((o: any) => o.id === driverOrderId);
  assert(foundMyOrder, 'Driver can see their assigned order');

  // Another driver CANNOT update this driver's order
  const otherDriverRes = await req('/api/delivery-agents', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      id: `da-other-${Date.now().toString().slice(-4)}`,
      name: 'كابتن آخر',
      phone: `7733${Date.now().toString().slice(-5)}`,
      pin: '1122'
    })
  });
  const otherLoginRes = await req('/api/auth/driver-login', {
    method: 'POST',
    body: JSON.stringify({ phone: otherDriverRes.json?.data?.phone, pin: '1122' })
  });
  const otherDriverToken = otherLoginRes.json?.token;

  const unauthorizedUpdate = await req(`/api/orders/${driverOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${otherDriverToken}` },
    body: JSON.stringify({ status: 'delivered' })
  });
  assert(unauthorizedUpdate.status === 403, 'Unauthorized driver blocked from updating another driver\'s order (HTTP 403)');

  // Driver updates order status through delivery lifecycle: assigned -> preparing -> shipped -> delivered
  const stepPrep = await req(`/api/orders/${driverOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${driverToken}` },
    body: JSON.stringify({ status: 'preparing', driverNotes: 'جاري التجهيز' })
  });
  assert(stepPrep.status === 200, 'Driver updates status to "preparing"');

  const stepShipped = await req(`/api/orders/${driverOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${driverToken}` },
    body: JSON.stringify({ status: 'shipped', driverNotes: 'استلمت الشحنة وبدأت التحرك' })
  });
  assert(stepShipped.status === 200, 'Driver updates status to "shipped"');

  const stepDelivered = await req(`/api/orders/${driverOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${driverToken}` },
    body: JSON.stringify({ status: 'delivered', driverNotes: 'تم التسليم واستلام المبلغ نقداً' })
  });
  assert(stepDelivered.status === 200, 'Driver updates status to "delivered" and confirms cash collection');

  // Verify order in D1 has real driver name and payment confirmed
  const d1OrderAfterDelivered = await d1.findOrderByIdAsync(driverOrderId);
  assert(d1OrderAfterDelivered?.status === 'delivered', 'Order status in D1 is "delivered"');
  assert(d1OrderAfterDelivered?.driverName === 'الكابتن مختار الصنعاني', 'Order has real driver name in D1');

  // 2.6 Public Tracking Privacy: Shows driverName, HIDES driverPhone/PIN
  const trackRes = await req(`/api/orders/track/${driverOrderId}`);
  assert(trackRes.status === 200, 'Public tracking returns order');
  assert(trackRes.json?.data?.driverName === 'الكابتن مختار الصنعاني', 'Tracking displays real driver name');
  assert(!trackRes.json?.data?.driverPhone, 'Public tracking does NOT leak driver phone number');

  // 2.7 Delete Driver (DELETE /api/delivery-agents/:id)
  const delDriverRes = await req(`/api/delivery-agents/${testDriverId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(delDriverRes.status === 200, 'DELETE /api/delivery-agents/:id returns HTTP 200');
  const d1DeletedDriver = await d1.findDeliveryAgentByIdAsync(testDriverId);
  assert(!d1DeletedDriver, 'Driver verified deleted from Cloudflare D1');

  // ===================================================================
  // SECTION 3: CUSTOMERS AUDIT (Login, Guest Checkout, CRM, Data Isolation)
  // ===================================================================
  console.log('\n--- 3. CUSTOMERS AUDIT ---');

  // 3.1 Quick Customer Login / Register (Phone validation)
  const invalidPhoneRes = await req('/api/auth/quick-customer', {
    method: 'POST',
    body: JSON.stringify({ phone: '12345', name: 'عميل خاطئ' })
  });
  assert(invalidPhoneRes.status === 400, 'Invalid phone number rejected with HTTP 400');

  const validCustRes = await req('/api/auth/quick-customer', {
    method: 'POST',
    body: JSON.stringify({ phone: '771234567', name: 'محمد عبد الله العميل' })
  });
  assert(validCustRes.status === 200, 'Valid Yemeni phone registers successfully');
  assert(Boolean(validCustRes.json?.token), 'Customer receives JWT token');
  assert(validCustRes.json?.user?.phone === '771234567', 'Customer phone stored accurately');

  // 3.2 Guest Checkout (Order created without JWT issues guestToken)
  const guestOrderRes = await req('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      customerName: 'ضيف المتجر الزائر',
      customerPhone: '739876543',
      address: { district: 'حدة', street: 'شارع صفر' },
      items: [{ productId: 'bg-ignition-cubes', quantity: 1, weight: '1 علبة' }]
    })
  });
  assert(guestOrderRes.status === 200, 'Guest order created successfully');
  assert(Boolean(guestOrderRes.json?.guestToken), 'Server issues cryptographically signed guestToken');
  const guestToken = guestOrderRes.json?.guestToken;
  const guestOrderId = guestOrderRes.json?.data?.id;

  // 3.3 Guest Data Access Isolation
  // Guest can access their own order
  const guestAccessOwn = await req(`/api/orders/${guestOrderId}`, {
    headers: { 'Authorization': `Bearer ${guestToken}` }
  });
  assert(guestAccessOwn.status === 200, 'Guest can access their own order with guestToken');

  // Create second guest
  const guestBOrderRes = await req('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      customerName: 'ضيف آخر',
      customerPhone: '715566778',
      address: { district: 'السبعين', street: 'شارع السبعين' },
      items: [{ productId: 'bg-ignition-cubes', quantity: 1, weight: '1 علبة' }]
    })
  });
  const guestBToken = guestBOrderRes.json?.guestToken;

  // Guest B CANNOT access Guest A's order
  const guestBTamperA = await req(`/api/orders/${guestOrderId}`, {
    headers: { 'Authorization': `Bearer ${guestBToken}` }
  });
  assert(guestBTamperA.status === 403, 'Guest B forbidden from accessing Guest A\'s order (HTTP 403)');

  // 3.4 Customer Order Linking & CRM Data in D1
  const d1Customers = await d1.getCustomersAsync();
  const foundCustomerCRM = d1Customers.find(c => c.phone.replace(/\D/g, '') === '739876543');
  assert(Boolean(foundCustomerCRM), 'Guest customer automatically registered in CRM customers table in D1');
  assert(Number(foundCustomerCRM?.totalOrders) >= 1, 'CRM records total_orders >= 1');
  assert(Number(foundCustomerCRM?.totalSpent) > 0, 'CRM records total_spent accurately');

  console.log('\n======================================================================');
  console.log(`📊 FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runCouponsDriversCustomersAudit().catch(err => {
  console.error('Fatal audit suite error:', err);
  process.exit(1);
});
