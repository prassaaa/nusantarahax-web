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

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`admin-analytics-${clientIP}`, 30, 60000)) {
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
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      recentUsers,
      recentOrders,
      topProducts,
      userGrowthData,
      orderStatusDistribution
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: 'COMPLETED' }
      }),

      // New users
      prisma.user.count({
        where: { createdAt: { gte: startOfToday } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: startOfWeek } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } }
      }),

      // Orders
      prisma.order.count({
        where: { createdAt: { gte: startOfToday } }
      }),
      prisma.order.count({
        where: { createdAt: { gte: startOfWeek } }
      }),
      prisma.order.count({
        where: { createdAt: { gte: startOfMonth } }
      }),

      // Revenue
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

      // Recent data
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true,
          role: true
        }
      }),

      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),

      // Top products
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        _count: { productId: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      }),

      // User growth data (last 7 days)
      Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const date = new Date(startOfToday)
          date.setDate(startOfToday.getDate() - (6 - i))
          const nextDate = new Date(date)
          nextDate.setDate(date.getDate() + 1)
          
          return prisma.user.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDate
              }
            }
          }).then(count => ({
            date: date.toISOString().split('T')[0],
            count
          }))
        })
      ),

      // Order status distribution
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true }
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
            price: true,
            image: true
          }
        })
        return {
          ...product,
          totalSold: item._sum.quantity || 0,
          orderCount: item._count.productId
        }
      })
    )

    // Calculate growth percentages (simplified)
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const analytics = {
      overview: {
        totalUsers: {
          value: totalUsers,
          growth: calculateGrowth(newUsersThisWeek, newUsersToday * 7), // Simplified
          period: 'vs last week'
        },
        totalProducts: {
          value: totalProducts,
          growth: 0, // Would need historical data
          period: 'total products'
        },
        totalOrders: {
          value: totalOrders,
          growth: calculateGrowth(ordersThisWeek, ordersToday * 7),
          period: 'vs last week'
        },
        totalRevenue: {
          value: totalRevenue._sum.total || 0,
          growth: calculateGrowth(
            revenueThisWeek._sum.total || 0,
            (revenueToday._sum.total || 0) * 7
          ),
          period: 'vs last week'
        }
      },
      
      periods: {
        today: {
          users: newUsersToday,
          orders: ordersToday,
          revenue: revenueToday._sum.total || 0
        },
        thisWeek: {
          users: newUsersThisWeek,
          orders: ordersThisWeek,
          revenue: revenueThisWeek._sum.total || 0
        },
        thisMonth: {
          users: newUsersThisMonth,
          orders: ordersThisMonth,
          revenue: revenueThisMonth._sum.total || 0
        }
      },

      recentActivity: {
        users: recentUsers,
        orders: recentOrders
      },

      topProducts: topProductsWithDetails,
      
      charts: {
        userGrowth: userGrowthData,
        orderStatus: orderStatusDistribution.map(item => ({
          status: item.status,
          count: item._count.status
        }))
      }
    }

    return NextResponse.json(analytics)

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

    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
