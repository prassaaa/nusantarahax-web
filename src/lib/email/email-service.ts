import nodemailer from 'nodemailer'
import { prisma } from '@/lib/db/prisma'
import { randomBytes } from 'crypto'

// Email transporter configuration
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration (e.g., SendGrid, AWS SES, etc.)
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  } else {
    // Development: Use Ethereal Email for testing
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
    })
  }
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const transporter = createTransporter()
    
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@nusantarahax.com',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    })

    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function generateVerificationToken(userId: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR_SETUP' | 'TWO_FACTOR_BACKUP') {
  // Generate secure random token
  const token = randomBytes(32).toString('hex')
  
  // Set expiration time (24 hours for email verification, 1 hour for password reset)
  const expiresAt = new Date()
  if (type === 'EMAIL_VERIFICATION') {
    expiresAt.setHours(expiresAt.getHours() + 24)
  } else if (type === 'PASSWORD_RESET') {
    expiresAt.setHours(expiresAt.getHours() + 1)
  } else {
    expiresAt.setHours(expiresAt.getHours() + 2)
  }

  // Delete existing tokens of the same type for this user
  await prisma.userVerificationToken.deleteMany({
    where: {
      userId,
      type
    }
  })

  // Create new token
  const verificationToken = await prisma.userVerificationToken.create({
    data: {
      userId,
      token,
      type,
      expiresAt
    }
  })

  return verificationToken
}

export async function verifyToken(token: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR_SETUP' | 'TWO_FACTOR_BACKUP') {
  const verificationToken = await prisma.userVerificationToken.findFirst({
    where: {
      token,
      type,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true
    }
  })

  if (!verificationToken) {
    return { success: false, error: 'Invalid or expired token' }
  }

  // Delete the used token
  await prisma.userVerificationToken.delete({
    where: {
      id: verificationToken.id
    }
  })

  return { success: true, user: verificationToken.user }
}

export async function sendEmailVerification(userId: string, email: string, name: string) {
  try {
    const token = await generateVerificationToken(userId, 'EMAIL_VERIFICATION')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${token.token}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email - NusantaraHax</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎮 NusantaraHax</h1>
              <p>Verify Your Email Address</p>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Thank you for creating an account with NusantaraHax. To complete your registration and start accessing our premium gaming tools, please verify your email address.</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
              
              <p><strong>This verification link will expire in 24 hours.</strong></p>
              
              <p>If you didn't create an account with NusantaraHax, you can safely ignore this email.</p>
              
              <div class="footer">
                <p>Best regards,<br>The NusantaraHax Team</p>
                <p><small>This is an automated email. Please do not reply to this message.</small></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const result = await sendEmail({
      to: email,
      subject: 'Verify Your Email Address - NusantaraHax',
      html
    })

    return result
  } catch (error) {
    console.error('Failed to send email verification:', error)
    return { success: false, error: 'Failed to send verification email' }
  }
}

export async function sendPasswordResetEmail(userId: string, email: string, name: string) {
  try {
    const token = await generateVerificationToken(userId, 'PASSWORD_RESET')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token.token}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password - NusantaraHax</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 NusantaraHax</h1>
              <p>Password Reset Request</p>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>We received a request to reset your password for your NusantaraHax account. If you made this request, click the button below to reset your password.</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetUrl}</p>
              
              <p><strong>This reset link will expire in 1 hour.</strong></p>
              
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
              
              <div class="footer">
                <p>Best regards,<br>The NusantaraHax Team</p>
                <p><small>This is an automated email. Please do not reply to this message.</small></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const result = await sendEmail({
      to: email,
      subject: 'Reset Your Password - NusantaraHax',
      html
    })

    return result
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return { success: false, error: 'Failed to send password reset email' }
  }
}

// Clean up expired tokens (should be run periodically)
export async function cleanupExpiredTokens() {
  try {
    const result = await prisma.userVerificationToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
    
    console.log(`Cleaned up ${result.count} expired tokens`)
    return result.count
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error)
    return 0
  }
}
