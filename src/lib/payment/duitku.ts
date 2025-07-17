import crypto from 'crypto'

// Duitku Configuration
const DUITKU_CONFIG = {
  merchantCode: process.env.DUITKU_MERCHANT_CODE || 'DS17715',
  apiKey: process.env.DUITKU_API_KEY || 'your-api-key',
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://passport.duitku.com/webapi/api/merchant' 
    : 'https://sandbox.duitku.com/webapi/api/merchant',
  callbackUrl: process.env.NEXTAUTH_URL + '/api/payment/callback',
  returnUrl: process.env.NEXTAUTH_URL + '/payment/success',
  errorUrl: process.env.NEXTAUTH_URL + '/payment/error',
}

// Payment Methods supported by Duitku
export const PAYMENT_METHODS = {
  // Bank Transfer
  'BT': { name: 'Bank Transfer', fee: 4000 },
  'BC': { name: 'BCA', fee: 4000 },
  'M2': { name: 'Mandiri', fee: 4000 },
  'BN': { name: 'BNI', fee: 4000 },
  'BR': { name: 'BRI', fee: 4000 },
  
  // Virtual Account
  'VA': { name: 'BCA Virtual Account', fee: 4000 },
  'M1': { name: 'Mandiri Virtual Account', fee: 4000 },
  'B1': { name: 'BNI Virtual Account', fee: 4000 },
  'I1': { name: 'BRI Virtual Account', fee: 4000 },
  
  // E-Wallet
  'OV': { name: 'OVO', fee: 0 },
  'DA': { name: 'DANA', fee: 0 },
  'GP': { name: 'GoPay', fee: 0 },
  'LA': { name: 'LinkAja', fee: 0 },
  
  // QRIS
  'NQ': { name: 'QRIS', fee: 0 },
}

export interface PaymentRequest {
  merchantOrderId: string
  paymentAmount: number
  paymentMethod: string
  productDetails: string
  customerVaName: string
  email: string
  phoneNumber: string
  itemDetails: Array<{
    name: string
    price: number
    quantity: number
  }>
  customerDetail: {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    billingAddress: {
      firstName: string
      lastName: string
      address: string
      city: string
      postalCode: string
      phone: string
      countryCode: string
    }
  }
}

export interface PaymentResponse {
  statusCode: string
  statusMessage: string
  reference: string
  paymentUrl: string
  vaNumber?: string
  qrString?: string
  amount: number
}

// Generate signature for Duitku API
function generateSignature(merchantCode: string, merchantOrderId: string, paymentAmount: number, apiKey: string): string {
  const signatureString = `${merchantCode}${merchantOrderId}${paymentAmount}${apiKey}`
  return crypto.createHash('md5').update(signatureString).digest('hex')
}

// Create payment transaction
export async function createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
  try {
    const signature = generateSignature(
      DUITKU_CONFIG.merchantCode,
      paymentData.merchantOrderId,
      paymentData.paymentAmount,
      DUITKU_CONFIG.apiKey
    )

    const requestBody = {
      merchantCode: DUITKU_CONFIG.merchantCode,
      paymentAmount: paymentData.paymentAmount,
      paymentMethod: paymentData.paymentMethod,
      merchantOrderId: paymentData.merchantOrderId,
      productDetails: paymentData.productDetails,
      customerVaName: paymentData.customerVaName,
      email: paymentData.email,
      phoneNumber: paymentData.phoneNumber,
      itemDetails: paymentData.itemDetails,
      customerDetail: paymentData.customerDetail,
      callbackUrl: DUITKU_CONFIG.callbackUrl,
      returnUrl: DUITKU_CONFIG.returnUrl,
      signature: signature,
      expiryPeriod: 1440 // 24 hours in minutes
    }

    const response = await fetch(`${DUITKU_CONFIG.baseUrl}/v2/inquiry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.statusCode !== '00') {
      throw new Error(result.statusMessage || 'Payment creation failed')
    }

    return {
      statusCode: result.statusCode,
      statusMessage: result.statusMessage,
      reference: result.reference,
      paymentUrl: result.paymentUrl,
      vaNumber: result.vaNumber,
      qrString: result.qrString,
      amount: result.amount
    }
  } catch (error) {
    console.error('Duitku payment creation error:', error)
    throw error
  }
}

// Verify callback signature
export function verifyCallback(
  merchantCode: string,
  amount: string,
  merchantOrderId: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHash('md5')
    .update(`${merchantCode}${amount}${merchantOrderId}${DUITKU_CONFIG.apiKey}`)
    .digest('hex')
  
  return signature === expectedSignature
}

// Check transaction status
export async function checkTransactionStatus(merchantOrderId: string) {
  try {
    const signature = crypto
      .createHash('md5')
      .update(`${DUITKU_CONFIG.merchantCode}${merchantOrderId}${DUITKU_CONFIG.apiKey}`)
      .digest('hex')

    const response = await fetch(`${DUITKU_CONFIG.baseUrl}/transactionStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantCode: DUITKU_CONFIG.merchantCode,
        merchantOrderId: merchantOrderId,
        signature: signature
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Transaction status check error:', error)
    throw error
  }
}

// Get available payment methods
export async function getPaymentMethods(amount: number) {
  try {
    const datetime = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const signature = crypto
      .createHash('md5')
      .update(`${DUITKU_CONFIG.merchantCode}${amount}${datetime}${DUITKU_CONFIG.apiKey}`)
      .digest('hex')

    const response = await fetch(`${DUITKU_CONFIG.baseUrl}/paymentmethod/getpaymentmethod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantcode: DUITKU_CONFIG.merchantCode,
        amount: amount,
        datetime: datetime,
        signature: signature
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.paymentFee || []
  } catch (error) {
    console.error('Get payment methods error:', error)
    return []
  }
}
