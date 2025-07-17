import { getServerSession } from 'next-auth/next'
import { authOptions } from './config'
import { prisma } from '../db/prisma'
import { hash } from 'bcryptjs'

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  
  if (!session?.user?.email) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      createdAt: true,
    },
  })

  return user
}

export async function requireAuth() {
  const session = await getSession()
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  return session
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Admin access required')
  }
  
  return user
}

export async function createUser(data: {
  email: string
  name: string
  password: string
  role?: 'USER' | 'ADMIN'
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    throw new Error('User already exists')
  }

  const hashedPassword = await hash(data.password, 12)
  const userRole = data.role || 'USER'

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: userRole,
      // Auto-verify admin emails
      emailVerified: userRole === 'ADMIN' ? new Date() : null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  })

  // Send email verification only for non-admin users
  if (userRole !== 'ADMIN') {
    try {
      const { sendEmailVerification } = await import('@/lib/email/email-service')
      await sendEmailVerification(user.id, user.email, user.name)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail registration if email fails
    }
  }

  // Log security activity
  await prisma.securityLog.create({
    data: {
      userId: user.id,
      action: 'ACCOUNT_CREATED',
      details: 'New account registered',
    }
  })

  return user
}

export async function updateUserProfile(userId: string, data: {
  name?: string
  avatar?: string
}) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
    },
  })

  return user
}
