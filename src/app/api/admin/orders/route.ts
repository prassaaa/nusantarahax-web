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

const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'all']).optional().default('all'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'total', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED']).optional(),
  notes: z.string().optional(),
})

// GET /api/admin/orders - List orders with pagination and filters
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`admin-orders-${clientIP}`, 60, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    await requireAdminAPI()

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const { page, limit, search, status, dateFrom, dateTo, sortBy, sortOrder } = querySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    })

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { items: { some: { product: { name: { contains: search, mode: 'insensitive' } } } } }
      ]
    }

    if (status !== 'all') {
      where.status = status
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z')
      }
    }

    // Get total count
    const totalCount = await prisma.order.count({ where })

    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
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
                image: true,
                category: true
              }
            }
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      }
    })

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit
      }
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
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Admin orders GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/admin/orders/stats - Get order statistics
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`admin-order-stats-${clientIP}`, 30, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    await requireAdminAPI()

    // Get date ranges
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfToday.getDate() - 7)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Parallel queries for better performance
    const [
      totalOrders,
      totalRevenue,
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      ordersByStatus,
      recentOrders,
      topProducts
    ] = await Promise.all([
      // Total counts
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: 'COMPLETED' }
      }),

      // Orders by period
      prisma.order.count({
        where: { createdAt: { gte: startOfToday } }
      }),
      prisma.order.count({
        where: { createdAt: { gte: startOfWeek } }
      }),
      prisma.order.count({
        where: { createdAt: { gte: startOfMonth } }
      }),

      // Revenue by period
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfToday }
        }
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfWeek }
        }
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth }
        }
      }),

      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
        _sum: { total: true }
      }),

      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
              avatar: true
            }
          },
          _count: {
            select: {
              items: true
            }
          }
        }
      }),

      // Top selling products
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, price: true },
        _count: { productId: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10
      })
    ])

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            image: true,
            category: true
          }
        })
        return {
          ...product,
          totalSold: item._sum.quantity || 0,
          totalRevenue: item._sum.price || 0,
          orderCount: item._count.productId
        }
      })
    )

    const stats = {
      overview: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        averageOrderValue: totalOrders > 0 ? (totalRevenue._sum.total || 0) / totalOrders : 0
      },
      periods: {
        today: {
          orders: ordersToday,
          revenue: revenueToday._sum.total || 0
        },
        thisWeek: {
          orders: ordersThisWeek,
          revenue: revenueThisWeek._sum.total || 0
        },
        thisMonth: {
          orders: ordersThisMonth,
          revenue: revenueThisMonth._sum.total || 0
        }
      },
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: item._count.status,
        revenue: item._sum.total || 0
      })),
      recentOrders,
      topProducts: topProductsWithDetails
    }

    return NextResponse.json(stats)

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

    console.error('Admin order stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
