import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { addFavorite, removeFavorite, isFavorite, getFavorites, getApartmentById } from "@/lib/db"

export async function POST(req: Request) {
  const session = await auth()
  if (!session || !session.user || !session.user.email) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { apartmentId } = await req.json()
    const userId = session.user.email

    const exists = await isFavorite(userId, apartmentId)

    if (exists) {
      await removeFavorite(userId, apartmentId)
      return NextResponse.json({ isFavorite: false })
    } else {
      await addFavorite(userId, apartmentId)
      return NextResponse.json({ isFavorite: true })
    }
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session || !session.user || !session.user.email) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const apartmentId = searchParams.get('apartmentId')

  // If checking specific apartment status
  if (apartmentId) {
    const status = await isFavorite(session.user.email, apartmentId)
    return NextResponse.json({ isFavorite: status })
  }

  // List all favorites (full apartment details)
  try {
    const favorites = await getFavorites(session.user.email)
    const apartments = await Promise.all(
      favorites.map(async (fav) => {
        return await getApartmentById(fav.apartmentId)
      })
    )
    // Filter out any undefined (in case apartment was deleted)
    return NextResponse.json(apartments.filter(Boolean))
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}
