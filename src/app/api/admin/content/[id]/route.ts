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

const updateContentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  type: z.enum(['TEXT', 'HTML', 'JSON', 'IMAGE']).optional(),
  category: z.string().optional(),
  isPublished: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
})

// GET /api/admin/content/[id] - Get single content item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`admin-content-get-${clientIP}`, 30, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    await requireAdminAPI()

    const contentId = params.id

    // Get content with detailed information
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        key: true,
        title: true,
        content: true,
        type: true,
        category: true,
        isPublished: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ content })

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

    console.error('Admin content GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/content/[id] - Update content
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`admin-content-update-${clientIP}`, 30, 60000)) {
      return NextResponse.json(
        { error: 'Too many update requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    const admin = await requireAdminAPI()

    const contentId = params.id

    // Check if content exists
    const existingContent = await prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true, key: true, title: true }
    })

    if (!existingContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = updateContentSchema.parse(body)

    // Update content
    const content = await prisma.content.update({
      where: { id: contentId },
      data: {
        ...validatedData,
        updatedById: admin.id,
      },
      select: {
        id: true,
        key: true,
        title: true,
        content: true,
        type: true,
        category: true,
        isPublished: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Log content update
    await prisma.securityLog.create({
      data: {
        userId: admin.id,
        action: 'CONTENT_UPDATED',
        details: `Content updated: ${content.title} (key: ${content.key}). Changes: ${JSON.stringify(validatedData)}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Content updated successfully',
      content
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

    console.error('Admin content PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/content/[id] - Delete content
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`admin-content-delete-${clientIP}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many delete requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    const admin = await requireAdminAPI()

    const contentId = params.id

    // Check if content exists
    const existingContent = await prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true, key: true, title: true }
    })

    if (!existingContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    // Delete content
    await prisma.content.delete({
      where: { id: contentId }
    })

    // Log content deletion
    await prisma.securityLog.create({
      data: {
        userId: admin.id,
        action: 'CONTENT_DELETED',
        details: `Content deleted: ${existingContent.title} (key: ${existingContent.key})`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
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

    console.error('Admin content DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
