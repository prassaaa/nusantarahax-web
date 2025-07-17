'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  Copy, 
  CreditCard, 
  Building2, 
  Wallet, 
  QrCode,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface PaymentInstructionsProps {
  order: {
    id: string
    status: string
    total: number
    paymentMethod: string
    paymentId?: string
    paymentData?: any
    items: Array<{
      id: string
      quantity: number
      price: number
      product: {
        id: string
        name: string
        images: any
        price: number
      }
    }>
  }
}

export function PaymentInstructions({ order }: PaymentInstructionsProps) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)

  const paymentData = order.paymentData || {}
  const expiryTime = paymentData.expiryTime ? new Date(paymentData.expiryTime) : null

  // Format currency
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  // Check payment status
  const checkPaymentStatus = async () => {
    setIsCheckingStatus(true)
    try {
      const response = await fetch(`/api/payment/status/${order.id}`)
      const data = await response.json()

      if (data.status === 'PAID') {
        toast.success('Payment confirmed!')
        router.push(`/payment/success/${order.id}`)
      } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
        router.push(`/payment/error/${order.id}`)
      } else {
        toast.info('Payment is still pending')
      }
    } catch (error) {
      console.error('Status check error:', error)
      toast.error('Failed to check payment status')
    } finally {
      setIsCheckingStatus(false)
    }
  }

  // Update countdown timer
  useEffect(() => {
    if (!expiryTime) return

    const updateTimer = () => {
      const now = new Date()
      const diff = expiryTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('Expired')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [expiryTime])

  // Get payment method icon and name
  const getPaymentMethodInfo = (method: string) => {
    const methodMap: Record<string, { icon: any, name: string, color: string }> = {
      'DUITKU_VA': { icon: Building2, name: 'Virtual Account', color: 'bg-blue-500' },
      'DUITKU_EWALLET': { icon: Wallet, name: 'E-Wallet', color: 'bg-green-500' },
      'DUITKU_QRIS': { icon: QrCode, name: 'QRIS', color: 'bg-purple-500' },
      'DUITKU_CREDIT_CARD': { icon: CreditCard, name: 'Credit Card', color: 'bg-orange-500' }
    }

    return methodMap[method] || { icon: CreditCard, name: method, color: 'bg-gray-500' }
  }

  const paymentMethodInfo = getPaymentMethodInfo(order.paymentMethod)
  const PaymentIcon = paymentMethodInfo.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Complete Your Payment
        </h1>
        <p className="text-gray-600">
          Order #{order.id}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Instructions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PaymentIcon className="h-5 w-5" />
                Payment Instructions
              </CardTitle>
              <CardDescription>
                Follow the steps below to complete your payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Amount */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount to Pay:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>

              {/* Timer */}
              {expiryTime && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex justify-between items-center">
                      <span>Payment expires in:</span>
                      <Badge variant={timeLeft === 'Expired' ? 'destructive' : 'secondary'}>
                        {timeLeft}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Virtual Account Instructions */}
              {order.paymentMethod === 'DUITKU_VA' && paymentData.vaNumber && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">Virtual Account Number:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {paymentData.vaNumber}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(paymentData.vaNumber, 'VA Number')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 space-y-2">
                    <p><strong>How to pay:</strong></p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Open your mobile banking or visit ATM</li>
                      <li>Select "Transfer" or "Virtual Account"</li>
                      <li>Enter the Virtual Account number above</li>
                      <li>Enter the exact amount: {formatPrice(order.total)}</li>
                      <li>Confirm and complete the transaction</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* E-Wallet Instructions */}
              {order.paymentMethod === 'DUITKU_EWALLET' && paymentData.paymentUrl && (
                <div className="space-y-3">
                  <Button
                    asChild
                    className="w-full"
                    size="lg"
                  >
                    <a 
                      href={paymentData.paymentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open E-Wallet App
                    </a>
                  </Button>

                  <div className="text-sm text-gray-600">
                    <p><strong>How to pay:</strong></p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Click the button above to open your e-wallet app</li>
                      <li>Confirm the payment details</li>
                      <li>Complete the payment in your app</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* QRIS Instructions */}
              {order.paymentMethod === 'DUITKU_QRIS' && (
                <div className="space-y-3">
                  <div className="text-center p-4 border rounded-lg">
                    <QrCode className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      QR Code will be displayed after payment creation
                    </p>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p><strong>How to pay:</strong></p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Open any e-wallet app that supports QRIS</li>
                      <li>Scan the QR code above</li>
                      <li>Confirm the payment amount</li>
                      <li>Complete the payment</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Mock Payment for Development */}
              {paymentData.mockPayment && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>Development Mode:</strong> This is a mock payment.</p>
                      <Button
                        onClick={() => router.push(`/payment/success/${order.id}`)}
                        size="sm"
                        className="w-full"
                      >
                        Simulate Successful Payment
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Check Status Button */}
              <Button
                onClick={checkPaymentStatus}
                disabled={isCheckingStatus}
                variant="outline"
                className="w-full"
              >
                {isCheckingStatus ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check Payment Status
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>
                Review your purchase details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <Image
                      src={typeof item.product.images === 'string' 
                        ? JSON.parse(item.product.images)[0] 
                        : item.product.images[0] || '/images/placeholder.jpg'
                      }
                      alt={item.product.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total:</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${paymentMethodInfo.color}`}>
                  <PaymentIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">{paymentMethodInfo.name}</p>
                  {order.paymentId && (
                    <p className="text-sm text-gray-500">
                      Ref: {order.paymentId}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
