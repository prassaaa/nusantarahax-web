import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { notificationService } from '@/lib/notifications/notification-service'
import { z } from 'zod'

const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1).max(10),
    price: z.number().min(0)
  })),
  paymentMethod: z.enum(['DUITKU_VA', 'DUITKU_EWALLET', 'DUITKU_QRIS', 'DUITKU_CREDIT_CARD']),
  customerInfo: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(1, 'Phone is required')
  })
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, paymentMethod, customerInfo } = checkoutSchema.parse(body)

    // Validate products exist and are active
    const productIds = items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        isActive: true
      }
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Some products are not available' },
        { status: 400 }
      )
    }

    // Validate prices match
    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      if (!product || product.price !== item.price) {
        return NextResponse.json(
          { error: 'Product prices have changed. Please refresh your cart.' },
          { status: 400 }
        )
      }
    }

    // Calculate total
    const total = items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)!
      return sum + (product.price * item.quantity)
    }, 0)

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: 'PENDING',
        total,
        paymentMethod,
        paymentData: {
          customerInfo,
          items: items.map(item => {
            const product = products.find(p => p.id === item.productId)!
            return {
              productId: item.productId,
              productName: product.name,
              quantity: item.quantity,
              price: product.price
            }
          })
        },
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Clear user's cart after successful order creation
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id }
    })

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      })
    }

    // TODO: Integrate with Duitku payment gateway
    // For now, we'll create a mock payment URL
    const paymentUrl = `/payment/${order.id}`

    // Send order created notification
    await notificationService.notifyOrderCreated(
      session.user.id,
      order.id,
      total
    )

    // Log order creation
    await prisma.securityLog.create({
      data: {
        userId: session.user.id,
        action: 'ORDER_CREATED',
        details: `Order ${order.id} created with total ${total}`,
      }
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentUrl,
      total,
      message: 'Order created successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
