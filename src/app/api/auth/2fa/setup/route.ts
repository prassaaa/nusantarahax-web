import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, rateLimit } from '@/lib/auth/route-protection'
import { generateTwoFactorSetup, verifyTOTP, enableTwoFactor } from '@/lib/auth/two-factor'
import { z } from 'zod'

const setupSchema = z.object({
  token: z.string().min(6, 'Token must be 6 digits').max(6, 'Token must be 6 digits'),
})

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`2fa-setup-${clientIP}`, 5, 60000)) {
      return NextResponse.json(
        { error: 'Too many setup attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Require authentication
    const user = await requireAuth()

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is already enabled' },
        { status: 400 }
      )
    }

    // Generate 2FA setup data
    const setupData = await generateTwoFactorSetup(user.id, user.email)

    return NextResponse.json({
      qrCodeUrl: setupData.qrCodeUrl,
      manualEntryKey: setupData.manualEntryKey,
      backupCodes: setupData.backupCodes,
      secret: setupData.secret // Temporarily store for verification
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('2FA setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`2fa-enable-${clientIP}`, 5, 60000)) {
      return NextResponse.json(
        { error: 'Too many enable attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Require authentication
    const user = await requireAuth()

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is already enabled' },
        { status: 400 }
      )
    }

    // Validate request body
    const body = await request.json()
    const { token, secret, backupCodes } = body

    if (!token || !secret || !backupCodes) {
      return NextResponse.json(
        { error: 'Token, secret, and backup codes are required' },
        { status: 400 }
      )
    }

    const validatedData = setupSchema.parse({ token })

    // Verify the TOTP token
    if (!verifyTOTP(validatedData.token, secret)) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Enable 2FA for the user
    const success = await enableTwoFactor(user.id, secret, backupCodes)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to enable two-factor authentication' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
      backupCodes
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid verification code format', details: error.errors },
        { status: 400 }
      )
    }

    console.error('2FA enable error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
