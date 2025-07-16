// Core Types for NusantaraHax
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice?: number;
  category: ProductCategory;
  features: string[];
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  downloadUrl?: string;
  version: string;
  compatibility: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

export interface License {
  id: string;
  userId: string;
  productId: string;
  licenseKey: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  product: Product;
}

export interface Order {
  id: string;
  userId: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  total: number;
  paymentMethod: string;
  paymentId?: string;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export interface Testimonial {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  comment: string;
  productId?: string;
  isVerified: boolean;
  createdAt: Date;
}

// Animation Types
export interface AnimationConfig {
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
  whileHover?: any;
  whileTap?: any;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CheckoutForm {
  email: string;
  name: string;
  phone?: string;
  paymentMethod: string;
}

// Navigation Types
export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  children?: NavItem[];
}

// Theme Types
export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  white: string;
  offWhite: string;
  darkGray: string;
  lightGray: string;
}
