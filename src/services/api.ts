/**
 * Central API Client for store, orders, auth, products, and D1 database sync
 */

export const authStorage = {
  getToken(): string {
    return localStorage.getItem('bg_auth_token') || '';
  },
  setToken(token: string): void {
    localStorage.setItem('bg_auth_token', token);
  },
  removeToken(): void {
    localStorage.removeItem('bg_auth_token');
  },
};

export const api = {
  async quickCustomerLogin(phone: string, name?: string) {
    const res = await fetch('/api/auth/quick-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'فشل تسجيل الدخول');
    }
    return data;
  },

  async adminLogin(credentials: { pin?: string; password?: string }) {
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'رمز الدخول غير صحيح');
    }
    return data;
  },

  async verifySession() {
    const token = authStorage.getToken();
    if (!token) return { success: false };
    const res = await fetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },

  async getProducts() {
    const res = await fetch('/api/products');
    return res.json();
  },

  async addProduct(productData: any) {
    const token = authStorage.getToken();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
    return res.json();
  },

  async updateProduct(id: string, productData: any) {
    const token = authStorage.getToken();
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
    return res.json();
  },

  async deleteProduct(id: string) {
    const token = authStorage.getToken();
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return res.json();
  },

  async getOrders() {
    const token = authStorage.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api/orders', { headers });
    return res.json();
  },

  async createOrder(orderData: any) {
    const token = authStorage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });
    return res.json();
  },

  async updateOrderStatus(orderId: string, status: string, driverNotes?: string) {
    const token = authStorage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, driverNotes }),
    });
    return res.json();
  },

  async cancelOrder(orderId: string, reason?: string) {
    const token = authStorage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason }),
    });
    return res.json();
  },

  async getReviews() {
    const res = await fetch('/api/reviews');
    return res.json();
  },

  async addReview(reviewData: any) {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    });
    return res.json();
  },

  async getSettings() {
    const res = await fetch('/api/settings');
    return res.json();
  },

  async updateSettings(settings: any) {
    const token = authStorage.getToken();
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  async getD1Status() {
    const res = await fetch('/api/d1/health');
    return res.json();
  },

  async getInventoryTransactions() {
    const res = await fetch('/api/inventory/transactions');
    return res.json();
  },

  async getCustomersCRM() {
    const res = await fetch('/api/crm/customers');
    return res.json();
  },

  async adjustInventory(arg1: any, quantity?: number, type?: string, reason?: string) {
    const token = authStorage.getToken();
    const payload = typeof arg1 === 'object'
      ? arg1
      : { productId: arg1, quantity, type, reason };

    const res = await fetch('/api/inventory/adjust', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async uploadImage(input: any, fileName?: string) {
    const token = authStorage.getToken();
    let bodyData: any;
    let headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };

    if (typeof FormData !== 'undefined' && input instanceof FormData) {
      bodyData = input;
    } else if (typeof input === 'string') {
      headers['Content-Type'] = 'application/json';
      bodyData = JSON.stringify({ fileData: input, fileName: fileName || 'uploaded_image.jpg' });
    } else {
      headers['Content-Type'] = 'application/json';
      bodyData = JSON.stringify(input);
    }

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: bodyData,
    });
    return res.json();
  },
};
