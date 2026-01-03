"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, List, Settings, Mail, PlusCircle, CalendarCheck, Tag, MessageSquare } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
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
        {children}
      </main>
    </div>
  )
}
