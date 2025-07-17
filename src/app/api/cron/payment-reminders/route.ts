import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPaymentReminderEmail } from '@/lib/email/service'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find pending orders that are about to expire (within 2 hours)
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: oneDayAgo, // Created within last 24 hours
          lte: twoHoursFromNow // Will expire within 2 hours
        }
      },
      include: {
        user: true
      }
    })

    let emailsSent = 0
    let emailsFailed = 0

    for (const order of pendingOrders) {
      try {
        const paymentData = order.paymentData ? JSON.parse(order.paymentData) : {}
        const customerInfo = paymentData.customerInfo || {}
        
        // Calculate expiry time (24 hours from creation)
        const expiresAt = new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000)
        
        const emailSent = await sendPaymentReminderEmail({
          customerEmail: order.user.email,
          customerName: customerInfo.name || order.user.name || 'Customer',
          orderId: order.id,
          total: order.total,
          paymentUrl: paymentData.paymentUrl,
          vaNumber: paymentData.vaNumber,
          expiresAt
        })

        if (emailSent) {
          emailsSent++
          console.log(`Payment reminder sent for order: ${order.id}`)
        } else {
          emailsFailed++
          console.error(`Failed to send payment reminder for order: ${order.id}`)
        }
      } catch (error) {
        emailsFailed++
        console.error(`Error processing order ${order.id}:`, error)
      }
    }

    // Clean up expired orders (older than 24 hours and still pending)
    const expiredCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const expiredOrders = await prisma.order.updateMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: expiredCutoff
        }
      },
      data: {
        status: 'EXPIRED'
      }
    })

    return NextResponse.json({
      success: true,
      processed: pendingOrders.length,
      emailsSent,
      emailsFailed,
      expiredOrders: expiredOrders.count
    })

  } catch (error) {
    console.error('Payment reminder cron error:', error)
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}
