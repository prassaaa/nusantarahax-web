import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/utils'
import { createPayment, type PaymentRequest } from '@/lib/payment/duitku'
import { prisma } from '@/lib/db'
import { generateLicenseKey } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      cartItems, 
      customerInfo, 
      paymentMethod, 
      total,
      discountCode,
      discountAmount 
    } = body

    // Validate required fields
    if (!cartItems || !customerInfo || !paymentMethod || !total) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate unique order ID
    const merchantOrderId = `NH-${Date.now()}-${user.id.slice(-6)}`

    // Create order in database
    const order = await prisma.order.create({
      data: {
        id: merchantOrderId,
        userId: user.id,
        status: 'PENDING',
        total: total,
        paymentMethod: paymentMethod.method,
        paymentData: JSON.stringify({
          provider: paymentMethod.provider,
          customerInfo,
          discountCode,
          discountAmount
        }),
        items: {
          create: cartItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.salePrice || item.product.price,
            product: {
              connect: { id: item.productId }
            }
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Prepare payment request
    const paymentRequest: PaymentRequest = {
      merchantOrderId,
      paymentAmount: Math.round(total),
      paymentMethod: paymentMethod.provider || paymentMethod.method,
      productDetails: cartItems.map((item: any) => item.product.name).join(', '),
      customerVaName: customerInfo.name,
      email: customerInfo.email,
      phoneNumber: customerInfo.phone,
      itemDetails: cartItems.map((item: any) => ({
        name: item.product.name,
        price: Math.round(item.product.salePrice || item.product.price),
        quantity: item.quantity
      })),
      customerDetail: {
        firstName: customerInfo.name.split(' ')[0] || customerInfo.name,
        lastName: customerInfo.name.split(' ').slice(1).join(' ') || '',
        email: customerInfo.email,
        phoneNumber: customerInfo.phone,
        billingAddress: {
          firstName: customerInfo.name.split(' ')[0] || customerInfo.name,
          lastName: customerInfo.name.split(' ').slice(1).join(' ') || '',
          address: customerInfo.address,
          city: customerInfo.city,
          postalCode: customerInfo.postalCode,
          phone: customerInfo.phone,
          countryCode: 'ID'
        }
      }
    }

    // Create payment with Duitku
    const paymentResponse = await createPayment(paymentRequest)

    // Update order with payment reference
    await prisma.order.update({
      where: { id: merchantOrderId },
      data: {
        paymentId: paymentResponse.reference,
        paymentData: JSON.stringify({
          ...JSON.parse(order.paymentData || '{}'),
          paymentUrl: paymentResponse.paymentUrl,
          vaNumber: paymentResponse.vaNumber,
          qrString: paymentResponse.qrString
        })
      }
    })

    return NextResponse.json({
      success: true,
      orderId: merchantOrderId,
      paymentUrl: paymentResponse.paymentUrl,
      vaNumber: paymentResponse.vaNumber,
      qrString: paymentResponse.qrString,
      amount: paymentResponse.amount
    })

  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
