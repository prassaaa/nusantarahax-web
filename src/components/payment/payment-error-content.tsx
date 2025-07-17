'use client'

import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/main-layout'
import Link from 'next/link'

export function PaymentErrorContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('merchantOrderId')
  const errorMessage = searchParams.get('message')

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <AlertCircle className="h-20 w-20 text-red-500 mx-auto mb-6" />
                </motion.div>
                
                <h1 className="text-3xl font-bold text-red-800 mb-4">
                  Payment Failed
                </h1>
                
                <p className="text-red-700 mb-6 text-lg">
                  We couldn't process your payment. Please try again or contact support.
                </p>

                {orderId && (
                  <div className="bg-white p-4 rounded-lg mb-6">
                    <p className="text-sm text-gray-600 mb-2">Order ID</p>
                    <p className="font-mono font-bold text-lg">
                      #{orderId.slice(-8)}
                    </p>
                  </div>
                )}

                {errorMessage && (
                  <div className="bg-red-100 p-4 rounded-lg mb-6">
                    <p className="text-sm text-red-800">
                      <strong>Error:</strong> {errorMessage}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-red-700 text-sm">
                    Common reasons for payment failure:<br/>
                    • Insufficient balance<br/>
                    • Network connection issues<br/>
                    • Payment method temporarily unavailable<br/>
                    • Transaction timeout
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" asChild>
                      <Link href="/checkout">
                        <RefreshCw className="h-5 w-5 mr-2" />
                        Try Again
                      </Link>
                    </Button>
                    
                    <Button variant="outline" size="lg" asChild>
                      <Link href="/cart">
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Cart
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm">
                Still having issues? Contact our support team at{' '}
                <a href="mailto:support@nusantarahax.com" className="text-primary hover:underline">
                  support@nusantarahax.com
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  )
}
