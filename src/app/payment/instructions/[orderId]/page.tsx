import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/utils'
import { PaymentInstructionsContent } from '@/components/payment/payment-instructions-content'

interface PaymentInstructionsPageProps {
  params: {
    orderId: string
  }
}

export const metadata: Metadata = {
  title: 'Payment Instructions - NusantaraHax',
  description: 'Complete your payment to receive your gaming tools',
}

export default async function PaymentInstructionsPage({ params }: PaymentInstructionsPageProps) {
  const user = await getCurrentUser()
  const { orderId } = await params

  if (!user) {
    redirect('/auth/signin')
  }

  return <PaymentInstructionsContent orderId={orderId} />
}
