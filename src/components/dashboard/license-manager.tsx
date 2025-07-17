'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Download, 
  Copy, 
  Key,
  CheckCircle,
  XCircle,
  Clock,
  Search
} from 'lucide-react'
import { toast } from 'sonner'

interface License {
  id: string
  licenseKey: string
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED'
  createdAt: string
  expiresAt: string | null
  downloadCount: number
  product: {
    id: string
    name: string
    downloadUrl: string
  }
}

export function LicenseManager() {
  const { data: session } = useSession()
  const [licenses, setLicenses] = useState<License[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch licenses
  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const response = await fetch('/api/dashboard/licenses')
        if (response.ok) {
          const data = await response.json()
          setLicenses(data.licenses)
        } else {
          toast.error('Failed to load licenses')
        }
      } catch (error) {
        console.error('Failed to fetch licenses:', error)
        toast.error('Failed to load licenses')
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchLicenses()
    }
  }, [session])

  // Filter licenses based on search term
  const filteredLicenses = licenses.filter(license =>
    license.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.licenseKey.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const copyLicenseKey = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey)
    toast.success('License key copied to clipboard')
  }

  const handleDownload = async (license: License) => {
    try {
      const response = await fetch(`/api/download/${license.id}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Download failed')
      }

      const data = await response.json()

      if (data.success && data.downloadUrl) {
        // Open download URL in new tab
        window.open(data.downloadUrl, '_blank')
        toast.success(`Download started for ${data.productName}`)
      } else {
        throw new Error('Invalid download response')
      }
    } catch (error) {
      console.error('Download error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Download failed'
      toast.error(errorMessage)
    }
  }

  const getStatusBadge = (status: License['status']) => {
    const statusConfig = {
      ACTIVE: { 
        variant: 'default' as const, 
        icon: CheckCircle, 
        label: 'Active' 
      },
      EXPIRED: { 
        variant: 'secondary' as const, 
        icon: Clock, 
        label: 'Expired' 
      },
      REVOKED: { 
        variant: 'destructive' as const, 
        icon: XCircle, 
        label: 'Revoked' 
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (licenses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <Key className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No licenses yet
        </h3>
        <p className="text-gray-500 mb-4">
          Purchase products to get your licenses here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search licenses or products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Licenses Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>License Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Downloads</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLicenses.map((license) => (
              <TableRow key={license.id}>
                <TableCell className="font-medium">
                  {license.product.name}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {license.licenseKey}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLicenseKey(license.licenseKey)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(license.status)}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(license.createdAt)}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {license.expiresAt ? formatDate(license.expiresAt) : 'Never'}
                </TableCell>
                <TableCell className="text-sm">
                  {license.downloadCount}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => copyLicenseKey(license.licenseKey)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy License Key
                      </DropdownMenuItem>
                      {license.status === 'ACTIVE' && (
                        <DropdownMenuItem
                          onClick={() => handleDownload(license)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Product
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

      {filteredLicenses.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No licenses found matching "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  )
}
