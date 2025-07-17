import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { sendPasswordResetEmail } from '@/lib/email/email-service'
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

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - very restrictive for password reset
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`forgot-password-${clientIP}`, 3, 300000)) { // 3 attempts per 5 minutes
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = forgotPasswordSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true // Check if user has password (not OAuth only)
      }
    })

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    }

    if (!user) {
      // Log potential attack attempt
      console.warn(`Password reset attempt for non-existent email: ${validatedData.email}`)
      return NextResponse.json(successResponse)
    }

    // Check if user has a password (not OAuth-only account)
    if (!user.password) {
      // Log OAuth account reset attempt
      await prisma.securityLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_OAUTH_ATTEMPT',
          details: 'Password reset attempted on OAuth-only account',
          ipAddress: clientIP
        }
      })
      
      return NextResponse.json(successResponse)
    }

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(user.id, user.email, user.name)

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again later.' },
        { status: 500 }
      )
    }

    // Log password reset request
    await prisma.securityLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        details: 'Password reset email sent',
        ipAddress: clientIP
      }
    })

    return NextResponse.json(successResponse)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email format', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
