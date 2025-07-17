'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  Star,
  ShoppingCart,
  Check,
  Shield,
  Download,
  Clock,
  Users,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductCard } from '@/components/common/product-card'
import { useCart } from '@/hooks/use-cart'
import { formatCurrency, calculateDiscount } from '@/lib/utils'
import { SAMPLE_PRODUCTS } from '@/lib/constants/sample-data'
import { ANIMATIONS } from '@/lib/constants'
import { ProductReviews } from '@/components/product/product-reviews'
import { RelatedProducts } from '@/components/product/related-products'
import type { Product } from '@/types'

interface ProductDetailContentProps {
  product: Product
}

export function ProductDetailContent({ product }: ProductDetailContentProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const { addToCart, isInCart } = useCart()
  
  const isProductInCart = isInCart(product.id)
  const discount = product.originalPrice ? calculateDiscount(product.originalPrice, product.price) : 0
  


  const handleAddToCart = () => {
    addToCart(product)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
  }

  return (
    <div className="min-h-screen bg-gradient-background pt-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-2 text-sm text-gray-600 mb-8"
        >
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Button variant="outline" asChild className="hover:bg-red-50">
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              {/* Main Image */}
              <div
                className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 mb-4 cursor-zoom-in group"
                onClick={() => setIsImageModalOpen(true)}
              >
                <Image
                  src={product.images[currentImageIndex]}
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Zoom Indicator */}
                <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to zoom
                </div>
                
                {/* Image Navigation */}
                {product.images.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}

                {/* Badges */}
                {product.isFeatured && (
                  <Badge className="absolute top-4 left-4 gradient-button text-white border-0">
                    Featured
                  </Badge>
                )}
                {discount > 0 && (
                  <Badge variant="destructive" className="absolute top-4 right-4">
                    -{discount}%
                  </Badge>
                )}
              </div>

              {/* Thumbnail Images */}
              {product.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex
                          ? 'border-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Category */}
            <Badge variant="outline" className="mb-4">
              {product.category.icon} {product.category.name}
            </Badge>

            {/* Product Name */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600 ml-2">(4.8 • 1,234 reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-2">
                <span className="text-4xl font-bold text-primary">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
              {discount > 0 && (
                <p className="text-green-600 font-medium">
                  You save {formatCurrency(product.originalPrice! - product.price)} ({discount}% off)
                </p>
              )}
            </div>

            {/* Short Description */}
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Key Features */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features:</h3>
              <div className="grid grid-cols-1 gap-3">
                {product.features.slice(0, 4).map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center text-gray-700"
                  >
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    {feature}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Purchase Section */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <div className="flex items-center space-x-4 mb-4">
                <Shield className="h-6 w-6 text-green-500" />
                <span className="text-sm text-gray-600">
                  Secure purchase with instant delivery
                </span>
              </div>
              
              <div className="flex space-x-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <Button
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isProductInCart}
                    className={`w-full gradient-button text-white border-0 ${
                      isProductInCart ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {isProductInCart ? 'In Cart' : 'Add to Cart'}
                  </Button>
                </motion.div>
                
                <Button variant="outline" size="lg">
                  <Play className="h-5 w-5 mr-2" />
                  Demo
                </Button>
              </div>
            </div>

            {/* Product Info Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center p-4">
                <Download className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Instant Download</p>
              </Card>
              <Card className="text-center p-4">
                <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">24/7 Support</p>
              </Card>
              <Card className="text-center p-4">
                <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">50K+ Users</p>
              </Card>
            </div>
          </motion.div>
        </div>

        {/* Product Details Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    {product.description}
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Product Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Version:</span>
                          <span className="font-medium">{product.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span className="font-medium">{product.category.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Updated:</span>
                          <span className="font-medium">
                            {new Date(product.updatedAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">What's Included</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          Main application file
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          Installation guide
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          Configuration tutorial
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          24/7 support access
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Complete Feature List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {product.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="font-medium text-gray-900">{feature}</h5>
                          <p className="text-sm text-gray-600 mt-1">
                            Advanced feature with premium quality implementation
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compatibility" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Supported Platforms</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.compatibility.map((platform, index) => (
                          <Badge key={index} variant="outline" className="px-3 py-1">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Minimum Requirements</h4>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li>• RAM: 2GB minimum</li>
                          <li>• Storage: 100MB free space</li>
                          <li>• Internet: Stable connection required</li>
                          <li>• Permissions: Root/Admin access</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Recommended</h4>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li>• RAM: 4GB or higher</li>
                          <li>• Storage: 500MB free space</li>
                          <li>• Internet: High-speed connection</li>
                          <li>• Device: Latest OS version</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <ProductReviews productId={product.id} />
            </TabsContent>

          </Tabs>
        </motion.div>

        {/* Related Products */}
        <RelatedProducts currentProduct={product} />

        {/* Image Modal */}
        {isImageModalOpen && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-full">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsImageModalOpen(false)}
                className="absolute -top-12 right-0 text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>

              <div className="relative aspect-video">
                <Image
                  src={product.images[currentImageIndex]}
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Modal Navigation */}
              {product.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded text-sm">
                {currentImageIndex + 1} / {product.images.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
