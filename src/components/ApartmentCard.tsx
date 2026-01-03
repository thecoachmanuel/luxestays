'use client'

import Link from "next/link"
import Image from "next/image"
import { Star, Edit } from "lucide-react"
import { format } from "date-fns"
import { Apartment } from "@/types"
import { formatPrice } from "@/lib/utils"
import { FavoriteButton } from "./FavoriteButton"
import { useState } from "react"

interface ApartmentCardProps {
  apartment: Apartment
  initialIsFavorite?: boolean
  currentUserId?: string
  isAdmin?: boolean
  className?: string
}

export function ApartmentCard({ apartment, initialIsFavorite = false, currentUserId, isAdmin = false, className }: ApartmentCardProps) {
  const [currentImage, setCurrentImage] = useState(apartment.images?.[0] || apartment.image)

  return (
    <div 
      className={`group relative block cursor-pointer ${className || ''}`}
      onMouseEnter={() => {
        if (apartment.images && apartment.images.length > 1) {
          setCurrentImage(apartment.images[1])
        }
      }}
      onMouseLeave={() => {
        setCurrentImage(apartment.images?.[0] || apartment.image)
      }}
    >
      <Link href={`/apartments/${apartment.id}`}>
        <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--secondary)]/20">
          <Image
            src={currentImage}
            alt={apartment.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {apartment.currentStatus === 'booked' && (
              <div className="absolute top-3 left-3 rounded-md bg-[var(--background)]/90 px-2 py-1 text-xs font-bold uppercase tracking-wider text-[var(--foreground)] backdrop-blur-sm shadow-sm transition-all">
                  {apartment.nextAvailableDate 
                    ? `Available from ${format(new Date(apartment.nextAvailableDate), 'MMM d')}` 
                    : 'Booked'}
              </div>
          )}
        </div>
      </Link>
      
      {isAdmin && (
        <div className="absolute top-3 left-3 z-10">
           <Link 
             href={`/admin/edit-apartment/${apartment.id}`}
             className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--background)]/90 text-[var(--brand)] shadow-sm backdrop-blur-sm transition-all hover:bg-[var(--brand)] hover:text-[var(--background)]"
             title="Edit Apartment"
             onClick={(e) => e.stopPropagation()} 
           >
             <Edit className="h-4 w-4" />
           </Link>
        </div>
      )}

      <div className="absolute top-3 right-3 z-10">
        <FavoriteButton 
          apartmentId={apartment.id}
          initialIsFavorite={initialIsFavorite}
          currentUserId={currentUserId}
        />
      </div>
      
      <Link href={`/apartments/${apartment.id}`}>
        <div className="mt-3">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-[var(--foreground)] truncate pr-2">{apartment.title}</h3>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-3 w-3 fill-[var(--brand)] text-[var(--brand)]" />
              <span className="text-sm font-light text-[var(--foreground)]">{apartment.rating}</span>
            </div>
          </div>
          
          <p className="text-[var(--secondary)] text-sm truncate">{apartment.location}</p>
          <p className="text-[var(--secondary)] text-sm">
            {apartment.currentStatus === 'booked' 
              ? 'Currently booked'
              : 'Available now'}
          </p>
          
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-semibold text-[var(--foreground)]">{formatPrice(apartment.price)}</span>
            <span className="text-[var(--foreground)]">night</span>
          </div>
        </div>
      </Link>
    </div>
  )
}
