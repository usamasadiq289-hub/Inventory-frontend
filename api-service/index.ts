// Centralized API service for frontend to interact with backend
// Uses fetch API and returns JSON

const API_BASE = import.meta.env.VITE_API_BASE || 'https://inventory-backend-ivory.vercel.app/api';

// API function types
type Stock = {
  category: string;
  subcategory: string;
  stockIn: string;
  sizeMode: 'single' | 'multiple';
  singleSize?: number[];
  start?: number;
  end?: number;
  interval?: number;
  stockInQuantity?: number;
  sizePrefix?: string;
};

// All API functions as a single object
const api = {
  async getProducts() {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async createProduct(product: Omit<any, 'id' | 'createdAt'>) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Failed to create product');
    return res.json();
  },

  async updateProduct(id: string, updates: any) {
    if (!id) throw new Error('Product ID is required for update');
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },

  async deleteProduct(id: string) {
    if (!id) throw new Error('Product ID is required for delete');
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return res.json();
  },

  async getStocks() {
    const res = await fetch(`${API_BASE}/stocks`);
    if (!res.ok) throw new Error('Failed to fetch stocks');
    return res.json();
  },

  async getSingleStock(id: string) {
    const res = await fetch(`${API_BASE}/stocks/${id}`);
    if (!res.ok) throw new Error('Failed to fetch stock');
    return res.json();
  },

  async createStock(stock: Stock) {
    console.log('API Service - Creating stock with data:', stock); // Debug log
    const res = await fetch(`${API_BASE}/stocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stock)
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create stock. Please try again.');
    }
    
    return res.json();
  },

  async updateStock(id: string, updates: any) {
    const res = await fetch(`${API_BASE}/stocks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update stock');
    }
    return res.json();
  },

  async deleteStock(id: string) {
    const res = await fetch(`${API_BASE}/stocks/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete stock');
    return res.json();
  },

  async deleteStockQuantity(id: string, stockOutQuantity: number, date?: string, sizes?: (number | string)[]) {
    if (!id) throw new Error('Stock ID is required');
    if (!stockOutQuantity || stockOutQuantity <= 0) throw new Error('Stock out quantity must be provided');
    const res = await fetch(`${API_BASE}/stocks/${id}/delete-quantity`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockOutQuantity, date, sizes })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete stock quantity');
    }
    return res.json();
  },

  async addStockQuantity(id: string, stockInQuantity: number = 1, date?: string, sizes?: (number | string)[]) {
    if (!id) throw new Error('Stock ID is required');
    if ((!stockInQuantity || stockInQuantity <= 0) && (!sizes || sizes.length === 0)) {
      throw new Error('Stock in quantity or sizes must be provided');
    }
    const res = await fetch(`${API_BASE}/stocks/${id}/add-quantity`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockInQuantity, date, sizes })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to add stock quantity');
    }
    return res.json();
  },

  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async getTransactions() {
    const res = await fetch(`${API_BASE}/transactions`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async createTransaction(transaction: Omit<any, 'id' | 'date'>) {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction)
    });
    if (!res.ok) throw new Error('Failed to create transaction');
    return res.json();
  },

  async deleteTransaction(id: string) {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
    return res.json();
  }
, 

  // Get stock history with optional filters
  async getStockHistory(filters: {
    category?: string;
    subcategory?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.subcategory) params.append('subcategory', filters.subcategory);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const res = await fetch(`${API_BASE}/stocks/history?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch stock history');
    return res.json();
  }
} as const;

// Export all functions from the api object
export const { 
  getProducts, createProduct, updateProduct, deleteProduct,
  getStocks, getSingleStock, createStock, updateStock, deleteStock,
  deleteStockQuantity, addStockQuantity, getStockHistory,
  getDashboardStats,
  getTransactions, createTransaction, deleteTransaction
} = api;
