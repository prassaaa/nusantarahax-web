import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { redirect, notFound } from 'next/navigation'
import { PaymentInstructions } from '@/components/payment/payment-instructions'

interface PaymentPageProps {
  params: {
    orderId: string
  }
}

export async function generateMetadata({ params }: PaymentPageProps): Promise<Metadata> {
  return {
    title: `Payment - Order ${params.orderId} - NusantaraHax`,
    description: 'Complete your payment to access your products',
  }
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin?callbackUrl=/payment/' + params.orderId)
  }

  // Get order details
  const order = await prisma.order.findFirst({
    where: {
      id: params.orderId,
      userId: session.user.id
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
              price: true
            }
          }
        }
      }
    }
  })

  if (!order) {
    notFound()
  }

  // If order is already paid, redirect to success page
  if (order.status === 'PAID') {
    redirect(`/payment/success/${order.id}`)
  }

  // If order is failed or cancelled, redirect to error page
  if (order.status === 'FAILED' || order.status === 'CANCELLED') {
    redirect(`/payment/error/${order.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <PaymentInstructions order={order} />
        </div>
      </div>
    </div>
  )
}
