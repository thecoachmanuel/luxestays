'use client'

import { Check, CheckCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function MarkAllReadButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleMarkRead = async () => {
    setLoading(true)
    try {
      await fetch('/api/admin/notifications/ack', { method: 'POST' })
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
        onClick={handleMarkRead}
        disabled={loading}
        title="Mark all as read"
        className="flex items-center gap-2 rounded-xl bg-[var(--background)] border px-3 py-2 hover:bg-[var(--secondary)]/10 transition-colors disabled:opacity-50"
    >
        <CheckCheck className="h-4 w-4 text-[var(--brand)]" />
        <span className="text-sm font-medium">Mark all as read</span>
    </button>
  )
}
