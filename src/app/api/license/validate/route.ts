import { NextRequest, NextResponse } from 'next/server'
import { licenseManager } from '@/lib/license/license-manager'
import { z } from 'zod'

const validateLicenseSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required'),
  productId: z.string().optional(),
  hardwareInfo: z.object({
    cpuId: z.string().optional(),
    motherboardId: z.string().optional(),
    diskId: z.string().optional(),
    macAddress: z.string().optional(),
    systemUuid: z.string().optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { licenseKey, productId, hardwareInfo } = validateLicenseSchema.parse(body)

    // Validate license
    const result = await licenseManager.validateLicense(
      licenseKey,
      productId,
      hardwareInfo
    )

    if (result.isValid) {
      return NextResponse.json({
        valid: true,
        license: result.license,
        message: 'License is valid'
      })
    } else {
      return NextResponse.json({
        valid: false,
        error: result.error,
        message: 'License validation failed'
      }, { status: 400 })
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('License validation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for simple license check
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const licenseKey = searchParams.get('key')
    const productId = searchParams.get('productId')

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'License key is required' },
        { status: 400 }
      )
    }

    const result = await licenseManager.validateLicense(
      licenseKey,
      productId || undefined
    )

    return NextResponse.json({
      valid: result.isValid,
      error: result.error,
      license: result.license ? {
        productName: result.license.product.name,
        userName: result.license.user.name,
        expiresAt: result.license.expiresAt,
        status: result.license.status
      } : null
    })

  } catch (error) {
    console.error('License validation GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
