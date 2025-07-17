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

const contentSchema = z.object({
  key: z.string().min(1, 'Content key is required'),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['TEXT', 'HTML', 'JSON', 'IMAGE']).default('TEXT'),
  category: z.string().optional(),
  isPublished: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
})

const updateContentSchema = contentSchema.partial().omit({ key: true })

const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
  type: z.enum(['TEXT', 'HTML', 'JSON', 'IMAGE', 'all']).optional().default('all'),
  category: z.string().optional(),
  status: z.enum(['published', 'draft', 'all']).optional().default('all'),
  sortBy: z.enum(['title', 'key', 'createdAt', 'updatedAt']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// GET /api/admin/content - List content with pagination and filters
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`admin-content-${clientIP}`, 60, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    await requireAdminAPI()

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const { page, limit, search, type, category, status, sortBy, sortOrder } = querySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      type: searchParams.get('type'),
      category: searchParams.get('category'),
      status: searchParams.get('status'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    })

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { key: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (type !== 'all') {
      where.type = type
    }

    if (category) {
      where.category = category
    }

    if (status !== 'all') {
      where.isPublished = status === 'published'
    }

    // Get total count
    const totalCount = await prisma.content.count({ where })

    // Get content with pagination
    const content = await prisma.content.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
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

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      content,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit
      }
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
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Admin content GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/content - Create new content
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`admin-create-content-${clientIP}`, 20, 60000)) {
      return NextResponse.json(
        { error: 'Too many create requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    const admin = await requireAdminAPI()

    // Validate request body
    const body = await request.json()
    const validatedData = contentSchema.parse(body)

    // Check if content key already exists
    const existingContent = await prisma.content.findUnique({
      where: { key: validatedData.key }
    })

    if (existingContent) {
      return NextResponse.json(
        { error: 'Content with this key already exists' },
        { status: 400 }
      )
    }

    // Create content
    const content = await prisma.content.create({
      data: {
        ...validatedData,
        createdById: admin.id,
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
        }
      }
    })

    // Log content creation
    await prisma.securityLog.create({
      data: {
        userId: admin.id,
        action: 'CONTENT_CREATED',
        details: `Content created: ${content.title} (key: ${content.key})`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Content created successfully',
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
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Admin content POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
