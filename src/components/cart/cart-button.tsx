'use client'

import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/hooks/use-cart'
import { CartDrawer } from './cart-drawer'

export function CartButton() {
  const { cart } = useCart()

  return (
    <CartDrawer>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
        >
          <ShoppingCart className="h-5 w-5" />
          {cart && cart.totalItems > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Badge
                variant="destructive"
                className="h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {cart.totalItems > 99 ? '99+' : cart.totalItems}
              </Badge>
            </motion.div>
          )}
        </Button>
      </motion.div>
    </CartDrawer>
  )
}
