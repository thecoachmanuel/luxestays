"use client"

import { useState } from "react"
import { Send } from "lucide-react"

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    const data = {
        name: `${formData.get('firstName')} ${formData.get('lastName')}`,
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        message: formData.get('message'),
    }

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })

        if (!response.ok) throw new Error('Failed to send message')
        
        setSubmitted(true)
    } catch (err) {
        setError('Something went wrong. Please try again.')
    } finally {
        setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--secondary)]/20 bg-[var(--background)] p-8 shadow-sm">
        {submitted ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
                <div className="mb-6 rounded-full bg-[var(--brand)]/10 p-4">
                    <Send className="h-8 w-8 text-[var(--brand)]" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-[var(--foreground)]">Message Sent!</h3>
                <p className="text-[var(--secondary)]">
                    Thank you for reaching out. We'll get back to you shortly.
                </p>
                <button 
                    onClick={() => setSubmitted(false)}
                    className="mt-8 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand)]/80"
                >
                    Send another message
                </button>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label htmlFor="firstName" className="text-sm font-medium text-[var(--foreground)]">
                            First name
                        </label>
                        <input
                            id="firstName"
                            name="firstName"
                            required
                            className="w-full rounded-lg border border-[var(--secondary)]/20 bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--secondary)]/50 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                            placeholder="John"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="lastName" className="text-sm font-medium text-[var(--foreground)]">
                            Last name
                        </label>
                        <input
                            id="lastName"
                            name="lastName"
                            required
                            className="w-full rounded-lg border border-[var(--secondary)]/20 bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--secondary)]/50 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                            placeholder="Doe"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-[var(--foreground)]">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="w-full rounded-lg border border-[var(--secondary)]/20 bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--secondary)]/50 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                        placeholder="john@example.com"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-[var(--foreground)]">
                        Phone number
                    </label>
                    <input
                        id="phone"
                        name="phone"
                        type="tel"
                        className="w-full rounded-lg border border-[var(--secondary)]/20 bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--secondary)]/50 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                        placeholder="+1 (555) 000-0000"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-[var(--foreground)]">
                        Subject
                    </label>
                    <select
                        id="subject"
                        name="subject"
                        required
                        className="w-full rounded-lg border border-[var(--secondary)]/20 bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                    >
                        <option value="">Select a topic</option>
                        <option value="booking">Booking Inquiry</option>
                        <option value="support">Guest Support</option>
                        <option value="partnership">Partnership</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-[var(--foreground)]">
                        Message
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        required
                        rows={4}
                        className="w-full resize-none rounded-lg border border-[var(--secondary)]/20 bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--secondary)]/50 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                        placeholder="How can we help you?"
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-[var(--brand)] px-4 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand)]/90 disabled:opacity-50"
                >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
            </form>
        )}
    </div>
  )
}
