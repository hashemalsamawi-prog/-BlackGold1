import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Product, Order, Review, Coupon, DeliveryAgent, StoreSettings, GalleryItem } from '../src/types';
import { d1, CLOUDFLARE_CONFIG, VALID_ORDER_STATUS_TRANSITIONS } from './d1';
import type { UserAccount, CustomerRecord, OrderItemRecord, InventoryLogRecord } from './d1';
import { hashSecret, getJwtSecret, timingSafeEqual, normalizeDigits, validateYemeniPhone, sanitizeInputString, generateToken, verifyToken, createRateLimiter } from './security';

export type { UserAccount, CustomerRecord, OrderItemRecord, InventoryLogRecord };
export { CLOUDFLARE_CONFIG, VALID_ORDER_STATUS_TRANSITIONS, hashSecret, getJwtSecret, timingSafeEqual, normalizeDigits, validateYemeniPhone, sanitizeInputString, generateToken, verifyToken, createRateLimiter };

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  type: 'initial' | 'purchase' | 'sale' | 'return' | 'damage' | 'adjustment' | 'STOCK_IN' | 'STOCK_OUT' | 'STOCK_ROLLBACK';
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  reason: string;
  orderId?: string;
  performedBy: string;
  date: string;
}

/**
 * Unified Database Access Proxy pointing directly to Cloudflare D1 Engine
 */
class DatabaseProxy {
  // Products
  public getProducts(): Product[] {
    return d1.getProducts();
  }

  public findProductById(id: string): Product | undefined {
    return d1.findProductById(id);
  }

  public addProduct(p: Product): Product {
    return d1.addProduct(p);
  }

  public updateProduct(id: string, p: Partial<Product>): Product | null {
    return d1.updateProduct(id, p);
  }

  public deleteProduct(id: string): boolean {
    return d1.deleteProduct(id);
  }

  public getCategories() {
    return d1.getCategories();
  }

  // Users
  public getUsers(): UserAccount[] {
    return d1.getUsers();
  }

  public findUserById(id: string): UserAccount | undefined {
    return d1.findUserById(id);
  }

  public findUserByPhone(phone: string): UserAccount | undefined {
    return d1.findUserByPhone(phone);
  }

  public addUser(user: UserAccount): UserAccount {
    return d1.addUser(user);
  }

  public updateUser(id: string, updates: Partial<UserAccount>): UserAccount | null {
    const user = d1.findUserById(id);
    if (!user) return null;
    Object.assign(user, updates);
    return user;
  }

  // Customers (CRM)
  public getCustomers(): CustomerRecord[] {
    return d1.getCustomers();
  }

  public findOrCreateCustomer(name: string, phone: string, district?: string): CustomerRecord {
    return d1.findOrCreateCustomer(name, phone, district);
  }

  // Orders
  public getOrders(): Order[] {
    return d1.getOrders();
  }

  public findOrderById(id: string): Order | undefined {
    return d1.findOrderById(id);
  }

  public getOrderItems(orderId: string): OrderItemRecord[] {
    return d1.getOrderItems(orderId);
  }

  public addOrder(order: Order): Order {
    return d1.addOrder(order);
  }

  public async createOrderAtomic(orderData: any): Promise<{ success: boolean; order?: Order; message?: string; isDuplicate?: boolean }> {
    return d1.createOrderAtomic(orderData);
  }

  public async updateOrderStatus(id: string, status: Order['status'], driverNotes?: string, actor?: string): Promise<Order | null> {
    return d1.updateOrderStatus(id, status, driverNotes, actor);
  }

  public updateOrderDriver(id: string, driverId: string, driverName: string, driverPhone: string): Order | null {
    const order = d1.findOrderById(id);
    if (!order) return null;
    order.driverId = driverId;
    order.driverName = driverName;
    order.driverPhone = driverPhone;
    return order;
  }

  // Reviews
  public getReviews(): Review[] {
    return d1.getReviews();
  }

  public addReview(review: Review): Review {
    return d1.addReview(review);
  }

  // Coupons
  public getCoupons(): Coupon[] {
    return d1.getCoupons();
  }

  public findCoupon(code: string): Coupon | undefined {
    return d1.findCoupon(code);
  }

