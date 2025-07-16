import type { Product, ProductCategory } from '@/types'

// Sample Categories
export const SAMPLE_CATEGORIES: ProductCategory[] = [
  {
    id: 'mlbb',
    name: 'Mobile Legends',
    slug: 'mobile-legends',
    description: 'Premium tools for Mobile Legends Bang Bang',
    icon: '🎮',
    isActive: true,
  },
  {
    id: 'pubgm',
    name: 'PUBG Mobile',
    slug: 'pubg-mobile',
    description: 'Advanced tools for PUBG Mobile',
    icon: '🔫',
    isActive: true,
  },
  {
    id: 'dfm',
    name: 'DFM Garena',
    slug: 'dfm-garena',
    description: 'Professional tools for DFM Garena',
    icon: '⚔️',
    isActive: true,
  },
]

// Sample Products
export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'mlbb-pro-hack',
    name: 'MLBB Pro Hack',
    slug: 'mlbb-pro-hack',
    description: 'Advanced Mobile Legends hack with map hack, damage boost, and auto-aim features. Includes anti-ban protection and regular updates to stay undetected.',
    shortDescription: 'Advanced MLBB hack with map hack, damage boost, and auto-aim',
    price: 150000,
    originalPrice: 200000,
    category: SAMPLE_CATEGORIES[0],
    features: [
      'Map Hack & Wallhack',
      'Damage Boost (1.5x - 3x)',
      'Auto Aim & Lock Target',
      'Speed Hack',
      'Anti-Ban Protection',
      'Regular Updates',
      '24/7 Support',
      'Easy Installation'
    ],
    images: [
      'https://picsum.photos/1920/1080?random=1',
      'https://picsum.photos/1920/1080?random=2',
      'https://picsum.photos/1920/1080?random=3'
    ],
    isActive: true,
    isFeatured: true,
    downloadUrl: '/downloads/mlbb-pro-hack.zip',
    version: '2.1.5',
    compatibility: ['Android 7+', 'iOS 12+'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-15'),
  },
  {
    id: 'pubgm-elite-esp',
    name: 'PUBGM Elite ESP',
    slug: 'pubgm-elite-esp',
    description: 'Professional PUBG Mobile ESP with player detection, item ESP, vehicle ESP, and advanced aimbot. Designed for competitive players.',
    shortDescription: 'Professional PUBGM ESP with player detection and advanced aimbot',
    price: 175000,
    originalPrice: 250000,
    category: SAMPLE_CATEGORIES[1],
    features: [
      'Player ESP & Skeleton',
      'Item ESP (Weapons, Armor)',
      'Vehicle ESP',
      'Advanced Aimbot',
      'No Recoil & No Spread',
      'Speed Hack',
      'Anti-Detection System',
      'Lifetime Updates'
    ],
    images: [
      'https://picsum.photos/1920/1080?random=4',
      'https://picsum.photos/1920/1080?random=5',
      'https://picsum.photos/1920/1080?random=6'
    ],
    isActive: true,
    isFeatured: true,
    downloadUrl: '/downloads/pubgm-elite-esp.zip',
    version: '3.2.1',
    compatibility: ['Android 8+', 'iOS 13+'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-12-10'),
  },
  {
    id: 'dfm-premium-mod',
    name: 'DFM Premium Mod',
    slug: 'dfm-premium-mod',
    description: 'Complete DFM Garena modification with unlimited resources, character unlock, and premium features. Perfect for casual and competitive play.',
    shortDescription: 'Complete DFM mod with unlimited resources and character unlock',
    price: 125000,
    category: SAMPLE_CATEGORIES[2],
    features: [
      'Unlimited Gold & Diamonds',
      'All Characters Unlocked',
      'Premium Skins Access',
      'Auto Win Matches',
      'Damage Multiplier',
      'God Mode',
      'Anti-Ban Shield',
      'Regular Updates'
    ],
    images: [
      'https://picsum.photos/1920/1080?random=7',
      'https://picsum.photos/1920/1080?random=8',
      'https://picsum.photos/1920/1080?random=9'
    ],
    isActive: true,
    isFeatured: true,
    downloadUrl: '/downloads/dfm-premium-mod.zip',
    version: '1.8.3',
    compatibility: ['Android 6+'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-12-05'),
  },
  {
    id: 'mlbb-rank-booster',
    name: 'MLBB Rank Booster',
    slug: 'mlbb-rank-booster',
    description: 'Automated ranking system for Mobile Legends with smart AI gameplay, auto-farm, and rank protection features.',
    shortDescription: 'Automated ranking system with smart AI gameplay',
    price: 100000,
    originalPrice: 150000,
    category: SAMPLE_CATEGORIES[0],
    features: [
      'Auto Rank Up',
      'Smart AI Gameplay',
      'Auto Farm & Level',
      'Rank Protection',
      'Win Rate Booster',
      'Safe & Undetected',
      '24/7 Operation',
      'Multiple Account Support'
    ],
    images: [
      'https://picsum.photos/1920/1080?random=10',
      'https://picsum.photos/1920/1080?random=11'
    ],
    isActive: true,
    isFeatured: false,
    downloadUrl: '/downloads/mlbb-rank-booster.zip',
    version: '1.5.2',
    compatibility: ['Android 7+', 'iOS 12+'],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-11-30'),
  },
  {
    id: 'pubgm-aimbot-pro',
    name: 'PUBGM Aimbot Pro',
    slug: 'pubgm-aimbot-pro',
    description: 'Advanced aimbot for PUBG Mobile with customizable settings, smooth aim, and prediction algorithms for perfect shots.',
    shortDescription: 'Advanced aimbot with customizable settings and smooth aim',
    price: 200000,
    category: SAMPLE_CATEGORIES[1],
    features: [
      'Smooth Aimbot',
      'Prediction Algorithm',
      'Customizable FOV',
      'Bone Selection',
      'Visibility Check',
      'Auto Fire',
      'Recoil Control',
      'Undetected System'
    ],
    images: [
      'https://picsum.photos/1920/1080?random=12',
      'https://picsum.photos/1920/1080?random=13'
    ],
    isActive: true,
    isFeatured: false,
    downloadUrl: '/downloads/pubgm-aimbot-pro.zip',
    version: '2.3.4',
    compatibility: ['Android 8+', 'iOS 13+'],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-12-01'),
  },
  {
    id: 'dfm-auto-battle',
    name: 'DFM Auto Battle',
    slug: 'dfm-auto-battle',
    description: 'Automated battle system for DFM Garena with intelligent combat AI, auto-skill usage, and resource farming.',
    shortDescription: 'Automated battle system with intelligent combat AI',
    price: 80000,
    originalPrice: 120000,
    category: SAMPLE_CATEGORIES[2],
    features: [
      'Auto Battle AI',
      'Smart Skill Usage',
      'Resource Farming',
      'Quest Completion',
      'Energy Management',
      'Safe Automation',
      'Custom Scripts',
      'Multi-Account'
    ],
    images: [
      'https://picsum.photos/1920/1080?random=14',
      'https://picsum.photos/1920/1080?random=15'
    ],
    isActive: true,
    isFeatured: false,
    downloadUrl: '/downloads/dfm-auto-battle.zip',
    version: '1.2.1',
    compatibility: ['Android 6+'],
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-11-25'),
  },
]

// Get featured products
export const getFeaturedProducts = (): Product[] => {
  return SAMPLE_PRODUCTS.filter(product => product.isFeatured && product.isActive)
}

// Get products by category
export const getProductsByCategory = (categoryId: string): Product[] => {
  return SAMPLE_PRODUCTS.filter(product => 
    product.category.id === categoryId && product.isActive
  )
}

// Get product by slug
export const getProductBySlug = (slug: string): Product | undefined => {
  return SAMPLE_PRODUCTS.find(product => product.slug === slug && product.isActive)
}
