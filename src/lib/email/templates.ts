import { formatCurrency, formatDate } from '@/lib/utils'

interface OrderEmailData {
  customerName: string
  orderId: string
  total: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  licenses: Array<{
    productName: string
    licenseKey: string
    downloadUrl?: string
  }>
  orderDate: Date
}

export function generateOrderConfirmationEmail(data: OrderEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - NusantaraHax</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .order-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .order-info h3 {
            margin-top: 0;
            color: #495057;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th,
        .items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        .items-table th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .license-section {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #28a745;
        }
        .license-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            border: 1px solid #d4edda;
        }
        .license-key {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
            color: #155724;
            background: #f8f9fa;
            padding: 8px 12px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 5px;
        }
        .download-btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 10px;
            font-weight: 500;
        }
        .total {
            text-align: right;
            font-size: 18px;
            font-weight: bold;
            color: #495057;
            border-top: 2px solid #e9ecef;
            padding-top: 15px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
        }
        .support-info {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">NusantaraHax</div>
            <h2>Order Confirmation</h2>
            <p>Thank you for your purchase!</p>
        </div>

        <div class="order-info">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> #${data.orderId.slice(-8)}</p>
            <p><strong>Customer:</strong> ${data.customerName}</p>
            <p><strong>Order Date:</strong> ${formatDate(data.orderDate)}</p>
            <p><strong>Total Amount:</strong> ${formatCurrency(data.total)}</p>
        </div>

        <h3>Items Purchased</h3>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${formatCurrency(item.price * item.quantity)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="total">
            Total: ${formatCurrency(data.total)}
        </div>

        <div class="license-section">
            <h3>🎉 Your License Keys</h3>
            <p>Your gaming tools are ready! Here are your license keys:</p>
            
            ${data.licenses.map(license => `
            <div class="license-item">
                <h4>${license.productName}</h4>
                <p>License Key:</p>
                <div class="license-key">${license.licenseKey}</div>
                ${license.downloadUrl ? `
                <a href="${license.downloadUrl}" class="download-btn">Download Now</a>
                ` : ''}
            </div>
            `).join('')}
        </div>

        <div class="support-info">
            <h4>📱 How to Use Your License</h4>
            <ol>
                <li>Download the software from the provided links</li>
                <li>Install and run the application</li>
                <li>Enter your license key when prompted</li>
                <li>Enjoy your premium gaming tools!</li>
            </ol>
        </div>

        <div class="footer">
            <p>Need help? Contact us at <a href="mailto:support@nusantarahax.com">support@nusantarahax.com</a></p>
            <p>Visit your <a href="${process.env.NEXTAUTH_URL}/dashboard">dashboard</a> to manage your licenses</p>
            <p>&copy; 2024 NusantaraHax. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `
}

export function generatePaymentReminderEmail(data: {
  customerName: string
  orderId: string
  total: number
  paymentUrl?: string
  vaNumber?: string
  expiresAt: Date
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Reminder - NusantaraHax</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
        }
        .payment-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .va-number {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            color: #495057;
            background: white;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
            margin: 10px 0;
        }
        .pay-btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 500;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">NusantaraHax</div>
            <h2>Payment Reminder</h2>
        </div>

        <div class="warning">
            <h3>⏰ Payment Required</h3>
            <p>Your order is waiting for payment. Complete your payment before it expires!</p>
        </div>

        <div class="payment-info">
            <h3>Order Information</h3>
            <p><strong>Order ID:</strong> #${data.orderId.slice(-8)}</p>
            <p><strong>Customer:</strong> ${data.customerName}</p>
            <p><strong>Amount:</strong> ${formatCurrency(data.total)}</p>
            <p><strong>Expires:</strong> ${formatDate(data.expiresAt)}</p>
        </div>

        ${data.vaNumber ? `
        <div class="payment-info">
            <h3>Virtual Account Payment</h3>
            <p>Use this Virtual Account number to complete your payment:</p>
            <div class="va-number">${data.vaNumber}</div>
        </div>
        ` : ''}

        <div style="text-align: center;">
            ${data.paymentUrl ? `
            <a href="${data.paymentUrl}" class="pay-btn">Complete Payment</a>
            ` : `
            <a href="${process.env.NEXTAUTH_URL}/payment/instructions/${data.orderId}" class="pay-btn">View Payment Instructions</a>
            `}
        </div>

        <div class="footer">
            <p>Need help? Contact us at <a href="mailto:support@nusantarahax.com">support@nusantarahax.com</a></p>
            <p>&copy; 2024 NusantaraHax. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `
}
