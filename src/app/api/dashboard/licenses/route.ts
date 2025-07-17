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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const productId = searchParams.get('productId')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      userId: session.user.id
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (productId) {
      where.productId = productId
    }

    // Get licenses with pagination
    const [licenses, totalCount] = await Promise.all([
      prisma.license.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              downloadUrl: true
            }
          },
          _count: {
            select: {
              downloads: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.license.count({ where })
    ])

    // Transform data to include download count
    const transformedLicenses = licenses.map(license => ({
      id: license.id,
      licenseKey: license.licenseKey,
      status: license.status,
      createdAt: license.createdAt,
      expiresAt: license.expiresAt,
      downloadCount: license._count.downloads,
      product: license.product
    }))

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      licenses: transformedLicenses,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Dashboard licenses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
