import { prisma } from '@/lib/db/prisma'
import { emailService } from '@/lib/email/mailer'

export type NotificationType = 
  | 'INFO' 
  | 'SUCCESS' 
  | 'WARNING' 
  | 'ERROR' 
  | 'ORDER_UPDATE' 
  | 'PAYMENT_SUCCESS' 
  | 'PAYMENT_FAILED' 
  | 'LICENSE_EXPIRY' 
  | 'SYSTEM_MAINTENANCE'

export interface NotificationData {
  userId: string
  title: string
  message: string
  type: NotificationType
  data?: Record<string, any>
  sendEmail?: boolean
  emailTemplate?: string
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(data: NotificationData): Promise<boolean> {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          data: data.data || {},
          isRead: false
        }
      })

      // Send email notification if requested
      if (data.sendEmail && data.emailTemplate) {
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
          include: {
            preferences: true
          }
        })

        if (user && user.preferences?.emailNotifications) {
          await emailService.sendTemplateEmail(
            data.emailTemplate,
            user.email,
            {
              userName: user.name,
              title: data.title,
              message: data.message,
              ...data.data
            }
          )
        }
      }

      // TODO: Send real-time notification via WebSocket/SSE
      this.sendRealTimeNotification(data.userId, notification)

      return true
    } catch (error) {
      console.error('Create notification error:', error)
      return false
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  async createBulkNotifications(
    userIds: string[],
    notificationData: Omit<NotificationData, 'userId'>
  ): Promise<number> {
    let successCount = 0

    for (const userId of userIds) {
      const success = await this.createNotification({
        ...notificationData,
        userId
      })
      if (success) successCount++
    }

    return successCount
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId
        },
        data: {
          isRead: true
        }
      })
      return true
    } catch (error) {
      console.error('Mark notification as read error:', error)
      return false
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      })
      return true
    } catch (error) {
      console.error('Mark all notifications as read error:', error)
      return false
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: {
      page?: number
      limit?: number
      unreadOnly?: boolean
      type?: NotificationType
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type
    } = options

    const skip = (page - 1) * limit

    const where: any = { userId }
    if (unreadOnly) where.isRead = false
    if (type) where.type = type

    try {
      const [notifications, totalCount, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
          where: { userId, isRead: false }
        })
      ])

      return {
        notifications,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        unreadCount
      }
    } catch (error) {
      console.error('Get user notifications error:', error)
      return null
    }
  }

  /**
   * Delete old notifications (cleanup)
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          isRead: true
        }
      })

      console.log(`Cleaned up ${result.count} old notifications`)
      return result.count
    } catch (error) {
      console.error('Cleanup old notifications error:', error)
      return 0
    }
  }

  /**
   * Send real-time notification (placeholder for WebSocket implementation)
   */
  private sendRealTimeNotification(userId: string, notification: any) {
    // TODO: Implement WebSocket/SSE for real-time notifications
    console.log(`Real-time notification for user ${userId}:`, notification.title)
  }

  // Predefined notification creators
  async notifyOrderCreated(userId: string, orderId: string, total: number) {
    return this.createNotification({
      userId,
      title: 'Order Created',
      message: `Your order #${orderId.slice(-8)} has been created successfully.`,
      type: 'ORDER_UPDATE',
      data: { orderId, total },
      sendEmail: true,
      emailTemplate: 'order_confirmation'
    })
  }

  async notifyPaymentSuccess(userId: string, orderId: string, total: number) {
    return this.createNotification({
      userId,
      title: 'Payment Successful',
      message: `Payment for order #${orderId.slice(-8)} has been processed successfully.`,
      type: 'PAYMENT_SUCCESS',
      data: { orderId, total },
      sendEmail: true,
      emailTemplate: 'payment_success'
    })
  }

  async notifyPaymentFailed(userId: string, orderId: string, reason?: string) {
    return this.createNotification({
      userId,
      title: 'Payment Failed',
      message: `Payment for order #${orderId.slice(-8)} has failed. ${reason || 'Please try again.'}`,
      type: 'PAYMENT_FAILED',
      data: { orderId, reason },
      sendEmail: true,
      emailTemplate: 'payment_failed'
    })
  }

  async notifyLicenseExpiring(userId: string, productName: string, expiryDate: Date) {
    return this.createNotification({
      userId,
      title: 'License Expiring Soon',
      message: `Your license for ${productName} will expire on ${expiryDate.toLocaleDateString()}.`,
      type: 'LICENSE_EXPIRY',
      data: { productName, expiryDate: expiryDate.toISOString() },
      sendEmail: true,
      emailTemplate: 'license_expiry'
    })
  }

  async notifySystemMaintenance(userIds: string[], startTime: Date, endTime: Date) {
    return this.createBulkNotifications(userIds, {
      title: 'Scheduled Maintenance',
      message: `System maintenance is scheduled from ${startTime.toLocaleString()} to ${endTime.toLocaleString()}.`,
      type: 'SYSTEM_MAINTENANCE',
      data: { 
        startTime: startTime.toISOString(), 
        endTime: endTime.toISOString() 
      },
      sendEmail: true,
      emailTemplate: 'system_maintenance'
    })
  }
}

// Create singleton instance
export const notificationService = new NotificationService()
