import Link from "next/link"
import { getBookings, getConversations, getMessages, getUsers, getAdminNotificationCount } from "@/lib/db"
import { Calendar, MessageSquare, Users, Bell } from "lucide-react"
import { MarkAllReadButton } from "./mark-read-button"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminNotificationsPage() {
  const [bookings, conversations, messages, users, totalCount] = await Promise.all([
    getBookings(),
    getConversations(),
    getMessages(),
    getUsers(),
    getAdminNotificationCount()
  ])

  const now = new Date()
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const unreadConversations = conversations.filter(c => (c.unreadCount || 0) > 0 && c.status !== 'archived')
  const newMessages = messages.filter(m => m.status === 'new' || !m.read)
  const newUsers = users.filter(u => new Date(u.createdAt) >= last24h)
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Notifications</h1>
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
                <Bell className="h-5 w-5 text-[var(--brand)]" />
                <span className="text-sm">{totalCount} updates</span>
            </div>
        </div>
        <MarkAllReadButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Pending Bookings" value={pendingBookings.length} icon={<Calendar className="h-6 w-6" />} href="/admin/bookings" />
        <SummaryCard title="Unread Chats" value={unreadConversations.length} icon={<MessageSquare className="h-6 w-6" />} href="/admin/chat" />
        <SummaryCard title="New Messages" value={newMessages.length} icon={<MessageSquare className="h-6 w-6" />} href="/admin/messages" />
        <SummaryCard title="New Users (24h)" value={newUsers.length} icon={<Users className="h-6 w-6" />} href="/admin/users" />
      </div>

      <Section title="Pending Bookings" empty="No pending bookings." href="/admin/bookings">
        {pendingBookings.slice(0, 6).map(b => (
          <li key={b.id} className="flex items-center justify-between py-2">
            <div className="text-sm">
              <span className="font-medium">#{b.id}</span> · {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()} · ${b.totalPrice}
            </div>
            <Link href="/admin/bookings" className="text-[var(--brand)] text-sm">Review</Link>
          </li>
        ))}
      </Section>

      <Section title="Unread Chats" empty="No unread chats." href="/admin/chat">
        {unreadConversations.slice(0, 6).map(c => (
          <li key={c.id} className="flex items-center justify-between py-2">
            <div className="text-sm">
              <span className="font-medium">{c.userName || c.userEmail || 'User'}</span> · {c.unreadCount} unread · last {new Date(c.lastMessageAt).toLocaleString()}
            </div>
            <Link href="/admin/chat" className="text-[var(--brand)] text-sm">Open Chat</Link>
          </li>
        ))}
      </Section>

      <Section title="New Messages" empty="No new messages." href="/admin/messages">
        {newMessages.slice(0, 6).map(m => (
          <li key={m.id} className="flex items-center justify-between py-2">
            <div className="text-sm">
              <span className="font-medium">{m.name || m.email}</span> · {m.subject}
            </div>
            <Link href="/admin/messages" className="text-[var(--brand)] text-sm">View</Link>
          </li>
        ))}
      </Section>

      <Section 
        title="New Users (24h)" 
        empty="No new users in the last 24 hours." 
        href="/admin/users"
      >
        {newUsers.slice(0, 6).map(u => (
          <li key={u.id} className="flex items-center justify-between py-2">
            <div className="text-sm">
              <span className="font-medium">{u.name || u.email}</span> · joined {new Date(u.createdAt).toLocaleString()}
            </div>
            <Link href="/admin/users" className="text-[var(--brand)] text-sm">Manage</Link>
          </li>
        ))}
      </Section>
    </div>
  )
}

function SummaryCard({ title, value, icon, href }: { title: string; value: number; icon: React.ReactNode; href: string }) {
  return (
    <Link href={href} className="group block">
      <div className="rounded-xl border bg-[var(--background)] p-5 shadow-sm transition-colors group-hover:border-[var(--brand)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--secondary)]">{title}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
          <div className="rounded-full bg-[var(--secondary)]/10 p-3 text-[var(--brand)]">
            {icon}
          </div>
        </div>
      </div>
    </Link>
  )
}

function Section({ title, children, empty, href, action }: { title: string; children: React.ReactNode; empty: string; href: string, action?: React.ReactNode }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : true
  return (
    <div className="rounded-xl border bg-[var(--background)] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            {action}
        </div>
        <Link href={href} className="text-[var(--brand)] text-sm">Go to {title}</Link>
      </div>
      <ul className="divide-y">
        {hasItems ? children : (
          <li className="py-4 text-sm text-[var(--secondary)]">{empty}</li>
        )}
      </ul>
    </div>
  )
}
