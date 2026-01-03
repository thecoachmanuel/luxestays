"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { differenceInDays, addDays } from "date-fns"
import { Apartment, Booking } from "@/types"
import { formatPrice } from "@/lib/utils"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const PaystackButton = dynamic(
  () => import("react-paystack").then((mod) => mod.PaystackButton),
  { ssr: false }
)

interface BookingFormProps {
  apartment: Apartment
  paystackPublicKey?: string
  rating: number
  reviewCount: number
  cleaningFee?: number
}

export function BookingForm({ apartment, paystackPublicKey, rating, reviewCount, cleaningFee = 0 }: BookingFormProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [phone, setPhone] = useState("")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isAvailable, setIsAvailable] = useState(true)
  const [couponCode, setCouponCode] = useState("")
  const [discountAmount, setDiscountAmount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, type: string, value: number} | null>(null)
  const [couponMessage, setCouponMessage] = useState("")
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false)

  // Fetch existing bookings to check availability
  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch(`/api/apartments/${apartment.id}/bookings`)
        if (res.ok) {
           const data = await res.json()
           setBookings(data)
        }
      } catch (e) {
        console.error("Failed to fetch bookings", e)
      }
    }
    fetchBookings()
  }, [apartment.id])

  const checkAvailability = (start: Date, end: Date) => {
    // Check if any existing confirmed booking overlaps
    return !bookings.some(booking => {
        const bStart = new Date(booking.startDate)
        const bEnd = new Date(booking.endDate)
        return start < bEnd && end > bStart
    })
  }

  const [days, setDays] = useState(0)

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      // Check for overlap immediately when dates change
      if (!checkAvailability(start, end)) {
         setIsAvailable(false)
      } else {
         setIsAvailable(true)
      }

      const d = differenceInDays(end, start)
      setDays(d > 0 ? d : 0)
    } else {
      setDays(0)
      setIsAvailable(true)
    }
  }, [startDate, endDate, bookings])

  // Recalculate discount if days change
  useEffect(() => {
    if (appliedCoupon && days > 0) {
      const originalTotal = days * apartment.price
      let discount = 0
      if (appliedCoupon.type === 'percentage') {
        discount = (originalTotal * appliedCoupon.value) / 100
      } else {
        discount = appliedCoupon.value
      }
      // Ensure discount doesn't exceed total
      setDiscountAmount(Math.min(discount, originalTotal))
    } else {
      setDiscountAmount(0)
    }
  }, [days, appliedCoupon, apartment.price])

  const handleApplyCoupon = async () => {
    if (!couponCode) return
    setIsCheckingCoupon(true)
    setCouponMessage("")
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode })
      })

      if (res.ok) {
        const coupon = await res.json()
        setAppliedCoupon({
          code: coupon.code,
          type: coupon.discountType,
          value: coupon.discountValue
        })
        setCouponMessage("Coupon applied successfully!")
      } else {
        const error = await res.json()
        setCouponMessage(error.error || "Invalid coupon")
        setAppliedCoupon(null)
        setDiscountAmount(0)
      }
    } catch (error) {
      setCouponMessage("Error validating coupon")
    } finally {
      setIsCheckingCoupon(false)
    }
  }

  const baseAmount = days * apartment.price
  const finalAmount = Math.max(0, baseAmount + cleaningFee - discountAmount)
  const amount = finalAmount * 100 // Paystack expects amount in kobo

  const handleSuccess = async (reference: any) => {
    try {
        // 1. Verify payment (optional but recommended)
        // const verifyRes = await fetch("/api/verify", { ... })

        // 2. Create booking
        const bookingRes = await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                apartmentId: apartment.id,
                userId: session?.user?.email, // Using email as ID
                startDate,
                endDate,
                totalPrice: finalAmount,
                paymentReference: reference.reference,
                status: 'confirmed',
                couponCode: appliedCoupon?.code,
                discountAmount: discountAmount
            }),
        })

        if (bookingRes.ok) {
            alert("Payment successful! Your booking is confirmed.")
            // Reset form
            setStartDate("")
            setEndDate("")
            // Redirect to bookings page
            router.push("/bookings")
        } else {
            alert("Booking creation failed. Please contact support.")
        }
    } catch (error) {
        console.error("Booking process failed", error)
        alert("An error occurred while processing your booking.")
    }
  }

  const componentProps = {
    email: session?.user?.email || "",
    amount,
    metadata: {
      name: session?.user?.name || "",
      phone,
      custom_fields: [
        {
            display_name: "Apartment ID",
            variable_name: "apartment_id",
            value: apartment.id
        }
      ]
    },
    publicKey: paystackPublicKey || process.env.NEXT_PUBLIC_PAYSTACK_KEY || "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    text: "Pay Now",
    onSuccess: handleSuccess,
    onClose: () => alert("Payment cancelled"),
  }

  if (!session) {
    return (
        <div className="rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">Book this Apartment</h3>
            <p className="mb-4 text-[var(--secondary)]">Please sign in to book this apartment.</p>
            <div className="flex flex-col gap-3">
                <Link 
                  href={`/signin?callbackUrl=${encodeURIComponent(pathname)}`}
                  className="block w-full text-center rounded-lg bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--background)] hover:opacity-90 transition-opacity"
                >
                    Sign In
                </Link>
                <div className="text-center text-sm text-[var(--secondary)]">
                    Don't have an account? <Link href="/signup" className="text-[var(--brand)] underline">Sign up</Link>
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] p-4 sm:p-6 shadow-xl sticky top-28">
      <div className="flex items-baseline justify-between mb-6">
          <div>
            <span className="text-2xl font-bold">{formatPrice(apartment.price)}</span>
            <span className="text-[var(--secondary)]"> night</span>
          </div>
          <div className="text-sm text-[var(--secondary)]">
             <span className="font-semibold text-[var(--foreground)]">{rating}</span> · {reviewCount} reviews
          </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 border border-[var(--secondary)] rounded-lg overflow-hidden">
            <div className="border-r border-[var(--secondary)] p-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]">Check-in</label>
              <input
                type="date"
                className="w-full p-1 text-sm outline-none bg-transparent cursor-pointer"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="p-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]">Check-out</label>
              <input
                type="date"
                className="w-full p-1 text-sm outline-none bg-transparent cursor-pointer"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate ? addDays(new Date(startDate), 1).toISOString().split('T')[0] : addDays(new Date(), 1).toISOString().split('T')[0]}
              />
            </div>
        </div>
        
         <div className="border border-[var(--secondary)] rounded-lg p-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]">Phone</label>
          <input
            type="tel"
            className="w-full p-1 text-sm outline-none bg-transparent"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter at least 10 digits"
          />
        </div>
        {phone && phone.length < 10 && (
            <p className="text-xs text-red-500">Phone number must be at least 10 digits</p>
        )}

        {/* Coupon Input */}
        <div className="flex gap-2">
            <div className="border border-[var(--secondary)] rounded-lg p-2 flex-1">
                <input
                    type="text"
                    className="w-full p-1 text-sm outline-none bg-transparent uppercase text-[var(--foreground)] placeholder-[var(--secondary)]/50"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter Coupon Code"
                    disabled={!!appliedCoupon}
                />
            </div>
            {appliedCoupon ? (
                <button
                    onClick={() => {
                        setAppliedCoupon(null)
                        setDiscountAmount(0)
                        setCouponCode("")
                        setCouponMessage("")
                    }}
                    className="px-4 py-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg text-sm font-medium hover:bg-[var(--accent)]/20"
                >
                    Remove
                </button>
            ) : (
                <button
                    onClick={handleApplyCoupon}
                    disabled={isCheckingCoupon || !couponCode}
                    className="px-4 py-2 bg-[var(--secondary)]/10 text-[var(--secondary)] rounded-lg text-sm font-medium hover:bg-[var(--secondary)]/20 disabled:opacity-50"
                >
                    {isCheckingCoupon ? "..." : "Apply"}
                </button>
            )}
        </div>
        {couponMessage && (
            <p className={`text-xs ${appliedCoupon ? "text-[var(--accent)]" : "text-[var(--accent)]"}`}>
                {couponMessage}
            </p>
        )}

        {amount > 0 && phone && phone.length >= 10 ? (
           isAvailable ? (
             <PaystackButton {...componentProps} className="w-full rounded-lg bg-[var(--brand)] py-3 font-semibold text-[var(--background)] hover:opacity-90 transition-opacity" />
           ) : (
             <div className="w-full rounded-lg bg-red-100 py-3 font-semibold text-red-600 text-center">
                Dates unavailable
             </div>
           )
        ) : (
            <button disabled className="w-full rounded-lg bg-[var(--brand)] py-3 font-semibold text-[var(--background)] opacity-50 cursor-not-allowed">
                Reserve
            </button>
        )}
        
        <p className="text-center text-sm text-[var(--secondary)] mt-2">You won't be charged yet</p>

        <div className="pt-4 space-y-3">
          {days > 0 && (
            <>
             <div className="flex justify-between text-[var(--secondary)] underline decoration-[var(--secondary)]/30">
                <span>{formatPrice(apartment.price)} x {days} nights</span>
                <span>{formatPrice(baseAmount)}</span>
             </div>
             <div className="flex justify-between text-[var(--secondary)] underline decoration-[var(--secondary)]/30">
                <span>Cleaning fee</span>
                <span>{formatPrice(cleaningFee)}</span>
             </div>
             {discountAmount > 0 && (
                 <div className="flex justify-between text-[var(--accent)] font-medium">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                 </div>
             )}
            </>
          )}
          <div className="border-t pt-4 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{(startDate && endDate && phone && phone.length >= 10) ? formatPrice(finalAmount) : "Nil"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
