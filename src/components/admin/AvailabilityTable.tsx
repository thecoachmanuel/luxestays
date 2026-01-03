"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Apartment, Booking } from "@/types"
import { differenceInDays } from "date-fns"
import { Search, Calendar, CheckCircle, XCircle } from "lucide-react"

interface AvailabilityTableProps {
  apartments: Apartment[]
  bookings: Booking[]
}

interface ApartmentStatus {
  id: string
  name: string
  image: string
  status: 'available' | 'booked'
  currentBooking?: {
    startDate: string
    endDate: string
    duration: number
    guestName?: string
  }
  nextAvailable: string
}

export function AvailabilityTable({ apartments, bookings }: AvailabilityTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  // Auto-refresh every 30 seconds to keep availability live
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 30000)
    return () => clearInterval(interval)
  }, [router])

  // Process data to get status
  const apartmentStatuses: ApartmentStatus[] = apartments.map(apt => {
    // Use local date string for comparison to avoid timezone issues
    const now = new Date()
    const todayStr = format(now, 'yyyy-MM-dd')
    const todayDate = new Date(todayStr) // Local midnight of today

    // Find current active booking
    const currentBooking = bookings.find(b => {
       // Extract just the date part YYYY-MM-DD
       const startStr = new Date(b.startDate).toISOString().split('T')[0]
       const endStr = new Date(b.endDate).toISOString().split('T')[0]
       
       return b.apartmentId === apt.id && 
              b.status === 'confirmed' &&
              startStr <= todayStr &&
              endStr > todayStr
    })

    // Calculate next availability (considering contiguous bookings)
    let nextAvailable = todayDate
    if (currentBooking) {
       let chainEndStr = new Date(currentBooking.endDate).toISOString().split('T')[0]
       
       // Find contiguous bookings
       const futureBookings = bookings
        .filter(b => {
            const startStr = new Date(b.startDate).toISOString().split('T')[0]
            return b.apartmentId === apt.id && b.status === 'confirmed' && startStr > todayStr
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

       for (const booking of futureBookings) {
          const bStartStr = new Date(booking.startDate).toISOString().split('T')[0]
          const bEndStr = new Date(booking.endDate).toISOString().split('T')[0]
          
          if (bStartStr <= chainEndStr && bEndStr > chainEndStr) {
             chainEndStr = bEndStr
          }
       }
       nextAvailable = new Date(chainEndStr)
    }

    return {
      id: apt.id,
      name: apt.title,
      image: apt.image,
      status: currentBooking ? 'booked' : 'available',
      currentBooking: currentBooking ? {
        startDate: currentBooking.startDate.toString(),
        endDate: currentBooking.endDate.toString(),
        duration: differenceInDays(new Date(currentBooking.endDate), new Date(currentBooking.startDate)),
        guestName: currentBooking.guestName || "Guest"
      } : undefined,
      nextAvailable: currentBooking ? nextAvailable.toISOString() : "Now"
    }
  })

  const filtered = apartmentStatuses.filter(apt => 
    apt.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-[var(--background)] w-full sm:w-64">
        <Search className="h-4 w-4 text-[var(--secondary)]" />
        <input 
          type="text" 
          placeholder="Search apartments..." 
          className="bg-transparent outline-none text-sm w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--secondary)]/5 text-[var(--foreground)] font-semibold">
              <tr>
                <th className="px-6 py-4">Apartment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Booked Date</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Available From</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--secondary)]/10">
              {filtered.map((apt) => (
                <tr key={apt.id} className="hover:bg-[var(--secondary)]/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg overflow-hidden relative bg-[var(--secondary)]/10">
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                         <img src={apt.image} alt={apt.name} className="h-full w-full object-cover" />
                      </div>
                      <span className="font-medium text-[var(--foreground)]">{apt.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {apt.status === 'booked' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <XCircle className="h-3 w-3" />
                        Booked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        Available
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[var(--secondary)]">
                    {apt.currentBooking ? (
                      <div className="flex flex-col">
                        <span className="text-[var(--foreground)]">{format(new Date(apt.currentBooking.startDate), 'MMM d, yyyy')}</span>
                        <span className="text-xs text-[var(--secondary)]/70">Guest: {apt.currentBooking.guestName}</span>
                      </div>
                    ) : (
                      <span className="text-[var(--secondary)]/50">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[var(--secondary)]">
                    {apt.currentBooking ? (
                      <span className="font-medium">{apt.currentBooking.duration} nights</span>
                    ) : (
                      <span className="text-[var(--secondary)]/50">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[var(--secondary)]">
                    {apt.status === 'booked' ? (
                      <div className="flex items-center gap-2 text-[var(--brand)] font-medium">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(apt.nextAvailable), 'MMM d, yyyy')}
                      </div>
                    ) : (
                      <span className="text-green-600 font-medium">Now</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--secondary)]">
                    No apartments found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
