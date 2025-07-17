import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { hash } from 'bcryptjs'

// This is a one-time setup endpoint to create the first admin user
// In production, this should be removed or protected with a secret key
export async function POST(request: NextRequest) {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 400 }
      )
    }

    // Create admin user
    const hashedPassword = await hash('admin123', 12)
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@nusantarahax.com',
        name: 'Admin NusantaraHax',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(), // Auto-verify admin email
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    // Log admin creation
    await prisma.securityLog.create({
      data: {
        userId: admin.id,
        action: 'ADMIN_ACCOUNT_CREATED',
        details: 'Admin account created via setup endpoint'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    })

  } catch (error) {
    console.error('Create admin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