  public addCoupon(coupon: Coupon): Coupon {
    const existing = d1.getCoupons().find(c => c.code.toUpperCase() === coupon.code.toUpperCase());
    if (existing) {
      Object.assign(existing, coupon);
      return existing;
    }
    d1.getCoupons().unshift(coupon);
    return coupon;
  }

  public deleteCoupon(code: string): boolean {
    const coupons = d1.getCoupons();
    const idx = coupons.findIndex(c => c.code.toUpperCase() === code.toUpperCase());
    if (idx !== -1) {
      coupons.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Delivery Agents
  public getDeliveryAgents(): DeliveryAgent[] {
    return d1.getDeliveryAgents();
  }

  public updateDeliveryAgents(agents: DeliveryAgent[]): DeliveryAgent[] {
    const current = d1.getDeliveryAgents();
    current.length = 0;
    current.push(...agents);
    return current;
  }

  // Store Settings
  public getSettings(): StoreSettings {
    return d1.getSettings();
  }

  public updateSettings(settings: Partial<StoreSettings>): StoreSettings {
    return d1.updateSettings(settings);
  }

  // Gallery Items
  public getGalleryItems(): GalleryItem[] {
    return d1.getGalleryItems();
  }

  public addGalleryItem(item: GalleryItem): GalleryItem {
    d1.getGalleryItems().unshift(item);
    return item;
  }

  public updateGalleryItem(id: string, updates: Partial<GalleryItem>): GalleryItem | null {
    const item = d1.getGalleryItems().find(g => g.id === id);
    if (!item) return null;
    Object.assign(item, updates);
    return item;
  }

  public deleteGalleryItem(id: string): boolean {
    const items = d1.getGalleryItems();
    const idx = items.findIndex(g => g.id === id);
    if (idx !== -1) {
      items.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Inventory Transactions & Audit
  public getInventoryTransactions(): InventoryTransaction[] {
    return d1.getInventoryTransactions().map(tx => ({
      id: tx.id,
      productId: tx.productId,
      productName: tx.productName,
      type: tx.type,
      quantity: tx.quantity,
      previousStock: tx.previousStock,
      newStock: tx.newStock,
      reason: tx.reason,
      orderId: tx.orderId,
      performedBy: tx.performedBy,
      date: tx.createdAt
    }));
  }

  public logInventoryTransaction(tx: InventoryTransaction): InventoryTransaction {
    d1.logInventoryTransaction({
      id: tx.id,
      productId: tx.productId,
      productName: tx.productName,
      type: tx.type,
      quantity: tx.quantity,
      previousStock: tx.previousStock,
      newStock: tx.newStock,
      reason: tx.reason,
      orderId: tx.orderId,
      performedBy: tx.performedBy,
      createdAt: tx.date || new Date().toISOString()
    });
    return tx;
  }

  public adjustProductStock(params: {
    productId: string;
    type: 'initial' | 'purchase' | 'sale' | 'return' | 'damage' | 'adjustment' | 'STOCK_IN' | 'STOCK_OUT' | 'STOCK_ROLLBACK';
    quantity: number;
    previousStock: number;
    newStock: number;
    reason: string;
    performedBy: string;
  }) {
    return d1.adjustProductStock(params);
  }

  public logAnalyticsEvent(event: string, data: any, userId?: string) {
    // Analytics telemetry
  }

  public logAbandonedCart(cart: { customerPhone?: string; customerName?: string; items: any[]; subtotal: number }) {
    // Abandoned cart telemetry
  }

  public hasDeliveredOrderForProduct(customerPhone: string, productId: string): boolean {
    if (!customerPhone) return false;
    const cleanPhone = customerPhone.replace(/\D/g, '');
    return d1.getOrders().some(order => {
      const orderPhone = order.customerPhone?.replace(/\D/g, '');
      const isMatchPhone = orderPhone === cleanPhone;
      const isDelivered = order.status === 'delivered';
      const hasProduct = order.items.some(it => it.productId === productId);
      return isMatchPhone && isDelivered && hasProduct;
    });
  }

  public async init(): Promise<void> {
    await d1.init();
  }
}

export const db = new DatabaseProxy();
