'use client'

import { motion } from 'framer-motion'
import { ShoppingBag, Minus, Plus, Trash2, ArrowLeft, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCart } from '@/hooks/use-cart'
import { formatCurrency } from '@/lib/utils'
import { MainLayout } from '@/components/layout/main-layout'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export function CartPageContent() {
  const { 
    cartItems, 
    cartSummary, 
    discountCode,
    hasDiscount,
    isLoading, 
    isEmpty, 
    updateQuantity, 
    removeFromCart,
    clearCart,
    applyDiscount,
    removeDiscount
  } = useCart()

  const [discountInput, setDiscountInput] = useState('')
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return
    
    setIsApplyingDiscount(true)
    const success = await applyDiscount(discountInput.trim())
    if (success) {
      setDiscountInput('')
    }
    setIsApplyingDiscount(false)
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-background py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
              <p className="text-gray-600">
                {isEmpty ? 'Your cart is empty' : `${cartSummary.itemsCount} item${cartSummary.itemsCount !== 1 ? 's' : ''} in your cart`}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </div>

          {isEmpty ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Your cart is empty
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Looks like you haven't added any gaming tools to your cart yet. 
                Browse our collection and find the perfect tools for your game.
              </p>
              <Button size="lg" asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Cart Items</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear Cart
                  </Button>
                </div>

                {cartItems.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          {/* Product Image */}
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1">
                              {item.product.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              {item.product.category}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-primary text-lg">
                                {formatCurrency(item.product.salePrice || item.product.price)}
                              </span>
                              {item.product.salePrice && (
                                <span className="text-sm text-gray-500 line-through">
                                  {formatCurrency(item.product.price)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                disabled={isLoading}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-12 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={isLoading}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => removeFromCart(item.productId)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Item Total */}
                          <div className="text-right">
                            <p className="font-semibold text-lg">
                              {formatCurrency((item.product.salePrice || item.product.price) * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="space-y-6">
                {/* Discount Code */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Tag className="h-5 w-5 mr-2" />
                      Discount Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hasDiscount ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800">
                            Code: {discountCode}
                          </p>
                          <p className="text-sm text-green-600">
                            Discount applied!
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeDiscount}
                          className="text-green-700 hover:text-green-800"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Enter discount code"
                            value={discountInput}
                            onChange={(e) => setDiscountInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApplyDiscount()}
                          />
                          <Button 
                            onClick={handleApplyDiscount}
                            disabled={!discountInput.trim() || isApplyingDiscount}
                          >
                            {isApplyingDiscount ? 'Applying...' : 'Apply'}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Try: WELCOME10, NEWUSER15, SAVE20, STUDENT25
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(cartSummary.subtotal)}</span>
                      </div>
                      {cartSummary.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>-{formatCurrency(cartSummary.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Tax (PPN 11%)</span>
                        <span>{formatCurrency(cartSummary.tax)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span>{formatCurrency(cartSummary.total)}</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full gradient-button text-white border-0" 
                      size="lg"
                      asChild
                    >
                      <Link href="/checkout">
                        Proceed to Checkout
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
