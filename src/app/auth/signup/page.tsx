import { Metadata } from 'next'
import { SignUpForm } from '@/components/auth/signup-form'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sign Up - NusantaraHax',
  description: 'Create your NusantaraHax account',
}

export default async function SignUpPage() {
  const session = await getServerSession(authOptions)

  // Redirect if already signed in
  if (session) {
    redirect('/dashboard')
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
        
        <SignUpForm />
      </div>
    </div>
  )
}
