
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { User } from '@/types'
import { Eye, EyeOff, Loader2, Upload } from 'lucide-react'

interface ProfileEditorProps {
  user: User
}

export function ProfileEditor({ user }: ProfileEditorProps) {
  const router = useRouter()
  const { update } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    password: '',
    image: user.image || ''
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const uploadData = new FormData()
    uploadData.append('file', file)

    try {
      setLoading(true)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      setFormData(prev => ({ ...prev, image: data.url }))
    } catch (err) {
      setError('Failed to upload image')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        throw new Error('Failed to update profile')
      }

      setSuccess('Profile updated successfully')
      await update({ image: formData.image, name: formData.name })
      router.refresh()
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {error && (
          <div className="bg-[var(--accent)]/10 text-[var(--accent)] p-4 rounded-md text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-[var(--brand)]/10 text-[var(--brand)] p-4 rounded-md text-sm">
            {success}
          </div>
        )}

      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-3 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Phone Number</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+234..."
          className="mt-1 block w-full rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-3 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-3 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] transition-colors"
        />
      </div>

       <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Profile Image</label>
        <div className="mt-1 flex items-center gap-4">
          {formData.image && (
            <img 
              src={formData.image} 
              alt="Profile" 
              className="h-16 w-16 rounded-full object-cover border border-[var(--secondary)]/20"
            />
          )}
          <label className="cursor-pointer flex items-center gap-2 rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--secondary)]/10 transition-colors relative">
            <Upload className="h-4 w-4" />
            <span>Change Image</span>
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              accept="image/*"
              onChange={handleImageUpload}
              disabled={loading}
            />
          </label>
        </div>
        <input
          type="text"
          value={formData.image}
          onChange={e => setFormData({ ...formData, image: e.target.value })}
          className="mt-2 block w-full rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] px-3 py-3 text-sm text-[var(--secondary)] shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] transition-colors"
          placeholder="Or enter image URL..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">New Password (leave blank to keep current)</label>
        <div className="relative mt-1">
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            className="block w-full rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-3 pr-10 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full justify-center rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] px-4 py-3 text-sm font-bold text-[var(--background)] shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save Changes
      </button>
    </form>
  )
}
