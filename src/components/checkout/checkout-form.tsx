'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/hooks/use-cart'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard, 
  Wallet, 
  QrCode, 
  Building2,
  Loader2,
  ShoppingBag,
  AlertTriangle
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'

type PaymentMethod = 'DUITKU_VA' | 'DUITKU_EWALLET' | 'DUITKU_QRIS' | 'DUITKU_CREDIT_CARD'

interface CheckoutData {
  paymentMethod: PaymentMethod
  customerInfo: {
    name: string
    email: string
    phone: string
  }
}

export function CheckoutForm() {
  const { data: session } = useSession()
  const { cart, isLoading: cartLoading, formatPrice } = useCart()
  const router = useRouter()
  
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    paymentMethod: 'DUITKU_VA',
    customerInfo: {
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      phone: ''
    }
  })
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update customer info when session changes
  useEffect(() => {
    if (session?.user) {
      setCheckoutData(prev => ({
        ...prev,
        customerInfo: {
          ...prev.customerInfo,
          name: session.user.name || '',
          email: session.user.email || ''
        }
      }))
    }
  }, [session])

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && (!cart || cart.items.length === 0)) {
      router.push('/products')
      toast.error('Your cart is empty')
    }
  }, [cart, cartLoading, router])

  const handleInputChange = (field: keyof CheckoutData['customerInfo'], value: string) => {
    setCheckoutData(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        [field]: value
      }
    }))
  }

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setCheckoutData(prev => ({
      ...prev,
      paymentMethod: method
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    // Validate form
    if (!checkoutData.customerInfo.name.trim()) {
      setError('Name is required')
      return
    }
    
    if (!checkoutData.customerInfo.email.trim()) {
      setError('Email is required')
      return
    }
    
    if (!checkoutData.customerInfo.phone.trim()) {
      setError('Phone number is required')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price
          })),
          paymentMethod: checkoutData.paymentMethod,
          customerInfo: checkoutData.customerInfo
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed')
      }

      // Create payment after successful checkout
      if (data.orderId) {
        const paymentResponse = await fetch('/api/payment/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: data.orderId,
            paymentMethod: checkoutData.paymentMethod
          }),
        })

        const paymentData = await paymentResponse.json()

        if (paymentResponse.ok) {
          // Redirect to payment instructions or external payment URL
          if (paymentData.paymentUrl && paymentData.paymentUrl.startsWith('http')) {
            window.location.href = paymentData.paymentUrl
          } else {
            router.push(`/payment/${data.orderId}`)
          }
        } else {
          throw new Error(paymentData.error || 'Payment creation failed')
        }
      }

    } catch (error) {
      console.error('Checkout error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  if (cartLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Customer Info & Payment Method */}
      <div className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Please provide your contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={checkoutData.customerInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={checkoutData.customerInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={checkoutData.customerInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              Choose your preferred payment method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={checkoutData.paymentMethod}
              onValueChange={handlePaymentMethodChange}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="DUITKU_VA" id="va" />
                <Label htmlFor="va" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="h-4 w-4" />
                  Virtual Account (Bank Transfer)
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="DUITKU_EWALLET" id="ewallet" />
                <Label htmlFor="ewallet" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Wallet className="h-4 w-4" />
                  E-Wallet (OVO, DANA, GoPay)
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="DUITKU_QRIS" id="qris" />
                <Label htmlFor="qris" className="flex items-center gap-2 cursor-pointer flex-1">
                  <QrCode className="h-4 w-4" />
                  QRIS (Scan to Pay)
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="DUITKU_CREDIT_CARD" id="credit" />
                <Label htmlFor="credit" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4" />
                  Credit/Debit Card
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Order Summary */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>
              Review your items before payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image
                    src={item.product.images[0] || '/images/placeholder.jpg'}
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
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
            
            <Separator />
            
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total:</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Proceed to Payment
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
