"use client"

import { useState } from "react"
import { Booking, Apartment, User } from "@/types"
import { formatPrice } from "@/lib/utils"
import { Download, Trash2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface BookingsTableProps {
  bookings: Booking[]
  apartments: Apartment[]
  users: User[]
}

export function BookingsTable({ bookings: initialBookings, apartments, users }: BookingsTableProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const [filterApartment, setFilterApartment] = useState("")
  const [filterMinAmount, setFilterMinAmount] = useState("")
  const [filterMaxAmount, setFilterMaxAmount] = useState("")
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Filter bookings
  const filteredBookings = initialBookings.filter(booking => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const user = users.find(u => u.id === booking.userId)
      const apartment = apartments.find(a => a.id === booking.apartmentId)
      
      const matchesSearch = 
        booking.id.toLowerCase().includes(term) ||
        (booking.paymentReference && booking.paymentReference.toLowerCase().includes(term)) ||
        booking.userId.toLowerCase().includes(term) ||
        (booking.guestName && booking.guestName.toLowerCase().includes(term)) ||
        (booking.guestEmail && booking.guestEmail.toLowerCase().includes(term)) ||
        (user?.name && user.name.toLowerCase().includes(term)) ||
        (user?.email && user.email.toLowerCase().includes(term)) ||
        (apartment?.title && apartment.title.toLowerCase().includes(term))
      
      if (!matchesSearch) return false
    }

    // Filter by date range
    let dateMatch = true
    const bookingStart = new Date(booking.startDate)
    const bookingEnd = new Date(booking.endDate)
    
    if (filterDate) {
      // If filtering by start date (From), booking should end after or on this date
      const filterStart = new Date(filterDate)
      dateMatch = dateMatch && bookingEnd >= filterStart
    }

    if (filterEndDate) {
      // If filtering by end date (To), booking should start before or on this date
      const filterEnd = new Date(filterEndDate)
      dateMatch = dateMatch && bookingStart <= filterEnd
    }

    let apartmentMatch = true
    if (filterApartment) {
      apartmentMatch = booking.apartmentId === filterApartment
    }

    let amountMatch = true
    if (filterMinAmount) {
      amountMatch = amountMatch && booking.totalPrice >= parseFloat(filterMinAmount)
    }
    if (filterMaxAmount) {
      amountMatch = amountMatch && booking.totalPrice <= parseFloat(filterMaxAmount)
    }

    return dateMatch && apartmentMatch && amountMatch
  })

  // Sort bookings
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (!sortField) return 0

    let valA, valB

    switch (sortField) {
      case 'startDate':
        valA = new Date(a.startDate).getTime()
        valB = new Date(b.startDate).getTime()
        break
      case 'endDate':
        valA = new Date(a.endDate).getTime()
        valB = new Date(b.endDate).getTime()
        break
      case 'totalPrice':
        valA = a.totalPrice
        valB = b.totalPrice
        break
      case 'createdAt':
        valA = new Date(a.createdAt || 0).getTime()
        valB = new Date(b.createdAt || 0).getTime()
        break
      default:
        return 0
    }

    if (sortDirection === 'asc') {
      return valA > valB ? 1 : -1
    } else {
      return valA < valB ? 1 : -1
    }
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc') // Default to desc for new sort
    }
  }

  const handleDelete = async (ids: string[]) => {
    if (!ids.length) return

    if (!confirm(`Are you sure you want to delete ${ids.length} booking(s)? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete bookings')
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting bookings:', error)
      alert('Failed to delete bookings. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClearFiltered = () => {
    const ids = filteredBookings.map(b => b.id)
    handleDelete(ids)
  }

  // Calculate daily booking counts for the selected range
  const getDailyCounts = () => {
    if (!filterDate || !filterEndDate) return []
    
    const start = new Date(filterDate)
    const end = new Date(filterEndDate)
    const days = []
    
    // Safety check: prevent infinite loop if dates are invalid or too far apart
    if (start > end) return []
    
    // Limit to 365 days to prevent performance issues
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays > 365) return []

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const currentDay = new Date(d)
      const currentTimestamp = currentDay.setHours(0,0,0,0)

      // Count bookings active on this day
      const count = filteredBookings.filter(b => {
        const bStart = new Date(b.startDate).setHours(0,0,0,0)
        const bEnd = new Date(b.endDate).setHours(0,0,0,0)
        
        return currentTimestamp >= bStart && currentTimestamp <= bEnd
      }).length
      
      days.push({ date: currentDay.toLocaleDateString(), count })
    }
    return days
  }

  const dailyCounts = getDailyCounts()

  const getApartmentName = (id: string) => {
    return apartments.find(a => a.id === id)?.title || "Unknown Apartment"
  }

  const getUserDetails = (userId: string) => {
    return users.find(u => u.id === userId)
  }

  const downloadCSV = () => {
    // Define headers
    const headers = ["Booking ID", "User Name", "User Email", "User Phone", "Apartment", "Start Date", "End Date", "Total Price", "Status", "Payment Ref", "Booked At"]
    
    // Map data to rows
    const rows = filteredBookings.map(booking => {
      const user = getUserDetails(booking.userId)
      const apartmentName = getApartmentName(booking.apartmentId)
      
      return [
        booking.id,
        booking.guestName || user?.name || "N/A",
        booking.guestEmail || user?.email || booking.userId,
        booking.guestPhone || user?.phone || "N/A",
        apartmentName,
        new Date(booking.startDate).toLocaleDateString(),
        new Date(booking.endDate).toLocaleDateString(),
        booking.totalPrice,
        booking.status,
        booking.paymentReference || "N/A",
        booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "N/A"
      ]
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `bookings_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] p-6 shadow-sm">
        <div className="w-full sm:w-auto flex-grow min-w-[200px]">
          <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Search</label>
          <input
            type="text"
            className="w-full rounded-xl border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2.5 text-sm focus:border-[var(--brand)] focus:ring-[var(--brand)]"
            placeholder="Search by ID, User, Email, or Apartment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Start Date</label>
          <input
            type="date"
            className="w-full rounded-xl border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2.5 text-sm focus:border-[var(--brand)] focus:ring-[var(--brand)]"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">End Date</label>
          <input
            type="date"
            className="w-full rounded-xl border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2.5 text-sm focus:border-[var(--brand)] focus:ring-[var(--brand)]"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Apartment</label>
          <select
            className="w-full rounded-xl border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2.5 text-sm focus:border-[var(--brand)] focus:ring-[var(--brand)]"
            value={filterApartment}
            onChange={(e) => setFilterApartment(e.target.value)}
          >
            <option value="">All Apartments</option>
            {apartments.map((apt) => (
              <option key={apt.id} value={apt.id}>{apt.title}</option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Min Amount</label>
          <input
            type="number"
            className="w-full rounded-xl border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2.5 text-sm focus:border-[var(--brand)] focus:ring-[var(--brand)]"
            placeholder="0"
            value={filterMinAmount}
            onChange={(e) => setFilterMinAmount(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Max Amount</label>
          <input
            type="number"
            className="w-full rounded-xl border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2.5 text-sm focus:border-[var(--brand)] focus:ring-[var(--brand)]"
            placeholder="0"
            value={filterMaxAmount}
            onChange={(e) => setFilterMaxAmount(e.target.value)}
          />
        </div>
        <div className="flex w-full items-end gap-2 sm:w-auto pb-0.5">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-bold text-[var(--background)] hover:opacity-90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={handleClearFiltered}
              disabled={isDeleting || filteredBookings.length === 0}
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-4 py-2.5 text-sm font-bold text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete all currently filtered bookings"
            >
              <Trash2 className="h-4 w-4" />
              Clear Filtered
            </button>
        </div>
      </div>

      {/* Daily Booking Counts */}
      {dailyCounts.length > 0 && (
        <div className="mb-6 rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-[var(--foreground)]">Bookings per Day ({dailyCounts.length} days)</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 max-h-60 overflow-y-auto">
            {dailyCounts.map((day, index) => (
              <div key={index} className={`rounded-xl border p-3 text-center ${day.count > 0 ? 'bg-[var(--accent)]/5 border-[var(--accent)]/20' : 'bg-[var(--secondary)]/5 border-[var(--secondary)]/20'}`}>
                <div className="text-xs text-[var(--secondary)]/70 mb-1">{day.date}</div>
                <div className={`text-xl font-bold ${day.count > 0 ? 'text-[var(--brand)]' : 'text-[var(--secondary)]/50'}`}>{day.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Card View (Hidden on MD+) */}
      <div className="grid gap-4 md:hidden">
        {sortedBookings.map((booking) => {
          const user = getUserDetails(booking.userId)
          return (
            <div key={booking.id} className="rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-[var(--foreground)]">{getApartmentName(booking.apartmentId)}</h4>
                  <p className="text-sm text-[var(--secondary)]/70">{booking.id.slice(0, 8)}...</p>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  booking.status === 'confirmed' ? 'bg-[var(--brand)]/10 text-[var(--brand)]' : 
                  booking.status === 'pending' ? 'bg-[var(--secondary)]/10 text-[var(--secondary)]' : 
                  'bg-[var(--accent)]/10 text-[var(--accent)]'
                }`}>
                  {booking.status}
                </span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-[var(--secondary)]/10 pb-2">
                  <span className="text-[var(--secondary)]/70">User</span>
                  <div className="text-right">
                    <div className="font-medium text-[var(--foreground)]">{booking.guestName || user?.name || "Unknown"}</div>
                    <div className="text-xs text-[var(--secondary)]/70">{booking.guestEmail || user?.email || booking.userId}</div>
                  </div>
                </div>

                <div className="flex justify-between border-b border-[var(--secondary)]/10 pb-2">
                  <span className="text-[var(--secondary)]/70">Reference</span>
                  <span className="font-medium text-[var(--foreground)] break-all ml-4 text-right">
                    {booking.paymentReference || "N/A"}
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-[var(--secondary)]/10 pb-2">
                  <span className="text-[var(--secondary)]/70">Dates</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-[var(--secondary)]/10 pb-2">
                  <span className="text-[var(--secondary)]/70">Amount</span>
                  <span className="font-bold text-[var(--foreground)]">{formatPrice(booking.totalPrice)}</span>
                </div>

                <div className="flex justify-between pt-1">
                   <span className="text-[var(--secondary)]/70">Booked At</span>
                   <span className="text-[var(--foreground)]">{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "N/A"}</span>
                </div>
                
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleDelete([booking.id])}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--secondary)]/20 px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/30 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filteredBookings.length === 0 && (
           <div className="rounded-xl border border-dashed border-[var(--secondary)]/20 p-8 text-center text-[var(--secondary)]/70">
             No bookings found matching your filters.
           </div>
        )}
      </div>

      {/* Desktop Table View (Hidden on Mobile) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] shadow-sm">
        <table className="min-w-full divide-y divide-[var(--secondary)]/20">
          <thead className="bg-[var(--secondary)]/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--secondary)]/70">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--secondary)]/70">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--secondary)]/70">
                Apartment
              </th>
              <th 
                className="cursor-pointer px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--secondary)]/70 hover:text-[var(--foreground)]"
                onClick={() => handleSort('startDate')}
              >
                Dates {sortField === 'startDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="cursor-pointer px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--secondary)]/70 hover:text-[var(--foreground)]"
                onClick={() => handleSort('totalPrice')}
              >
                Amount {sortField === 'totalPrice' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--secondary)]/70">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--secondary)]/70">
                Payment Ref
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--secondary)]/70">
                Coupon
              </th>
               <th 
                className="cursor-pointer px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--secondary)]/70 hover:text-[var(--foreground)]"
                onClick={() => handleSort('createdAt')}
              >
                Booked At {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--secondary)]/20 bg-[var(--background)]">
            {sortedBookings.map((booking) => {
              const user = getUserDetails(booking.userId)
              return (
                <tr key={booking.id} className="hover:bg-[var(--secondary)]/5 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-bold text-[var(--foreground)]">
                      {booking.guestName || user?.name || "Unknown"}
                    </div>
                    <div className="text-xs text-[var(--secondary)]/70">
                      {booking.guestEmail || user?.email || booking.userId}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-[var(--foreground)]">
                      {booking.guestPhone || user?.phone || "N/A"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-[var(--foreground)]">
                      {getApartmentName(booking.apartmentId)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-[var(--foreground)]">
                      {new Date(booking.startDate).toLocaleDateString()} - 
                      {new Date(booking.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-[var(--foreground)]">{formatPrice(booking.totalPrice)}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      booking.status === 'confirmed' ? 'bg-[var(--brand)]/10 text-[var(--brand)]' : 
                      booking.status === 'pending' ? 'bg-[var(--secondary)]/10 text-[var(--secondary)]' : 
                      'bg-[var(--accent)]/10 text-[var(--accent)]'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--secondary)]/70">
                    {booking.paymentReference || "N/A"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--secondary)]/70">
                    {booking.couponCode ? (
                        <div>
                            <span className="font-bold text-[var(--brand)]">{booking.couponCode}</span>
                            {booking.discountAmount && (
                                <span className="text-xs text-[var(--secondary)]/50 block">(-{formatPrice(booking.discountAmount)})</span>
                            )}
                        </div>
                    ) : "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--secondary)]/70">
                    {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "N/A"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete([booking.id])}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                      title="Delete Booking"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredBookings.length === 0 && (
            <div className="p-12 text-center text-[var(--secondary)]/70">No bookings found matching your filters.</div>
        )}
      </div>
    </div>
  )
}
