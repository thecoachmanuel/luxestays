
import { NextResponse } from 'next/server'
import { addReview, getReviews } from '@/lib/db'
import { auth } from '@/auth'
import { Review } from '@/types'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const apartmentId = searchParams.get('apartmentId')
  const userId = searchParams.get('userId')

  let reviews = await getReviews()

  if (apartmentId) {
    reviews = reviews.filter(r => r.apartmentId === apartmentId)
  }
  
  if (userId) {
    reviews = reviews.filter(r => r.userId === userId)
  }

  return NextResponse.json(reviews)
}

export async function POST(req: Request) {
  const session = await auth()
  
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const { apartmentId, rating, comment, userName } = body

    if (!apartmentId || !rating || !comment) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const parsedRating = Number(rating)
    const clampedRating = Math.max(1, Math.min(5, parsedRating))

    const newReview: Review = {
      id: Date.now().toString(),
      apartmentId,
      userId: (session.user as any).id || session.user.email!,
      userName: userName || session.user.name || 'Anonymous',
      rating: clampedRating,
      comment,
      createdAt: new Date().toISOString()
    }

    await addReview(newReview)
    
    return NextResponse.json(newReview)
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}
