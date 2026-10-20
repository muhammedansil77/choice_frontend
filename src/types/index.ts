export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: 'admin' | 'user';
  coinBalance: number;
  createdAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  priceInCoins: number;
  category: string;
  images: string[];
  stock: number;
  status: 'available' | 'unavailable';
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  icon?: string;
  image?: string;
  description?: string;
  createdAt: string;
}

export interface Order {
  _id: string;
  userId: string;
  user?: User;
  products: {
    productId: string;
    product?: Product;
    quantity: number;
    priceAtTime: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface CreditEntry {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    phoneNumber?: string;
    email?: string;
  };
  invoiceNumber: string;
  date: string;
  category: 'electronic' | 'hardware';
  billAmount: number;
  receivedAmount: number;
  returnAmount: number;
  balanceAmount: number;
  narration?: string | null;
  status: 'unpaid' | 'partial' | 'settled';
  createdAt: string;
  updatedAt: string;
}

export interface CreditSummary {
  totalBilled: number;
  totalReceived: number;
  totalReturned: number;
  totalOutstanding: number;
  totalCount?: number;
  totalInvoices?: number;
}

