import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAPI } from '@/lib/auth/admin-protection'
import { prisma } from '@/lib/db/prisma'

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

// GET /api/admin/orders/stats - Get comprehensive order statistics
export async function GET(request: NextRequest) {
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
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // Parallel queries for better performance
    const [
      totalOrders,
      totalRevenue,
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      ordersLastMonth,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      revenueLastMonth,
      ordersByStatus,
      recentOrders,
      topProducts,
      dailyOrdersThisMonth
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
      prisma.order.count({
        where: { 
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
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
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: 'COMPLETED',
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
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
      }),

      // Daily orders for this month (for chart)
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as orders,
          SUM(CASE WHEN status = 'COMPLETED' THEN total ELSE 0 END) as revenue
        FROM Order 
        WHERE createdAt >= ${startOfMonth}
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `
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
            category: true,
            price: true
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

    // Calculate growth percentages
    const orderGrowth = ordersLastMonth > 0 
      ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100 
      : 0

    const revenueGrowth = (revenueLastMonth._sum.total || 0) > 0 
      ? (((revenueThisMonth._sum.total || 0) - (revenueLastMonth._sum.total || 0)) / (revenueLastMonth._sum.total || 0)) * 100 
      : 0

    const averageOrderValue = totalOrders > 0 
      ? (totalRevenue._sum.total || 0) / totalOrders 
      : 0

    const stats = {
      overview: {
        totalOrders: {
          value: totalOrders,
          growth: orderGrowth,
          period: 'from last month'
        },
        totalRevenue: {
          value: totalRevenue._sum.total || 0,
          growth: revenueGrowth,
          period: 'from last month'
        },
        averageOrderValue: {
          value: averageOrderValue,
          growth: 0, // Could calculate if needed
          period: 'all time'
        }
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
        revenue: item._sum.total || 0,
        percentage: totalOrders > 0 ? (item._count.status / totalOrders) * 100 : 0
      })),
      recentOrders,
      topProducts: topProductsWithDetails.filter(p => p !== null),
      charts: {
        dailyOrders: dailyOrdersThisMonth,
        orderStatus: ordersByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        }))
      }
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
