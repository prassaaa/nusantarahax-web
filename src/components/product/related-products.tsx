'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp, Clock, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductCard } from '@/components/common/product-card'
import { getComprehensiveRecommendations } from '@/lib/utils/recommendations'
import { SAMPLE_PRODUCTS } from '@/lib/constants/sample-data'
import type { Product } from '@/types'

interface RelatedProductsProps {
  currentProduct: Product
}

export function RelatedProducts({ currentProduct }: RelatedProductsProps) {
  const [activeTab, setActiveTab] = useState('smart')
  
  // Get comprehensive recommendations
  const recommendations = getComprehensiveRecommendations(currentProduct, SAMPLE_PRODUCTS)
  
  const tabs = [
    {
      id: 'smart',
      label: 'Recommended',
      icon: Sparkles,
      products: recommendations.smartRecommendations,
      description: 'Personalized recommendations based on your interests'
    },
    {
      id: 'category',
      label: 'Similar',
      icon: TrendingUp,
      products: recommendations.sameCategoryProducts,
      description: `More ${currentProduct.category.name} products`
    },
    {
      id: 'price',
      label: 'Price Range',
      icon: DollarSign,
      products: recommendations.similarPriceProducts,
      description: 'Products in similar price range'
    },
    {
      id: 'recent',
      label: 'Recently Viewed',
      icon: Clock,
      products: recommendations.recentlyViewed,
      description: 'Products you viewed recently'
    }
  ]

  // Filter tabs that have products
  const availableTabs = tabs.filter(tab => tab.products.length > 0)

  if (availableTabs.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="mb-16"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          You Might Also Like
        </h2>
        <p className="text-gray-600">
          Discover more amazing products tailored for you
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          {availableTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center space-x-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {availableTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">{tab.description}</p>
            </div>

            <ProductGrid products={tab.products} />
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  )
}

interface ProductGridProps {
  products: Product[]
}

function ProductGrid({ products }: ProductGridProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemsPerPage = 3
  const totalPages = Math.ceil(products.length / itemsPerPage)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages)
  }

  const currentProducts = products.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  )

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">No products found in this category</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      {totalPages > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg hover:bg-gray-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg hover:bg-gray-50"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {currentProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <ProductCard product={product} index={index} />
          </motion.div>
        ))}
      </div>

      {/* Pagination Dots */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-3 h-3 rounded-full transition-colors ${
                i === currentIndex ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* Products Counter */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-500">
          Showing {currentIndex * itemsPerPage + 1}-{Math.min((currentIndex + 1) * itemsPerPage, products.length)} of {products.length} products
        </p>
      </div>
    </div>
  )
}

// Alternative compact version for smaller spaces
export function CompactRelatedProducts({ currentProduct }: RelatedProductsProps) {
  const recommendations = getComprehensiveRecommendations(currentProduct, SAMPLE_PRODUCTS)
  const products = recommendations.smartRecommendations.slice(0, 4)

  if (products.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Related Products
      </h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <ProductCard product={product} index={index} compact />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
