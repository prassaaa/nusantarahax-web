import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAPI } from '@/lib/auth/admin-protection'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

// Simple rate limiting implementation
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

const settingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required').optional(),
  siteDescription: z.string().optional(),
  siteUrl: z.string().url('Invalid URL').optional(),
  contactEmail: z.string().email('Invalid email').optional(),
  supportEmail: z.string().email('Invalid email').optional(),
  socialLinks: z.object({
    twitter: z.string().url().optional(),
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
  }).optional(),
  seoSettings: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.string().optional(),
    ogImage: z.string().url().optional(),
  }).optional(),
  emailSettings: z.object({
    smtpHost: z.string().optional(),
    smtpPort: z.number().optional(),
    smtpUser: z.string().optional(),
    smtpPassword: z.string().optional(),
    fromEmail: z.string().email().optional(),
    fromName: z.string().optional(),
  }).optional(),
  paymentSettings: z.object({
    currency: z.string().optional(),
    taxRate: z.number().min(0).max(100).optional(),
    shippingRate: z.number().min(0).optional(),
    freeShippingThreshold: z.number().min(0).optional(),
  }).optional(),
  securitySettings: z.object({
    enableTwoFactor: z.boolean().optional(),
    sessionTimeout: z.number().min(1).optional(),
    maxLoginAttempts: z.number().min(1).optional(),
    passwordMinLength: z.number().min(6).optional(),
  }).optional(),
  maintenanceMode: z.boolean().optional(),
  registrationEnabled: z.boolean().optional(),
})

// GET /api/admin/settings - Get all settings
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`admin-settings-${clientIP}`, 30, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    await requireAdminAPI()

    // Get all settings
    const settings = await prisma.setting.findMany({
      select: {
        key: true,
        value: true,
        type: true,
        category: true,
        description: true,
        updatedAt: true,
        updatedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Group settings by category
    const groupedSettings: Record<string, any> = {}
    
    settings.forEach(setting => {
      const category = setting.category || 'general'
      if (!groupedSettings[category]) {
        groupedSettings[category] = {}
      }
      
      let value = setting.value
      try {
        // Try to parse JSON values
        if (setting.type === 'JSON') {
          value = JSON.parse(setting.value)
        } else if (setting.type === 'BOOLEAN') {
          value = setting.value === 'true'
        } else if (setting.type === 'NUMBER') {
          value = parseFloat(setting.value)
        }
      } catch (e) {
        // Keep original value if parsing fails
      }
      
      groupedSettings[category][setting.key] = {
        value,
        type: setting.type,
        description: setting.description,
        updatedAt: setting.updatedAt,
        updatedBy: setting.updatedBy
      }
    })

    return NextResponse.json({ settings: groupedSettings })

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    console.error('Admin settings GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`admin-settings-update-${clientIP}`, 20, 60000)) {
      return NextResponse.json(
        { error: 'Too many update requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    const admin = await requireAdminAPI()

    // Validate request body
    const body = await request.json()
    const validatedData = settingsSchema.parse(body)

    // Prepare settings updates
    const settingsToUpdate: Array<{
      key: string
      value: string
      type: string
      category: string
      description?: string
    }> = []

    // Process each setting category
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        let settingValue: string
        let settingType: string
        let category: string

        if (typeof value === 'object' && value !== null) {
          settingValue = JSON.stringify(value)
          settingType = 'JSON'
          category = key
        } else if (typeof value === 'boolean') {
          settingValue = value.toString()
          settingType = 'BOOLEAN'
          category = 'general'
        } else if (typeof value === 'number') {
          settingValue = value.toString()
          settingType = 'NUMBER'
          category = 'general'
        } else {
          settingValue = value.toString()
          settingType = 'STRING'
          category = 'general'
        }

        settingsToUpdate.push({
          key,
          value: settingValue,
          type: settingType,
          category,
          description: `${key} setting`
        })
      }
    })

    // Update settings in database
    const updatedSettings = await Promise.all(
      settingsToUpdate.map(setting =>
        prisma.setting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            type: setting.type,
            updatedById: admin.id,
          },
          create: {
            key: setting.key,
            value: setting.value,
            type: setting.type,
            category: setting.category,
            description: setting.description,
            createdById: admin.id,
            updatedById: admin.id,
          }
        })
      )
    )

    // Log settings update
    await prisma.securityLog.create({
      data: {
        userId: admin.id,
        action: 'SETTINGS_UPDATED',
        details: `Settings updated: ${settingsToUpdate.map(s => s.key).join(', ')}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      updatedCount: updatedSettings.length
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Admin settings PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
