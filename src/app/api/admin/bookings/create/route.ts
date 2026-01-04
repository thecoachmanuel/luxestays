import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      apartmentId, 
      startDate, 
      endDate, 
      userId, 
      guestName, 
      guestEmail, 
      guestPhone, 
      totalPrice,
      status 
    } = body

    if (!apartmentId || !startDate || !endDate || !guestName || !guestEmail || !totalPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // 1. Check Availability
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        apartmentId,
        status: { in: ['confirmed', 'pending'] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start }
          }
        ]
      }
    })

    if (conflictingBooking) {
      return NextResponse.json({ error: 'Apartment is not available for these dates' }, { status: 409 })
    }

    // 2. Determine User ID
    let finalUserId = userId

    if (!finalUserId) {
      // Check if user exists by email
      const existingUser = await prisma.user.findUnique({
        where: { email: guestEmail }
      })

      if (existingUser) {
        finalUserId = existingUser.id
      } else {
        // Create new shadow/guest user
        // Password is optional in schema, so we can leave it null or set a random one
        const newUser = await prisma.user.create({
          data: {
            email: guestEmail,
            name: guestName,
            phone: guestPhone,
            role: 'user',
            // No password set implies they can't login until they reset it or register properly
            createdAt: new Date()
          }
        })
        finalUserId = newUser.id
      }
    }

    // 3. Create Booking
    const newBooking = await prisma.booking.create({
      data: {
        apartmentId,
        userId: finalUserId,
        startDate: start,
        endDate: end,
        totalPrice: parseFloat(totalPrice.toString()),
        status: status || 'confirmed',
        guestName,
        guestEmail,
        guestPhone: guestPhone || '',
        paymentReference: `ADMIN-${Date.now()}`, // Mark as admin booking
        createdAt: new Date()
      }
    })

    return NextResponse.json({ success: true, booking: newBooking })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
