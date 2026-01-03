import { getBookings, getApartments, getUsers } from "@/lib/db"
import { BookingsTable } from "@/components/admin/BookingsTable"

export default async function AdminBookingsPage() {
  const bookings = await getBookings()
  const apartments = await getApartments()
  const users = await getUsers()

  // Sort bookings by date (newest first)
  const sortedBookings = bookings.sort((a, b) => 
    new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime()
  )

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="mb-8 text-3xl font-bold">Manage Bookings</h1>
      <BookingsTable bookings={sortedBookings} apartments={apartments} users={users} />
    </div>
  )
}
