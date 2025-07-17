import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10, 'Maximum quantity is 10')
})

// Update cart item quantity
export async function PATCH(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { quantity } = updateCartItemSchema.parse(body)

    // Find cart item and verify ownership
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: params.itemId,
        cart: {
          userId: session.user.id
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            originalPrice: true,
            images: true,
            isActive: true,
          }
        }
      }
    })

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    if (!cartItem.product.isActive) {
      return NextResponse.json({ error: 'Product is no longer available' }, { status: 400 })
    }

    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: params.itemId },
      data: { quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            originalPrice: true,
            images: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Cart item updated successfully',
      item: {
        id: updatedItem.id,
        productId: updatedItem.productId,
        quantity: updatedItem.quantity,
        product: {
          ...updatedItem.product,
          images: typeof updatedItem.product.images === 'string' 
            ? JSON.parse(updatedItem.product.images) 
            : updatedItem.product.images
        }
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update cart item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Remove cart item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find cart item and verify ownership
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: params.itemId,
        cart: {
          userId: session.user.id
        }
      },
      include: {
        product: {
          select: { name: true }
        }
      }
    })

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id: params.itemId }
    })

    return NextResponse.json({
      success: true,
      message: `${cartItem.product.name} removed from cart`
    })

  } catch (error) {
    console.error('Remove cart item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
