"use client"

import Image from "next/image"
import Link from "next/link"
import { AdvertSettings } from "@/types"

interface AdvertCardProps {
  settings?: AdvertSettings
}

export function AdvertCard({ settings }: AdvertCardProps) {
  if (!settings || !settings.enabled || !settings.image) {
    return null
  }

  const Content = (
    <div className="relative w-full aspect-square overflow-hidden rounded-xl border border-[var(--secondary)]/20 shadow-sm">
      <Image
        src={settings.image}
        alt={settings.altText || "Advertisement"}
        fill
        className="object-cover"
      />
    </div>
  )

  if (settings.link) {
    return (
      <Link href={settings.link} target="_blank" rel="noopener noreferrer" className="block transition-opacity hover:opacity-90">
        {Content}
      </Link>
    )
  }

  return Content
}
