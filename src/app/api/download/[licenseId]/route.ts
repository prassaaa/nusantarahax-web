import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { licenseManager } from '@/lib/license/license-manager'

export async function GET(
  request: NextRequest,
  { params }: { params: { licenseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find license and verify ownership
    const license = await prisma.license.findFirst({
      where: {
        id: params.licenseId,
        userId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            downloadUrl: true,
            isActive: true
          }
        }
      }
    })

    if (!license) {
      return NextResponse.json(
        { error: 'License not found or not accessible' },
        { status: 404 }
      )
    }

    if (!license.product.isActive) {
      return NextResponse.json(
        { error: 'Product is no longer available' },
        { status: 400 }
      )
    }

    // Check if license is expired
    if (license.expiresAt && license.expiresAt < new Date()) {
      await prisma.license.update({
        where: { id: license.id },
        data: { status: 'EXPIRED' }
      })

      return NextResponse.json(
        { error: 'License has expired' },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Log download
    await prisma.download.create({
      data: {
        userId: session.user.id,
        productId: license.productId,
        licenseId: license.id,
        ipAddress: clientIP,
        userAgent: userAgent
      }
    })

    // Generate secure download token (valid for 1 hour)
    const downloadToken = generateDownloadToken(license.id, session.user.id)
    
    // For demo purposes, return download URL
    // In production, this should stream the file or redirect to a secure URL
    return NextResponse.json({
      success: true,
      downloadUrl: license.product.downloadUrl,
      downloadToken,
      productName: license.product.name,
      licenseKey: license.licenseKey,
      expiresAt: license.expiresAt,
      message: 'Download authorized'
    })

  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Generate secure download token
function generateDownloadToken(licenseId: string, userId: string): string {
  const crypto = require('crypto')
  const timestamp = Date.now()
  const expiryTime = timestamp + (60 * 60 * 1000) // 1 hour
  
  const data = `${licenseId}:${userId}:${expiryTime}`
  const secret = process.env.DOWNLOAD_TOKEN_SECRET || 'default-secret'
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex')
  
  return Buffer.from(`${data}:${signature}`).toString('base64')
}

// Verify download token
export function verifyDownloadToken(token: string): {
  isValid: boolean
  licenseId?: string
  userId?: string
} {
  try {
    const crypto = require('crypto')
    const decoded = Buffer.from(token, 'base64').toString('utf8')
    const [licenseId, userId, expiryTime, signature] = decoded.split(':')
    
    // Check expiry
    if (parseInt(expiryTime) < Date.now()) {
      return { isValid: false }
    }
    
    // Verify signature
    const data = `${licenseId}:${userId}:${expiryTime}`
    const secret = process.env.DOWNLOAD_TOKEN_SECRET || 'default-secret'
    const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('hex')
    
    if (signature !== expectedSignature) {
      return { isValid: false }
    }
    
    return {
      isValid: true,
      licenseId,
      userId
    }
  } catch (error) {
    return { isValid: false }
  }
}
