import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import { compare } from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          // Validate input
          const { email, password } = loginSchema.parse(credentials)

          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              avatar: true,
              emailVerified: true,
              twoFactorEnabled: true,
            }
          })

          if (!user || !user.password) {
            return null
          }

          // Verify password
          const isPasswordValid = await compare(password, user.password)
          if (!isPasswordValid) {
            return null
          }

          // Log successful login
          await prisma.securityLog.create({
            data: {
              userId: user.id,
              action: 'LOGIN_SUCCESS',
              details: `User logged in successfully`,
              ipAddress: 'unknown', // Will be set by middleware
            }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            emailVerified: user.emailVerified,
            twoFactorEnabled: user.twoFactorEnabled,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
        token.avatar = user.avatar
        token.emailVerified = user.emailVerified
        token.twoFactorEnabled = user.twoFactorEnabled
      }

      // Update session
      if (trigger === 'update' && session) {
        token.name = session.name
        token.avatar = session.avatar
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.avatar = token.avatar as string
        session.user.emailVerified = token.emailVerified as Date
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
      }

      return session
    },
    async signIn({ user, account, profile }) {
      // Allow sign in
      return true
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (user.id) {
        await prisma.securityLog.create({
          data: {
            userId: user.id,
            action: 'SIGNIN_EVENT',
            details: `User signed in via ${account?.provider || 'credentials'}`,
          }
        })
      }
    },
    async signOut({ session, token }) {
      if (token?.id) {
        await prisma.securityLog.create({
          data: {
            userId: token.id as string,
            action: 'SIGNOUT_EVENT',
            details: 'User signed out',
          }
        })
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
