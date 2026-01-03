import { Booking, Apartment, User } from "@/types"
import { formatPrice } from "@/lib/utils"
import { Users, Building, CalendarCheck, Wallet } from "lucide-react"

interface AdminStatsProps {
  bookings: Booking[]
  apartments: Apartment[]
  users: User[]
}

export function AdminStats({ bookings, apartments, users }: AdminStatsProps) {
  // Calculate stats
  const totalBookings = bookings.length
  const totalUsers = users.length
  const totalApartments = apartments.length
  
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.totalPrice, 0)

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const monthlyRevenue = bookings
    .filter(b => {
      const date = new Date(b.startDate)
      return b.status === 'confirmed' && date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, b) => sum + b.totalPrice, 0)

  const activeBookings = bookings.filter(b => {
    const now = new Date()
    const start = new Date(b.startDate)
    const end = new Date(b.endDate)
    return b.status === 'confirmed' && now >= start && now <= end
  }).length

  const stats = [
    {
      title: "Total Revenue",
      value: formatPrice(totalRevenue),
      icon: Wallet,
      className: "bg-[var(--brand)] text-[var(--background)]",
    },
    {
      title: "Monthly Revenue",
      value: formatPrice(monthlyRevenue),
      icon: Wallet,
      className: "bg-[var(--accent)] text-[var(--background)]",
    },
    {
      title: "Total Bookings",
      value: totalBookings,
      icon: CalendarCheck,
      className: "bg-[var(--secondary)] text-[var(--background)]",
    },
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      className: "bg-[var(--brand)]/80 text-[var(--background)]",
    },
    {
      title: "Total Apartments",
      value: totalApartments,
      icon: Building,
      className: "bg-[var(--accent)]/80 text-[var(--background)]",
    },
  ]

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat) => (
        <div key={stat.title} className={`relative overflow-hidden rounded-xl p-6 shadow-md transition-transform hover:-translate-y-1 ${stat.className}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">{stat.title}</p>
              <p className="mt-2 text-2xl font-bold">{stat.value}</p>
            </div>
            <div className="rounded-full bg-[var(--background)]/20 p-3 backdrop-blur-sm">
              <stat.icon className="h-6 w-6 text-[var(--background)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
