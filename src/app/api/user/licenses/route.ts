import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, rateLimit } from '@/lib/auth/route-protection'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`licenses-${clientIP}`, 20, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Require authentication
    const user = await requireAuth()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const productId = searchParams.get('productId')

    // Build where clause
    const where: any = { userId: user.id }
    if (status && ['ACTIVE', 'EXPIRED', 'REVOKED'].includes(status)) {
      where.status = status
    }
    if (productId) {
      where.productId = productId
    }

    // Get user's licenses
    const licenses = await prisma.license.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            category: true,
            downloadUrl: true,
            version: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      licenses: licenses.map(license => ({
        id: license.id,
        licenseKey: license.licenseKey,
        status: license.status,
        createdAt: license.createdAt,
        expiresAt: license.expiresAt,
        product: license.product,
        isExpired: license.expiresAt ? new Date() > license.expiresAt : false
      }))
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Licenses fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
