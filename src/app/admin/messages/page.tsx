"use client"

import { useState, useEffect } from "react"
import { ContactMessage } from "@/types"
import { Trash2, CheckCircle, Mail, Loader2, RefreshCw } from "lucide-react"

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [marking, setMarking] = useState<string | null>(null)

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/messages')
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Failed to fetch messages', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/messages?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMessages(messages.filter(m => m.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete message', error)
    } finally {
      setDeleting(null)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    setMarking(id)
    try {
        const res = await fetch('/api/messages', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        })
        if (res.ok) {
            setMessages(messages.map(m => m.id === id ? { ...m, read: true } : m))
        }
    } catch (error) {
        console.error('Failed to update message', error)
    } finally {
        setMarking(null)
    }
  }

  if (loading) {
      return (
          <div className="flex h-96 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Contact Messages</h1>
        <button 
            onClick={fetchMessages}
            className="flex items-center gap-2 text-sm text-[var(--brand)] hover:opacity-80"
        >
            <RefreshCw className="h-4 w-4" />
            Refresh
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--secondary)]/30 p-12 text-center text-[var(--secondary)]">
          <Mail className="mx-auto mb-4 h-12 w-12 text-[var(--secondary)]/50" />
          <p>No messages found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {messages.map((message) => (
            <div 
                key={message.id} 
                className={`rounded-lg border p-6 transition-colors ${
                    message.read 
                    ? 'bg-[var(--background)] border-[var(--secondary)]/20' 
                    : 'bg-[var(--brand)]/5 border-[var(--brand)]/20'
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[var(--foreground)]">{message.name}</h3>
                    <span className="text-sm text-[var(--secondary)]">&lt;{message.email}&gt;</span>
                  </div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{message.subject}</p>
                  <p className="text-sm text-[var(--secondary)] whitespace-pre-wrap">{message.message}</p>
                  <p className="text-xs text-[var(--secondary)]/70 mt-2">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                    {!message.read && (
                        <button
                            onClick={() => handleMarkAsRead(message.id)}
                            disabled={marking === message.id}
                            className="p-2 text-[var(--brand)] hover:bg-[var(--brand)]/10 rounded-full"
                            title="Mark as read"
                        >
                            {marking === message.id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <CheckCircle className="h-5 w-5" />
                            )}
                        </button>
                    )}
                    <button
                        onClick={() => handleDelete(message.id)}
                        disabled={deleting === message.id}
                        className="p-2 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-full"
                        title="Delete message"
                    >
                        {deleting === message.id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Trash2 className="h-5 w-5" />
                        )}
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}