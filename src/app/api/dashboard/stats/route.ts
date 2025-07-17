import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get order statistics
    const [
      totalOrders,
      paidOrders,
      pendingOrders,
      totalLicenses,
      activeLicenses,
      totalSpentResult
    ] = await Promise.all([
      // Total orders
      prisma.order.count({
        where: { userId: session.user.id }
      }),
      
      // Paid orders
      prisma.order.count({
        where: { 
          userId: session.user.id,
          status: 'PAID'
        }
      }),
      
      // Pending orders
      prisma.order.count({
        where: { 
          userId: session.user.id,
          status: 'PENDING'
        }
      }),
      
      // Total licenses
      prisma.license.count({
        where: { userId: session.user.id }
      }),
      
      // Active licenses
      prisma.license.count({
        where: { 
          userId: session.user.id,
          status: 'ACTIVE'
        }
      }),
      
      // Total spent (sum of paid orders)
      prisma.order.aggregate({
        where: { 
          userId: session.user.id,
          status: 'PAID'
        },
        _sum: {
          total: true
        }
      })
    ])

    const totalSpent = totalSpentResult._sum.total || 0

    return NextResponse.json({
      totalOrders,
      paidOrders,
      pendingOrders,
      totalLicenses,
      activeLicenses,
      totalSpent
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
