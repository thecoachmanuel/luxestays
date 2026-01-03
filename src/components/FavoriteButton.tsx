'use client'

import { Heart } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface FavoriteButtonProps {
  apartmentId: string
  initialIsFavorite?: boolean
  currentUserId?: string
  variant?: 'icon' | 'button'
  className?: string
}

export function FavoriteButton({ 
  apartmentId, 
  initialIsFavorite = false, 
  currentUserId,
  variant = 'icon',
  className = ''
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const router = useRouter()

  useEffect(() => {
    setIsFavorite(initialIsFavorite)
  }, [initialIsFavorite])

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUserId) {
      router.push('/signin')
      return
    }

    // Optimistic update
    setIsFavorite(!isFavorite)

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apartmentId })
      })
      
      if (!res.ok) {
        throw new Error('Failed to toggle favorite')
      }
      
      router.refresh()
    } catch (error) {
      // Revert on error
      setIsFavorite(isFavorite)
      console.error(error)
    }
  }

  if (variant === 'button') {
    return (
      <button 
        onClick={toggleFavorite}
        className={`flex items-center gap-2 px-3 py-2 hover:bg-[var(--secondary)]/10 rounded-md transition-colors font-medium underline ${className}`}
      >
        <Heart 
          className={`h-4 w-4 ${isFavorite ? 'fill-[var(--accent)] text-[var(--accent)]' : 'text-[var(--foreground)]'}`} 
        />
        {isFavorite ? 'Saved' : 'Save'}
      </button>
    )
  }

  return (
    <button 
      onClick={toggleFavorite}
      className={`p-1 rounded-full hover:bg-[var(--brand)]/10 transition-colors ${className}`}
    >
       <Heart 
         className={`h-6 w-6 transition-colors hover:scale-110 active:scale-90 ${isFavorite ? 'fill-[var(--accent)] text-[var(--accent)]' : 'text-[var(--background)]/70 hover:text-[var(--background)]'}`} 
       />
    </button>
  )
}
