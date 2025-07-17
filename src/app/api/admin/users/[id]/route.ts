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

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  emailVerified: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
})

// GET /api/admin/users/[id] - Get single user with detailed information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`admin-user-get-${clientIP}`, 30, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    await requireAdminAPI()

    const userId = params.id

    // Get user with detailed information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
            securityLogs: true
          }
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                quantity: true,
                price: true,
                product: {
                  select: {
                    name: true,
                    image: true
                  }
                }
              }
            }
          }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            product: {
              select: {
                name: true,
                image: true
              }
            }
          }
        },
        securityLogs: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            details: true,
            ipAddress: true,
            createdAt: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })

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

    console.error('Admin user GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`admin-user-update-${clientIP}`, 20, 60000)) {
      return NextResponse.json(
        { error: 'Too many update requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    const admin = await requireAdminAPI()

    const userId = params.id

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin from demoting themselves
    if (userId === admin.id && existingUser.role === 'ADMIN') {
      const body = await request.json()
      if (body.role && body.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Cannot change your own admin role' },
          { status: 400 }
        )
      }
    }

    // Validate request body
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Check email uniqueness if email is being updated
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.email) updateData.email = validatedData.email
    if (validatedData.role) updateData.role = validatedData.role
    if (validatedData.twoFactorEnabled !== undefined) {
      updateData.twoFactorEnabled = validatedData.twoFactorEnabled
      // If disabling 2FA, also clear the secret and backup codes
      if (!validatedData.twoFactorEnabled) {
        updateData.twoFactorSecret = null
        updateData.backupCodes = null
      }
    }
    if (validatedData.emailVerified !== undefined) {
      updateData.emailVerified = validatedData.emailVerified ? new Date() : null
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Log user update
    await prisma.securityLog.create({
      data: {
        userId: admin.id,
        action: 'USER_UPDATED_BY_ADMIN',
        details: `User updated by admin: ${user.name} (${user.email}). Changes: ${JSON.stringify(validatedData)}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user
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

    console.error('Admin user PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete user (soft delete or hard delete based on orders)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`admin-user-delete-${clientIP}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many delete requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check admin authentication
    const admin = await requireAdminAPI()

    const userId = params.id

    // Prevent admin from deleting themselves
    if (userId === admin.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists and get related data
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        }
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has orders or reviews (prevent deletion if they do)
    if (existingUser._count.orders > 0 || existingUser._count.reviews > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete user with existing orders or reviews. Consider deactivating the account instead.',
          hasOrders: existingUser._count.orders > 0,
          hasReviews: existingUser._count.reviews > 0
        },
        { status: 400 }
      )
    }

    // Delete user (this will cascade delete security logs due to schema)
    await prisma.user.delete({
      where: { id: userId }
    })

    // Log user deletion
    await prisma.securityLog.create({
      data: {
        userId: admin.id,
        action: 'USER_DELETED_BY_ADMIN',
        details: `User deleted by admin: ${existingUser.name} (${existingUser.email}) with role ${existingUser.role}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
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

    console.error('Admin user DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
