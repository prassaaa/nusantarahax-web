'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Eye, 
  CreditCard, 
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
  }
}

interface Order {
  id: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  total: number
  paymentMethod: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

export function OrderHistory() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/dashboard/orders')
        if (response.ok) {
          const data = await response.json()
          setOrders(data.orders)
        } else {
          toast.error('Failed to load orders')
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error)
        toast.error('Failed to load orders')
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchOrders()
    }
  }, [session])

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      PENDING: { 
        variant: 'secondary' as const, 
        icon: Clock, 
        label: 'Pending' 
      },
      PAID: { 
        variant: 'default' as const, 
        icon: CheckCircle, 
        label: 'Paid' 
      },
      FAILED: { 
        variant: 'destructive' as const, 
        icon: XCircle, 
        label: 'Failed' 
      },
      CANCELLED: { 
        variant: 'outline' as const, 
        icon: XCircle, 
        label: 'Cancelled' 
      },
      REFUNDED: { 
        variant: 'outline' as const, 
        icon: AlertTriangle, 
        label: 'Refunded' 
      }
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPaymentMethodName = (method: string): string => {
    const methodMap: Record<string, string> = {
      'DUITKU_VA': 'Virtual Account',
      'DUITKU_EWALLET': 'E-Wallet',
      'DUITKU_QRIS': 'QRIS',
      'DUITKU_CREDIT_CARD': 'Credit Card'
    }
    return methodMap[method] || method
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <CreditCard className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No orders yet
        </h3>
        <p className="text-gray-500 mb-4">
          Start shopping to see your order history here
        </p>
        <Button asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">
                  #{order.id.slice(-8)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {order.items.slice(0, 2).map((item) => (
                      <div key={item.id} className="text-sm">
                        {item.product.name} 
                        {item.quantity > 1 && (
                          <span className="text-gray-500"> x{item.quantity}</span>
                        )}
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="text-sm text-gray-500">
                        +{order.items.length - 2} more items
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(order.status)}
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {getPaymentMethodName(order.paymentMethod)}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  {formatPrice(order.total)}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {order.status === 'PENDING' && (
                        <DropdownMenuItem asChild>
                          <Link href={`/payment/${order.id}`}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Complete Payment
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {order.status === 'PAID' && (
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/licenses?order=${order.id}`}>
                            <Download className="mr-2 h-4 w-4" />
                            View Licenses
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
