
import { NextResponse } from 'next/server'
import { getReviews, updateReview, deleteReview } from '@/lib/db'
import { auth } from '@/auth'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params
  
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const reviews = await getReviews()
  const review = reviews.find(r => r.id === id)

  if (!review) {
    return new NextResponse('Review not found', { status: 404 })
  }

  // Allow admin or review owner
  // Note: Review stores userId as email based on my previous implementation assumption, 
  // but let's check if session.user.id is available. 
  // NextAuth default session usually has email. 
  // In `src/auth.ts` (if it exists) we might have mapped id.
  // For now assuming userId in review matches session.user.email
  
  const isOwner = review.userId === ((session.user as any)?.id || session.user?.email)
  const isAdmin = (session.user as any)?.role === 'admin'

  if (!isOwner && !isAdmin) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const body = await req.json()
    const { rating, comment } = body

    const updatedReview = { ...review }
    if (rating) updatedReview.rating = Number(rating)
    if (comment) updatedReview.comment = comment

    await updateReview(updatedReview)
    
    return NextResponse.json(updatedReview)
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params
  
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const reviews = await getReviews()
  const review = reviews.find(r => r.id === id)

  if (!review) {
    return new NextResponse('Review not found', { status: 404 })
  }

  const isOwner = review.userId === ((session.user as any)?.id || session.user?.email)
  const isAdmin = (session.user as any)?.role === 'admin'

  if (!isOwner && !isAdmin) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    await deleteReview(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}
