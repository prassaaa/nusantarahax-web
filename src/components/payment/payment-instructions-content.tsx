'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Clock, 
  Copy, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  QrCode,
  Building2,
  Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MainLayout } from '@/components/layout/main-layout'
import { formatCurrency, copyToClipboard } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

interface PaymentInstructionsContentProps {
  orderId: string
}

interface OrderData {
  orderId: string
  status: string
  total: number
  paymentMethod: string
  createdAt: string
  paymentData: {
    paymentUrl?: string
    vaNumber?: string
    qrString?: string
    reference?: string
    paidAt?: string
  }
  items: Array<{
    id: string
    productName: string
    quantity: number
    price: number
  }>
}

export function PaymentInstructionsContent({ orderId }: PaymentInstructionsContentProps) {
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchOrderStatus = async () => {
    try {
      const response = await fetch(`/api/payment/status/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrderData(data)
      } else {
        toast.error('Failed to fetch order status')
      }
    } catch (error) {
      console.error('Error fetching order status:', error)
      toast.error('Failed to fetch order status')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOrderStatus()
    
    // Auto-refresh every 30 seconds if payment is pending
    const interval = setInterval(() => {
      if (orderData?.status === 'PENDING') {
        fetchOrderStatus()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [orderId, orderData?.status])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchOrderStatus()
  }

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      toast.success(`${label} copied to clipboard`)
    } else {
      toast.error('Failed to copy to clipboard')
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-background py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-gray-600">Loading payment instructions...</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!orderData) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-background py-8">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
              <p className="text-gray-600 mb-6">
                The order you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Button asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-500 text-white">Paid</Badge>
      case 'PENDING':
        return <Badge variant="secondary">Pending Payment</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentIcon = (method: string) => {
    if (method.includes('va') || method.includes('virtual')) {
      return <CreditCard className="h-5 w-5" />
    } else if (method.includes('qris')) {
      return <QrCode className="h-5 w-5" />
    } else if (method.includes('bank')) {
      return <Building2 className="h-5 w-5" />
    } else {
      return <Smartphone className="h-5 w-5" />
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Instructions</h1>
            <p className="text-gray-600">
              Complete your payment to receive your gaming tools instantly
            </p>
          </div>

          {/* Order Status */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  Order #{orderData.orderId.slice(-8)}
                  {getStatusBadge(orderData.status)}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(orderData.total)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <div className="flex items-center mt-1">
                    {getPaymentIcon(orderData.paymentMethod)}
                    <span className="ml-2 font-medium">{orderData.paymentMethod}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {orderData.status === 'PAID' ? (
            /* Payment Success */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-green-800 mb-2">
                    Payment Successful!
                  </h2>
                  <p className="text-green-700 mb-6">
                    Your payment has been confirmed. License keys have been sent to your email 
                    and are available in your dashboard.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button asChild>
                      <Link href="/dashboard">View Dashboard</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/products">Continue Shopping</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : orderData.status === 'FAILED' ? (
            /* Payment Failed */
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-800 mb-2">
                  Payment Failed
                </h2>
                <p className="text-red-700 mb-6">
                  Your payment could not be processed. Please try again or contact support.
                </p>
                <Button asChild>
                  <Link href="/checkout">Try Again</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Payment Instructions */
            <div className="space-y-6">
              {/* Payment Countdown */}
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Please complete your payment within 24 hours. 
                  After this time, the order will be automatically cancelled.
                </AlertDescription>
              </Alert>

              {/* Virtual Account Instructions */}
              {orderData.paymentData.vaNumber && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Virtual Account Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Virtual Account Number</p>
                          <p className="text-xl font-mono font-bold">
                            {orderData.paymentData.vaNumber}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(orderData.paymentData.vaNumber!, 'VA Number')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">How to Pay:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        <li>Open your mobile banking or visit ATM</li>
                        <li>Select "Transfer" or "Virtual Account"</li>
                        <li>Enter the Virtual Account number above</li>
                        <li>Enter amount: {formatCurrency(orderData.total)}</li>
                        <li>Confirm and complete the transaction</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* QRIS Instructions */}
              {orderData.paymentData.qrString && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <QrCode className="h-5 w-5 mr-2" />
                      QRIS Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="bg-white p-4 rounded-lg border inline-block">
                        {/* QR Code would be generated here */}
                        <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                          <QrCode className="h-16 w-16 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">How to Pay:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        <li>Open your e-wallet or mobile banking app</li>
                        <li>Select "Scan QR" or "QRIS"</li>
                        <li>Scan the QR code above</li>
                        <li>Verify amount: {formatCurrency(orderData.total)}</li>
                        <li>Complete the payment</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orderData.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(orderData.total)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
