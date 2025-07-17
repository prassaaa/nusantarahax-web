import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, rateLimit } from '@/lib/auth/route-protection'
import { disableTwoFactor, verifyTwoFactorToken } from '@/lib/auth/two-factor'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const disableSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  token: z.string().min(6, 'Token must be 6 digits').max(8, 'Invalid token format'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`2fa-disable-${clientIP}`, 3, 60000)) {
      return NextResponse.json(
        { error: 'Too many disable attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Require authentication
    const user = await requireAuth()

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is not enabled' },
        { status: 400 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = disableSchema.parse(body)

    // Get user with password
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true }
    })

    if (!userWithPassword || !userWithPassword.password) {
      return NextResponse.json(
        { error: 'Password verification failed' },
        { status: 400 }
      )
    }

    // Verify password
    const isPasswordValid = await compare(validatedData.password, userWithPassword.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      )
    }

    // Verify 2FA token
    const tokenResult = await verifyTwoFactorToken(user.id, validatedData.token)
    if (!tokenResult.success) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Disable 2FA
    const success = await disableTwoFactor(user.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to disable two-factor authentication' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication disabled successfully'
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
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('2FA disable error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
