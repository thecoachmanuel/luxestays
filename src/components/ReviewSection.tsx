
'use client'

import { useState } from 'react'
import { Review } from '@/types'
import { useRouter } from 'next/navigation'
import { ReviewList } from './ReviewList'
import { Star, Loader2 } from 'lucide-react'

interface ReviewSectionProps {
  apartmentId: string
  reviews: Review[]
  currentUserId?: string | null
  isAdmin?: boolean
}

export function ReviewSection({ apartmentId, reviews: initialReviews, currentUserId, isAdmin }: ReviewSectionProps) {
  const router = useRouter()
  const [reviews, setReviews] = useState(initialReviews)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId) {
      alert('Please sign in to leave a review')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentId,
          rating,
          comment
        })
      })

      if (!res.ok) throw new Error('Failed to post review')

      const newReview = await res.json()
      setReviews([...reviews, newReview])
      setComment('')
      setRating(5)
      router.refresh()
    } catch (error) {
      alert('Failed to post review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-12">
      <h2 className="mb-6 text-2xl font-bold">Reviews</h2>
      
      {currentUserId && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-lg border bg-[var(--secondary)]/5 p-4 sm:p-6 border-[var(--secondary)]/20">
          <h3 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Leave a Review</h3>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`focus:outline-none ${star <= rating ? 'text-[var(--brand)]' : 'text-[var(--secondary)]'}`}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={3}
              className="w-full rounded-md border border-[var(--secondary)]/20 p-2 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
              placeholder="Share your experience..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-6 py-3 text-sm font-medium text-[var(--background)] hover:opacity-80 disabled:opacity-50 transition-opacity"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit Review
          </button>
        </form>
      )}

      <ReviewList 
        reviews={reviews} 
        currentUserId={currentUserId} 
        isAdmin={isAdmin}
      />
    </div>
  )
}
