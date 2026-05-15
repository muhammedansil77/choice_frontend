export interface User {
  _id: string;
  name: string;
  email: string;
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
