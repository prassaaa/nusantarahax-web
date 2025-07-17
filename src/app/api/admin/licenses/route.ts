import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { licenseManager } from '@/lib/license/license-manager'
import { z } from 'zod'

// Get licenses (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const productId = searchParams.get('productId')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }
    
    if (userId) {
      where.userId = userId
    }
    
    if (productId) {
      where.productId = productId
    }
    
    if (search) {
      where.OR = [
        { licenseKey: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { product: { name: { contains: search } } }
      ]
    }

    // Get licenses with pagination
    const [licenses, totalCount] = await Promise.all([
      prisma.license.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              version: true
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

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      licenses: licenses.map(license => ({
        ...license,
        downloadCount: license._count.downloads
      })),
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
    console.error('Admin licenses GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const createLicenseSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  expiresAt: z.string().optional().transform(val => val ? new Date(val) : null),
  hardwareBinding: z.boolean().optional().default(false)
})

// Create license (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, productId, expiresAt, hardwareBinding } = createLicenseSchema.parse(body)

    // Verify user and product exist
    const [user, product] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.product.findUnique({ where: { id: productId } })
    ])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Generate license key
    const licenseKey = licenseManager.generateLicenseKey(productId, userId)

    // Create license
    const license = await prisma.license.create({
      data: {
        userId,
        productId,
        licenseKey,
        status: 'ACTIVE',
        expiresAt,
        requiresHardwareBinding: hardwareBinding
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        product: {
          select: {
            name: true
          }
        }
      }
    })

    // Log license creation
    await prisma.securityLog.create({
      data: {
        userId: session.user.id,
        action: 'LICENSE_CREATED',
        details: `License ${license.licenseKey} created for user ${user.email} and product ${product.name}`,
      }
    })

    return NextResponse.json({
      success: true,
      license,
      message: 'License created successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create license error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
