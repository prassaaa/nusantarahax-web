import { NextRequest, NextResponse } from 'next/server'
import { verifyCallback } from '@/lib/payment/duitku'
import { prisma } from '@/lib/db'
import { generateLicenseKey } from '@/lib/utils'
import { sendOrderConfirmationEmail } from '@/lib/email/service'
import { notificationService } from '@/lib/notifications/notification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantCode,
      amount,
      merchantOrderId,
      productDetail,
      additionalParam,
      paymentCode,
      resultCode,
      merchantUserId,
      reference,
      signature
    } = body

    // Verify callback signature
    if (!verifyCallback(merchantCode, amount, merchantOrderId, signature)) {
      console.error('Invalid callback signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: merchantOrderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    })

    if (!order) {
      console.error('Order not found:', merchantOrderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if payment is successful
    if (resultCode === '00') {
      // Payment successful
      await prisma.order.update({
        where: { id: merchantOrderId },
        data: {
          status: 'PAID',
          paymentData: JSON.stringify({
            ...JSON.parse(order.paymentData || '{}'),
            paymentCode,
            reference,
            paidAt: new Date().toISOString()
          })
        }
      })

      // Generate licenses for each product
      const licenses = []
      for (const item of order.items) {
        for (let i = 0; i < item.quantity; i++) {
          const licenseKey = generateLicenseKey()
          
          const license = await prisma.license.create({
            data: {
              userId: order.userId,
              productId: item.productId,
              licenseKey,
              status: 'ACTIVE',
              // Set expiry date if product has duration
              expiresAt: item.product.duration
                ? new Date(Date.now() + item.product.duration * 24 * 60 * 60 * 1000)
                : null
            },
            include: {
              product: true
            }
          })
          
          licenses.push(license)
        }
      }

      // Send email notification with license keys
      try {
        const customerInfo = JSON.parse(order.paymentData || '{}').customerInfo || {}

        await sendOrderConfirmationEmail({
          customerEmail: order.user.email,
          customerName: customerInfo.name || order.user.name || 'Customer',
          orderId: order.id,
          total: order.total,
          items: order.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.price
          })),
          licenses: licenses.map(license => ({
            productName: license.product?.name || 'Product',
            licenseKey: license.licenseKey,
            downloadUrl: license.product?.downloadUrl
          })),
          orderDate: order.createdAt
        })

        console.log('Order confirmation email sent to:', order.user.email)
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError)
      }

      // Send payment success notification
      await notificationService.notifyPaymentSuccess(
        order.userId,
        merchantOrderId,
        parseFloat(amount)
      )

      console.log('Payment successful for order:', merchantOrderId)
      console.log('Generated licenses:', licenses.length)

    } else {
      // Payment failed
      await prisma.order.update({
        where: { id: merchantOrderId },
        data: {
          status: 'FAILED',
          paymentData: JSON.stringify({
            ...JSON.parse(order.paymentData || '{}'),
            paymentCode,
            reference,
            failedAt: new Date().toISOString(),
            failureReason: resultCode
          })
        }
      })

      // Send payment failed notification
      await notificationService.notifyPaymentFailed(
        order.userId,
        merchantOrderId,
        `Payment failed with code: ${resultCode}`
      )

      console.log('Payment failed for order:', merchantOrderId, 'Result code:', resultCode)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    )
  }
}
