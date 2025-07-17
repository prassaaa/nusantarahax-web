import { getServerSession } from 'next-auth'
import { authOptions } from './config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'

/**
 * Server-side admin authentication check
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin')
  }

  // Get user with role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true
    }
  })

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard?error=access_denied')
  }

  return user
}

/**
 * API route admin authentication check
 */
export async function requireAdminAPI() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    if (!user || user.role !== 'ADMIN') {
      throw new Error('Admin access required')
    }

    return user
  } catch (error) {
    console.error('Admin API auth error:', error)
    throw error
  }
}

/**
 * Client-side admin check hook
 */
export function useAdminCheck() {
  // This would be implemented as a React hook
  // For now, we'll handle admin checks server-side
  return { isAdmin: false, isLoading: true }
}
