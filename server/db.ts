import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Product, Order, Review, Coupon, DeliveryAgent, StoreSettings, GalleryItem } from '../src/types';
import { d1, CLOUDFLARE_CONFIG } from './d1';
import type { UserAccount, CustomerRecord, OrderItemRecord, InventoryLogRecord } from './d1';

export type { UserAccount, CustomerRecord, OrderItemRecord, InventoryLogRecord };
export { CLOUDFLARE_CONFIG };

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  type: 'initial' | 'purchase' | 'sale' | 'return' | 'damage' | 'adjustment' | 'STOCK_ROLLBACK';
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  reason: string;
  orderId?: string;
  performedBy: string;
  date: string;
}

// Helper to hash passwords / PINs
export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret + 'BLACK_GOLD_SALT_2026').digest('hex');
}

// Generate secure session tokens (JWT HMAC-SHA256)
const JWT_SECRET = process.env.JWT_SECRET || 'blackgold_secure_2026';

export function generateToken(payload: { userId: string; role: string; phone: string; name: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { userId: string; role: string; phone: string; name: string } | null {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Date.now()) return null;
    return decoded;
  } catch (e) {
    return null;
  }
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

  public updateOrderStatus(id: string, status: Order['status'], driverNotes?: string, actor?: string): Order | null {
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
}

export const db = new DatabaseProxy();
