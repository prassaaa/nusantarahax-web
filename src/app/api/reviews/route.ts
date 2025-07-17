import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const getReviewsSchema = z.object({
  productId: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  rating: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  verified: z.string().optional().transform(val => val === 'true')
})

// Get reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = getReviewsSchema.parse({
      productId: searchParams.get('productId'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      rating: searchParams.get('rating'),
      verified: searchParams.get('verified')
    })

    const skip = (params.page - 1) * params.limit

    // Build where clause
    const where: any = {}
    
    if (params.productId) {
      where.productId = params.productId
    }
    
    if (params.rating) {
      where.rating = params.rating
    }
    
    if (params.verified !== undefined) {
      where.isVerified = params.verified
    }

    // Get reviews with pagination
    const [reviews, totalCount, averageRating, ratingDistribution] = await Promise.all([
      prisma.review.findMany({
        where,
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
        },
        orderBy: [
          { isVerified: 'desc' }, // Verified reviews first
          { createdAt: 'desc' }
        ],
        skip,
        take: params.limit
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where: params.productId ? { productId: params.productId } : {},
        _avg: { rating: true }
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: params.productId ? { productId: params.productId } : {},
        _count: { rating: true }
      })
    ])

    const totalPages = Math.ceil(totalCount / params.limit)

    // Format rating distribution
    const ratingStats = {
      average: averageRating._avg.rating || 0,
      total: totalCount,
      distribution: [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: ratingDistribution.find(r => r.rating === rating)?._count.rating || 0
      }))
    }

    return NextResponse.json({
      reviews,
      ratingStats,
      pagination: {
        page: params.page,
        limit: params.limit,
        totalCount,
        totalPages,
        hasNext: params.page < totalPages,
        hasPrev: params.page > 1
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Get reviews error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const createReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment too long')
})

// Create review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, rating, comment } = createReviewSchema.parse(body)

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, isActive: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.isActive) {
      return NextResponse.json({ error: 'Product is not available' }, { status: 400 })
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId
        }
      }
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      )
    }

    // Check if user has purchased this product (for verified review)
    const hasPurchased = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: 'PAID',
        items: {
          some: {
            productId: productId
          }
        }
      }
    })

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId,
        rating,
        comment,
        isVerified: !!hasPurchased
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

    // Update product rating cache (optional optimization)
    const avgRating = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true }
    })

    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: avgRating._avg.rating || 0,
        reviewCount: avgRating._count.rating
      }
    })

    // Log review creation
    await prisma.securityLog.create({
      data: {
        userId: session.user.id,
        action: 'REVIEW_CREATED',
        details: `Review created for product ${product.name} with rating ${rating}`,
      }
    })

    return NextResponse.json({
      success: true,
      review,
      message: 'Review created successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
