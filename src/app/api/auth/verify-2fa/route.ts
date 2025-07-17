import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyTwoFactorToken } from '@/lib/auth/two-factor'
import { z } from 'zod'

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

const verify2FASchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  token: z.string().min(6, 'Token must be at least 6 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - more restrictive for 2FA verification
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`verify-2fa-${clientIP}`, 5, 60000)) {
      return NextResponse.json(
        { error: 'Too many 2FA verification attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = verify2FASchema.parse(body)

    // Verify the 2FA token
    const tokenResult = await verifyTwoFactorToken(validatedData.userId, validatedData.token)

    if (!tokenResult.success) {
      // Log failed 2FA attempt
      await prisma.securityLog.create({
        data: {
          userId: validatedData.userId,
          action: 'TWO_FACTOR_FAILED',
          details: `Failed 2FA verification attempt with ${tokenResult.type || 'unknown'} method`,
          ipAddress: clientIP
        }
      })

      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Log successful 2FA verification
    await prisma.securityLog.create({
      data: {
        userId: validatedData.userId,
        action: 'TWO_FACTOR_SUCCESS',
        details: `Successful 2FA verification with ${tokenResult.type} method`,
        ipAddress: clientIP
      }
    })

    // Create a session token or return success
    // Note: In a real implementation, you might want to create a temporary token
    // that can be used to complete the sign-in process
    return NextResponse.json({
      success: true,
      message: '2FA verification successful',
      type: tokenResult.type
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('2FA verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
