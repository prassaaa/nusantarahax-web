import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

// Get single review
export async function GET(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.reviewId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json({ review })

  } catch (error) {
    console.error('Get review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(10).max(1000).optional()
}).refine(data => data.rating !== undefined || data.comment !== undefined, {
  message: "At least one field (rating or comment) must be provided"
})

// Update review
export async function PATCH(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updateData = updateReviewSchema.parse(body)

    // Find review and verify ownership
    const review = await prisma.review.findFirst({
      where: {
        id: params.reviewId,
        userId: session.user.id
      },
      include: {
        product: { select: { name: true } }
      }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found or not accessible' },
        { status: 404 }
      )
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: params.reviewId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        product: {
          select: {
            name: true
          }
        }
      }
    })

    // Update product rating cache if rating changed
    if (updateData.rating) {
      const avgRating = await prisma.review.aggregate({
        where: { productId: review.productId },
        _avg: { rating: true },
        _count: { rating: true }
      })

      await prisma.product.update({
        where: { id: review.productId },
        data: {
          averageRating: avgRating._avg.rating || 0,
          reviewCount: avgRating._count.rating
        }
      })
    }

    // Log review update
    await prisma.securityLog.create({
      data: {
        userId: session.user.id,
        action: 'REVIEW_UPDATED',
        details: `Review updated for product ${review.product.name}`,
      }
    })

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: 'Review updated successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find review and verify ownership (or admin)
    const review = await prisma.review.findFirst({
      where: {
        id: params.reviewId,
        ...(session.user.role === 'ADMIN' ? {} : { userId: session.user.id })
      },
      include: {
        product: { select: { name: true } }
      }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found or not accessible' },
        { status: 404 }
      )
    }

    // Delete review
    await prisma.review.delete({
      where: { id: params.reviewId }
    })

    // Update product rating cache
    const avgRating = await prisma.review.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: { rating: true }
    })

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        averageRating: avgRating._avg.rating || 0,
        reviewCount: avgRating._count.rating
      }
    })

    // Log review deletion
    await prisma.securityLog.create({
      data: {
        userId: session.user.id,
        action: 'REVIEW_DELETED',
        details: `Review deleted for product ${review.product.name}`,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    })

  } catch (error) {
    console.error('Delete review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
