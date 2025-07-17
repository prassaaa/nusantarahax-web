import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAPI } from '@/lib/auth/admin-protection'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

// Simple rate limiting implementation
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED']).optional(),
  notes: z.string().optional(),
})

// GET /api/admin/orders/[id] - Get single order with detailed information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`admin-order-get-${clientIP}`, 30, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    await requireAdminAPI()

    const orderId = params.id

    // Get order with detailed information
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        total: true,
        subtotal: true,
        tax: true,
        shipping: true,
        discount: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                image: true,
                category: true,
                downloadUrl: true
              }
            }
          }
        },
        shippingAddress: {
          select: {
            id: true,
            fullName: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            phone: true
          }
        },
        payment: {
          select: {
            id: true,
            method: true,
            status: true,
            amount: true,
            transactionId: true,
            createdAt: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ order })

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    console.error('Admin order GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/orders/[id] - Update order status and notes
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`admin-order-update-${clientIP}`, 20, 60000)) {
      return NextResponse.json(
        { error: 'Too many update requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    const admin = await requireAdminAPI()

    const orderId = params.id

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { 
        id: true, 
        status: true, 
        total: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = updateOrderSchema.parse(body)

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.status) {
      updateData.status = validatedData.status
    }
    
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes
    }

    // Update order
    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      select: {
        id: true,
        status: true,
        total: true,
        subtotal: true,
        tax: true,
        shipping: true,
        discount: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    // Log order update
    await prisma.securityLog.create({
      data: {
        userId: admin.id,
        action: 'ORDER_UPDATED_BY_ADMIN',
        details: `Order ${orderId} updated by admin. Status: ${existingOrder.status} -> ${order.status}. Changes: ${JSON.stringify(validatedData)}`
      }
    })

    // Send notification email if status changed to completed
    if (validatedData.status === 'COMPLETED' && existingOrder.status !== 'COMPLETED') {
      // TODO: Send order completion email
      console.log(`Order ${orderId} completed - should send email to ${existingOrder.user.email}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Admin order PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/orders/[id] - Cancel order (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`admin-order-delete-${clientIP}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many delete requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    const admin = await requireAdminAPI()

    const orderId = params.id

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { 
        id: true, 
        status: true, 
        total: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if order can be cancelled
    if (existingOrder.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel completed order. Use refund instead.' },
        { status: 400 }
      )
    }

    if (existingOrder.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Order is already cancelled' },
        { status: 400 }
      )
    }

    // Cancel order (soft delete by changing status)
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'CANCELLED',
        notes: `Order cancelled by admin on ${new Date().toISOString()}`
      }
    })

    // Log order cancellation
    await prisma.securityLog.create({
      data: {
        userId: admin.id,
        action: 'ORDER_CANCELLED_BY_ADMIN',
        details: `Order ${orderId} cancelled by admin. Previous status: ${existingOrder.status}`
      }
    })

    // TODO: Send cancellation email to customer
    console.log(`Order ${orderId} cancelled - should send email to ${existingOrder.user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully'
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    console.error('Admin order DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
