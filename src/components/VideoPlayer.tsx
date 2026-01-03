"use client"

import { useState } from "react"
import Image from "next/image"
import { Play } from "lucide-react"
import { getEmbedUrl } from "@/lib/utils"

interface VideoPlayerProps {
  url: string
  title: string
  coverImage: string
}

export function VideoPlayer({ url, title, coverImage }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const embedUrl = getEmbedUrl(url)

  if (!embedUrl) return null

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
      {!isPlaying ? (
        <button 
          onClick={() => setIsPlaying(true)}
          className="group relative h-full w-full cursor-pointer"
          aria-label={`Play video tour of ${title}`}
        >
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform duration-300 group-hover:scale-110">
              <Play className="h-6 w-6 fill-black text-black ml-1" />
            </div>
          </div>
        </button>
      ) : (
        <iframe
          src={`${embedUrl}?autoplay=1`}
          title={`${title} Video Tour`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  )
}
