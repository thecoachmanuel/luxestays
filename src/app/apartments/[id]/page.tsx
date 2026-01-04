
import Image from "next/image"
import { notFound } from "next/navigation"
import { MapPin, Star, Bed, Bath, CheckCircle, Tag, Video } from "lucide-react"
import { getApartmentById, getReviewsByApartmentId, isFavorite, getSettings } from "@/lib/db"
import { BookingForm } from "@/components/BookingForm"
import { ReviewSection } from "@/components/ReviewSection"
import { formatPrice } from "@/lib/utils"
import { auth } from "@/auth"
import { FavoriteButton } from "@/components/FavoriteButton"
import { ApartmentImageSlider } from "@/components/ApartmentImageSlider"
import { ShareButton } from "@/components/ShareButton"
import { VideoPlayer } from "@/components/VideoPlayer"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ApartmentPage({ params }: PageProps) {
    const { id } = await params
    const apartment = await getApartmentById(id)
    const reviews = await getReviewsByApartmentId(id)
    const session = await auth()
    const settings = await getSettings()
    const isFavorited = session?.user?.email ? await isFavorite(session.user.email, id) : false

    if (!apartment) {
        notFound()
    }

    return (
        <div className="container mx-auto py-6 px-4 xl:px-20">
            {/* Header Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">{apartment.title}</h1>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 text-sm gap-4">
                    <div className="flex items-center gap-2 text-[var(--foreground)] font-medium underline cursor-pointer">
                        <MapPin className="h-4 w-4" />
                        {apartment.location}
                    </div>
                    <div className="flex gap-2">
                         <ShareButton 
                            title={apartment.title}
                            description={apartment.description}
                            image={apartment.image}
                         />
                         <FavoriteButton 
                           apartmentId={apartment.id}
                           initialIsFavorite={isFavorited}
                           currentUserId={session?.user?.email || undefined}
                           variant="button"
                         />
                    </div>
                </div>
            </div>

            {/* Image Section - Horizontal Scroll */}
            <ApartmentImageSlider 
                images={apartment.images && apartment.images.length > 0 ? apartment.images : [apartment.image]} 
                title={apartment.title}
                category={apartment.category}
            />
            
            <div className="grid gap-8 lg:gap-12 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="border-b pb-8 border-[var(--secondary)]/20">
                        <div className="flex justify-between items-start">
                             <div>
                                <h2 className="text-xl font-semibold text-[var(--foreground)]">Entire apartment hosted by LuxeStays</h2>
                                <div className="mt-1 text-[var(--secondary)] text-sm">
                                    {apartment.bedrooms} bedrooms · {apartment.bathrooms} bathrooms
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="py-8 border-b border-[var(--secondary)]/20">
                         <div className="flex gap-4">
                             <div className="mt-1"><CheckCircle className="h-6 w-6 text-[var(--foreground)]" /></div>
                             <div>
                                 <h3 className="font-semibold text-[var(--foreground)]">Self check-in</h3>
                                 <p className="text-[var(--secondary)] text-sm">Check yourself in with the keypad.</p>
                             </div>
                         </div>
                         <div className="flex gap-4 mt-6">
                             <div className="mt-1"><MapPin className="h-6 w-6 text-[var(--foreground)]" /></div>
                             <div>
                                 <h3 className="font-semibold text-[var(--foreground)]">Great location</h3>
                                 <p className="text-[var(--secondary)] text-sm">100% of recent guests gave the location a 5-star rating.</p>
                             </div>
                         </div>
                    </div>

                    <div className="py-8 border-b border-[var(--secondary)]/20">
                        <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)]">About this place</h2>
                        <p className="text-[var(--secondary)] leading-relaxed">{apartment.description}</p>
                    </div>

                     <div className="py-8 border-b border-[var(--secondary)]/20">
                        <h2 className="text-xl font-semibold mb-6 text-[var(--foreground)]">What this place offers</h2>
                        <div className="grid grid-cols-2 gap-y-4">
                            {apartment.amenities.map((amenity) => (
                                <div key={amenity} className="flex items-center gap-3 text-[var(--secondary)]">
                                    <CheckCircle className="h-5 w-5 text-[var(--secondary)]/70" />
                                    <span>{amenity}</span>
                                </div>
                            ))}
                            </div>
                        </div>

                        {apartment.videoUrl && (
                            <div className="py-8 border-b border-[var(--secondary)]/20">
                                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-[var(--foreground)]">
                                    <Video className="h-5 w-5" />
                                    Video Tour
                                </h2>
                                <VideoPlayer 
                                    url={apartment.videoUrl} 
                                    title={apartment.title}
                                    coverImage={apartment.image}
                                />
                            </div>
                        )}
                    
                    <div className="py-8">
                         <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-[var(--foreground)]">
                             <Star className="h-5 w-5 fill-[var(--foreground)]" />
                             {apartment.rating} · {reviews.length} reviews
                         </h2>
                        <ReviewSection 
                          apartmentId={apartment.id} 
                          reviews={reviews} 
                          currentUserId={session?.user?.email}
                          isAdmin={(session?.user as any)?.role === 'admin'}
                        />
                    </div>
                </div>

                <div>
                    <BookingForm 
                        apartment={apartment} 
                        paystackPublicKey={settings.paystackPublicKey} 
                        rating={apartment.rating}
                        reviewCount={reviews.length}
                        cleaningFee={settings.cleaningFee}
                    />
                </div>
            </div>
        </div>
    )
}
