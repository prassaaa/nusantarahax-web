import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, rateLimit } from '@/lib/auth/route-protection'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const preferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  orderUpdates: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  securityAlerts: z.boolean().optional(),
  twoFactorAuth: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`preferences-get-${clientIP}`, 20, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Require authentication
    const user = await requireAuth()

    // Get user preferences
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id }
    })

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId: user.id,
          emailNotifications: true,
          orderUpdates: true,
          marketingEmails: false,
          securityAlerts: true,
          twoFactorAuth: false
        }
      })
    }

    return NextResponse.json({
      preferences: {
        emailNotifications: preferences.emailNotifications,
        orderUpdates: preferences.orderUpdates,
        marketingEmails: preferences.marketingEmails,
        securityAlerts: preferences.securityAlerts,
        twoFactorAuth: preferences.twoFactorAuth
      }
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Get preferences error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`preferences-update-${clientIP}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Require authentication
    const user = await requireAuth()

    // Validate request body
    const body = await request.json()
    const validatedData = preferencesSchema.parse(body)

    // Update or create preferences
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: {
        ...validatedData,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        emailNotifications: validatedData.emailNotifications ?? true,
        orderUpdates: validatedData.orderUpdates ?? true,
        marketingEmails: validatedData.marketingEmails ?? false,
        securityAlerts: validatedData.securityAlerts ?? true,
        twoFactorAuth: validatedData.twoFactorAuth ?? false
      }
    })

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences: {
        emailNotifications: preferences.emailNotifications,
        orderUpdates: preferences.orderUpdates,
        marketingEmails: preferences.marketingEmails,
        securityAlerts: preferences.securityAlerts,
        twoFactorAuth: preferences.twoFactorAuth
      }
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

    console.error('Update preferences error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
