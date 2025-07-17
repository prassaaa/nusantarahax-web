import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, rateLimit } from '@/lib/auth/route-protection'
import { prisma } from '@/lib/db'
import { hash, compare } from 'bcryptjs'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - more restrictive for password changes
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`change-password-${clientIP}`, 5, 60000)) {
      return NextResponse.json(
        { error: 'Too many password change attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Require authentication
    const user = await requireAuth()

    // Validate request body
    const body = await request.json()
    const validatedData = changePasswordSchema.parse(body)

    // Get user with password
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        password: true
      }
    })

    if (!userWithPassword || !userWithPassword.password) {
      return NextResponse.json(
        { error: 'User not found or password not set' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(
      validatedData.currentPassword,
      userWithPassword.password
    )

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Check if new password is different from current
    const isSamePassword = await compare(
      validatedData.newPassword,
      userWithPassword.password
    )

    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedNewPassword = await hash(validatedData.newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    })

    // Log security event (optional - for audit trail)
    console.log(`Password changed for user: ${user.email} at ${new Date().toISOString()}`)

    return NextResponse.json({
      message: 'Password changed successfully'
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

    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
