import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db/prisma'

// Configure TOTP settings
authenticator.options = {
  step: 30, // 30 second window
  window: 1, // Allow 1 step before/after for clock drift
}

export interface TwoFactorSetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
  manualEntryKey: string
}

/**
 * Generate 2FA setup data for a user
 */
export async function generateTwoFactorSetup(userId: string, userEmail: string): Promise<TwoFactorSetup> {
  // Generate secret
  const secret = authenticator.generateSecret()
  
  // Generate service name and account name for QR code
  const serviceName = 'NusantaraHax'
  const accountName = userEmail
  
  // Generate TOTP URL for QR code
  const otpUrl = authenticator.keyuri(accountName, serviceName, secret)
  
  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(otpUrl)
  
  // Generate backup codes
  const backupCodes = generateBackupCodes()
  
  // Format secret for manual entry (groups of 4 characters)
  const manualEntryKey = secret.match(/.{1,4}/g)?.join(' ') || secret
  
  return {
    secret,
    qrCodeUrl,
    backupCodes,
    manualEntryKey
  }
}

/**
 * Generate backup codes for 2FA
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character backup code
    const code = randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  
  return codes
}

/**
 * Verify TOTP token
 */
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret })
  } catch (error) {
    console.error('TOTP verification error:', error)
    return false
  }
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { backupCodes: true }
    })

    if (!user || !user.backupCodes) {
      return false
    }

    const backupCodes = JSON.parse(user.backupCodes) as string[]
    const codeIndex = backupCodes.indexOf(code.toUpperCase())

    if (codeIndex === -1) {
      return false
    }

    // Remove used backup code
    backupCodes.splice(codeIndex, 1)

    // Update user's backup codes
    await prisma.user.update({
      where: { id: userId },
      data: { backupCodes: JSON.stringify(backupCodes) }
    })

    // Log security activity
    await prisma.securityLog.create({
      data: {
        userId,
        action: 'BACKUP_CODE_USED',
        details: 'Backup code used for 2FA verification'
      }
    })

    return true
  } catch (error) {
    console.error('Backup code verification error:', error)
    return false
  }
}

/**
 * Enable 2FA for user
 */
export async function enableTwoFactor(userId: string, secret: string, backupCodes: string[]): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        backupCodes: JSON.stringify(backupCodes)
      }
    })

    // Log security activity
    await prisma.securityLog.create({
      data: {
        userId,
        action: 'TWO_FACTOR_ENABLED',
        details: 'Two-factor authentication enabled'
      }
    })

    return true
  } catch (error) {
    console.error('Enable 2FA error:', error)
    return false
  }
}

/**
 * Disable 2FA for user
 */
export async function disableTwoFactor(userId: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null
      }
    })

    // Log security activity
    await prisma.securityLog.create({
      data: {
        userId,
        action: 'TWO_FACTOR_DISABLED',
        details: 'Two-factor authentication disabled'
      }
    })

    return true
  } catch (error) {
    console.error('Disable 2FA error:', error)
    return false
  }
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  try {
    const newBackupCodes = generateBackupCodes()

    await prisma.user.update({
      where: { id: userId },
      data: { backupCodes: JSON.stringify(newBackupCodes) }
    })

    // Log security activity
    await prisma.securityLog.create({
      data: {
        userId,
        action: 'BACKUP_CODES_REGENERATED',
        details: 'Backup codes regenerated'
      }
    })

    return newBackupCodes
  } catch (error) {
    console.error('Regenerate backup codes error:', error)
    throw new Error('Failed to regenerate backup codes')
  }
}

/**
 * Check if user has 2FA enabled
 */
export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true }
    })

    return user?.twoFactorEnabled || false
  } catch (error) {
    console.error('Check 2FA status error:', error)
    return false
  }
}

/**
 * Verify 2FA token (TOTP or backup code)
 */
export async function verifyTwoFactorToken(userId: string, token: string): Promise<{ success: boolean; type?: 'totp' | 'backup' }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        backupCodes: true
      }
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return { success: false }
    }

    // Try TOTP first
    if (verifyTOTP(token, user.twoFactorSecret)) {
      // Log security activity
      await prisma.securityLog.create({
        data: {
          userId,
          action: 'TWO_FACTOR_VERIFIED',
          details: 'Two-factor authentication verified with TOTP'
        }
      })

      return { success: true, type: 'totp' }
    }

    // Try backup code
    if (await verifyBackupCode(userId, token)) {
      return { success: true, type: 'backup' }
    }

    return { success: false }
  } catch (error) {
    console.error('2FA verification error:', error)
    return { success: false }
  }
}
