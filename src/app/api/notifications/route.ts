import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { notificationService } from '@/lib/notifications/notification-service'
import { z } from 'zod'

const getNotificationsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  unreadOnly: z.string().optional().transform(val => val === 'true'),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ORDER_UPDATE', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'LICENSE_EXPIRY', 'SYSTEM_MAINTENANCE']).optional()
})

// Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = getNotificationsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      unreadOnly: searchParams.get('unreadOnly'),
      type: searchParams.get('type')
    })

    const result = await notificationService.getUserNotifications(
      session.user.id,
      params
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ORDER_UPDATE', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'LICENSE_EXPIRY', 'SYSTEM_MAINTENANCE']),
  data: z.record(z.any()).optional(),
  sendEmail: z.boolean().optional().default(false),
  emailTemplate: z.string().optional()
})

// Create notification (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const notificationData = createNotificationSchema.parse(body)

    // For admin-created notifications, we need a target user ID
    const { userId } = body
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const success = await notificationService.createNotification({
      userId,
      ...notificationData
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Notification created successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
