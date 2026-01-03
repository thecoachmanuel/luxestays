import Link from "next/link"
import { PlusCircle, List, Settings, Users, Mail, Tags, Calendar, Star, Phone, Megaphone, MonitorPlay } from "lucide-react"
import { getBookings, getApartments, getUsers } from "@/lib/db"
import { AdminStats } from "@/components/admin/AdminStats"

export default async function AdminPage() {
  const bookings = await getBookings()
  const apartments = await getApartments()
  const users = await getUsers()

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Admin Dashboard</h1>
      
      <AdminStats bookings={bookings} apartments={apartments} users={users} />
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/availability" className="flex flex-col items-center justify-center rounded-lg border bg-[var(--background)] p-8 text-center shadow-sm transition-colors hover:border-[var(--brand)] hover:shadow-md">
          <MonitorPlay className="mb-4 h-12 w-12 text-[var(--brand)]" />
          <h2 className="text-xl font-semibold">Availability Monitor</h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">Live apartment status</p>
        </Link>

        <Link href="/admin/add-apartment" className="flex flex-col items-center justify-center rounded-lg border bg-[var(--background)] p-8 text-center shadow-sm transition-colors hover:border-[var(--brand)] hover:shadow-md">
          <PlusCircle className="mb-4 h-12 w-12 text-[var(--brand)]" />
          <h2 className="text-xl font-semibold">Add Listing</h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">List a new property</p>
        </Link>
        
        <Link href="/admin/listings" className="flex flex-col items-center justify-center rounded-lg border bg-[var(--background)] p-8 text-center shadow-sm transition-colors hover:border-[var(--brand)] hover:shadow-md">
          <List className="mb-4 h-12 w-12 text-[var(--brand)]" />
          <h2 className="text-xl font-semibold">Manage Listings</h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">Edit or remove listings</p>
        </Link>

        <Link href="/admin/bookings" className="flex flex-col items-center justify-center rounded-lg border bg-[var(--background)] p-8 text-center shadow-sm transition-colors hover:border-[var(--brand)] hover:shadow-md">
          <Calendar className="mb-4 h-12 w-12 text-[var(--brand)]" />
          <h2 className="text-xl font-semibold">Bookings</h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">View all bookings</p>
        </Link>

        <Link href="/admin/users" className="flex flex-col items-center justify-center rounded-lg border bg-[var(--background)] p-8 text-center shadow-sm transition-colors hover:border-[var(--brand)] hover:shadow-md">
          <Users className="mb-4 h-12 w-12 text-[var(--brand)]" />
          <h2 className="text-xl font-semibold">Users</h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">Manage user accounts</p>
        </Link>

        <Link href="/admin/categories" className="flex flex-col items-center justify-center rounded-lg border bg-[var(--background)] p-8 text-center shadow-sm transition-colors hover:border-[var(--brand)] hover:shadow-md">
          <Tags className="mb-4 h-12 w-12 text-[var(--brand)]" />
          <h2 className="text-xl font-semibold">Categories</h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">Manage listing categories</p>
        </Link>

         <Link href="/admin/email" className="flex flex-col items-center justify-center rounded-lg border bg-[var(--background)] p-8 text-center shadow-sm transition-colors hover:border-[var(--brand)] hover:shadow-md">
          <Mail className="mb-4 h-12 w-12 text-[var(--brand)]" />
          <h2 className="text-xl font-semibold">Bulk Email</h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">Send updates to users</p>
        </Link>

        <Link href="/admin/messages" className="flex flex-col items-center justify-center rounded-lg border bg-[var(--background)] p-8 text-center shadow-sm transition-colors hover:border-[var(--brand)] hover:shadow-md">
          <Mail className="mb-4 h-12 w-12 text-[var(--brand)]" />
          <h2 className="text-xl font-semibold">Messages</h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">View contact inquiries</p>
        </Link>

        <Link href="/admin/chat" className="flex flex-col items-center justify-center rounded-lg border bg-[var(--background)] p-8 text-center shadow-sm transition-colors hover:border-[var(--brand)] hover:shadow-md">
          <div className="mb-4 h-12 w-12 flex items-center justify-center text-[var(--brand)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h2 className="text-xl font-semibold">Live Chat</h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">Chat with users</p>
        </Link>

        <Link href="/admin/why-choose-us" className="flex flex-col items-center justify-center rounded-lg border bg-[var(--background)] p-8 text-center shadow-sm transition-colors hover:border-[var(--brand)] hover:shadow-md">
          <Star className="mb-4 h-12 w-12 text-[var(--brand)]" />
          <h2 className="text-xl font-semibold">Why Choose Us</h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">Edit homepage features</p>
        </Link>

        <Link href="/admin/contact-page" className="flex flex-col items-center justify-center rounded-lg border bg-[var(--background)] p-8 text-center shadow-sm transition-colors hover:border-[var(--brand)] hover:shadow-md">
          <Phone className="mb-4 h-12 w-12 text-[var(--brand)]" />
          <h2 className="text-xl font-semibold">Contact Page</h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">Edit contact info</p>
        </Link>

        <Link href="/admin/advert" className="flex flex-col items-center justify-center rounded-lg border bg-[var(--background)] p-8 text-center shadow-sm transition-colors hover:border-[var(--brand)] hover:shadow-md">
          <Megaphone className="mb-4 h-12 w-12 text-[var(--brand)]" />
          <h2 className="text-xl font-semibold">Sidebar Advert</h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">Manage sidebar ad</p>
        </Link>

         <Link href="/admin/settings" className="flex flex-col items-center justify-center rounded-lg border bg-[var(--background)] p-8 text-center shadow-sm transition-colors hover:border-[var(--brand)] hover:shadow-md">
          <Settings className="mb-4 h-12 w-12 text-[var(--brand)]" />
          <h2 className="text-xl font-semibold">Settings</h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">Configure site preferences</p>
        </Link>
      </div>
    </div>
  )
}
