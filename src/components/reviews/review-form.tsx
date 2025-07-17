'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Star, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface ReviewFormProps {
  productId: string
  productName: string
  onReviewSubmitted?: () => void
}

export function ReviewForm({ productId, productName, onReviewSubmitted }: ReviewFormProps) {
  const { data: session, status } = useSession()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id) {
      toast.error('Please sign in to submit a review')
      return
    }

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (comment.trim().length < 10) {
      setError('Comment must be at least 10 characters long')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating,
          comment: comment.trim()
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Review submitted successfully!')
        setRating(0)
        setComment('')
        onReviewSubmitted?.()
      } else {
        setError(data.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Submit review error:', error)
      setError('Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render star rating input
  const renderStarInput = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-1 hover:scale-110 transition-transform"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          >
            <Star
              className={`h-8 w-8 ${
                star <= (hoverRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-gray-600">
            {rating} out of 5 stars
          </span>
        )}
      </div>
    )
  }

  // Show sign in prompt if not authenticated
  if (status !== 'authenticated') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
          <CardDescription>
            Share your experience with {productName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please{' '}
              <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                sign in
              </Link>{' '}
              to write a review.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>
          Share your experience with {productName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Input */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            {renderStarInput()}
          </div>

          {/* Comment Input */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your Review *</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience with this product..."
              rows={4}
              maxLength={1000}
              className="resize-none"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Minimum 10 characters</span>
              <span>{comment.length}/1000</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>

          {/* Guidelines */}
          <div className="text-sm text-gray-500 space-y-1">
            <p className="font-medium">Review Guidelines:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Be honest and constructive in your feedback</li>
              <li>Focus on the product features and your experience</li>
              <li>Avoid inappropriate language or personal attacks</li>
              <li>Reviews are moderated and may take time to appear</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
