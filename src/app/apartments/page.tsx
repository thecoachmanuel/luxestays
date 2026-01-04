export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getApartments, getCategories, getFavorites } from "@/lib/db"
import { ApartmentCard } from "@/components/ApartmentCard"
import Link from "next/link"
import { auth } from "@/auth"
import { ICON_MAP } from "@/components/IconMap"

interface PageProps {
    searchParams: Promise<{ category?: string; query?: string }>
}

export default async function ApartmentsPage({ searchParams }: PageProps) {
  const { category, query } = await searchParams
  const allApartments = await getApartments()
  const categoriesData = await getCategories()
  const session = await auth()
  const favorites = session?.user?.id ? await getFavorites(session.user.id) : []
  const favoriteIds = new Set(favorites.map(f => f.apartmentId))
  
  let apartments = allApartments

  if (category) {
    apartments = apartments.filter(a => a.category?.toLowerCase() === category.toLowerCase())
  }

  if (query) {
    const lowerQuery = query.toLowerCase()
    apartments = apartments.filter(a => 
      a.title.toLowerCase().includes(lowerQuery) || 
      a.location.toLowerCase().includes(lowerQuery) ||
      a.description.toLowerCase().includes(lowerQuery)
    )
  }

  const categories = categoriesData // .map(c => c.name)

  return (
    <div className="container mx-auto py-8 px-4 xl:px-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          {query ? `Search results for "${query}"` : (category ? `${category} stays` : 'All stays')}
        </h1>
      </div>

      <div className="mb-8 flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        <Link 
            href="/apartments" 
            className={`shrink-0 flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all border ${!category ? 'bg-[var(--brand)] text-white border-[var(--brand)]' : 'bg-[var(--background)] text-[var(--secondary)] border-[var(--secondary)]/20 hover:border-[var(--brand)]'}`}
        >
            <span>All</span>
        </Link>
        {categories.map(cat => {
            const Icon = ICON_MAP[cat.icon || ""] || ICON_MAP["Home"]
            return (
                <Link 
                    key={cat.id} 
                    href={`/apartments?category=${cat.name}`}
                    className={`shrink-0 flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all border ${category === cat.name ? 'bg-[var(--brand)] text-white border-[var(--brand)]' : 'bg-[var(--background)] text-[var(--secondary)] border-[var(--secondary)]/20 hover:border-[var(--brand)]'}`}
                >
                    <Icon className="h-4 w-4" />
                    <span>{cat.name}</span>
                </Link>
            )
        })}
      </div>
      
      {apartments.length > 0 ? (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {apartments.map((apartment) => (
            <ApartmentCard 
              key={apartment.id} 
              apartment={apartment} 
              initialIsFavorite={favoriteIds.has(apartment.id)}
              currentUserId={session?.user?.id || undefined}
              isAdmin={(session?.user as any)?.role === 'admin'}
            />
            ))}
        </div>
      ) : (
        <div className="text-center py-20">
            <h3 className="text-xl font-semibold mb-2 text-[var(--foreground)]">No stays found</h3>
            <p className="text-[var(--secondary)]/70 mb-6">Try adjusting your search or filters.</p>
            <Link href="/apartments" className="inline-block rounded-lg bg-[var(--brand)] px-6 py-3 text-white font-medium hover:opacity-90">Remove all filters</Link>
        </div>
      )}
    </div>
  )
}
