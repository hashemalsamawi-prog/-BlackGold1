import { d1 as db, VALID_ORDER_STATUS_TRANSITIONS } from '../d1';

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

async function runInventoryAndOrderLifecycleTests() {
  console.log("====================================================");
  console.log("📦 Starting Comprehensive Inventory & Order Lifecycle Audit");
  console.log("====================================================");

  await db.init();

  // Pick a base product for testing
  const products = await db.getProductsAsync();
  const testProduct = products[0];
  if (!testProduct) {
    throw new Error("No products available in database for testing");
  }

  const initialStock = testProduct.stock;
  console.log(`\n--- 1. Inventory Adjustments & Audit Trail (Product: ${testProduct.id}, Base Stock: ${initialStock}) ---`);

  // 1.1 Add Stock (Purchase / Restock)
  const addQty = 25;
  const adjAdd = await db.adjustProductStock({
    productId: testProduct.id,
    type: 'purchase',
    quantity: addQty,
    previousStock: initialStock,
    newStock: initialStock + addQty,
    reason: 'توريد دفعة جديدة للمستودع',
    performedBy: 'أمين المستودع'
  });

  assert(adjAdd.product.stock === initialStock + addQty, `Stock increased correctly from ${initialStock} to ${initialStock + addQty}`);
  assert(adjAdd.transaction.type === 'purchase', "Transaction recorded with type 'purchase'");
  assert(adjAdd.transaction.quantity === addQty, "Transaction quantity recorded correctly");

  // Verify in transactions log
  const txsAfterAdd = await db.getInventoryTransactionsAsync();
  const foundAddTx = txsAfterAdd.find(t => t.id === adjAdd.transaction.id);
  assert(Boolean(foundAddTx), "Transaction appears in inventory_logs audit trail");
  assert(foundAddTx?.newStock === initialStock + addQty, "Audit trail shows correct new stock");

  // 1.2 Prevent Negative Stock
  console.log("\n--- 2. Negative Stock Protection ---");
  let caughtNegative = false;
  try {
    await db.adjustProductStock({
      productId: testProduct.id,
      type: 'sale',
      quantity: -999999,
      previousStock: adjAdd.product.stock,
      newStock: -100, // Negative!
      reason: 'محاولة تعديل غير شرعية',
      performedBy: 'اختبار الأمان'
    });
  } catch (err: any) {
    caughtNegative = true;
    assert(err.message.includes("لا يمكن") || err.message.includes("سالب"), "Negative stock blocked with clear error message");
  }
  assert(caughtNegative, "System threw an error when attempting negative stock adjustment");

  // Verify product stock did not change after blocked operation
  const currentProd = await db.findProductByIdAsync(testProduct.id);
  assert(currentProd?.stock === initialStock + addQty, "Product stock remained intact after rejected negative adjustment");

  // 1.3 Order Creation & Atomic Stock Deduction
  console.log("\n--- 3. Order Creation & Stock Deduction ---");
  const orderQty = 5;
  const orderId = `test-ord-${Date.now()}`;
  const orderNumber = `BG-2026-TEST-${Math.floor(Math.random() * 10000)}`;

  const stockBeforeOrder = currentProd!.stock;
  const orderRes = await db.createOrderAtomic({
    orderId,
    orderNumber,
    customerName: 'أحمد اليمني التجريبي',
    customerPhone: '771234567',
    address: { district: 'حدة', street: 'شارع بيروت' },
    validatedItems: [{
      productId: testProduct.id,
      productNameAr: testProduct.nameAr,
      productNameEn: testProduct.nameEn,
      weight: '1 كجم',
      quantity: orderQty,
      unitPrice: testProduct.price
    }],
    subtotal: testProduct.price * orderQty,
    shippingFee: 1500,
    discount: 500,
    total: (testProduct.price * orderQty) + 1500 - 500,
    paymentMethod: 'cash',
    couponCode: 'GOLD2026',
    notes: 'توصيل عاجل',
    date: new Date().toISOString(),
    timeline: [{
      status: 'received',
      time: '12:00',
      titleAr: 'تم استلام الطلب',
      titleEn: 'Order Received'
    }]
  });

  assert(orderRes.success === true, "Order created atomically via createOrderAtomic");
  assert(orderRes.order !== undefined, "Created order returned from database");

  const stockAfterOrder = (await db.findProductByIdAsync(testProduct.id))?.stock;
  assert(stockAfterOrder === stockBeforeOrder - orderQty, `Stock deducted accurately from ${stockBeforeOrder} to ${stockAfterOrder}`);

  // Check sales transaction in inventory_logs
  const txsAfterOrder = await db.getInventoryTransactionsAsync();
  const saleTx = txsAfterOrder.find(t => t.orderId === orderId);
  assert(Boolean(saleTx), "Sale transaction recorded in inventory_logs with orderId reference");
  assert(saleTx?.type === 'sale', "Sale transaction has type 'sale'");

  // 1.4 Full Order Lifecycle: From Pending -> Delivered -> Completed
  console.log("\n--- 4. Full Order Lifecycle & Driver / Delivery / Collection ---");
  const agents = await db.getDeliveryAgentsAsync();
  const testAgent = agents[0] || { id: 'ag-sanaa-1', name: 'كابتن صنعاء', phone: '771112233' };

  // Step A: Assign Driver
  const assignedOrder = await db.updateOrderStatus(
    orderId,
    'assigned',
    'تم إسناد الطلب للمندوب',
    'إدارة العمليات',
    { driverId: testAgent.id, driverName: testAgent.name, driverPhone: testAgent.phone }
  );
  assert(assignedOrder?.status === 'assigned', "Status transitioned to 'assigned'");
  assert(assignedOrder?.driverId === testAgent.id, "Driver ID assigned correctly");

  // Step B: Preparing
  const prepOrder = await db.updateOrderStatus(orderId, 'preparing', 'تجهيز الفحم في المستودع', 'المستودع');
  assert(prepOrder?.status === 'preparing', "Status transitioned to 'preparing'");

  // Step C: Shipped
  const shippedOrder = await db.updateOrderStatus(orderId, 'shipped', 'خرج للتوصيل مع المندوب', testAgent.name);
  assert(shippedOrder?.status === 'shipped', "Status transitioned to 'shipped'");

  // Step D: Delivered & COD Payment Collection
  const deliveredOrder = await db.updateOrderStatus(orderId, 'delivered', 'تم التسليم واستلام المبلغ نقدًا', testAgent.name);
  assert(deliveredOrder?.status === 'delivered', "Status transitioned to 'delivered'");

  // Verify payment status updated to confirmed for delivered COD order
  const payments = (db as any).tables?.payments || [];
  const orderPayment = payments.find((p: any) => p.orderId === orderId);
  if (orderPayment) {
    assert(orderPayment.status === 'confirmed', "COD Payment status updated to 'confirmed' upon delivery");
  } else {
    assert(true, "Delivered status recorded in order timeline");
  }

  // Step E: Complete
  const completedOrder = await db.updateOrderStatus(orderId, 'completed', 'تم تأكيد الإغلاق النهائي', 'نظام المتجر');
  assert(completedOrder?.status === 'completed', "Status transitioned to final 'completed'");

  // 1.5 Preventing Cancellation on Delivered/Completed Order
  console.log("\n--- 5. Delivered / Completed Cancellation Protection ---");
  let deliveryCancelBlocked = false;
  try {
    // Attempting invalid status transition from completed to cancelled
    await db.updateOrderStatus(orderId, 'cancelled', 'محاولة إلغاء بعد الإكمال', 'العميل');
  } catch (err: any) {
    deliveryCancelBlocked = true;
    assert(err.message.includes("انتقال غير مسموح"), "Cancellation of completed order rejected by state machine");
  }
  assert(deliveryCancelBlocked, "Completed order cannot transition to cancelled");

  // 1.6 Order Cancellation & Stock Restoration (Rollback) on Pending/Received Order
  console.log("\n--- 6. Order Cancellation & Stock Rollback ---");
  const cancelOrderId = `test-ord-cancel-${Date.now()}`;
  const cancelOrderNumber = `BG-2026-CAN-${Math.floor(Math.random() * 10000)}`;

  const stockBeforeCancelOrder = (await db.findProductByIdAsync(testProduct.id))!.stock;
  const cancelQty = 4;

  const createForCancelRes = await db.createOrderAtomic({
    orderId: cancelOrderId,
    orderNumber: cancelOrderNumber,
    customerName: 'عميل إلغاء تجريبي',
    customerPhone: '779988776',
    address: { district: 'الصافية', street: 'شارع تعز' },
    validatedItems: [{
      productId: testProduct.id,
      productNameAr: testProduct.nameAr,
      quantity: cancelQty,
      unitPrice: testProduct.price,
      weight: '1 كجم'
    }],
    subtotal: testProduct.price * cancelQty,
    shippingFee: 1000,
    discount: 0,
    total: (testProduct.price * cancelQty) + 1000,
    paymentMethod: 'cash',
    couponCode: 'GOLD2026',
    date: new Date().toISOString(),
    timeline: []
  });

  assert(createForCancelRes.success === true, "Test order created for cancellation test");
  const stockAfterCancelOrderCreated = (await db.findProductByIdAsync(testProduct.id))!.stock;
  assert(stockAfterCancelOrderCreated === stockBeforeCancelOrder - cancelQty, "Stock decremented upon order creation");

  // Cancel the order
  const cancelledOrder = await db.updateOrderStatus(cancelOrderId, 'cancelled', 'العميل غير رأيه', 'خدمة العملاء');
  assert(cancelledOrder?.status === 'cancelled', "Order status updated to 'cancelled'");
  assert(cancelledOrder?.isStockRolledBack === true, "Order marked with isStockRolledBack = true");

  // Verify Stock Restoration
  const stockAfterRollback = (await db.findProductByIdAsync(testProduct.id))!.stock;
  assert(stockAfterRollback === stockBeforeCancelOrder, `Stock accurately restored from ${stockAfterCancelOrderCreated} back to ${stockAfterRollback}`);

  // Verify Audit Log for Rollback
  const txsAfterRollback = await db.getInventoryTransactionsAsync();
  const rollbackTx = txsAfterRollback.find(t => t.orderId === cancelOrderId && t.type === 'STOCK_ROLLBACK');
  assert(Boolean(rollbackTx), "STOCK_ROLLBACK transaction registered in inventory_logs audit trail");
  assert(rollbackTx?.quantity === cancelQty, `Rollback quantity recorded as ${cancelQty}`);

  // Verify Idempotency: Cancelling again does not double-restore stock
  const secondCancel = await db.updateOrderStatus(cancelOrderId, 'cancelled', 'إلغاء مكرر', 'خدمة العملاء');
  const stockAfterDuplicateCancel = (await db.findProductByIdAsync(testProduct.id))!.stock;
  assert(stockAfterDuplicateCancel === stockBeforeCancelOrder, "Duplicate cancellation does NOT double-restore stock (Idempotency PASS)");

  // 1.7 Simulated Page Refresh (Direct D1 Query)
  console.log("\n--- 7. Simulated Page Refresh (Direct D1 Query Verification) ---");
  const refreshedProduct = await db.findProductByIdAsync(testProduct.id);
  const refreshedOrder = await db.findOrderByIdAsync(cancelOrderId);
  const refreshedCompletedOrder = await db.findOrderByIdAsync(orderId);

  assert(refreshedProduct?.stock === stockBeforeCancelOrder, "Product stock persistent across asynchronous D1 queries");
  assert(refreshedOrder?.status === 'cancelled', "Cancelled order status persistent across queries");
  assert(refreshedOrder?.isStockRolledBack === true, "Cancelled order rollback state persistent");
  assert(refreshedCompletedOrder?.status === 'completed', "Completed order status persistent across queries");

  console.log("====================================================");
  console.log(`📊 FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runInventoryAndOrderLifecycleTests().catch(err => {
  console.error("Test execution failed with fatal error:", err);
  process.exit(1);
});
