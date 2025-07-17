import { Metadata } from 'next'
import { CartPageContent } from '@/components/cart/cart-page-content'

export const metadata: Metadata = {
  title: 'Shopping Cart - NusantaraHax',
  description: 'Review your selected gaming tools before checkout',
}

export default function CartPage() {
  return <CartPageContent />
}
