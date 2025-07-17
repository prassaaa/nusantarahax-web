'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, CreditCard, User, MapPin, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCart } from '@/hooks/use-cart'
import { formatCurrency } from '@/lib/utils'
import { MainLayout } from '@/components/layout/main-layout'
import Link from 'next/link'
import { CustomerInfoForm } from './customer-info-form'
import { PaymentMethodForm } from './payment-method-form'
import { OrderSummary } from './order-summary'
import type { User } from '@/types'

interface CheckoutPageContentProps {
  user: User
}

export type CheckoutStep = 'customer-info' | 'payment' | 'review'

export interface CheckoutData {
  customerInfo: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  paymentMethod: {
    method: string
    provider?: string
  }
}

export function CheckoutPageContent({ user }: CheckoutPageContentProps) {
  const { cartItems, cartSummary, isEmpty, discountCode, discountAmount, clearCart } = useCart()
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('customer-info')
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    customerInfo: {
      name: user.name || '',
      email: user.email || '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Indonesia'
    },
    paymentMethod: {
      method: ''
    }
  })

  // Redirect if cart is empty
  if (isEmpty) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-background py-8">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Your cart is empty
              </h1>
              <p className="text-gray-600 mb-8">
                Add some gaming tools to your cart before checkout
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

  const steps = [
    { id: 'customer-info', title: 'Customer Info', icon: User },
    { id: 'payment', title: 'Payment', icon: CreditCard },
    { id: 'review', title: 'Review', icon: Shield }
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)

  const handleNext = () => {
    if (currentStep === 'customer-info') {
      setCurrentStep('payment')
    } else if (currentStep === 'payment') {
      setCurrentStep('review')
    }
  }

  const handleBack = () => {
    if (currentStep === 'payment') {
      setCurrentStep('customer-info')
    } else if (currentStep === 'review') {
      setCurrentStep('payment')
    }
  }

  const handleCompleteOrder = async () => {
    setIsProcessing(true)

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems,
          customerInfo: checkoutData.customerInfo,
          paymentMethod: checkoutData.paymentMethod,
          total: cartSummary.total,
          discountCode,
          discountAmount
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create payment')
      }

      // Clear cart after successful order creation
      clearCart()

      // Redirect to payment page or show payment instructions
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl
      } else {
        // For VA or QRIS, redirect to payment instructions page
        window.location.href = `/payment/instructions/${result.orderId}`
      }

    } catch (error) {
      console.error('Order creation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create order')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-background py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
              <p className="text-gray-600">
                Complete your purchase of {cartSummary.itemsCount} item{cartSummary.itemsCount !== 1 ? 's' : ''}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/cart">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cart
              </Link>
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStepIndex
                const isCompleted = index < currentStepIndex
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors
                        ${isActive ? 'bg-primary border-primary text-white' : 
                          isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                          'bg-white border-gray-300 text-gray-400'}
                      `}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`mt-2 text-sm font-medium ${
                        isActive ? 'text-primary' : 
                        isCompleted ? 'text-green-600' : 
                        'text-gray-500'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-0.5 mx-4 ${
                        index < currentStepIndex ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 'customer-info' && (
                  <CustomerInfoForm
                    data={checkoutData.customerInfo}
                    onChange={(data) => setCheckoutData(prev => ({ ...prev, customerInfo: data }))}
                    onNext={handleNext}
                  />
                )}
                
                {currentStep === 'payment' && (
                  <PaymentMethodForm
                    data={checkoutData.paymentMethod}
                    onChange={(data) => setCheckoutData(prev => ({ ...prev, paymentMethod: data }))}
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}
                
                {currentStep === 'review' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Review Your Order</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Customer Info Review */}
                        <div>
                          <h3 className="font-semibold mb-2">Customer Information</h3>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                            <p><strong>Name:</strong> {checkoutData.customerInfo.name}</p>
                            <p><strong>Email:</strong> {checkoutData.customerInfo.email}</p>
                            <p><strong>Phone:</strong> {checkoutData.customerInfo.phone}</p>
                            <p><strong>Address:</strong> {checkoutData.customerInfo.address}</p>
                            <p><strong>City:</strong> {checkoutData.customerInfo.city}, {checkoutData.customerInfo.postalCode}</p>
                          </div>
                        </div>

                        {/* Payment Method Review */}
                        <div>
                          <h3 className="font-semibold mb-2">Payment Method</h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p><strong>Method:</strong> {checkoutData.paymentMethod.method}</p>
                            {checkoutData.paymentMethod.provider && (
                              <p><strong>Provider:</strong> {checkoutData.paymentMethod.provider}</p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-4">
                          <Button variant="outline" onClick={handleBack}>
                            Back to Payment
                          </Button>
                          <Button
                            className="flex-1 gradient-button text-white border-0"
                            size="lg"
                            onClick={handleCompleteOrder}
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Processing...' : `Complete Order - ${formatCurrency(cartSummary.total)}`}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Order Summary Sidebar */}
            <div>
              <OrderSummary />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
