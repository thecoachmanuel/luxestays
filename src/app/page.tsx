import { getApartments, getFavorites, getCategories, getWhyChooseUs, getSettings } from "@/lib/db"
import { ApartmentCard } from "@/components/ApartmentCard"
import { HeroSection } from "@/components/HeroSection"
import { AdvertBanner } from "@/components/AdvertBanner"
import { SidebarWidget } from "@/components/SidebarWidget"
import Link from "next/link"
import { Home } from "lucide-react"
import { ICON_MAP } from "@/components/IconMap"
import { auth } from "@/auth"

export default async function HomePage() {
  const apartments = await getApartments()
  const session = await auth()
  const favorites = session?.user?.email ? await getFavorites(session.user.email) : []
  const favoriteIds = new Set(favorites.map(f => f.apartmentId))
  
  // Get categories from DB for consistency
  const categories = await getCategories()

  // Get Why Choose Us items
  const whyChooseUs = await getWhyChooseUs()

  // Get App Settings
  const settings = await getSettings()

  // Filter apartments for Hero Section (e.g., Luxury, Penthouse, or high rated)
  const heroApartments = apartments
    .filter(a => ['Luxury', 'Penthouse'].includes(a.category) || a.rating >= 4.8)
    .slice(0, 5)

  // Get Top Rated apartments for Sidebar
  const topRatedApartments = [...apartments]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)

  return (
    <div className="container mx-auto px-4 xl:px-20 pt-6 pb-20">
      <AdvertBanner />
      <HeroSection apartments={heroApartments} />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1">
          {/* Categories Filter */}
          <div className="mb-8 flex gap-8 overflow-x-auto pb-4 scrollbar-hide">
            <Link 
                href="/apartments" 
                className="flex flex-col items-center gap-2 min-w-16 cursor-pointer text-[var(--secondary)] hover:text-[var(--brand)] hover:border-b-2 hover:border-[var(--brand)] pb-2 transition-all group"
            >
                <Home className="h-6 w-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">All</span>
            </Link>
            {categories.map(category => {
                const Icon = ICON_MAP[category.icon || ""] || ICON_MAP["Home"]
                return (
                <Link 
                    key={category.id} 
                    href={`/apartments?category=${category.name}`}
                    className="flex flex-col items-center gap-2 min-w-16 cursor-pointer text-[var(--secondary)] hover:text-[var(--brand)] hover:border-b-2 hover:border-[var(--brand)] pb-2 transition-all group"
                >
                    <Icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium capitalize whitespace-nowrap">{category.name}</span>
                </Link>
                )
            })}
          </div>
          
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {apartments.slice(0, 10).map((apartment, index) => (
              <ApartmentCard 
                key={apartment.id} 
                apartment={apartment} 
                initialIsFavorite={favoriteIds.has(apartment.id)}
                currentUserId={session?.user?.email || undefined}
                isAdmin={(session?.user as any)?.role === 'admin'}
                className={index === 9 ? "lg:hidden" : ""}
              />
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <h3 className="text-lg font-semibold mb-4">Continue exploring unique homes</h3>
            <Link 
                href="/apartments" 
                className="inline-flex items-center justify-center rounded-lg bg-[var(--brand)] px-6 py-3.5 text-base font-medium text-[var(--background)] hover:opacity-90 transition-colors"
            >
                Show more
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 shrink-0">
           <SidebarWidget 
             topRatedApartments={topRatedApartments} 
             whyChooseUs={whyChooseUs} 
             advertSettings={settings.sidebarAdvert} 
           />
        </div>
      </div>
    </div>
  )
}
