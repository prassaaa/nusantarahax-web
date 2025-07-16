'use client'

import { useState, useCallback } from 'react'
import { useLocalStorage } from './use-local-storage'
import type { CartItem, Product } from '@/types'

export function useCart() {
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>('nusantarahax-cart', [])
  const [isLoading, setIsLoading] = useState(false)

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setIsLoading(true)
    setCartItems(currentItems => {
      const existingItem = currentItems.find(item => item.productId === product.id)
      
      if (existingItem) {
        return currentItems.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      
      return [...currentItems, { productId: product.id, quantity, product }]
    })
    setIsLoading(false)
  }, [setCartItems])

  const removeFromCart = useCallback((productId: string) => {
    setIsLoading(true)
    setCartItems(currentItems => currentItems.filter(item => item.productId !== productId))
    setIsLoading(false)
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
    setCartItems([])
    setIsLoading(false)
  }, [setCartItems])

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }, [cartItems])

  const getCartItemsCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }, [cartItems])

  const isInCart = useCallback((productId: string) => {
    return cartItems.some(item => item.productId === productId)
  }, [cartItems])

  return {
    cartItems,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    isInCart,
  }
}
