import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/utils'
import { checkTransactionStatus } from '@/lib/payment/duitku'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params

    // Find order and verify ownership
    const order = await prisma.order.findUnique({
      where: { 
        id: orderId,
        userId: user.id
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check transaction status with Duitku
    let duitkuStatus = null
    try {
      duitkuStatus = await checkTransactionStatus(orderId)
    } catch (error) {
      console.error('Failed to check Duitku status:', error)
    }

    // Parse payment data
    const paymentData = order.paymentData ? JSON.parse(order.paymentData) : {}

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      total: order.total,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paymentData: {
        paymentUrl: paymentData.paymentUrl,
        vaNumber: paymentData.vaNumber,
        qrString: paymentData.qrString,
        reference: paymentData.reference,
        paidAt: paymentData.paidAt
      },
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price
      })),
      duitkuStatus
    })

  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    )
  }
}
