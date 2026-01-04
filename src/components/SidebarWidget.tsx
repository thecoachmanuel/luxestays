"use client"

import Link from "next/link"
import { Star, TrendingUp, ShieldCheck, Clock } from "lucide-react"
import { Apartment, WhyChooseUsItem, AdvertSettings } from "@/types"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import { useState } from "react"
import { ICON_MAP } from "@/components/IconMap"
import { AdvertCard } from "@/components/AdvertCard"

interface SidebarWidgetProps {
  topRatedApartments: Apartment[]
  whyChooseUs: WhyChooseUsItem[]
  advertSettings?: AdvertSettings
}

export function SidebarWidget({ topRatedApartments, whyChooseUs, advertSettings }: SidebarWidgetProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setMessage("")

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        throw new Error('Failed to subscribe')
      }

      setStatus('success')
      setMessage("Thanks for subscribing!")
      setEmail("")
    } catch (error) {
      setStatus('error')
      setMessage("Something went wrong. Please try again.")
    }
  }

  return (
    <div className="space-y-8">
      {/* Advert Widget */}
      <AdvertCard settings={advertSettings} />

      {/* Why Choose Us Widget */}
      <div className="rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Why Choose Us</h3>
        <div className="space-y-4">
          {whyChooseUs.map((item) => {
            const Icon = ICON_MAP[item.icon] || ShieldCheck
            return (
              <div key={item.id} className="flex items-start gap-3">
                <div className={`rounded-full p-2 ${item.bgColor} ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-xs text-[var(--secondary)]">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Rated Widget */}
      <div className="hidden lg:block rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
          <Star className="h-5 w-5 fill-[var(--brand)] text-[var(--brand)]" />
          Top Rated
        </h3>
        <div className="space-y-4">
          {topRatedApartments.slice(0, 3).map((apt) => (
            <Link 
              key={apt.id} 
              href={`/apartments/${apt.id}`}
              className="flex gap-3 group"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--secondary)]/10">
                <Image
                  src={apt.image}
                  alt={apt.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <div>
                <h4 className="font-medium text-sm line-clamp-1 group-hover:text-[var(--brand)] transition-colors">
                  {apt.title}
                </h4>
                <p className="text-xs text-[var(--secondary)] mb-1">{apt.location}</p>
                <p className="text-sm font-semibold">{formatPrice(apt.price)}</p>
              </div>
            </Link>
          ))}
        </div>
        <Link 
          href="/apartments?sort=rating" 
          className="mt-4 block text-center text-sm font-medium text-[var(--brand)] hover:underline"
        >
          View all top rated
        </Link>
      </div>

      {/* Newsletter Widget */}
      <div className="rounded-xl bg-[var(--foreground)] p-6 text-[var(--background)]">
        <h3 className="mb-2 text-lg font-semibold">Join Our Newsletter</h3>
        <p className="mb-4 text-sm text-[var(--background)]/70">
          Get the latest updates and exclusive offers delivered to your inbox.
        </p>
        <form className="space-y-2" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="w-full rounded-lg bg-[var(--background)]/10 border-[var(--background)]/20 px-4 py-2 text-sm text-[var(--background)] placeholder:text-[var(--background)]/50 focus:ring-2 focus:ring-[var(--brand)]"
            disabled={status === 'loading'}
            required
          />
          <button 
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90 disabled:opacity-50"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
          {message && (
            <p className={`text-xs ${status === 'success' ? 'text-[var(--brand)]' : 'text-[var(--accent)]'}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
