'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'
import { formatCurrency, calculateDiscount } from '@/lib/utils'
import { ANIMATIONS } from '@/lib/constants'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  index?: number
  compact?: boolean
}

export function ProductCard({ product, index = 0, compact = false }: ProductCardProps) {
  const discount = product.originalPrice ? calculateDiscount(product.originalPrice, product.price) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={ANIMATIONS.transitions.cardHover}
      className="group"
    >
      <Card className="h-full overflow-hidden border-0 shadow-lg hover:shadow-red-lg transition-all duration-300">
        {/* Product Image */}
        <CardHeader className="p-0 relative">
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={product.images[0] || '/placeholder-product.jpg'}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
            {product.isFeatured && (
              <Badge className="absolute top-3 left-3 gradient-button text-white border-0">
                Featured
              </Badge>
            )}
            {discount > 0 && (
              <Badge variant="destructive" className="absolute top-3 right-3">
                -{discount}%
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Category */}
          <Badge variant="outline" className="mb-3">
            {product.category.name}
          </Badge>

          {/* Product Name */}
          <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
            <Link href={`/products/${product.slug}`}>
              {product.name}
            </Link>
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {product.shortDescription}
          </p>

          {/* Features */}
          <div className="space-y-2 mb-4">
            {product.features.slice(0, 3).map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center text-sm text-gray-600"
              >
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                {feature}
              </motion.div>
            ))}
          </div>

          {/* Rating */}
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">(4.8)</span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <div className="flex w-full space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              asChild
            >
              <Link href={`/products/${product.slug}`}>
                View Details
              </Link>
            </Button>
            <AddToCartButton
              productId={product.id}
              productName={product.name}
              size="sm"
              className="gradient-button text-white border-0"
            />
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
