import { NextRequest, NextResponse } from 'next/server'
import { licenseManager } from '@/lib/license/license-manager'
import { notificationService } from '@/lib/notifications/notification-service'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-cron-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting license cleanup job...')

    // 1. Cleanup expired licenses
    const expiredCount = await licenseManager.cleanupExpiredLicenses()

    // 2. Get licenses expiring in 7 days
    const expiringLicenses = await licenseManager.getExpiringLicenses(7)

    // 3. Send expiry notifications
    let notificationsSent = 0
    for (const license of expiringLicenses) {
      if (license.expiresAt) {
        const success = await notificationService.notifyLicenseExpiring(
          license.userId,
          license.product.name,
          license.expiresAt
        )
        if (success) notificationsSent++
      }
    }

    // 4. Get licenses expiring in 1 day (urgent)
    const urgentExpiringLicenses = await licenseManager.getExpiringLicenses(1)

    // 5. Send urgent expiry notifications
    let urgentNotificationsSent = 0
    for (const license of urgentExpiringLicenses) {
      if (license.expiresAt) {
        const success = await notificationService.createNotification({
          userId: license.userId,
          title: 'License Expiring Tomorrow!',
          message: `Your license for ${license.product.name} will expire tomorrow. Please renew to continue using the product.`,
          type: 'WARNING',
          data: {
            licenseId: license.id,
            productName: license.product.name,
            expiryDate: license.expiresAt.toISOString()
          },
          sendEmail: true,
          emailTemplate: 'license_expiry_urgent'
        })
        if (success) urgentNotificationsSent++
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        expiredLicensesMarked: expiredCount,
        expiringIn7Days: expiringLicenses.length,
        expiringIn1Day: urgentExpiringLicenses.length,
        notificationsSent,
        urgentNotificationsSent
      }
    }

    console.log('License cleanup job completed:', result)

    return NextResponse.json(result)

  } catch (error) {
    console.error('License cleanup job error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'License cleanup job failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Manual trigger for development/testing
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  // Run the same cleanup logic
  return GET(request)
}
