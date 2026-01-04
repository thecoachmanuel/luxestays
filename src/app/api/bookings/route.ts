import { NextResponse } from "next/server"
import { addBooking, checkApartmentAvailability, getApartmentById, upsertUserContact } from "@/lib/db"
import { Booking } from "@/types"
import { sendBookingInvoiceEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validation handled by client mostly, but good to check
    if (!body.apartmentId || !body.userId || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check availability
    const isAvailable = await checkApartmentAvailability(body.apartmentId, body.startDate, body.endDate)
    if (!isAvailable) {
      return NextResponse.json(
        { error: "Apartment is not available for the selected dates" },
        { status: 409 }
      )
    }

    const newBooking: Booking = {
      id: Date.now().toString(),
      ...body,
      status: body.status || 'confirmed', 
      createdAt: new Date().toISOString(),
      // Ensure coupon data is preserved if sent
      couponCode: body.couponCode,
      discountAmount: body.discountAmount
    }

    await addBooking(newBooking)

    try {
      await upsertUserContact(newBooking.userId, newBooking.guestName, newBooking.guestPhone)
    } catch {}

    // Send invoice email
    try {
      const apartment = await getApartmentById(newBooking.apartmentId)
      if (apartment) {
           await sendBookingInvoiceEmail(newBooking, apartment)
      }
    } catch (emailError) {
      console.error("Failed to send invoice email:", emailError)
      // Don't fail the request, just log it
    }

    return NextResponse.json(newBooking, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating booking" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    
    if (!body.ids || !Array.isArray(body.ids)) {
      return NextResponse.json(
        { error: "Invalid request body. Expected 'ids' array." },
        { status: 400 }
      )
    }

    const { deleteBookings } = await import("@/lib/db")
    await deleteBookings(body.ids)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete booking error:", error)
    return NextResponse.json(
      { error: "Error deleting booking(s)" },
      { status: 500 }
    )
  }
}
