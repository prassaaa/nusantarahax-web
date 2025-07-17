'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Mail, 
  HelpCircle, 
  Phone, 
  ArrowLeft, 
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { MainLayout } from '@/components/layout/main-layout'
import { toast } from 'sonner'
import Link from 'next/link'

interface RecoveryOption {
  method: string
  name: string
  description: string
  available: boolean
}

export default function AccountRecoveryPage() {
  const [step, setStep] = useState<'email' | 'options' | 'processing' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('')
  const [recoveryOptions, setRecoveryOptions] = useState<RecoveryOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [referenceId, setReferenceId] = useState('')

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/auth/account-recovery?email=${encodeURIComponent(email)}`)
      
      if (response.ok) {
        const data = await response.json()
        setRecoveryOptions(data.availableOptions)
        setStep('options')
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to check recovery options')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMethod) {
      setError('Please select a recovery method')
      return
    }

    setIsLoading(true)
    setError('')
    setStep('processing')

    try {
      const response = await fetch('/api/auth/account-recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          method: selectedMethod
        })
      })

      const data = await response.json()

      if (response.ok) {
        if (data.referenceId) {
          setReferenceId(data.referenceId)
        }
        setStep('success')
        toast.success(data.message)
      } else {
        setError(data.error || 'Recovery process failed')
        setStep('options')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      setStep('options')
    } finally {
      setIsLoading(false)
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'email':
        return <Mail className="h-5 w-5" />
      case 'security_questions':
        return <HelpCircle className="h-5 w-5" />
      case 'admin_contact':
        return <Phone className="h-5 w-5" />
      default:
        return <Shield className="h-5 w-5" />
    }
  }

  const renderEmailStep = () => (
    <>
      <div className="text-center mb-6">
        <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Account Recovery</h3>
        <p className="text-gray-600 text-sm">
          Enter your email address to see available recovery options
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full gradient-button"
          disabled={isLoading || !email.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            'Check Recovery Options'
          )}
        </Button>
      </form>
    </>
  )

  const renderOptionsStep = () => (
    <>
      <div className="text-center mb-6">
        <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Recovery Options</h3>
        <p className="text-gray-600 text-sm">
          Choose how you&apos;d like to recover your account for <strong>{email}</strong>
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleRecoverySubmit} className="space-y-4">
        <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
          {recoveryOptions.map((option) => (
            <div
              key={option.method}
              className={`flex items-center space-x-3 p-4 border rounded-lg ${
                option.available 
                  ? 'hover:bg-gray-50 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed bg-gray-50'
              }`}
            >
              <RadioGroupItem 
                value={option.method} 
                id={option.method}
                disabled={!option.available}
              />
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 mt-1">
                  {getMethodIcon(option.method)}
                </div>
                <div className="flex-1">
                  <Label 
                    htmlFor={option.method}
                    className={`font-medium ${!option.available ? 'text-gray-500' : ''}`}
                  >
                    {option.name}
                    {!option.available && (
                      <span className="ml-2 text-xs text-gray-400">(Not Available)</span>
                    )}
                  </Label>
                  <p className={`text-sm mt-1 ${!option.available ? 'text-gray-400' : 'text-gray-600'}`}>
                    {option.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </RadioGroup>

        <div className="flex space-x-4">
          <Button
            type="submit"
            disabled={isLoading || !selectedMethod}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Start Recovery'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStep('email')
              setSelectedMethod('')
              setError('')
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </form>
    </>
  )

  const renderProcessingStep = () => (
    <div className="text-center py-12">
      <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
      <h3 className="text-lg font-semibold mb-2">Processing Recovery Request</h3>
      <p className="text-gray-600">
        Please wait while we process your account recovery request...
      </p>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      </motion.div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recovery Request Submitted</h3>
        <p className="text-gray-600">
          Your account recovery request has been processed successfully.
        </p>
        
        {referenceId && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Reference ID:</strong> {referenceId}
              <br />
              Please save this reference ID for your records.
            </AlertDescription>
          </Alert>
        )}

        {selectedMethod === 'email' && (
          <p className="text-sm text-gray-500">
            Please check your email for further instructions.
          </p>
        )}

        {selectedMethod === 'admin_contact' && (
          <p className="text-sm text-gray-500">
            Our support team will contact you within 24-48 hours.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <Button asChild className="w-full">
          <Link href="/auth/signin">Continue to Sign In</Link>
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => {
            setStep('email')
            setEmail('')
            setSelectedMethod('')
            setError('')
            setReferenceId('')
          }}
          className="w-full"
        >
          Start New Recovery
        </Button>
      </div>
    </div>
  )

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="text-2xl font-bold gradient-text">🎮 NusantaraHax</div>
                </div>
                Account Recovery
              </CardTitle>
            </CardHeader>
            <CardContent>
              {step === 'email' && renderEmailStep()}
              {step === 'options' && renderOptionsStep()}
              {step === 'processing' && renderProcessingStep()}
              {step === 'success' && renderSuccessStep()}

              {step !== 'success' && (
                <div className="mt-6 text-center">
                  <Button asChild variant="ghost">
                    <Link href="/auth/signin">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Sign In
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  )
}
