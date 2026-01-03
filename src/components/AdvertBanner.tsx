"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { AppSettings } from "@/types"

export function AdvertBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error(err))
  }, [])

  if (!isVisible || !settings?.bannerSettings?.isEnabled) return null

  const { text, link, backgroundColor, textColor } = settings.bannerSettings

  return (
    <div style={{ backgroundColor: backgroundColor || 'var(--brand)' }} className="relative transition-colors">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between text-sm sm:text-base" style={{ color: textColor || 'var(--background)' }}>
        <div className="flex-1 text-center font-medium">
          {link ? (
            <a href={link} className="hover:underline">
               <div dangerouslySetInnerHTML={{ __html: text }} />
            </a>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: text }} />
          )}
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-[var(--background)]/20 rounded-full transition-colors ml-4"
          aria-label="Close banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
