'use client'

import { useState } from 'react'
import { useCart } from '@/hooks/use-cart'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Loader2,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface AddToCartButtonProps {
  productId: string
  productName: string
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showQuantitySelector?: boolean
}

export function AddToCartButton({
  productId,
  productName,
  className,
  variant = 'default',
  size = 'default',
  showQuantitySelector = false
}: AddToCartButtonProps) {
  const { data: session, status } = useSession()
  const { addToCart, isInCart, getCartItem, isLoading } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const cartItem = getCartItem(productId)
  const inCart = isInCart(productId)

  const handleAddToCart = async () => {
    if (status !== 'authenticated') {
      toast.error('Please sign in to add items to cart')
      return
    }

    setIsAdding(true)
    const success = await addToCart(productId, quantity)
    if (success) {
      setQuantity(1) // Reset quantity after successful add
    }
    setIsAdding(false)
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity)
    }
  }

  // If user is not authenticated, show sign in prompt
  if (status !== 'authenticated') {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <Link href="/auth/signin">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Sign in to Purchase
        </Link>
      </Button>
    )
  }

  // If item is already in cart, show different state
  if (inCart && cartItem) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Button
          variant="outline"
          size={size}
          className="w-full"
          disabled
        >
          <Check className="h-4 w-4 mr-2" />
          In Cart ({cartItem.quantity})
        </Button>
        {showQuantitySelector && (
          <div className="flex items-center gap-2">
            <Label htmlFor="add-quantity" className="text-sm">
              Add more:
            </Label>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                id="add-quantity"
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="w-16 h-8 text-center"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= 10}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={isLoading || isAdding}
              size="sm"
            >
              {isAdding ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Plus className="h-3 w-3 mr-1" />
              )}
              Add
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Default add to cart button
  return (
    <div className={`space-y-2 ${className}`}>
      {showQuantitySelector && (
        <div className="flex items-center gap-2">
          <Label htmlFor="quantity" className="text-sm">
            Quantity:
          </Label>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="10"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="w-16 h-8 text-center"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= 10}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      
      <Button
        onClick={handleAddToCart}
        disabled={isLoading || isAdding}
        variant={variant}
        size={size}
        className="w-full"
      >
        {isAdding ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
            {showQuantitySelector && quantity > 1 && ` (${quantity})`}
          </>
        )}
      </Button>
    </div>
  )
}
