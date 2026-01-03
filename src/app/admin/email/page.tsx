"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Loader2, Send, Users, Mail, Copy, Check } from "lucide-react"
import { Subscriber, EmailCampaign } from "@/types"

type EmailForm = {
  subject: string
  message: string
  recipients: string
  individualEmail?: string
}

export default function BulkEmailPage() {
  const [isSending, setIsSending] = useState(false)
  const [status, setStatus] = useState("")
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const { register, handleSubmit, reset, watch, setValue } = useForm<EmailForm>()
  const recipients = watch("recipients")

  const handleExport = (type: 'subscribers' | 'users') => {
    window.location.href = `/api/newsletter/export?type=${type}`
  }

  const fetchCampaigns = () => {
    fetch('/api/email')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
            setCampaigns(data)
        }
      })
      .catch(console.error)
  }

  useEffect(() => {
    fetch('/api/newsletter/subscribers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
            setSubscribers(data)
        }
      })
      .catch(console.error)

    fetchCampaigns()
  }, [])

  const copyToClipboard = (email: string, id: string) => {
    navigator.clipboard.writeText(email)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const onSubmit = async (data: EmailForm) => {
    setIsSending(true)
    setStatus("")
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (res.ok) {
        setStatus(`Success! ${result.count} emails queued for sending.`)
        reset()
        fetchCampaigns()
      } else {
        setStatus(result.error || "Failed to send emails.")
      }
    } catch (error) {
      setStatus("Error sending emails.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Email Management</h1>
        <div className="flex gap-2">
            <button 
                onClick={() => handleExport('subscribers')}
                className="bg-[var(--background)] border border-[var(--secondary)]/20 text-[var(--foreground)] px-3 py-2 rounded-md text-sm font-medium hover:bg-[var(--secondary)]/10 flex items-center gap-2"
            >
                <Users className="h-4 w-4" /> Export Subscribers
            </button>
             <button 
                onClick={() => handleExport('users')}
                className="bg-[var(--background)] border border-[var(--secondary)]/20 text-[var(--foreground)] px-3 py-2 rounded-md text-sm font-medium hover:bg-[var(--secondary)]/10 flex items-center gap-2"
            >
                <Users className="h-4 w-4" /> Export All Users
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {status && (
            <div className={`p-4 mb-6 rounded-md ${status.includes("Success") ? "bg-[var(--brand)]/10 text-[var(--brand)]" : "bg-[var(--accent)]/10 text-[var(--accent)]"}`}>
              {status}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-[var(--background)] p-6 rounded-lg border border-[var(--secondary)]/20 shadow-sm">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">Recipients</label>
              <select 
                {...register("recipients")}
                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
              >
                <option value="all">All Users</option>
                <option value="newsletter">Newsletter Subscribers</option>
                <option value="individual">Individual</option>
              </select>
            </div>

            {recipients === 'individual' && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">Email Address</label>
                <input
                  {...register("individualEmail", { required: recipients === 'individual' })}
                  type="email"
                  className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                  placeholder="user@example.com"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">Subject</label>
              <input
                {...register("subject", { required: true })}
                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                placeholder="Welcome to CityDwell Apartments"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">Message</label>
              <textarea
                {...register("message", { required: true })}
                rows={6}
                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                placeholder="Write your message here..."
              />
            </div>

            <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-2 bg-[var(--brand)] text-[var(--background)] px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
            >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Emails
            </button>
          </form>

          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 text-[var(--foreground)]">Recent Campaigns</h3>
            <div className="bg-[var(--background)] rounded-lg border border-[var(--secondary)]/20 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[var(--secondary)]/5 border-b border-[var(--secondary)]/20">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--secondary)] uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--secondary)] uppercase">Subject</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--secondary)] uppercase">Sent</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--secondary)] uppercase">Opened</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--secondary)] uppercase">Rate</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--secondary)]/20">
                        {campaigns.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--secondary)]">No campaigns sent yet.</td>
                            </tr>
                        ) : (
                            campaigns.map(c => {
                                const rate = c.totalSent > 0 ? Math.round((c.totalOpened / c.totalSent) * 100) : 0;
                                return (
                                    <tr key={c.id}>
                                        <td className="px-4 py-3 text-sm text-[var(--secondary)]">
                                            {new Date(c.sentAt).toLocaleDateString()} {new Date(c.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                                            {c.subject}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--secondary)]">
                                            {c.totalSent}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--secondary)]">
                                            {c.totalOpened}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                rate > 50 ? 'bg-green-100 text-green-800' :
                                                rate > 20 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {rate}%
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        </div>

        <div>
            <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--secondary)]/20 shadow-sm h-fit">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-[var(--foreground)]">
                    <Users className="h-5 w-5" />
                    Subscribers ({subscribers.length})
                </h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {subscribers.length === 0 ? (
                        <p className="text-sm text-[var(--secondary)]">No subscribers yet.</p>
                    ) : (
                        subscribers.map((sub) => (
                            <div key={sub.email} className="flex items-center justify-between p-3 bg-[var(--secondary)]/5 rounded-md border border-[var(--secondary)]/10">
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium truncate text-[var(--foreground)]" title={sub.email}>{sub.email}</p>
                                    <p className="text-xs text-[var(--secondary)]">
                                        {new Date(sub.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(sub.email, sub.email)}
                                    className="text-[var(--secondary)] hover:text-[var(--brand)] p-1"
                                    title="Copy email"
                                >
                                    {copiedId === sub.email ? <Check className="h-4 w-4 text-[var(--brand)]" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
