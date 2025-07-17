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

const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Name too long').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  image: z.string().url('Invalid image URL').optional(),
  features: z.array(z.string()).optional(),
  downloadUrl: z.string().url('Invalid download URL').optional(),
  isActive: z.boolean().optional(),
  stock: z.number().int().min(0, 'Stock must be non-negative').optional(),
})

// GET /api/admin/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`admin-product-get-${clientIP}`, 30, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    await requireAdminAPI()

    const productId = params.id

    // Get product with related data
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        image: true,
        features: true,
        downloadUrl: true,
        isActive: true,
        stock: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orderItems: true,
            reviews: true
          }
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                avatar: true
              }
            }
          }
        },
        orderItems: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            quantity: true,
            price: true,
            createdAt: true,
            order: {
              select: {
                id: true,
                status: true,
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })

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

    console.error('Admin product GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`admin-product-update-${clientIP}`, 20, 60000)) {
      return NextResponse.json(
        { error: 'Too many update requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    const admin = await requireAdminAPI()

    const productId = params.id

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)

    // Update product
    const product = await prisma.product.update({
      where: { id: productId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        image: true,
        features: true,
        downloadUrl: true,
        isActive: true,
        stock: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Log product update
    await prisma.securityLog.create({
      data: {
        userId: admin.id,
        action: 'PRODUCT_UPDATED',
        details: `Product updated: ${product.name} (ID: ${product.id})`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product
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

    console.error('Admin product PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown'
    if (!rateLimit(`admin-product-delete-${clientIP}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many delete requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    const admin = await requireAdminAPI()

    const productId = params.id

    // Check if product exists and get related data
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            orderItems: true
          }
        }
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if product has orders (prevent deletion if it has orders)
    if (existingProduct._count.orderItems > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing orders. Consider deactivating instead.' },
        { status: 400 }
      )
    }

    // Delete product (this will cascade delete reviews due to schema)
    await prisma.product.delete({
      where: { id: productId }
    })

    // Log product deletion
    await prisma.securityLog.create({
      data: {
        userId: admin.id,
        action: 'PRODUCT_DELETED',
        details: `Product deleted: ${existingProduct.name} (ID: ${existingProduct.id})`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
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

    console.error('Admin product DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
