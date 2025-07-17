'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Mail, Lock, Shield, AlertTriangle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type SignInStep = 'credentials' | 'two-factor' | 'email-verification'

interface SignInState {
  step: SignInStep
  email: string
  password: string
  twoFactorCode: string
  rememberMe: boolean
  isLoading: boolean
  error: string
  requiresTwoFactor: boolean
  requiresEmailVerification: boolean
  userId?: string
}

interface SignInFormProps {
  callbackUrl?: string
  error?: string
}

export function SignInForm({ callbackUrl, error: urlError }: SignInFormProps) {
  const [state, setState] = useState<SignInState>({
    step: 'credentials',
    email: '',
    password: '',
    twoFactorCode: '',
    rememberMe: false,
    isLoading: false,
    error: '',
    requiresTwoFactor: false,
    requiresEmailVerification: false
  })

  const router = useRouter()
  const finalCallbackUrl = callbackUrl || '/dashboard'

  const updateState = (updates: Partial<SignInState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    updateState({ isLoading: true, error: '' })

    try {
      // First, check if user exists and get their 2FA status
      const userCheckResponse = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email })
      })

      if (userCheckResponse.ok) {
        const userData = await userCheckResponse.json()

        // Check if email is verified (skip for admin users)
        if (!userData.emailVerified && userData.role !== 'ADMIN') {
          updateState({
            requiresEmailVerification: true,
            step: 'email-verification',
            userId: userData.id
          })
          return
        }

        // Try to sign in with credentials
        const result = await signIn('credentials', {
          email: state.email,
          password: state.password,
          redirect: false,
        })

        if (result?.error) {
          updateState({ error: result.error })
          toast.error(result.error)
        } else {
          // Check if user has 2FA enabled
          if (userData.twoFactorEnabled) {
            updateState({
              requiresTwoFactor: true,
              step: 'two-factor',
              userId: userData.id
            })
          } else {
            // Success - redirect to dashboard
            await getSession()
            toast.success('Welcome back!')
            router.push(finalCallbackUrl)
            router.refresh()
          }
        }
      } else {
        const error = await userCheckResponse.json()
        updateState({ error: error.error || 'Invalid credentials' })
        toast.error(error.error || 'Invalid credentials')
      }
    } catch (error) {
      console.error('Credentials sign in error:', error)
      const errorMessage = 'An unexpected error occurred'
      updateState({ error: errorMessage })
      toast.error(errorMessage)
    } finally {
      updateState({ isLoading: false })
    }
  }

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    updateState({ isLoading: true, error: '' })

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: state.userId,
          token: state.twoFactorCode,
          email: state.email,
          password: state.password
        })
      })

      if (response.ok) {
        // 2FA verified, complete sign in
        await getSession()
        toast.success('Welcome back!')
        router.push(finalCallbackUrl)
        router.refresh()
      } else {
        const error = await response.json()
        updateState({ error: error.error || 'Invalid verification code' })
        toast.error(error.error || 'Invalid verification code')
      }
    } catch (error) {
      console.error('2FA verification error:', error)
      const errorMessage = 'An unexpected error occurred'
      updateState({ error: errorMessage })
      toast.error(errorMessage)
    } finally {
      updateState({ isLoading: false })
    }
  }

  const handleResendVerification = async () => {
    updateState({ isLoading: true })

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email })
      })

      if (response.ok) {
        toast.success('Verification email sent! Please check your inbox.')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send verification email')
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      updateState({ isLoading: false })
    }
  }

  const handleSocialSignIn = async (provider: string) => {
    updateState({ isLoading: true })
    try {
      await signIn(provider, { callbackUrl })
    } catch (error) {
      console.error('Social sign in error:', error)
      const errorMessage = 'Social sign in failed'
      updateState({ error: errorMessage })
      toast.error(errorMessage)
      updateState({ isLoading: false })
    }
  }

  const resetToCredentials = () => {
    updateState({
      step: 'credentials',
      twoFactorCode: '',
      error: '',
      requiresTwoFactor: false,
      requiresEmailVerification: false
    })
  }

  const renderCredentialsStep = () => (
    <>
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleCredentialsSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={state.email}
              onChange={(e) => updateState({ email: e.target.value })}
              className="pl-10"
              required
              disabled={state.isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={state.password}
              onChange={(e) => updateState({ password: e.target.value })}
              className="pl-10"
              required
              disabled={state.isLoading}
            />
          </div>
          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={state.rememberMe}
            onCheckedChange={(checked) => updateState({ rememberMe: checked as boolean })}
          />
          <Label htmlFor="remember" className="text-sm">
            Remember me for 30 days
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full gradient-button"
          disabled={state.isLoading}
        >
          {state.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => handleSocialSignIn('google')}
          disabled={state.isLoading}
        >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
        <Button
          variant="outline"
          onClick={() => handleSocialSignIn('github')}
          disabled={state.isLoading}
        >
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
            </svg>
            GitHub
          </Button>
        <Button
          variant="outline"
          onClick={() => handleSocialSignIn('discord')}
          disabled={state.isLoading}
        >
          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          Discord
        </Button>
      </div>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don&apos;t have an account? </span>
        <Link
          href="/auth/signup"
          className="text-primary hover:underline font-medium"
        >
          Sign up
        </Link>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        <p>Demo credentials:</p>
        <p>Email: admin@nusantarahax.com</p>
        <p>Password: password123</p>
      </div>
    </>
  )

  const renderTwoFactorStep = () => (
    <>
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="text-center mb-6">
        <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
        <p className="text-sm text-gray-600">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="twoFactorCode">Verification Code</Label>
          <Input
            id="twoFactorCode"
            value={state.twoFactorCode}
            onChange={(e) => updateState({ twoFactorCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            placeholder="123456"
            maxLength={6}
            className="text-center text-lg font-mono"
            required
            disabled={state.isLoading}
          />
          <p className="text-xs text-gray-500">
            You can also use a backup code if you don&apos;t have access to your authenticator app
          </p>
        </div>

        <div className="flex space-x-4">
          <Button
            type="submit"
            disabled={state.isLoading || state.twoFactorCode.length < 6}
            className="flex-1"
          >
            {state.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Sign In'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={resetToCredentials}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </form>
    </>
  )

  const renderEmailVerificationStep = () => (
    <>
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="text-center mb-6">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Email Verification Required</h3>
        <p className="text-sm text-gray-600">
          Please verify your email address before signing in
        </p>
      </div>

      <div className="space-y-4">
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            We&apos;ve sent a verification email to <strong>{state.email}</strong>.
            Please check your inbox and click the verification link.
          </AlertDescription>
        </Alert>

        <div className="flex space-x-4">
          <Button
            onClick={handleResendVerification}
            disabled={state.isLoading}
            className="flex-1"
          >
            {state.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend Email'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={resetToCredentials}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {state.step === 'credentials' && 'Welcome Back'}
          {state.step === 'two-factor' && 'Two-Factor Authentication'}
          {state.step === 'email-verification' && 'Email Verification'}
        </CardTitle>
        <CardDescription>
          {state.step === 'credentials' && 'Sign in to your NusantaraHax account'}
          {state.step === 'two-factor' && 'Enter your verification code to continue'}
          {state.step === 'email-verification' && 'Verify your email to access your account'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.step === 'credentials' && renderCredentialsStep()}
        {state.step === 'two-factor' && renderTwoFactorStep()}
        {state.step === 'email-verification' && renderEmailVerificationStep()}
      </CardContent>
    </Card>
  )
}
