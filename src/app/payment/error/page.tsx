import { Metadata } from 'next'
import { Suspense } from 'react'
import { PaymentErrorContent } from '@/components/payment/payment-error-content'

export const metadata: Metadata = {
  title: 'Payment Error - NusantaraHax',
  description: 'There was an issue processing your payment',
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentErrorContent />
    </Suspense>
  )
}
