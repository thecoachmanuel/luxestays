"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { AppSettings } from "@/types"
import { Upload, X } from "lucide-react"

interface AdvertFormProps {
  initialSettings: AppSettings
}

export function AdvertForm({ initialSettings }: AdvertFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    enabled: initialSettings.sidebarAdvert?.enabled || false,
    image: initialSettings.sidebarAdvert?.image || "",
    link: initialSettings.sidebarAdvert?.link || "",
    altText: initialSettings.sidebarAdvert?.altText || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const data = new FormData()
    data.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      })

      if (!res.ok) throw new Error("Upload failed")

      const json = await res.json()
      setFormData((prev) => ({ ...prev, image: json.url }))
    } catch (error) {
      console.error(error)
      alert("Failed to upload image")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sidebarAdvert: formData,
        }),
      })

      if (!res.ok) throw new Error("Failed to update settings")

      router.refresh()
      alert("Advert settings updated successfully!")
    } catch (error) {
      console.error(error)
      alert("Failed to update settings")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[var(--background)] p-6 rounded-lg shadow border border-[var(--secondary)]/20">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="enabled"
          name="enabled"
          checked={formData.enabled}
          onChange={handleChange}
          className="h-4 w-4 rounded border-[var(--secondary)]/20 text-[var(--brand)] focus:ring-[var(--brand)]"
        />
        <label htmlFor="enabled" className="text-sm font-medium text-[var(--foreground)]">
          Enable Sidebar Advert
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--foreground)]">Advert Image</label>
        {formData.image ? (
          <div className="relative h-64 w-full overflow-hidden rounded-lg border border-[var(--secondary)]/20">
            <Image
              src={formData.image}
              alt="Advert preview"
              fill
              className="object-contain"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-[var(--secondary)]/20 bg-[var(--secondary)]/5">
            <label className="flex cursor-pointer flex-col items-center justify-center space-y-2">
              <Upload className="h-8 w-8 text-[var(--secondary)]" />
              <span className="text-sm text-[var(--secondary)]">Click to upload image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Link URL (Optional)</label>
          <input
            type="url"
            name="link"
            value={formData.link}
            onChange={handleChange}
            placeholder="https://example.com/promo"
            className="w-full border border-[var(--secondary)]/20 rounded p-2 bg-[var(--background)] text-[var(--foreground)]"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Alt Text</label>
          <input
            type="text"
            name="altText"
            value={formData.altText}
            onChange={handleChange}
            placeholder="Summer Sale 50% Off"
            className="w-full border border-[var(--secondary)]/20 rounded p-2 bg-[var(--background)] text-[var(--foreground)]"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--brand)] text-white px-6 py-2 rounded hover:bg-[var(--brand)]/90 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  )
}
