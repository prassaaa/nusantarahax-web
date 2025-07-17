import nodemailer from 'nodemailer'
import { prisma } from '@/lib/db/prisma'

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export interface EmailData {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export class EmailService {
  private transporter: nodemailer.Transporter
  private defaultFrom: string

  constructor(config: EmailConfig, defaultFrom: string) {
    this.transporter = nodemailer.createTransporter(config)
    this.defaultFrom = defaultFrom
  }

  /**
   * Send email
   */
  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      const mailOptions = {
        from: data.from || this.defaultFrom,
        to: Array.isArray(data.to) ? data.to.join(', ') : data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
        replyTo: data.replyTo,
        attachments: data.attachments
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', result.messageId)
      return true
    } catch (error) {
      console.error('Email send error:', error)
      return false
    }
  }

  /**
   * Send email using template
   */
  async sendTemplateEmail(
    templateKey: string,
    to: string | string[],
    variables: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      // Get email template from database
      const template = await prisma.emailTemplate.findUnique({
        where: { 
          key: templateKey,
          isActive: true
        }
      })

      if (!template) {
        console.error(`Email template not found: ${templateKey}`)
        return false
      }

      // Replace variables in template
      let subject = template.subject
      let htmlContent = template.htmlContent
      let textContent = template.textContent || ''

      // Simple template variable replacement
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`
        const stringValue = String(value)
        
        subject = subject.replace(new RegExp(placeholder, 'g'), stringValue)
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), stringValue)
        textContent = textContent.replace(new RegExp(placeholder, 'g'), stringValue)
      })

      // Handle array variables (like order items)
      htmlContent = this.processArrayVariables(htmlContent, variables)
      textContent = this.processArrayVariables(textContent, variables)

      return await this.sendEmail({
        to,
        subject,
        html: htmlContent,
        text: textContent
      })

    } catch (error) {
      console.error('Template email send error:', error)
      return false
    }
  }

  /**
   * Process array variables in templates (simple implementation)
   */
  private processArrayVariables(content: string, variables: Record<string, any>): string {
    // Handle {{#each items}} blocks
    const eachRegex = /{{#each\s+(\w+)}}(.*?){{\/each}}/gs
    
    return content.replace(eachRegex, (match, arrayKey, template) => {
      const array = variables[arrayKey]
      if (!Array.isArray(array)) return ''
      
      return array.map(item => {
        let itemContent = template
        Object.entries(item).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`
          itemContent = itemContent.replace(new RegExp(placeholder, 'g'), String(value))
        })
        return itemContent
      }).join('')
    })
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      console.log('Email server connection verified')
      return true
    } catch (error) {
      console.error('Email server connection failed:', error)
      return false
    }
  }
}

// Create email service instance
const emailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
}

const defaultFrom = process.env.SMTP_FROM || 'noreply@nusantarahax.com'

export const emailService = new EmailService(emailConfig, defaultFrom)

// Email helper functions
export const sendWelcomeEmail = async (userEmail: string, userName: string) => {
  return await emailService.sendTemplateEmail('welcome', userEmail, {
    userName,
    loginUrl: `${process.env.APP_URL}/auth/signin`,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@nusantarahax.com'
  })
}

export const sendOrderConfirmationEmail = async (
  userEmail: string,
  orderData: {
    orderNumber: string
    customerName: string
    items: Array<{
      name: string
      quantity: number
      price: string
    }>
    total: string
    paymentMethod: string
  }
) => {
  return await emailService.sendTemplateEmail('order_confirmation', userEmail, orderData)
}

export const sendPaymentSuccessEmail = async (
  userEmail: string,
  paymentData: {
    orderNumber: string
    customerName: string
    total: string
    dashboardUrl: string
    licenses: Array<{
      productName: string
      licenseKey: string
      downloadUrl: string
    }>
  }
) => {
  return await emailService.sendTemplateEmail('payment_success', userEmail, paymentData)
}

export const sendPasswordResetEmail = async (
  userEmail: string,
  resetData: {
    userName: string
    resetUrl: string
    expiryTime: string
  }
) => {
  return await emailService.sendTemplateEmail('password_reset', userEmail, resetData)
}

export const sendEmailVerificationEmail = async (
  userEmail: string,
  verificationData: {
    userName: string
    verificationUrl: string
    expiryTime: string
  }
) => {
  return await emailService.sendTemplateEmail('email_verification', userEmail, verificationData)
}
