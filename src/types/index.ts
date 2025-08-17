export interface Product {
  _id?: string;
  category: 'PK' | 'Cogged' | 'Cogged Banded' | 'Timing';
  subcategory: string;
  createdAt: Date;
}

export interface Stock {
  _id: string;
  category: string;
  subcategory: string;
  quantity: number;
  stockIn: string | Date;
  lastUpdated: Date;
  sizeMode: 'single' | 'multiple';
  sizes: string[]; // Changed from number[] to string[] to support prefixed sizes
  sizePrefix?: string; // Optional size prefix
  status?: {
    high: number;
    medium: number;
    low: number;
  };
  currentStatus?: 'high' | 'medium' | 'low' | 'critical';
}

export interface CreateStockPayload {
  category: string;
  subcategory: string;
  stockIn?: string;
  date?: string; // Add date field for transactions
  sizeMode?: 'single' | 'multiple';
  singleSize?: number[] | string[] | string; // Support string arrays for prefixed sizes
  start?: number;
  end?: number;
  interval?: number;
  stockInQuantity?: number;
  stockOutQuantity?: number;
  sizes?: number[] | string[]; // Support both number and string arrays
  sizePrefix?: string; // Optional size prefix
  status?: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface StockHistoryEntry {
  category: string;
  subcategory: string;
  stockin?: number;
  stockout?: number;
  size?: number | string; // Support both number and string sizes
  date: string | Date;
}

export interface StockTransaction {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  date: Date;
  reference?: string;
}

export const PRODUCT_CATEGORIES = {
  'PK': ['1px', '4px', '5px'],
  'Cogged': ['Sux', 'Ax', 'Bx', 'Cx'],
  'Cogged Banded': [
    '2RA', '3RA', '4RA', '5RA', '6RA', '7RA', '8RA',
    '2RB', '3RB', '4RB', '5RB', '6RB',
    '2RC', '3RC', '4RC', '5RC', '6RC'
  ],
  'Timing': ['88ZA19', '89ZA19', '90ZA19']
} as const;

export const TRANSACTION_TYPES = {
  'IN': 'Stock In',
  'OUT': 'Stock Out',
  'ADJUSTMENT': 'Adjustment'
} as const;

