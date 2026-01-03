"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ApartmentImageSliderProps {
  images: string[]
  title: string
  category: string
}

export function ApartmentImageSlider({ images, title, category }: ApartmentImageSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const index = Math.round(container.scrollLeft / container.clientWidth)
      setActiveIndex(index)
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const scrollAmount = container.clientWidth
      
      if (direction === 'left') {
        if (container.scrollLeft <= 0) {
             // Wrap to end
             container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' })
        } else {
            container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
        }
      } else {
        // Check if we are at the end (allow some tolerance)
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
            // Wrap to start
            container.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
      }
    }
  }

  useEffect(() => {
    if (isHovered) return

    const interval = setInterval(() => {
      scroll('right')
    }, 2000) // 2 seconds per slide

    return () => clearInterval(interval)
  }, [isHovered])

  return (
    <div 
      className="group relative mb-8 md:mb-12 rounded-xl overflow-hidden shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:rounded-xl no-scrollbar"
        style={{ 
            scrollbarWidth: 'none',  /* Firefox */
            msOverflowStyle: 'none'  /* IE and Edge */
        }}
      >
        <style jsx>{`
            div::-webkit-scrollbar {
                display: none;
            }
        `}</style>
        {images.map((img, idx) => (
            <div key={idx} className="relative flex-none w-full h-[300px] md:h-[500px] snap-center">
                <Image
                    src={img}
                    alt={`${title} ${idx + 1}`}
                    fill
                    className="object-cover"
                    priority={idx === 0}
                />
                {idx === 0 && (
                    <div className="absolute top-4 left-4 rounded-full bg-[var(--background)]/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] backdrop-blur-sm z-10">
                        {category}
                    </div>
                )}
            </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
            <button 
                onClick={(e) => { e.preventDefault(); scroll('left'); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-[var(--background)]/80 hover:bg-[var(--background)] text-[var(--foreground)] p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20"
                aria-label="Previous image"
            >
                <ChevronLeft className="h-6 w-6" />
            </button>
            <button 
                onClick={(e) => { e.preventDefault(); scroll('right'); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--background)]/80 hover:bg-[var(--background)] text-[var(--foreground)] p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20"
                aria-label="Next image"
            >
                <ChevronRight className="h-6 w-6" />
            </button>
            
            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {images.map((_, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => {
                            if (scrollContainerRef.current) {
                                scrollContainerRef.current.scrollTo({
                                    left: idx * scrollContainerRef.current.clientWidth,
                                    behavior: 'smooth'
                                })
                            }
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                            idx === activeIndex 
                                ? "bg-[var(--brand)] scale-125" 
                                : "bg-[var(--background)]/50 hover:bg-[var(--background)]/80"
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </>
      )}
    </div>
  )
}
