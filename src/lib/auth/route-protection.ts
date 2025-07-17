import { getCurrentUser } from './utils'
import type { User } from '@/types'

/**
 * Higher-order function for pages that should redirect authenticated users
 */
export function withGuestOnly<T extends Record<string, any>>(
  Component: React.ComponentType<T>
) {
  return async function GuestOnlyComponent(props: T) {
    const user = await getCurrentUser()
    
    if (user) {
      redirect('/dashboard')
    }
    
    return <Component {...props} />
  }
}

/**
 * Check if user has required permissions
 */
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false
  
  switch (permission) {
    case 'admin':
      return user.role === 'ADMIN'
    case 'user':
      return user.role === 'USER' || user.role === 'ADMIN'
    default:
      return false
  }
}

/**
 * Require authentication for API routes
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

/**
 * Require admin access for API routes
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required')
  }
  
  return user
}

/**
 * Check if user owns a resource
 */
export function isResourceOwner(user: User, resourceUserId: string): boolean {
  return user.id === resourceUserId || user.role === 'ADMIN'
}

/**
 * Rate limiting utility
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

/**
 * Clean up expired rate limit records
 */
export function cleanupRateLimit(): void {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

// Clean up rate limit records every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimit, 5 * 60 * 1000)
}
