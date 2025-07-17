'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/hooks/use-cart'
import { formatCurrency } from '@/lib/utils'
import { ShoppingBag, Tag } from 'lucide-react'
import Image from 'next/image'

export function OrderSummary() {
  const { cartItems, cartSummary, discountCode, hasDiscount } = useCart()

  return (
    <div className="space-y-6">
      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingBag className="h-5 w-5 mr-2" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.productId} className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">
                  {item.product.name}
                </h4>
                <p className="text-xs text-gray-600">
                  Qty: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm">
                  {formatCurrency((item.product.salePrice || item.product.price) * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Discount */}
      {hasDiscount && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <Tag className="h-5 w-5 mr-2" />
              Discount Applied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{discountCode}</p>
                <p className="text-sm text-gray-600">Discount code applied</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                -{formatCurrency(cartSummary.discount)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Price Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal ({cartSummary.itemsCount} items)</span>
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
          
          <div className="border-t pt-3">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(cartSummary.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">
                Secure Payment
              </p>
              <p className="text-xs text-blue-700">
                Your payment information is encrypted and secure. 
                All transactions are processed through Duitku's secure payment gateway.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
