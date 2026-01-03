
'use client'

import { useState } from 'react'
import { Review } from '@/types'
import { useRouter } from 'next/navigation'
import { Star, Trash2, Edit2, Check, X, User } from 'lucide-react'

interface ReviewListProps {
  reviews: Review[]
  currentUserId?: string | null
  isAdmin?: boolean
}

export function ReviewList({ reviews, currentUserId, isAdmin }: ReviewListProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ rating: 0, comment: '' })

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
      window.location.reload()
    } catch (error) {
      alert('Failed to delete review')
    }
  }

  const startEdit = (review: Review) => {
    setEditingId(review.id)
    setEditForm({ rating: review.rating, comment: review.comment })
  }

  const saveEdit = async (id: string) => {
    try {
      await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      setEditingId(null)
      window.location.reload()
    } catch (error) {
      alert('Failed to update review')
    }
  }

  if (reviews.length === 0) {
    return <p className="text-[var(--secondary)]">No reviews yet.</p>
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {reviews.map((review) => {
        const isOwner = currentUserId === review.userId
        const canEdit = isOwner || isAdmin

        return (
          <div key={review.id} className="break-inside-avoid">
            {editingId === review.id ? (
              <div className="space-y-4 rounded-lg border border-[var(--secondary)]/20 p-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)]">Rating</label>
                  <select
                    value={editForm.rating}
                    onChange={e => setEditForm({ ...editForm, rating: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border border-[var(--secondary)] p-2 bg-[var(--background)] text-[var(--foreground)]"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n} Stars</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)]">Comment</label>
                  <textarea
                    value={editForm.comment}
                    onChange={e => setEditForm({ ...editForm, comment: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-[var(--secondary)] p-2 bg-[var(--background)] text-[var(--foreground)]"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(review.id)}
                    className="flex items-center gap-1 rounded bg-[var(--brand)] px-3 py-1 text-sm text-[var(--background)] hover:opacity-80"
                  >
                    <Check className="h-4 w-4" /> Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1 rounded bg-[var(--secondary)]/20 px-3 py-1 text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]/30"
                  >
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[var(--secondary)]/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-[var(--secondary)]" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-[var(--foreground)]">{review.userName || 'Guest'}</h4>
                        <span className="text-sm text-[var(--secondary)] block">
                            {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(review)}
                        className="text-[var(--secondary)] hover:text-[var(--foreground)]"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="text-[var(--secondary)] hover:text-[var(--accent)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1 mb-2">
                   {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < review.rating ? 'fill-[var(--foreground)] text-[var(--foreground)]' : 'text-[var(--secondary)]/30'}`}
                      />
                    ))}
                </div>

                <p className="text-[var(--secondary)] leading-relaxed">{review.comment}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
