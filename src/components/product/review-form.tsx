'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface ReviewFormProps {
  productId: string
  onSubmitted: () => void
  onCancel: () => void
}

export function ReviewForm({ productId, onSubmitted, onCancel }: ReviewFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }
    
    if (!title.trim()) {
      toast.error('Please enter a review title')
      return
    }
    
    if (content.length < 10) {
      toast.error('Review must be at least 10 characters long')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          title: title.trim(),
          content: content.trim()
        })
      })

      if (response.ok) {
        toast.success('Review submitted successfully!')
        onSubmitted()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit review')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStarRating = () => {
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }, (_, i) => {
          const starValue = i + 1
          const isActive = starValue <= (hoveredRating || rating)
          
          return (
            <button
              key={i}
              type="button"
              onClick={() => setRating(starValue)}
              onMouseEnter={() => setHoveredRating(starValue)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  isActive ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            </button>
          )
        })}
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 && (
            <>
              {rating} star{rating !== 1 ? 's' : ''}
              {rating === 1 && ' - Poor'}
              {rating === 2 && ' - Fair'}
              {rating === 3 && ' - Good'}
              {rating === 4 && ' - Very Good'}
              {rating === 5 && ' - Excellent'}
            </>
          )}
        </span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Write a Review</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div className="space-y-2">
              <Label>Rating *</Label>
              {renderStarRating()}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Review Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                maxLength={100}
              />
              <p className="text-xs text-gray-500">
                {title.length}/100 characters
              </p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Your Review *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tell others about your experience with this product..."
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500">
                {content.length}/1000 characters (minimum 10)
              </p>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Review Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Be honest and helpful to other customers</li>
                <li>• Focus on the product features and your experience</li>
                <li>• Avoid inappropriate language or personal information</li>
                <li>• You can only review products you have purchased</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={isLoading || rating === 0 || !title.trim() || content.length < 10}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
