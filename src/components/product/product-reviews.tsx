'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, ThumbsUp, MessageSquare, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDistanceToNow } from 'date-fns'
import { useSession } from 'next-auth/react'
import { ReviewForm } from '../reviews/review-form'
import { ReviewList } from '../reviews/review-list'

interface Review {
  id: string
  rating: number
  title: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    avatar?: string
  }
  helpful: number
}

interface ReviewSummary {
  averageRating: number
  totalReviews: number
  distribution: Array<{
    rating: number
    count: number
  }>
}

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { data: session } = useSession()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleReviewSubmitted = () => {
    setShowReviewForm(false)
    setRefreshKey(prev => prev + 1) // Trigger refresh of ReviewList
  }

  return (
    <div className="space-y-6">
      {/* Write Review Button */}
      {session && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowReviewForm(!showReviewForm)}
            size="sm"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Write Review
          </Button>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ReviewForm
            productId={productId}
            productName="Product" // You can pass actual product name here
            onReviewSubmitted={handleReviewSubmitted}
          />
        </motion.div>
      )}

      {/* Reviews List */}
      <ReviewList key={refreshKey} productId={productId} />
    </div>
  )
}
