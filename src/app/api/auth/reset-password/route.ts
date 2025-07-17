import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyToken } from '@/lib/email/email-service'
import { hash } from 'bcryptjs'
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

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`verify-reset-token-${clientIP}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many token verification attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      )
    }

    // Verify the token without consuming it
    const tokenRecord = await prisma.userVerificationToken.findFirst({
      where: {
        token,
        type: 'PASSWORD_RESET',
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      user: {
        email: tokenRecord.user.email,
        name: tokenRecord.user.name
      }
    })

  } catch (error) {
    console.error('Token verification error:', error)
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
    if (!rateLimit(`reset-password-${clientIP}`, 5, 60000)) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = resetPasswordSchema.parse(body)

    // Verify and consume the token
    const result = await verifyToken(validatedData.token, 'PASSWORD_RESET')

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await hash(validatedData.password, 12)

    // Update user's password
    await prisma.user.update({
      where: { id: result.user!.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    // Log password reset completion
    await prisma.securityLog.create({
      data: {
        userId: result.user!.id,
        action: 'PASSWORD_RESET_COMPLETED',
        details: 'Password successfully reset',
        ipAddress: clientIP
      }
    })

    // Invalidate all existing sessions for security
    await prisma.session.deleteMany({
      where: { userId: result.user!.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
