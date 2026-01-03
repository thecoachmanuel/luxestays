"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import { Apartment } from "@/types"
import { formatPrice } from "@/lib/utils"

interface HeroSectionProps {
  apartments: Apartment[]
}

export function HeroSection({ apartments }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null
    touchStartX.current = e.targetTouches[0].clientX
  }

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    if (isLeftSwipe) {
      nextSlide()
    }
    if (isRightSwipe) {
      prevSlide()
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % apartments.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + apartments.length) % apartments.length)
  }

  useEffect(() => {
    if (isHovered) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [isHovered, apartments.length])

  if (!apartments.length) return null

  return (
    <div 
      className="relative h-[400px] md:h-[500px] w-full overflow-hidden rounded-2xl mb-8 md:mb-12 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      {apartments.map((apt, index) => (
        <div
          key={apt.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* Image with gradient overlay */}
          <div className="relative h-full w-full">
            <Image
              src={apt.image}
              alt={apt.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--foreground)]/80 via-[var(--foreground)]/30 to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 text-[var(--background)]">
            <div className="container mx-auto max-w-4xl">
              <span className="inline-block rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4">
                {apt.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold mb-2 leading-tight">
                {apt.title}
              </h1>
              <div className="flex items-center gap-2 text-lg text-[var(--background)]/90 mb-6">
                <MapPin className="h-5 w-5" />
                {apt.location}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="text-2xl font-bold">
                  {formatPrice(apt.price)}
                  <span className="text-sm font-normal text-[var(--background)]/80 ml-1">/ night</span>
                </div>
                <Link
                  href={`/apartments/${apt.id}`}
                  className="rounded-full bg-[var(--background)] text-[var(--foreground)] px-8 py-3 font-semibold hover:bg-[var(--background)]/90 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-[var(--background)]/20 p-3 text-[var(--background)] backdrop-blur-sm hover:bg-[var(--background)]/40 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-[var(--background)]/20 p-3 text-[var(--background)] backdrop-blur-sm hover:bg-[var(--background)]/40 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots Indicators */}
      <div className="absolute bottom-6 right-8 z-20 flex gap-2">
        {apartments.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide ? "w-8 bg-[var(--background)]" : "w-2 bg-[var(--background)]/50 hover:bg-[var(--background)]/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
