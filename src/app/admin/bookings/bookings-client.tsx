'use client'

import { useState } from 'react'
import { Booking, Apartment, User } from '@/types'
import { BookingsTable } from '@/components/admin/BookingsTable'
import { AddBookingModal } from '@/components/admin/AddBookingModal'
import { Plus } from 'lucide-react'

interface BookingsClientProps {
  bookings: Booking[]
  apartments: Apartment[]
  users: User[]
}

export function BookingsClient({ bookings, apartments, users }: BookingsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Bookings</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add Booking
        </button>
      </div>

      <BookingsTable bookings={bookings} apartments={apartments} users={users} />

      <AddBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        apartments={apartments}
        users={users}
      />
    </div>
  )
}
