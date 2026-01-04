'use client'

import { useState, useEffect, useRef } from 'react'
import { Apartment, User } from '@/types'
import { X, Calendar, User as UserIcon, Building, DollarSign, Check, Search, ChevronDown } from 'lucide-react'
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

  // Search States
  const [aptSearch, setAptSearch] = useState('')
  const [isAptDropdownOpen, setIsAptDropdownOpen] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)

  const aptDropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aptDropdownRef.current && !aptDropdownRef.current.contains(event.target as Node)) {
        setIsAptDropdownOpen(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtered Lists
  const filteredApartments = apartments.filter(apt => 
    apt.title.toLowerCase().includes(aptSearch.toLowerCase()) ||
    apt.location.toLowerCase().includes(aptSearch.toLowerCase())
  )

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  // Auto-fill user details when existing user selected
  useEffect(() => {
    if (userMode === 'existing' && selectedUserId) {
      const user = users.find(u => u.id === selectedUserId)
      if (user) {
        setGuestName(user.name || '')
        setGuestEmail(user.email || '')
        setGuestPhone(user.phone || '')
        // Update search text if not already matching (prevents loop if typing)
        if (userSearch !== user.email && userSearch !== user.name) {
             setUserSearch(user.name || user.email)
        }
      }
    }
  }, [selectedUserId, userMode, users]) // Removed userSearch from deps to avoid loop

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
      setAptSearch('')
      setStartDate('')
      setEndDate('')
      setGuestName('')
      setGuestEmail('')
      setGuestPhone('')
      setTotalPrice(0)
      setSelectedUserId('')
      setUserSearch('')
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
            <div ref={aptDropdownRef} className="relative">
              <label className="mb-1 block text-sm font-medium">Apartment</label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={aptSearch}
                  onChange={(e) => {
                    setAptSearch(e.target.value)
                    setIsAptDropdownOpen(true)
                    if (e.target.value === '') setApartmentId('')
                  }}
                  onFocus={() => setIsAptDropdownOpen(true)}
                  placeholder="Search apartment..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-8 focus:border-black focus:outline-none"
                />
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              
              {isAptDropdownOpen && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {filteredApartments.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No apartments found</div>
                  ) : (
                    filteredApartments.map(apt => (
                      <div
                        key={apt.id}
                        onClick={() => {
                          setApartmentId(apt.id)
                          setAptSearch(apt.title)
                          setIsAptDropdownOpen(false)
                        }}
                        className={`cursor-pointer px-4 py-2 text-sm hover:bg-gray-50 ${apartmentId === apt.id ? 'bg-gray-50 font-medium' : ''}`}
                      >
                        <div className="text-gray-900">{apt.title}</div>
                        <div className="text-xs text-gray-500">{formatPrice(apt.price)}/night • {apt.location}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {/* Hidden Select for HTML5 validation if needed, though input required works too if logic matches */}
              <input type="hidden" name="apartmentId" value={apartmentId} required />
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
              <div className="mb-4 relative" ref={userDropdownRef}>
                <label className="mb-1 block text-sm font-medium">Select User</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                        setUserSearch(e.target.value)
                        setIsUserDropdownOpen(true)
                        if (e.target.value === '') setSelectedUserId('')
                    }}
                    onFocus={() => setIsUserDropdownOpen(true)}
                    placeholder="Search by name or email..."
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-8 focus:border-black focus:outline-none"
                  />
                   <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>

                {isUserDropdownOpen && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {filteredUsers.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">No users found</div>
                      ) : (
                        filteredUsers.map(u => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedUserId(u.id)
                              setUserSearch(u.name || u.email)
                              setIsUserDropdownOpen(false)
                            }}
                            className={`cursor-pointer px-4 py-2 text-sm hover:bg-gray-50 ${selectedUserId === u.id ? 'bg-gray-50 font-medium' : ''}`}
                          >
                            <div className="text-gray-900">{u.name || "No Name"}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
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
