import { getFavorites, getApartmentById } from "@/lib/db"
import { auth } from "@/auth"
import { ApartmentCard } from "@/components/ApartmentCard"
import Link from "next/link"
import { Apartment } from "@/types"

export default async function FavoritesPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    return (
      <div className="container mx-auto py-20 px-4 xl:px-20 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-[var(--secondary)]/20 bg-[var(--background)] p-10">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mb-4">Please sign in</h1>
          <p className="mb-8 text-[var(--secondary)]/70">You need to be logged in to view your favorites.</p>
          <Link 
            href="/signin" 
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] py-3 font-bold text-white hover:opacity-90 transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  const favorites = await getFavorites(session.user.email)
  const apartments = await Promise.all(
    favorites.map(f => getApartmentById(f.apartmentId))
  )
  // Filter out any null/undefined results
  const validApartments = apartments.filter((apt): apt is Apartment => apt !== undefined)

  return (
    <div className="container mx-auto py-12 px-4 xl:px-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">Your Favorites</h1>
        <p className="mt-2 text-lg text-[var(--secondary)]/70">Collect the places you love.</p>
      </div>

      {validApartments.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-[var(--secondary)]/20 bg-[var(--secondary)]/5">
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No favorites yet</h3>
          <p className="text-[var(--secondary)]/70 mb-6">Start exploring to find your next dream stay.</p>
          <Link 
            href="/apartments" 
            className="inline-flex items-center justify-center rounded-xl bg-[var(--brand)] px-6 py-3 font-semibold text-white hover:bg-[var(--brand)]/90 transition-colors"
          >
            Start exploring
          </Link>
        </div>
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {validApartments.map(apt => (
             <ApartmentCard 
               key={apt.id} 
               apartment={apt} 
               initialIsFavorite={true}
               currentUserId={session.user?.email || ''}
               isAdmin={(session.user as any)?.role === 'admin'}
             />
          ))}
        </div>
      )}
    </div>
  )
}
