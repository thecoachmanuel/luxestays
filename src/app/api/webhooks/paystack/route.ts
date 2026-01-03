import { NextResponse } from "next/server"
import crypto from "crypto"
import { getBookings, updateBooking } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    if (!signature) {
      return NextResponse.json({ message: "No signature provided" }, { status: 400 })
    }

    const secret = process.env.PAYSTACK_SECRET_KEY || "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    const hash = crypto.createHmac("sha512", secret).update(body).digest("hex")

    if (hash !== signature) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(body)

    if (event.event === "charge.success") {
      const { reference } = event.data
      
      // Find the booking with this reference
      const bookings = await getBookings()
      const booking = bookings.find(b => b.paymentReference === reference)

      if (booking) {
        // Update booking status to confirmed if it's not already
        if (booking.status !== 'confirmed') {
            await updateBooking({ ...booking, status: 'confirmed' })
            console.log(`Booking ${booking.id} confirmed via webhook`)
        }
      } else {
          // In a production app, you might create the booking here if it doesn't exist
          // using metadata from the payment
          console.log("Booking not found for reference:", reference)
      }
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ message: "Webhook handler failed" }, { status: 500 })
  }
}
