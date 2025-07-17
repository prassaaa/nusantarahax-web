import { Metadata } from 'next'
import { SignInForm } from '@/components/auth/signin-form'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sign In - NusantaraHax',
  description: 'Sign in to your NusantaraHax account',
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const session = await getServerSession(authOptions)
  const params = await searchParams

  // Redirect if already signed in
  if (session) {
    redirect(params.callbackUrl || '/dashboard')
  }
  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="h-10 w-10 rounded-lg gradient-hero flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="text-2xl font-bold text-gradient">NusantaraHax</span>
          </Link>
        </div>
        
        <SignInForm
          callbackUrl={params.callbackUrl}
          error={params.error}
        />
      </div>
    </div>
  )
}
