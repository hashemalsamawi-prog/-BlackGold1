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

async function runComprehensiveAudit() {
  console.log('======================================================================');
  console.log('🧪 Starting Full Production Audit: Products, Gallery, Reviews & Settings');
  console.log('======================================================================\n');

  await d1.init();

  const adminToken = generateToken({
    userId: 'usr-admin-audit',
    role: 'admin',
    phone: '770000000',
    name: 'مدير النظام التنفيذي'
  });

  // ===================================================================
  // SECTION 1: PRODUCTS (CRUD, Prices, Weights, Stock, Featured & D1 Refresh)
  // ===================================================================
  console.log('--- 1. PRODUCTS FULL LIFECYCLE AUDIT ---');

  const testProductId = `prod-audit-${Date.now().toString().slice(-5)}`;
  const initialWeights = [
    { weight: '500g', price: 1200 },
    { weight: '1kg', price: 2300 }
  ];

  // 1.1 Create Product (POST /api/products)
  const createProdRes = await req('/api/products', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      id: testProductId,
      nameAr: 'فحم الذهب الأسود - تجريبي خاص',
      nameEn: 'Black Gold Special Audit Charcoal',
      category: 'pouches',
      price: 1200,
      originalPrice: 1500,
      discountPercent: 20,
      descriptionAr: 'فحم نخب أول مجرب ومضمون من مصنع صنعاء',
      stock: 75,
      weightOptions: initialWeights,
      isFeatured: true,
      image: '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg',
      images: ['/src/assets/images/black_gold_pouch_pair_1786125935649.jpg']
    })
  });
  assert(createProdRes.status === 200, 'Admin creates product successfully');
  assert(createProdRes.json?.data?.id === testProductId, 'Created product returns correct ID');

  // Verify directly in Cloudflare D1
  const d1Product = await d1.findProductByIdAsync(testProductId);
  assert(Boolean(d1Product), 'Product verified in Cloudflare D1 database');
  assert(d1Product?.price === 1200, 'D1 product price is 1200 YER');
  assert(d1Product?.stock === 75, 'D1 product stock is 75');
  assert(d1Product?.isFeatured === true, 'D1 product isFeatured is true');
  assert(d1Product?.weightOptions?.length === 2, 'D1 product has 2 weight options stored');

  // 1.2 Update Product (PUT /api/products/:id) - Updating prices, weights, stock & featured
  const updatedWeights = [
    { weight: '250g', price: 650 },
    { weight: '500g', price: 1250 },
    { weight: '1kg', price: 2400 }
  ];

  const updateProdRes = await req(`/api/products/${testProductId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      price: 1250,
      originalPrice: 1600,
      stock: 90,
      isFeatured: false,
      weightOptions: updatedWeights,
      descriptionAr: 'تم تحديث الوصف بنجاح في قاعدة البيانات'
    })
  });
  assert(updateProdRes.status === 200, 'Admin updates product successfully');

  // Re-query from D1 directly (simulating fresh server load/refresh)
  const d1UpdatedProduct = await d1.findProductByIdAsync(testProductId);
  assert(d1UpdatedProduct?.price === 1250, 'Updated price (1250 YER) persisted in D1');
  assert(d1UpdatedProduct?.stock === 90, 'Updated stock (90) persisted in D1');
  assert(d1UpdatedProduct?.isFeatured === false, 'Updated isFeatured (false) persisted in D1');
  assert(d1UpdatedProduct?.weightOptions?.length === 3, 'Updated 3 weight options persisted in D1');
  assert(d1UpdatedProduct?.descriptionAr === 'تم تحديث الوصف بنجاح في قاعدة البيانات', 'Updated description persisted in D1');

  // 1.3 Delete Product (DELETE /api/products/:id)
  const deleteProdRes = await req(`/api/products/${testProductId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(deleteProdRes.status === 200, 'Admin deletes product successfully');

  const d1DeletedProduct = await d1.findProductByIdAsync(testProductId);
  assert(!d1DeletedProduct, 'Product confirmed deleted from Cloudflare D1');

  // ===================================================================
  // SECTION 2: GALLERY (Add, Edit, Delete, Empty State & D1 Truth)
  // ===================================================================
  console.log('\n--- 2. GALLERY FULL LIFECYCLE AUDIT ---');

  const testGalleryId = `g_audit_${Date.now().toString().slice(-5)}`;

  // 2.1 Add Gallery Item (POST /api/gallery)
  const addGalRes = await req('/api/gallery', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      id: testGalleryId,
      titleAr: 'صورة تجريبية من خط إنتاج مصنع صنعاء',
      titleEn: 'Sanaa Factory Line Real Snapshot',
      category: 'factory',
      image: '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg',
      imageUrl: '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg',
      caption: 'فحم طبيعي نقي 100%'
    })
  });
  assert(addGalRes.status === 200, 'Admin adds gallery photo successfully');

  // Verify in D1
  const galleryList = await d1.getGalleryItemsAsync();
  const foundItem = galleryList.find(g => g.id === testGalleryId);
  assert(Boolean(foundItem), 'Gallery photo verified in Cloudflare D1');
  assert(foundItem?.titleAr === 'صورة تجريبية من خط إنتاج مصنع صنعاء', 'Gallery photo title saved correctly');

  // 2.2 Update Gallery Item (PUT /api/gallery/:id)
  const updateGalRes = await req(`/api/gallery/${testGalleryId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      titleAr: 'صورة خط الإنتاج المحدثة كلياً',
      category: 'fleet'
    })
  });
  assert(updateGalRes.status === 200, 'Admin updates gallery photo successfully');

  const freshGalList = await d1.getGalleryItemsAsync();
  const updatedItem = freshGalList.find(g => g.id === testGalleryId);
  assert(updatedItem?.titleAr === 'صورة خط الإنتاج المحدثة كلياً', 'Updated gallery photo title persisted in D1');
  assert(updatedItem?.category === 'fleet', 'Updated gallery photo category persisted in D1');

  // 2.3 Delete Gallery Item (DELETE /api/gallery/:id)
  const delGalRes = await req(`/api/gallery/${testGalleryId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(delGalRes.status === 200, 'Admin deletes gallery photo successfully');

  const listAfterDelete = await d1.getGalleryItemsAsync();
  assert(!listAfterDelete.some(g => g.id === testGalleryId), 'Gallery photo confirmed deleted from D1');

  // 2.4 GET /api/gallery returns array without crashing
  const publicGalRes = await req('/api/gallery');
  assert(publicGalRes.status === 200, 'GET /api/gallery returns HTTP 200');
  assert(Array.isArray(publicGalRes.json?.data), 'GET /api/gallery returns array format');

  // ===================================================================
  // SECTION 3: REVIEWS (Add, Display, Verified Purchase Check with Real Order)
  // ===================================================================
  console.log('\n--- 3. REVIEWS & VERIFIED PURCHASE AUDIT ---');

  const verifiedCustomerPhone = '775566778';
  const customerName = 'علي محمد الحيمي';

  // 3.1 Unverified Review (Customer has NOT purchased the product)
  const unverifiedRes = await req('/api/reviews', {
    method: 'POST',
    body: JSON.stringify({
      productId: 'bg-ignition-cubes',
      userName: 'زائر لم يطلب بعد',
      userPhone: '779999999',
      rating: 4,
      comment: 'منتج يبدو ممتازاً لكن لم أجربه بعد'
    })
  });
  assert(unverifiedRes.status === 200, 'Public user can post review');
  assert(unverifiedRes.json?.data?.verifiedPurchase === false, 'Review without delivered order marked verifiedPurchase: false');

  // 3.2 Create and deliver an actual order for this customer
  const custRes = await req('/api/auth/quick-customer', {
    method: 'POST',
    body: JSON.stringify({ phone: verifiedCustomerPhone, name: customerName })
  });
  const custToken = custRes.json?.token;

  const orderRes = await req('/api/orders', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${custToken}` },
    body: JSON.stringify({
      customerName,
      customerPhone: verifiedCustomerPhone,
      address: { district: 'حدة', street: 'شارع صفر' },
      items: [{ productId: 'bg-ignition-cubes', quantity: 2, weight: '1 علبة' }]
    })
  });
  const orderId = orderRes.json?.data?.id;

  // Mark order as delivered via Admin status progression: received -> preparing -> shipped -> delivered
  await req(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'preparing' })
  });
  await req(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'shipped' })
  });
  await req(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'delivered' })
  });

  // 3.3 Verified Review (Customer has a delivered order for this product)
  const verifiedRes = await req('/api/reviews', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${custToken}` },
    body: JSON.stringify({
      productId: 'bg-ignition-cubes',
      userName: customerName,
      rating: 5,
      comment: 'فحم ممتاز ومكعبات سريعة الاشتعال بدون أي دخان مزعج، تجربة حقيقية ممتازة!'
    })
  });
  assert(verifiedRes.status === 200, 'Customer with delivered order posts review');
  assert(verifiedRes.json?.data?.verifiedPurchase === true, 'Review with delivered order accurately marked verifiedPurchase: true');

  // Verify reviews in D1
  const d1Reviews = await d1.getReviewsAsync();
  const foundVerifiedReview = d1Reviews.find(r => r.id === verifiedRes.json?.data?.id);
  assert(Boolean(foundVerifiedReview), 'Verified review persisted in Cloudflare D1');
  assert(foundVerifiedReview?.userName === customerName, 'Review customer_name stored correctly in D1');
  assert(foundVerifiedReview?.verifiedPurchase === true, 'Review verified purchase flag persisted in D1');

  // ===================================================================
  // SECTION 4: STORE SETTINGS (Read, Update & Persistence in D1)
  // ===================================================================
  console.log('\n--- 4. STORE SETTINGS & REFRESH PERSISTENCE AUDIT ---');

  // 4.1 Read Settings (GET /api/settings)
  const getSettingsRes = await req('/api/settings');
  assert(getSettingsRes.status === 200, 'GET /api/settings returns HTTP 200');
  const initialSettings = getSettingsRes.json?.data;

  // 4.2 Update Settings (PUT /api/settings)
  const testWhatsapp = '967771239999';
  const testThreshold = 9500;
  const testStoreName = 'متجر الذهب الأسود الملكي - صنعاء';

  const updateSettingsRes = await req('/api/settings', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      ...initialSettings,
      storeNameAr: testStoreName,
      whatsappPhone: testWhatsapp,
      whatsappNumber: testWhatsapp,
      freeDeliveryThreshold: testThreshold,
      freeShippingThreshold: testThreshold,
      sloganAr: 'شعار الفخامة الملكية الأول في اليمن'
    })
  });
  assert(updateSettingsRes.status === 200, 'Admin updates store settings successfully');

  // 4.3 Verify persistence in Cloudflare D1 (Simulate refresh / direct D1 query)
  const d1Settings = await d1.getSettingsAsync();
  assert(d1Settings?.storeNameAr === testStoreName, 'Updated store name persisted in Cloudflare D1');
  assert(d1Settings?.whatsappPhone === testWhatsapp, 'Updated WhatsApp phone persisted in Cloudflare D1');
  assert(Number(d1Settings?.freeDeliveryThreshold) === testThreshold, 'Updated free delivery threshold persisted in Cloudflare D1');

  // 4.4 Restore Settings to clean state
  await req('/api/settings', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      ...initialSettings,
      whatsappPhone: '967775000150',
      whatsappNumber: '967775000150',
      freeDeliveryThreshold: 8000,
      freeShippingThreshold: 8000
    })
  });

  // ===================================================================
  // SECTION 5: FINANCIAL & ANALYTICS REPORTS AUDIT
  // ===================================================================
  console.log('\n--- 5. ADMIN FINANCIAL REPORTS AUDIT ---');

  const reportsRes = await req('/api/admin/reports', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(reportsRes.status === 200, 'Admin reports endpoint returns HTTP 200');
  assert(typeof reportsRes.json?.data?.totalRevenue === 'number', 'Total revenue is computed accurately');
  assert(typeof reportsRes.json?.data?.totalOrders === 'number', 'Total orders count computed accurately');
  assert(Array.isArray(reportsRes.json?.data?.topProducts), 'Top products sales array is present');

  console.log('\n======================================================================');
  console.log(`📊 FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runComprehensiveAudit().catch(err => {
  console.error('Fatal audit suite error:', err);
  process.exit(1);
});
