'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Activity, 
  Monitor, 
  Mail, 
  Key, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface SecurityLog {
  id: string
  action: string
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

interface SecurityLogsResponse {
  logs: SecurityLog[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    limit: number
  }
}

const actionIcons: Record<string, any> = {
  ACCOUNT_CREATED: CheckCircle,
  EMAIL_VERIFIED: Mail,
  PASSWORD_CHANGED: Key,
  PASSWORD_RESET_REQUESTED: AlertTriangle,
  PASSWORD_RESET_COMPLETED: CheckCircle,
  TWO_FACTOR_ENABLED: Shield,
  TWO_FACTOR_DISABLED: XCircle,
  TWO_FACTOR_VERIFIED: CheckCircle,
  TWO_FACTOR_FAILED: XCircle,
  BACKUP_CODE_USED: Key,
  BACKUP_CODES_REGENERATED: RefreshCw,
  LOGIN_SUCCESS: CheckCircle,
  LOGIN_FAILED: XCircle,
  LOGOUT: Activity,
}

const actionColors: Record<string, string> = {
  ACCOUNT_CREATED: 'bg-green-100 text-green-800',
  EMAIL_VERIFIED: 'bg-blue-100 text-blue-800',
  PASSWORD_CHANGED: 'bg-yellow-100 text-yellow-800',
  PASSWORD_RESET_REQUESTED: 'bg-orange-100 text-orange-800',
  PASSWORD_RESET_COMPLETED: 'bg-green-100 text-green-800',
  TWO_FACTOR_ENABLED: 'bg-green-100 text-green-800',
  TWO_FACTOR_DISABLED: 'bg-red-100 text-red-800',
  TWO_FACTOR_VERIFIED: 'bg-green-100 text-green-800',
  TWO_FACTOR_FAILED: 'bg-red-100 text-red-800',
  BACKUP_CODE_USED: 'bg-yellow-100 text-yellow-800',
  BACKUP_CODES_REGENERATED: 'bg-blue-100 text-blue-800',
  LOGIN_SUCCESS: 'bg-green-100 text-green-800',
  LOGIN_FAILED: 'bg-red-100 text-red-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
}

export function SecurityActivityLog() {
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [pagination, setPagination] = useState<SecurityLogsResponse['pagination'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [actionFilter, setActionFilter] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchLogs = async (page: number = 1, action?: string) => {
    try {
      setIsLoading(page === 1)
      setIsRefreshing(page !== 1)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })

      if (action) {
        params.append('action', action)
      }

      const response = await fetch(`/api/user/security-logs?${params}`)
      
      if (response.ok) {
        const data: SecurityLogsResponse = await response.json()
        setLogs(data.logs)
        setPagination(data.pagination)
        setCurrentPage(page)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to fetch security logs')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLogs(1, actionFilter)
  }, [actionFilter])

  const handleRefresh = () => {
    fetchLogs(currentPage, actionFilter)
  }

  const handlePageChange = (page: number) => {
    fetchLogs(page, actionFilter)
  }

  const getActionIcon = (action: string) => {
    const IconComponent = actionIcons[action] || Activity
    return <IconComponent className="h-4 w-4" />
  }

  const getActionColor = (action: string) => {
    return actionColors[action] || 'bg-gray-100 text-gray-800'
  }

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const getBrowserInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown Browser'
    
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown Browser'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading security logs...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Activity
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Activities</SelectItem>
                <SelectItem value="LOGIN">Login Activities</SelectItem>
                <SelectItem value="PASSWORD">Password Changes</SelectItem>
                <SelectItem value="TWO_FACTOR">Two-Factor Auth</SelectItem>
                <SelectItem value="EMAIL">Email Activities</SelectItem>
                <SelectItem value="ACCOUNT">Account Changes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Security Activity</h3>
              <p className="text-gray-500">No security activities found for the selected filter.</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {getActionIcon(log.action)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <Badge className={getActionColor(log.action)}>
                        {formatActionName(log.action)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  {log.details && (
                    <p className="text-sm text-gray-600 mb-2">{log.details}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {log.ipAddress && (
                      <div className="flex items-center space-x-1">
                        <Monitor className="h-3 w-3" />
                        <span>{log.ipAddress}</span>
                      </div>
                    )}
                    {log.userAgent && (
                      <div className="flex items-center space-x-1">
                        <Activity className="h-3 w-3" />
                        <span>{getBrowserInfo(log.userAgent)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
              {pagination.totalCount} activities
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={page === pagination.currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
