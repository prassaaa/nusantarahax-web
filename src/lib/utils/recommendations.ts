import type { Product } from '@/types'

export interface RecommendationOptions {
  excludeIds?: string[]
  limit?: number
  includeCategories?: string[]
  priceRange?: {
    min: number
    max: number
  }
}

/**
 * Get smart product recommendations based on various factors
 */
export function getSmartRecommendations(
  currentProduct: Product,
  allProducts: Product[],
  options: RecommendationOptions = {}
): Product[] {
  const {
    excludeIds = [currentProduct.id],
    limit = 6,
    includeCategories,
    priceRange
  } = options

  // Filter available products
  let availableProducts = allProducts.filter(product => 
    product.isActive && 
    !excludeIds.includes(product.id)
  )

  // Apply category filter if specified
  if (includeCategories && includeCategories.length > 0) {
    availableProducts = availableProducts.filter(product =>
      includeCategories.includes(product.category.id)
    )
  }

  // Apply price range filter if specified
  if (priceRange) {
    availableProducts = availableProducts.filter(product =>
      product.price >= priceRange.min && product.price <= priceRange.max
    )
  }

  // Calculate recommendation scores
  const scoredProducts = availableProducts.map(product => ({
    product,
    score: calculateRecommendationScore(currentProduct, product)
  }))

  // Sort by score (highest first) and return limited results
  return scoredProducts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.product)
}

/**
 * Calculate recommendation score based on multiple factors
 */
function calculateRecommendationScore(currentProduct: Product, candidateProduct: Product): number {
  let score = 0

  // Same category gets high score
  if (currentProduct.category.id === candidateProduct.category.id) {
    score += 50
  }

  // Similar price range gets medium score
  const priceDifference = Math.abs(currentProduct.price - candidateProduct.price)
  const priceScore = Math.max(0, 30 - (priceDifference / currentProduct.price) * 30)
  score += priceScore

  // Popular products get bonus score
  if (candidateProduct.isPopular) {
    score += 20
  }

  // Featured products get bonus score
  if (candidateProduct.isFeatured) {
    score += 15
  }

  // Higher rating gets bonus score
  if (candidateProduct.rating) {
    score += candidateProduct.rating * 2
  }

  // Discount products get small bonus
  if (candidateProduct.originalPrice && candidateProduct.originalPrice > candidateProduct.price) {
    score += 10
  }

  return score
}

/**
 * Get products from the same category
 */
export function getSameCategoryProducts(
  currentProduct: Product,
  allProducts: Product[],
  limit = 4
): Product[] {
  return getSmartRecommendations(currentProduct, allProducts, {
    includeCategories: [currentProduct.category.id],
    limit
  })
}

/**
 * Get products in similar price range
 */
export function getSimilarPriceProducts(
  currentProduct: Product,
  allProducts: Product[],
  limit = 4
): Product[] {
  const priceVariation = currentProduct.price * 0.3 // 30% variation
  
  return getSmartRecommendations(currentProduct, allProducts, {
    priceRange: {
      min: currentProduct.price - priceVariation,
      max: currentProduct.price + priceVariation
    },
    limit
  })
}

/**
 * Get popular products (excluding current)
 */
export function getPopularProducts(
  currentProduct: Product,
  allProducts: Product[],
  limit = 4
): Product[] {
  return allProducts
    .filter(product => 
      product.isActive && 
      product.id !== currentProduct.id && 
      product.isPopular
    )
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit)
}

/**
 * Get recently viewed products (mock implementation)
 * In a real app, this would come from user session/cookies
 */
export function getRecentlyViewedProducts(
  currentProduct: Product,
  allProducts: Product[],
  limit = 4
): Product[] {
  // Mock recently viewed - in real app, get from localStorage/session
  const recentlyViewed = ['valorant-aimbot-pro', 'pubg-mobile-hack', 'ml-diamond-hack']
  
  return allProducts
    .filter(product => 
      product.isActive && 
      product.id !== currentProduct.id &&
      recentlyViewed.includes(product.id)
    )
    .slice(0, limit)
}

/**
 * Get comprehensive recommendations with different sections
 */
export function getComprehensiveRecommendations(
  currentProduct: Product,
  allProducts: Product[]
) {
  return {
    sameCategoryProducts: getSameCategoryProducts(currentProduct, allProducts, 3),
    similarPriceProducts: getSimilarPriceProducts(currentProduct, allProducts, 3),
    popularProducts: getPopularProducts(currentProduct, allProducts, 3),
    recentlyViewed: getRecentlyViewedProducts(currentProduct, allProducts, 3),
    smartRecommendations: getSmartRecommendations(currentProduct, allProducts, { limit: 6 })
  }
}
