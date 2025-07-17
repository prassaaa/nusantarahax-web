import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { licenseManager } from '@/lib/license/license-manager'
import { z } from 'zod'

// Get license details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { licenseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const licenseStats = await licenseManager.getLicenseStats(params.licenseId)

    if (!licenseStats) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 })
    }

    return NextResponse.json(licenseStats)

  } catch (error) {
    console.error('Get license details error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const updateLicenseSchema = z.object({
  action: z.enum(['revoke', 'extend', 'activate']),
  reason: z.string().optional(),
  extensionDays: z.number().int().min(1).optional()
})

// Update license (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { licenseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, reason, extensionDays } = updateLicenseSchema.parse(body)

    // Get license details for logging
    const license = await prisma.license.findUnique({
      where: { id: params.licenseId },
      include: {
        user: { select: { email: true } },
        product: { select: { name: true } }
      }
    })

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 })
    }

    let success = false
    let message = ''

    switch (action) {
      case 'revoke':
        success = await licenseManager.revokeLicense(params.licenseId, reason)
        message = success ? 'License revoked successfully' : 'Failed to revoke license'
        
        if (success) {
          await prisma.securityLog.create({
            data: {
              userId: session.user.id,
              action: 'LICENSE_REVOKED',
              details: `License ${license.licenseKey} revoked. Reason: ${reason || 'No reason provided'}`,
            }
          })
        }
        break

      case 'extend':
        if (!extensionDays) {
          return NextResponse.json(
            { error: 'Extension days required for extend action' },
            { status: 400 }
          )
        }
        
        success = await licenseManager.extendLicense(params.licenseId, extensionDays)
        message = success 
          ? `License extended by ${extensionDays} days` 
          : 'Failed to extend license'
        
        if (success) {
          await prisma.securityLog.create({
            data: {
              userId: session.user.id,
              action: 'LICENSE_EXTENDED',
              details: `License ${license.licenseKey} extended by ${extensionDays} days`,
            }
          })
        }
        break

      case 'activate':
        await prisma.license.update({
          where: { id: params.licenseId },
          data: { 
            status: 'ACTIVE',
            revokedAt: null,
            revocationReason: null
          }
        })
        success = true
        message = 'License activated successfully'
        
        await prisma.securityLog.create({
          data: {
            userId: session.user.id,
            action: 'LICENSE_ACTIVATED',
            details: `License ${license.licenseKey} activated`,
          }
        })
        break
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message
      })
    } else {
      return NextResponse.json(
        { error: message },
        { status: 500 }
      )
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update license error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete license (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { licenseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get license details for logging
    const license = await prisma.license.findUnique({
      where: { id: params.licenseId },
      select: {
        licenseKey: true,
        user: { select: { email: true } },
        product: { select: { name: true } }
      }
    })

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 })
    }

    // Delete license and related data
    await prisma.$transaction([
      prisma.download.deleteMany({
        where: { licenseId: params.licenseId }
      }),
      prisma.license.delete({
        where: { id: params.licenseId }
      })
    ])

    // Log license deletion
    await prisma.securityLog.create({
      data: {
        userId: session.user.id,
        action: 'LICENSE_DELETED',
        details: `License ${license.licenseKey} deleted permanently`,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'License deleted successfully'
    })

  } catch (error) {
    console.error('Delete license error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
