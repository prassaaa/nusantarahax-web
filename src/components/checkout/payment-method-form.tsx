'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { CreditCard, Smartphone, Building2, Wallet } from 'lucide-react'
import Image from 'next/image'

interface PaymentMethod {
  method: string
  provider?: string
}

interface PaymentMethodFormProps {
  data: PaymentMethod
  onChange: (data: PaymentMethod) => void
  onNext: () => void
  onBack: () => void
}

const paymentMethods = [
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Transfer via ATM, Internet Banking, atau Mobile Banking',
    icon: Building2,
    providers: [
      { id: 'bca', name: 'BCA', logo: '/images/banks/bca.png' },
      { id: 'mandiri', name: 'Mandiri', logo: '/images/banks/mandiri.png' },
      { id: 'bni', name: 'BNI', logo: '/images/banks/bni.png' },
      { id: 'bri', name: 'BRI', logo: '/images/banks/bri.png' },
    ]
  },
  {
    id: 'e_wallet',
    name: 'E-Wallet',
    description: 'Bayar dengan dompet digital favorit Anda',
    icon: Wallet,
    providers: [
      { id: 'gopay', name: 'GoPay', logo: '/images/ewallet/gopay.png' },
      { id: 'ovo', name: 'OVO', logo: '/images/ewallet/ovo.png' },
      { id: 'dana', name: 'DANA', logo: '/images/ewallet/dana.png' },
      { id: 'linkaja', name: 'LinkAja', logo: '/images/ewallet/linkaja.png' },
    ]
  },
  {
    id: 'virtual_account',
    name: 'Virtual Account',
    description: 'Bayar melalui ATM atau Mobile Banking dengan nomor VA',
    icon: CreditCard,
    providers: [
      { id: 'bca_va', name: 'BCA Virtual Account', logo: '/images/banks/bca.png' },
      { id: 'mandiri_va', name: 'Mandiri Virtual Account', logo: '/images/banks/mandiri.png' },
      { id: 'bni_va', name: 'BNI Virtual Account', logo: '/images/banks/bni.png' },
      { id: 'bri_va', name: 'BRI Virtual Account', logo: '/images/banks/bri.png' },
    ]
  },
  {
    id: 'qris',
    name: 'QRIS',
    description: 'Scan QR code dengan aplikasi mobile banking atau e-wallet',
    icon: Smartphone,
    providers: []
  }
]

export function PaymentMethodForm({ data, onChange, onNext, onBack }: PaymentMethodFormProps) {
  const [selectedMethod, setSelectedMethod] = useState(data.method)
  const [selectedProvider, setSelectedProvider] = useState(data.provider || '')

  const handleMethodChange = (method: string) => {
    setSelectedMethod(method)
    setSelectedProvider('')
    onChange({ method, provider: '' })
  }

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider)
    onChange({ method: selectedMethod, provider })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedMethod) {
      onNext()
    }
  }

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <RadioGroup value={selectedMethod} onValueChange={handleMethodChange}>
            {paymentMethods.map((method) => {
              const Icon = method.icon
              return (
                <div key={method.id} className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                      </div>
                    </Label>
                  </div>

                  {/* Provider Selection */}
                  {selectedMethod === method.id && method.providers.length > 0 && (
                    <div className="ml-8 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Choose Provider:</p>
                      <RadioGroup value={selectedProvider} onValueChange={handleProviderChange}>
                        <div className="grid grid-cols-2 gap-3">
                          {method.providers.map((provider) => (
                            <div key={provider.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                              <RadioGroupItem value={provider.id} id={provider.id} />
                              <Label htmlFor={provider.id} className="flex-1 cursor-pointer">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                    {/* Placeholder for bank/ewallet logos */}
                                    <span className="text-xs font-bold">
                                      {provider.name.substring(0, 2)}
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium">{provider.name}</span>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </div>
              )
            })}
          </RadioGroup>

          {/* Payment Info */}
          {selectedMethod && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Payment Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Payment will be processed securely through Duitku</li>
                <li>• You will receive payment instructions after placing your order</li>
                <li>• License keys will be delivered automatically after payment confirmation</li>
                <li>• Payment must be completed within 24 hours</li>
              </ul>
            </div>
          )}

          <div className="flex space-x-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Back to Customer Info
            </Button>
            <Button 
              type="submit" 
              className="flex-1 gradient-button text-white border-0"
              disabled={!selectedMethod || (selectedMethodData?.providers.length > 0 && !selectedProvider)}
            >
              Review Order
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
