import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/utils'
import { CheckoutPageContent } from '@/components/checkout/checkout-page-content'

export const metadata: Metadata = {
  title: 'Checkout - NusantaraHax',
  description: 'Complete your purchase of premium gaming tools',
}

export default async function CheckoutPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin?callbackUrl=/checkout')
  }

  return <CheckoutPageContent user={user} />
}
