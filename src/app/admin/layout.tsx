"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Users, List, Settings, Mail, PlusCircle, CalendarCheck, Tag, MessageSquare, Bell, BarChart3, LogOut } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === '/admin/login') {
      return <>{children}</>
  }

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
    { href: "/admin/listings", label: "Manage Listings", icon: List },
    { href: "/admin/bookings", label: "Manage Bookings", icon: CalendarCheck },
    { href: "/admin/coupons", label: "Manage Coupons", icon: Tag },
    { href: "/admin/users", label: "Users Management", icon: Users },
    { href: "/admin/chat", label: "Live Chat", icon: MessageSquare },
    { href: "/admin/email", label: "Bulk Email", icon: Mail },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ]

  const SidebarContent = () => (
    <div className="p-4 space-y-2">
      {links.map((link) => {
        const Icon = link.icon
        const isActive = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-[var(--brand)] text-white"
                : "text-[var(--secondary)] hover:bg-[var(--secondary)]/10"
            }`}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        )
      })}
       <Link
          href="/admin/add-apartment"
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === "/admin/add-apartment"
               ? "bg-[var(--brand)] text-[var(--background)]"
               : "text-[var(--secondary)] hover:bg-[var(--secondary)]/10"
          }`}
        >
          <PlusCircle className="h-4 w-4" />
          Add Listing
        </Link>

        <button
          onClick={async () => {
            await signOut({ redirect: false })
            router.push("/admin/login")
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mt-4"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] relative">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-[var(--secondary)]/5 border-r border-[var(--secondary)]/20 hidden md:block">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <AdminHeaderNotifications />
        {children}
      </main>
    </div>
  )
}

function AdminHeaderNotifications() {
  const [count, setCount] = useState<number>(0)

  useEffect(() => {
    let mounted = true
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/admin/notifications', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (mounted && typeof data.count === 'number') setCount(data.count)
      } catch (_) {}
    }
    fetchCount()
    const interval = setInterval(fetchCount, 10000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex items-center justify-end mb-4">
      <Link href="/admin/notifications" className="relative p-2 rounded-full hover:bg-[var(--secondary)]/10 transition-colors" aria-label="Notifications">
        <Bell className="h-6 w-6 text-[var(--foreground)]" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center">
            {count}
          </span>
        )}
      </Link>
    </div>
  )
}
