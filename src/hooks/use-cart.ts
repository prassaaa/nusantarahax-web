'use client'

import { useState, useCallback, useMemo } from 'react'
import { useLocalStorage } from './use-local-storage'
import { toast } from 'sonner'
import type { CartItem, Product } from '@/types'

interface CartSummary {
  subtotal: number
  tax: number
  discount: number
  total: number
  itemsCount: number
}

interface CartActions {
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  applyDiscount: (code: string) => Promise<boolean>
  removeDiscount: () => void
}

export function useCart() {
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>('nusantarahax-cart', [])
  const [discountCode, setDiscountCode] = useLocalStorage<string>('nusantarahax-discount', '')
  const [discountAmount, setDiscountAmount] = useLocalStorage<number>('nusantarahax-discount-amount', 0)
  const [isLoading, setIsLoading] = useState(false)

  // Tax rate (11% PPN Indonesia)
  const TAX_RATE = 0.11

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setIsLoading(true)

    try {
      setCartItems(currentItems => {
        const existingItem = currentItems.find(item => item.productId === product.id)

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity
          toast.success(`Updated ${product.name} quantity to ${newQuantity}`)
          return currentItems.map(item =>
            item.productId === product.id
              ? { ...item, quantity: newQuantity }
              : item
          )
        }

        toast.success(`Added ${product.name} to cart`)
        return [...currentItems, {
          productId: product.id,
          quantity,
          product,
          addedAt: new Date().toISOString()
        }]
      })
    } catch (error) {
      toast.error('Failed to add item to cart')
      console.error('Add to cart error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [setCartItems])

  const removeFromCart = useCallback((productId: string) => {
    setIsLoading(true)

    try {
      setCartItems(currentItems => {
        const item = currentItems.find(item => item.productId === productId)
        if (item) {
          toast.success(`Removed ${item.product.name} from cart`)
        }
        return currentItems.filter(item => item.productId !== productId)
      })
    } catch (error) {
      toast.error('Failed to remove item from cart')
      console.error('Remove from cart error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [setCartItems])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    setIsLoading(true)
    setCartItems(currentItems =>
      currentItems.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    )
    setIsLoading(false)
  }, [setCartItems, removeFromCart])

  const clearCart = useCallback(() => {
    setIsLoading(true)

    try {
      setCartItems([])
      setDiscountCode('')
      setDiscountAmount(0)
      toast.success('Cart cleared')
    } catch (error) {
      toast.error('Failed to clear cart')
      console.error('Clear cart error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [setCartItems, setDiscountCode, setDiscountAmount])

  const applyDiscount = useCallback(async (code: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      // Simulate API call to validate discount code
      await new Promise(resolve => setTimeout(resolve, 1000))

      const validCodes = {
        'WELCOME10': 0.10,
        'NEWUSER15': 0.15,
        'SAVE20': 0.20,
        'STUDENT25': 0.25,
      }

      const discount = validCodes[code.toUpperCase() as keyof typeof validCodes]

      if (discount) {
        setDiscountCode(code.toUpperCase())
        setDiscountAmount(discount)
        toast.success(`Discount code "${code}" applied! ${Math.round(discount * 100)}% off`)
        return true
      } else {
        toast.error('Invalid discount code')
        return false
      }
    } catch (error) {
      toast.error('Failed to apply discount code')
      console.error('Apply discount error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [setDiscountCode, setDiscountAmount])

  const removeDiscount = useCallback(() => {
    setDiscountCode('')
    setDiscountAmount(0)
    toast.success('Discount removed')
  }, [setDiscountCode, setDiscountAmount])

  // Memoized cart calculations
  const cartSummary = useMemo((): CartSummary => {
    const subtotal = cartItems.reduce((total, item) => {
      const price = item.product.salePrice || item.product.price
      return total + (price * item.quantity)
    }, 0)

    const discount = subtotal * discountAmount
    const subtotalAfterDiscount = subtotal - discount
    const tax = subtotalAfterDiscount * TAX_RATE
    const total = subtotalAfterDiscount + tax
    const itemsCount = cartItems.reduce((count, item) => count + item.quantity, 0)

    return {
      subtotal,
      tax,
      discount,
      total,
      itemsCount
    }
  }, [cartItems, discountAmount, TAX_RATE])

  const getCartTotal = useCallback(() => cartSummary.total, [cartSummary.total])
  const getCartItemsCount = useCallback(() => cartSummary.itemsCount, [cartSummary.itemsCount])

  const isInCart = useCallback((productId: string) => {
    return cartItems.some(item => item.productId === productId)
  }, [cartItems])

  const getCartItem = useCallback((productId: string) => {
    return cartItems.find(item => item.productId === productId)
  }, [cartItems])

  const isEmpty = useMemo(() => cartItems.length === 0, [cartItems.length])

  const hasDiscount = useMemo(() => discountAmount > 0, [discountAmount])

  return {
    // Cart data
    cartItems,
    cartSummary,
    discountCode,
    discountAmount,

    // Cart state
    isLoading,
    isEmpty,
    hasDiscount,

    // Cart actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyDiscount,
    removeDiscount,

    // Utility functions
    getCartTotal,
    getCartItemsCount,
    isInCart,
    getCartItem,
  }
}
