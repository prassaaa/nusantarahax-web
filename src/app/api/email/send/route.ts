import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { emailService } from '@/lib/email/mailer'
import { z } from 'zod'

const sendEmailSchema = z.object({
  templateKey: z.string().min(1, 'Template key is required'),
  to: z.union([z.string().email(), z.array(z.string().email())]),
  variables: z.record(z.any()).optional().default({})
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admin users to send emails via API
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateKey, to, variables } = sendEmailSchema.parse(body)

    // Send email using template
    const success = await emailService.sendTemplateEmail(templateKey, to, variables)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
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

    console.error('Send email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Test email endpoint (development only)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const testEmail = searchParams.get('email') || 'test@example.com'

    // Test email connection
    const connectionOk = await emailService.verifyConnection()
    
    if (!connectionOk) {
      return NextResponse.json({
        error: 'Email server connection failed',
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER ? '***' : 'not set'
        }
      }, { status: 500 })
    }

    // Send test email
    const success = await emailService.sendEmail({
      to: testEmail,
      subject: 'Test Email from NusantaraHax',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from NusantaraHax.</p>
        <p>If you received this, your email configuration is working correctly!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
      text: 'This is a test email from NusantaraHax. If you received this, your email configuration is working correctly!'
    })

    return NextResponse.json({
      success,
      message: success ? 'Test email sent successfully' : 'Failed to send test email',
      to: testEmail,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Test email failed', details: error },
      { status: 500 }
    )
  }
}
