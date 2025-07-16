// Design System Constants
export const COLORS = {
  primary: {
    red: '#DC2626',      // Red-600
    darkRed: '#991B1B',  // Red-800
    lightRed: '#FCA5A5', // Red-300
  },
  neutral: {
    white: '#FFFFFF',
    offWhite: '#F9FAFB',  // Gray-50
    darkGray: '#1F2937',  // Gray-800
    lightGray: '#6B7280', // Gray-500
  },
  gradients: {
    hero: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
    card: 'linear-gradient(145deg, #FFFFFF 0%, #F9FAFB 100%)',
    button: 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)',
    background: 'linear-gradient(180deg, #FFFFFF 0%, #FEF2F2 100%)',
  },
} as const;

// Animation Constants
export const ANIMATIONS = {
  durations: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
  },
  easings: {
    easeOut: [0.0, 0.0, 0.2, 1],
    easeIn: [0.4, 0.0, 1, 1],
    easeInOut: [0.4, 0.0, 0.2, 1],
  },
  transitions: {
    page: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.3 }
    },
    stagger: {
      animate: {
        transition: {
          staggerChildren: 0.1
        }
      }
    },
    buttonHover: {
      scale: 1.05,
      boxShadow: "0 10px 25px rgba(220, 38, 38, 0.3)",
      transition: { duration: 0.2 }
    },
    cardHover: {
      y: -5,
      scale: 1.02,
      boxShadow: "0 20px 40px rgba(220, 38, 38, 0.1)",
      transition: { duration: 0.3 }
    },
  },
} as const;

// Navigation Constants
export const NAV_ITEMS = [
  { title: 'Home', href: '/' },
  { title: 'Products', href: '/products' },
  { title: 'Features', href: '/#features' },
  { title: 'Pricing', href: '/#pricing' },
  { title: 'Support', href: '/support' },
] as const;

// Product Categories
export const PRODUCT_CATEGORIES = [
  { id: 'mlbb', name: 'Mobile Legends', slug: 'mobile-legends', icon: '🎮' },
  { id: 'pubgm', name: 'PUBG Mobile', slug: 'pubg-mobile', icon: '🔫' },
  { id: 'dfm', name: 'DFM Garena', slug: 'dfm-garena', icon: '⚔️' },
] as const;

// Features List
export const FEATURES = [
  {
    title: 'Instant Key Delivery',
    description: 'Get your license key immediately after purchase',
    icon: '⚡',
  },
  {
    title: '24/7 Support',
    description: 'Round-the-clock customer support for all users',
    icon: '🛟',
  },
  {
    title: 'Anti-Ban Protection',
    description: 'Advanced protection to keep your account safe',
    icon: '🛡️',
  },
  {
    title: 'Regular Updates',
    description: 'Continuous updates to stay ahead of game patches',
    icon: '🔄',
  },
] as const;

// Testimonials Data
export const TESTIMONIALS = [
  {
    id: '1',
    name: 'Ahmad Rizki',
    avatar: '/avatars/user1.jpg',
    rating: 5,
    comment: 'Amazing tool! Helped me dominate in Mobile Legends. Highly recommended!',
    productId: 'mlbb-pro',
    isVerified: true,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Sari Dewi',
    avatar: '/avatars/user2.jpg',
    rating: 5,
    comment: 'Fast delivery and excellent support. Worth every penny!',
    productId: 'pubgm-elite',
    isVerified: true,
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    name: 'Budi Santoso',
    avatar: '/avatars/user3.jpg',
    rating: 4,
    comment: 'Great features and easy to use. Customer service is very responsive.',
    productId: 'dfm-premium',
    isVerified: true,
    createdAt: new Date('2024-01-25'),
  },
] as const;

// API Endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
  },
  products: {
    list: '/api/products',
    detail: '/api/products',
    categories: '/api/products/categories',
  },
  orders: {
    create: '/api/orders',
    list: '/api/orders',
    detail: '/api/orders',
  },
  user: {
    profile: '/api/user/profile',
    licenses: '/api/user/licenses',
  },
} as const;

// Payment Methods
export const PAYMENT_METHODS = [
  { id: 'duitku_va', name: 'Virtual Account', icon: '🏦' },
  { id: 'duitku_ewallet', name: 'E-Wallet', icon: '📱' },
  { id: 'duitku_qris', name: 'QRIS', icon: '📱' },
] as const;

// Breakpoints
export const BREAKPOINTS = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1280px',
} as const;

// Site Configuration
export const SITE_CONFIG = {
  name: 'NusantaraHax',
  description: 'Dominate Your Game with Premium Gaming Tools',
  url: 'https://nusantarahax.com',
  ogImage: '/og-image.jpg',
  links: {
    twitter: 'https://twitter.com/nusantarahax',
    github: 'https://github.com/nusantarahax',
    discord: 'https://discord.gg/nusantarahax',
  },
} as const;
