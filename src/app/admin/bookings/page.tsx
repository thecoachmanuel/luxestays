import { getBookings, getApartments, getUsers } from "@/lib/db"
import { BookingsClient } from "./bookings-client"

export default async function AdminBookingsPage() {
  const bookings = await getBookings()
  const apartments = await getApartments()
  const users = await getUsers()

  // Sort bookings by date (newest first)
  const sortedBookings = bookings.sort((a, b) => 
    new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime()
  )

  return <BookingsClient bookings={sortedBookings} apartments={apartments} users={users} />
}
