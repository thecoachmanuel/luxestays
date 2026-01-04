'use client'

import { useState, useEffect } from 'react'
import { Apartment, User } from '@/types'
import { X, Calendar, User as UserIcon, Building, DollarSign, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'

interface AddBookingModalProps {
  isOpen: boolean
  onClose: () => void
  apartments: Apartment[]
  users: User[]
}

export function AddBookingModal({ isOpen, onClose, apartments, users }: AddBookingModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form State
  const [apartmentId, setApartmentId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [userMode, setUserMode] = useState<'existing' | 'new'>('new')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [totalPrice, setTotalPrice] = useState<number>(0)
  const [status, setStatus] = useState('confirmed')
  const [customPrice, setCustomPrice] = useState(false)

  // Auto-fill user details when existing user selected
  useEffect(() => {
    if (userMode === 'existing' && selectedUserId) {
      const user = users.find(u => u.id === selectedUserId)
      if (user) {
        setGuestName(user.name || '')
        setGuestEmail(user.email || '')
        setGuestPhone(user.phone || '')
      }
    } else if (userMode === 'new') {
        // Don't clear fields, allow manual entry
    }
  }, [selectedUserId, userMode, users])

  // Calculate Price
  useEffect(() => {
    if (customPrice) return

    if (apartmentId && startDate && endDate) {
      const apt = apartments.find(a => a.id === apartmentId)
      if (apt) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays > 0) {
          setTotalPrice(apt.price * diffDays)
        }
      }
    }
  }, [apartmentId, startDate, endDate, apartments, customPrice])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentId,
          startDate,
          endDate,
          userId: userMode === 'existing' ? selectedUserId : undefined,
          guestName,
          guestEmail,
          guestPhone,
          totalPrice,
          status
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      router.refresh()
      onClose()
      // Reset form
      setApartmentId('')
      setStartDate('')
      setEndDate('')
      setGuestName('')
      setGuestEmail('')
      setGuestPhone('')
      setTotalPrice(0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Create New Booking</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Apartment & Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Apartment</label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <select
                  required
                  value={apartmentId}
                  onChange={(e) => setApartmentId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 focus:border-black focus:outline-none"
                >
                  <option value="">Select Apartment</option>
                  {apartments.map(apt => (
                    <option key={apt.id} value={apt.id}>{apt.title} - {formatPrice(apt.price)}/night</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">End Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* User Details */}
          <div>
            <div className="mb-4 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="userMode"
                  value="new"
                  checked={userMode === 'new'}
                  onChange={() => setUserMode('new')}
                  className="text-black focus:ring-black"
                />
                New/Guest User
              </label>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="userMode"
                  value="existing"
                  checked={userMode === 'existing'}
                  onChange={() => setUserMode('existing')}
                  className="text-black focus:ring-black"
                />
                Existing User
              </label>
            </div>

            {userMode === 'existing' && (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium">Select User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                >
                  <option value="">Select a user...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email} ({u.email})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Guest Name</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Guest Email</label>
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone Number</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Pricing & Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium">Total Price</label>
                <label className="flex items-center gap-1 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={customPrice}
                    onChange={(e) => setCustomPrice(e.target.checked)}
                  />
                  Manual Override
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
                <input
                  type="number"
                  required
                  value={totalPrice}
                  readOnly={!customPrice}
                  onChange={(e) => setTotalPrice(parseFloat(e.target.value))}
                  className={`w-full rounded-lg border border-gray-300 py-2 pl-8 pr-4 focus:border-black focus:outline-none ${!customPrice && 'bg-gray-50'}`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Creating...' : (
                <>
                  <Check className="h-4 w-4" />
                  Create Booking
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
