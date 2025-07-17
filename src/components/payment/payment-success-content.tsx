'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Download, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/main-layout'
import Link from 'next/link'

export function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const [orderData, setOrderData] = useState<any>(null)
  const orderId = searchParams.get('merchantOrderId')

  useEffect(() => {
    if (orderId) {
      // Fetch order details
      fetch(`/api/payment/status/${orderId}`)
        .then(res => res.json())
        .then(data => setOrderData(data))
        .catch(err => console.error('Failed to fetch order:', err))
    }
  }, [orderId])

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
                </motion.div>
                
                <h1 className="text-3xl font-bold text-green-800 mb-4">
                  Payment Successful!
                </h1>
                
                <p className="text-green-700 mb-6 text-lg">
                  Thank you for your purchase! Your gaming tools are ready to use.
                </p>

                {orderData && (
                  <div className="bg-white p-4 rounded-lg mb-6">
                    <p className="text-sm text-gray-600 mb-2">Order ID</p>
                    <p className="font-mono font-bold text-lg">
                      #{orderData.orderId?.slice(-8)}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-green-700">
                    🎉 License keys have been sent to your email<br/>
                    📱 Access your tools from the dashboard<br/>
                    🔒 All downloads are secured and ready
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" asChild>
                      <Link href="/dashboard">
                        <Download className="h-5 w-5 mr-2" />
                        View Dashboard
                      </Link>
                    </Button>
                    
                    <Button variant="outline" size="lg" asChild>
                      <Link href="/products">
                        Continue Shopping
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm">
                Need help? Contact our support team at{' '}
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
