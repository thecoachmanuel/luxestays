import { NextResponse } from "next/server"
import { getBookingsByApartment } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const bookings = await getBookingsByApartment(id)
    return NextResponse.json(bookings)
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching bookings" },
      { status: 500 }
    )
  }
}
