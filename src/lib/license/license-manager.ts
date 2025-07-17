import crypto from 'crypto'
import { prisma } from '@/lib/db/prisma'

export interface LicenseValidationResult {
  isValid: boolean
  license?: {
    id: string
    licenseKey: string
    status: string
    userId: string
    productId: string
    expiresAt: Date | null
    product: {
      name: string
      version: string
    }
    user: {
      name: string
      email: string
    }
  }
  error?: string
}

export interface HardwareInfo {
  cpuId?: string
  motherboardId?: string
  diskId?: string
  macAddress?: string
  systemUuid?: string
}

export class LicenseManager {
  private readonly encryptionKey: string

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey
  }

  /**
   * Generate a new license key
   */
  generateLicenseKey(productId: string, userId: string): string {
    const timestamp = Date.now().toString()
    const random = crypto.randomBytes(8).toString('hex')
    const data = `${productId}-${userId}-${timestamp}-${random}`
    
    // Create hash
    const hash = crypto.createHash('sha256').update(data).digest('hex')
    
    // Format as license key (XXXX-XXXX-XXXX-XXXX)
    const key = hash.substring(0, 16).toUpperCase()
    return `${key.substring(0, 4)}-${key.substring(4, 8)}-${key.substring(8, 12)}-${key.substring(12, 16)}`
  }

  /**
   * Validate license key
   */
  async validateLicense(
    licenseKey: string,
    productId?: string,
    hardwareInfo?: HardwareInfo
  ): Promise<LicenseValidationResult> {
    try {
      // Find license in database
      const license = await prisma.license.findUnique({
        where: { licenseKey },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              version: true,
              isActive: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      if (!license) {
        return {
          isValid: false,
          error: 'License key not found'
        }
      }

      // Check if license is active
      if (license.status !== 'ACTIVE') {
        return {
          isValid: false,
          error: `License is ${license.status.toLowerCase()}`
        }
      }

      // Check if product is active
      if (!license.product.isActive) {
        return {
          isValid: false,
          error: 'Product is no longer available'
        }
      }

      // Check product match if specified
      if (productId && license.productId !== productId) {
        return {
          isValid: false,
          error: 'License is not valid for this product'
        }
      }

      // Check expiry date
      if (license.expiresAt && license.expiresAt < new Date()) {
        // Auto-expire the license
        await prisma.license.update({
          where: { id: license.id },
          data: { status: 'EXPIRED' }
        })

        return {
          isValid: false,
          error: 'License has expired'
        }
      }

      // Check hardware binding if enabled
      if (license.hardwareFingerprint && hardwareInfo) {
        const currentFingerprint = this.generateHardwareFingerprint(hardwareInfo)
        if (license.hardwareFingerprint !== currentFingerprint) {
          return {
            isValid: false,
            error: 'License is bound to different hardware'
          }
        }
      }

      return {
        isValid: true,
        license: {
          id: license.id,
          licenseKey: license.licenseKey,
          status: license.status,
          userId: license.userId,
          productId: license.productId,
          expiresAt: license.expiresAt,
          product: {
            name: license.product.name,
            version: license.product.version || '1.0.0'
          },
          user: {
            name: license.user.name || '',
            email: license.user.email
          }
        }
      }

    } catch (error) {
      console.error('License validation error:', error)
      return {
        isValid: false,
        error: 'License validation failed'
      }
    }
  }

  /**
   * Bind license to hardware
   */
  async bindLicenseToHardware(
    licenseId: string,
    hardwareInfo: HardwareInfo
  ): Promise<boolean> {
    try {
      const fingerprint = this.generateHardwareFingerprint(hardwareInfo)
      
      await prisma.license.update({
        where: { id: licenseId },
        data: { 
          hardwareFingerprint: fingerprint,
          hardwareInfo: JSON.stringify(hardwareInfo)
        }
      })

      return true
    } catch (error) {
      console.error('Hardware binding error:', error)
      return false
    }
  }

  /**
   * Generate hardware fingerprint
   */
  private generateHardwareFingerprint(hardwareInfo: HardwareInfo): string {
    const data = [
      hardwareInfo.cpuId || '',
      hardwareInfo.motherboardId || '',
      hardwareInfo.diskId || '',
      hardwareInfo.macAddress || '',
      hardwareInfo.systemUuid || ''
    ].join('|')

    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * Revoke license
   */
  async revokeLicense(licenseId: string, reason?: string): Promise<boolean> {
    try {
      await prisma.license.update({
        where: { id: licenseId },
        data: { 
          status: 'REVOKED',
          revokedAt: new Date(),
          revocationReason: reason
        }
      })

      return true
    } catch (error) {
      console.error('License revocation error:', error)
      return false
    }
  }

  /**
   * Extend license expiry
   */
  async extendLicense(
    licenseId: string,
    extensionDays: number
  ): Promise<boolean> {
    try {
      const license = await prisma.license.findUnique({
        where: { id: licenseId }
      })

      if (!license) return false

      const currentExpiry = license.expiresAt || new Date()
      const newExpiry = new Date(currentExpiry.getTime() + (extensionDays * 24 * 60 * 60 * 1000))

      await prisma.license.update({
        where: { id: licenseId },
        data: { expiresAt: newExpiry }
      })

      return true
    } catch (error) {
      console.error('License extension error:', error)
      return false
    }
  }

  /**
   * Get license usage statistics
   */
  async getLicenseStats(licenseId: string) {
    try {
      const [license, downloadCount, lastDownload] = await Promise.all([
        prisma.license.findUnique({
          where: { id: licenseId },
          include: {
            product: { select: { name: true } },
            user: { select: { name: true, email: true } }
          }
        }),
        prisma.download.count({
          where: { licenseId }
        }),
        prisma.download.findFirst({
          where: { licenseId },
          orderBy: { downloadedAt: 'desc' },
          select: { downloadedAt: true, ipAddress: true }
        })
      ])

      if (!license) return null

      return {
        license,
        stats: {
          downloadCount,
          lastDownload: lastDownload ? {
            date: lastDownload.downloadedAt,
            ipAddress: lastDownload.ipAddress
          } : null
        }
      }
    } catch (error) {
      console.error('License stats error:', error)
      return null
    }
  }

  /**
   * Check for expiring licenses
   */
  async getExpiringLicenses(daysBeforeExpiry: number = 7) {
    try {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry)

      return await prisma.license.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lte: expiryDate,
            gte: new Date()
          }
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { name: true } }
        }
      })
    } catch (error) {
      console.error('Get expiring licenses error:', error)
      return []
    }
  }

  /**
   * Cleanup expired licenses
   */
  async cleanupExpiredLicenses(): Promise<number> {
    try {
      const result = await prisma.license.updateMany({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lt: new Date()
          }
        },
        data: {
          status: 'EXPIRED'
        }
      })

      console.log(`Marked ${result.count} licenses as expired`)
      return result.count
    } catch (error) {
      console.error('Cleanup expired licenses error:', error)
      return 0
    }
  }
}

// Create singleton instance
const encryptionKey = process.env.LICENSE_ENCRYPTION_KEY || 'default-key-change-in-production'
export const licenseManager = new LicenseManager(encryptionKey)
