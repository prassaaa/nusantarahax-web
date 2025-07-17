import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/email/email-service'
import { prisma } from '@/lib/db/prisma'
import { rateLimit } from '@/lib/auth/route-protection'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`verify-email-${clientIP}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Verify the token
    const result = await verifyToken(token, 'EMAIL_VERIFICATION')

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Update user's email verification status
    await prisma.user.update({
      where: { id: result.user!.id },
      data: {
        emailVerified: new Date(),
        updatedAt: new Date()
      }
    })

    // Log security activity
    await prisma.securityLog.create({
      data: {
        userId: result.user!.id,
        action: 'EMAIL_VERIFIED',
        details: 'Email address verified successfully',
        ipAddress: clientIP
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: result.user!.id,
        email: result.user!.email,
        emailVerified: true
      }
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - more restrictive for resending
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`resend-verification-${clientIP}`, 3, 60000)) {
      return NextResponse.json(
        { error: 'Too many resend attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a verification email has been sent.'
      })
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Send verification email
    const { sendEmailVerification } = await import('@/lib/email/email-service')
    const emailResult = await sendEmailVerification(user.id, user.email, user.name)

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      )
    }

    // Log security activity
    await prisma.securityLog.create({
      data: {
        userId: user.id,
        action: 'VERIFICATION_EMAIL_SENT',
        details: 'Email verification resent',
        ipAddress: clientIP
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully'
    })

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
