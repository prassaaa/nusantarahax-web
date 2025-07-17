import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/checkout',
  '/payment',
  '/api/payment',
  '/api/user',
  '/api/orders',
  '/api/licenses'
]

// Define admin-only routes
const adminRoutes = [
  '/admin',
  '/api/admin'
]

// Define public routes that should redirect authenticated users
const publicRoutes = [
  '/auth/signin',
  '/auth/signup'
]

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    const isAuthenticated = !!token
    const isAdmin = token?.role === 'ADMIN'

    // Allow create-admin endpoint for initial setup
    if (pathname === '/api/admin/create-admin') {
      return NextResponse.next()
    }

    // Handle public routes - redirect authenticated users to dashboard
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      return NextResponse.next()
    }

    // Handle admin routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/dashboard?error=access_denied', req.url))
      }
      return NextResponse.next()
    }

    // Handle API routes
    if (pathname.startsWith('/api/')) {
      // Skip NextAuth API routes
      if (pathname.startsWith('/api/auth/')) {
        return NextResponse.next()
      }

      // Admin API routes
      if (adminRoutes.some(route => pathname.startsWith(route))) {
        if (!isAuthenticated) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }

        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          )
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Always allow NextAuth API routes
        if (pathname.startsWith('/api/auth/')) return true

        // Allow create-admin endpoint for initial setup
        if (pathname === '/api/admin/create-admin') return true

        // Allow public pages
        if (pathname === '/') return true
        if (pathname.startsWith('/products')) return true
        if (pathname.startsWith('/categories')) return true
        if (pathname.startsWith('/about')) return true
        if (pathname.startsWith('/contact')) return true
        if (pathname.startsWith('/auth/')) return true

        // Protected routes require authentication
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          return !!token
        }

        // Admin routes require admin role
        if (adminRoutes.some(route => pathname.startsWith(route))) {
          return !!token && token.role === 'ADMIN'
        }

        // Default allow
        return true
      },
    },
  }
)

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
