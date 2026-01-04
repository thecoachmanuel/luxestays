import { auth } from "@/auth"
import { getBookingsByUser, getApartmentById } from "@/lib/db"
import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin, CreditCard } from "lucide-react"
import { formatPrice } from "@/lib/utils"

export default async function BookingsPage() {
  const session = await auth()

  if (!session?.user?.email) {
    return (
      <div className="container mx-auto py-20 px-4 xl:px-20 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-[var(--secondary)]/20 bg-[var(--background)] p-10">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mb-4">Please sign in</h1>
          <p className="mb-8 text-[var(--secondary)]/70">You need to be logged in to view your bookings.</p>
          <Link 
            href="/signin" 
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] py-3 font-bold text-[var(--background)] hover:opacity-90 transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  // Hide for admins
  if (session.user.role === 'admin') {
    return (
      <div className="container mx-auto py-20 px-4 xl:px-20 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-[var(--secondary)]/20 bg-[var(--background)] p-10">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mb-4">Access Denied</h1>
          <p className="mb-8 text-[var(--secondary)]/70">Admins should use the admin dashboard to view bookings.</p>
          <Link 
            href="/admin" 
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] py-3 font-bold text-[var(--background)] hover:opacity-90 transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const bookings = await getBookingsByUser(session.user.id)
  
  // Fetch apartment details for each booking
  const bookingsWithApartments = await Promise.all(
    bookings.map(async (booking) => {
      const apartment = await getApartmentById(booking.apartmentId)
      return { ...booking, apartment }
    })
  )

  // Sort bookings: current/future first, then past
  const now = new Date()
  bookingsWithApartments.sort((a, b) => {
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  })

  return (
    <div className="container mx-auto py-12 px-4 xl:px-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">My Bookings</h1>
        <p className="mt-2 text-lg text-[var(--secondary)]/70">Manage your trips and upcoming stays.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-[var(--secondary)]/20 bg-[var(--secondary)]/5">
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No apartment booked... yet!</h3>
          <p className="text-[var(--secondary)]/70 mb-6">Time to dust off your bags and start planning your next adventure.</p>
          <Link 
            href="/apartments" 
            className="inline-flex items-center justify-center rounded-xl bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--background)] hover:bg-[var(--brand)]/90 transition-colors"
          >
            Start exploring
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookingsWithApartments.map((booking) => (
            <div 
              key={booking.id} 
              className="flex flex-col md:flex-row gap-6 rounded-2xl border border-[var(--secondary)]/20 p-6 shadow-sm hover:shadow-md transition-shadow bg-[var(--background)]"
            >
              {/* Image */}
              <div className="relative aspect-video md:aspect-square w-full md:w-48 shrink-0 overflow-hidden rounded-xl bg-[var(--secondary)]/20">
                {booking.apartment ? (
                  <Image
                    src={booking.apartment.images?.[0] || booking.apartment.image}
                    alt={booking.apartment.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--secondary)]/40">
                    No Image
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-semibold text-[var(--foreground)]">
                      {booking.apartment?.title || "Apartment Unavailable"}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      booking.status === 'confirmed' ? 'bg-[var(--brand)]/10 text-[var(--brand)]' : 
                      booking.status === 'cancelled' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 
                      'bg-[var(--secondary)]/10 text-[var(--secondary)]'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex items-center text-[var(--secondary)]/70 text-sm">
                    <MapPin className="mr-1.5 h-4 w-4" />
                    {booking.apartment?.location || "Unknown Location"}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-y-2 gap-x-6 text-sm">
                    <div className="flex items-center text-[var(--secondary)]">
                        <Calendar className="mr-2 h-4 w-4 text-[var(--secondary)]/40" />
                        <span className="font-medium">
                            {new Date(booking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 
                            {' - '} 
                            {new Date(booking.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="flex items-center text-[var(--secondary)]">
                        <CreditCard className="mr-2 h-4 w-4 text-[var(--secondary)]/40" />
                        <span className="font-medium">Total: {formatPrice(booking.totalPrice * 100)}</span> {/* booking.totalPrice is stored as whole units, formatPrice expects kobo if passed as raw number? formatPrice implementation usually expects currency units or handles it. Checking utils... */}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link 
                    href={`/apartments/${booking.apartmentId}`}
                    className="inline-flex items-center justify-center rounded-lg border border-[var(--secondary)]/20 bg-[var(--background)] px-4 py-2 text-sm font-semibold text-[var(--secondary)] hover:bg-[var(--secondary)]/5 transition-colors"
                  >
                    View Listing
                  </Link>
                  {/* Add cancel/support buttons here if needed */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
