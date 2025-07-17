import nodemailer from 'nodemailer'
import { generateOrderConfirmationEmail, generatePaymentReminderEmail } from './templates'

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}

// Create transporter
const transporter = nodemailer.createTransporter(emailConfig)

// Verify connection configuration
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify()
    console.log('Email server is ready to take our messages')
    return true
  } catch (error) {
    console.error('Email server connection failed:', error)
    return false
  }
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: from || `"NusantaraHax" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })

    console.log('Email sent successfully:', info.messageId)
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(data: {
  customerEmail: string
  customerName: string
  orderId: string
  total: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  licenses: Array<{
    productName: string
    licenseKey: string
    downloadUrl?: string
  }>
  orderDate: Date
}): Promise<boolean> {
  const html = generateOrderConfirmationEmail(data)
  
  return await sendEmail({
    to: data.customerEmail,
    subject: `Order Confirmation #${data.orderId.slice(-8)} - NusantaraHax`,
    html,
  })
}

// Send payment reminder email
export async function sendPaymentReminderEmail(data: {
  customerEmail: string
  customerName: string
  orderId: string
  total: number
  paymentUrl?: string
  vaNumber?: string
  expiresAt: Date
}): Promise<boolean> {
  const html = generatePaymentReminderEmail(data)
  
  return await sendEmail({
    to: data.customerEmail,
    subject: `Payment Reminder #${data.orderId.slice(-8)} - NusantaraHax`,
    html,
  })
}

// Send license delivery email (for existing customers getting new licenses)
export async function sendLicenseDeliveryEmail(data: {
  customerEmail: string
  customerName: string
  licenses: Array<{
    productName: string
    licenseKey: string
    downloadUrl?: string
  }>
}): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New License Keys - NusantaraHax</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .license-section {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #28a745;
        }
        .license-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            border: 1px solid #d4edda;
        }
        .license-key {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
            color: #155724;
            background: #f8f9fa;
            padding: 8px 12px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 5px;
        }
        .download-btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 10px;
            font-weight: 500;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">NusantaraHax</div>
            <h2>New License Keys</h2>
            <p>Your gaming tools are ready!</p>
        </div>

        <p>Hello ${data.customerName},</p>
        <p>Your new license keys are ready for use:</p>

        <div class="license-section">
            ${data.licenses.map(license => `
            <div class="license-item">
                <h4>${license.productName}</h4>
                <p>License Key:</p>
                <div class="license-key">${license.licenseKey}</div>
                ${license.downloadUrl ? `
                <a href="${license.downloadUrl}" class="download-btn">Download Now</a>
                ` : ''}
            </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>Need help? Contact us at <a href="mailto:support@nusantarahax.com">support@nusantarahax.com</a></p>
            <p>Visit your <a href="${process.env.NEXTAUTH_URL}/dashboard">dashboard</a> to manage your licenses</p>
            <p>&copy; 2024 NusantaraHax. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `
  
  return await sendEmail({
    to: data.customerEmail,
    subject: 'New License Keys Available - NusantaraHax',
    html,
  })
}
