import { Metadata } from 'next'
import { Suspense } from 'react'
import { PaymentSuccessContent } from '@/components/payment/payment-success-content'

export const metadata: Metadata = {
  title: 'Payment Successful - NusantaraHax',
  description: 'Your payment has been processed successfully',
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
