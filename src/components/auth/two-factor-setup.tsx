'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, QrCode, Key, Copy, Check, AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import Image from 'next/image'

interface TwoFactorSetupProps {
  isEnabled: boolean
  onStatusChange: (enabled: boolean) => void
}

interface SetupData {
  qrCodeUrl: string
  manualEntryKey: string
  backupCodes: string[]
  secret: string
}

export function TwoFactorSetup({ isEnabled, onStatusChange }: TwoFactorSetupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [showDisable, setShowDisable] = useState(false)
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [password, setPassword] = useState('')
  const [disableToken, setDisableToken] = useState('')
  const [copiedCodes, setCopiedCodes] = useState(false)

  const handleStartSetup = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/2fa/setup')
      if (response.ok) {
        const data = await response.json()
        setSetupData(data)
        setShowSetup(true)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to start 2FA setup')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteSetup = async () => {
    if (!setupData || !verificationCode) {
      toast.error('Please enter the verification code')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationCode,
          secret: setupData.secret,
          backupCodes: setupData.backupCodes
        })
      })

      if (response.ok) {
        toast.success('Two-factor authentication enabled successfully!')
        setShowSetup(false)
        setSetupData(null)
        setVerificationCode('')
        onStatusChange(true)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to enable 2FA')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!password || !disableToken) {
      toast.error('Please enter your password and verification code')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          token: disableToken
        })
      })

      if (response.ok) {
        toast.success('Two-factor authentication disabled successfully!')
        setShowDisable(false)
        setPassword('')
        setDisableToken('')
        onStatusChange(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to disable 2FA')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const copyBackupCodes = () => {
    if (setupData) {
      const codesText = setupData.backupCodes.join('\n')
      navigator.clipboard.writeText(codesText)
      setCopiedCodes(true)
      toast.success('Backup codes copied to clipboard')
      setTimeout(() => setCopiedCodes(false), 2000)
    }
  }

  const copyManualKey = () => {
    if (setupData) {
      navigator.clipboard.writeText(setupData.manualEntryKey)
      toast.success('Manual entry key copied to clipboard')
    }
  }

  if (showSetup && setupData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Set Up Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Scan QR Code */}
          <div>
            <h3 className="font-medium mb-3">Step 1: Scan QR Code</h3>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-48 h-48 border rounded-lg overflow-hidden bg-white p-2">
                  <Image
                    src={setupData.qrCodeUrl}
                    alt="2FA QR Code"
                    width={192}
                    height={192}
                    className="w-full h-full"
                  />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="space-y-2">
                  <Label>Manual Entry Key (if you can't scan)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={setupData.manualEntryKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyManualKey}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Backup Codes */}
          <div>
            <h3 className="font-medium mb-3">Step 2: Save Backup Codes</h3>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
              </AlertDescription>
            </Alert>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {setupData.backupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-white rounded border">
                    {code}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyBackupCodes}
                className="mt-3"
              >
                {copiedCodes ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All Codes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Step 3: Verify */}
          <div>
            <h3 className="font-medium mb-3">Step 3: Verify Setup</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="verification-code">Enter 6-digit code from your app</Label>
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="font-mono text-center text-lg"
                />
              </div>
              <div className="flex space-x-4">
                <Button
                  onClick={handleCompleteSetup}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {isLoading ? 'Verifying...' : 'Enable 2FA'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSetup(false)
                    setSetupData(null)
                    setVerificationCode('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (showDisable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <X className="h-5 w-5 mr-2" />
            Disable Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Disabling 2FA will make your account less secure. Make sure you understand the risks.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Current Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
              />
            </div>

            <div>
              <Label htmlFor="disable-token">Verification Code</Label>
              <Input
                id="disable-token"
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value)}
                placeholder="Enter code from your app or backup code"
                className="font-mono"
              />
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={handleDisable2FA}
                disabled={isLoading || !password || !disableToken}
                variant="destructive"
                className="flex-1"
              >
                {isLoading ? 'Disabling...' : 'Disable 2FA'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDisable(false)
                  setPassword('')
                  setDisableToken('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {isEnabled ? 'Enabled' : 'Disabled'}
            </p>
            <p className="text-sm text-gray-600">
              {isEnabled 
                ? 'Your account is protected with 2FA'
                : 'Add an extra layer of security to your account'
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
            {isEnabled ? (
              <Button
                variant="outline"
                onClick={() => setShowDisable(true)}
                disabled={isLoading}
              >
                Disable
              </Button>
            ) : (
              <Button
                onClick={handleStartSetup}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Enable 2FA'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
