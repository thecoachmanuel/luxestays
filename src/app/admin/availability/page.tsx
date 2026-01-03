import { getApartments, getBookings } from "@/lib/db"
import { AvailabilityTable } from "@/components/admin/AvailabilityTable"

export const dynamic = 'force-dynamic'

export default async function AvailabilityPage() {
  const apartments = await getApartments()
  const bookings = await getBookings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Availability Monitor</h1>
        <p className="mt-2 text-[var(--secondary)]">
          Track real-time apartment status, current bookings, and upcoming availability.
        </p>
      </div>

      <AvailabilityTable apartments={apartments} bookings={bookings} />
    </div>
  )
}
