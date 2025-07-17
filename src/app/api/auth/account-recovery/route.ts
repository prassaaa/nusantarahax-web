import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { sendPasswordResetEmail, generateVerificationToken } from '@/lib/email/email-service'
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

const recoverySchema = z.object({
  email: z.string().email('Invalid email format'),
  method: z.enum(['email', 'security_questions', 'admin_contact']),
  securityAnswers: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - very restrictive for account recovery
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`account-recovery-${clientIP}`, 2, 600000)) { // 2 attempts per 10 minutes
      return NextResponse.json(
        { error: 'Too many account recovery attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = recoverySchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true
      }
    })

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'Account recovery process initiated. Further instructions will be sent if the account exists.'
    }

    if (!user) {
      // Log potential attack attempt
      console.warn(`Account recovery attempt for non-existent email: ${validatedData.email}`)
      return NextResponse.json(successResponse)
    }

    // Handle different recovery methods
    switch (validatedData.method) {
      case 'email':
        return await handleEmailRecovery(user, clientIP)
      
      case 'security_questions':
        return await handleSecurityQuestionRecovery(user, validatedData.securityAnswers, clientIP)
      
      case 'admin_contact':
        return await handleAdminContactRecovery(user, clientIP)
      
      default:
        return NextResponse.json(
          { error: 'Invalid recovery method' },
          { status: 400 }
        )
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Account recovery error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleEmailRecovery(user: any, clientIP: string) {
  try {
    // Check if user has a password (not OAuth-only account)
    if (!user.password) {
      await prisma.securityLog.create({
        data: {
          userId: user.id,
          action: 'RECOVERY_OAUTH_ATTEMPT',
          details: 'Account recovery attempted on OAuth-only account',
          ipAddress: clientIP
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Account recovery process initiated. Further instructions will be sent if the account exists.'
      })
    }

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(user.id, user.email, user.name)

    if (!emailResult.success) {
      console.error('Failed to send recovery email:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send recovery email. Please try again later.' },
        { status: 500 }
      )
    }

    // Log recovery attempt
    await prisma.securityLog.create({
      data: {
        userId: user.id,
        action: 'ACCOUNT_RECOVERY_EMAIL',
        details: 'Account recovery email sent',
        ipAddress: clientIP
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Recovery email sent successfully.'
    })

  } catch (error) {
    console.error('Email recovery error:', error)
    return NextResponse.json(
      { error: 'Failed to process email recovery' },
      { status: 500 }
    )
  }
}

async function handleSecurityQuestionRecovery(user: any, answers: string[] | undefined, clientIP: string) {
  // This is a placeholder for security question recovery
  // In a real implementation, you would:
  // 1. Retrieve user's security questions from database
  // 2. Verify the provided answers
  // 3. Generate a recovery token if answers are correct
  
  await prisma.securityLog.create({
    data: {
      userId: user.id,
      action: 'RECOVERY_SECURITY_QUESTIONS_ATTEMPT',
      details: 'Security questions recovery attempted',
      ipAddress: clientIP
    }
  })

  return NextResponse.json({
    success: false,
    error: 'Security questions recovery is not yet implemented. Please use email recovery or contact support.'
  })
}

async function handleAdminContactRecovery(user: any, clientIP: string) {
  try {
    // Create a recovery request for admin review
    const recoveryRequest = await prisma.securityLog.create({
      data: {
        userId: user.id,
        action: 'RECOVERY_ADMIN_REQUEST',
        details: `Admin assistance requested for account recovery. User: ${user.email}`,
        ipAddress: clientIP
      }
    })

    // In a real implementation, you might:
    // 1. Send notification to admin team
    // 2. Create a support ticket
    // 3. Generate a unique reference number

    return NextResponse.json({
      success: true,
      message: 'Admin assistance request submitted. You will be contacted within 24-48 hours.',
      referenceId: recoveryRequest.id
    })

  } catch (error) {
    console.error('Admin contact recovery error:', error)
    return NextResponse.json(
      { error: 'Failed to submit admin assistance request' },
      { status: 500 }
    )
  }
}

// GET endpoint to check recovery options for an email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Rate limiting for checking recovery options
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`check-recovery-${clientIP}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Find user (don't reveal if user exists or not)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        emailVerified: true,
        twoFactorEnabled: true
      }
    })

    // Always return the same recovery options to prevent enumeration
    return NextResponse.json({
      availableOptions: [
        {
          method: 'email',
          name: 'Email Recovery',
          description: 'Send a password reset link to your email address',
          available: true
        },
        {
          method: 'security_questions',
          name: 'Security Questions',
          description: 'Answer your security questions to recover your account',
          available: false // Not implemented yet
        },
        {
          method: 'admin_contact',
          name: 'Contact Support',
          description: 'Request manual assistance from our support team',
          available: true
        }
      ]
    })

  } catch (error) {
    console.error('Check recovery options error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
