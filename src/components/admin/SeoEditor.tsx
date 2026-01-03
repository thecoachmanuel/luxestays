"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { AppSettings } from "@/types"
import { Upload, Loader2, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

export function SeoEditor() {
  const { register, setValue, watch } = useFormContext<AppSettings>()
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [uploadingOgImage, setUploadingOgImage] = useState(false)

  const favicon = watch("seoSettings.favicon")
  const ogImage = watch("seoSettings.ogImage")

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "seoSettings.favicon" | "seoSettings.ogImage") => {
    if (!e.target.files || e.target.files.length === 0) return

    const isFavicon = field === "seoSettings.favicon"
    if (isFavicon) setUploadingFavicon(true)
    else setUploadingOgImage(true)

    const file = e.target.files[0]
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      setValue(field, data.url, { shouldValidate: true })
    } catch (err) {
      alert("Failed to upload image")
    } finally {
      if (isFavicon) setUploadingFavicon(false)
      else setUploadingOgImage(false)
    }
  }

  return (
    <div className="space-y-6 border border-[var(--secondary)]/20 p-6 rounded-lg bg-[var(--background)] shadow-sm">
        <div className="border-b border-[var(--secondary)]/20 pb-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">SEO & Meta Data</h3>
            <p className="text-sm text-[var(--secondary)]">Configure global search engine optimization settings</p>
        </div>

        <div className="grid gap-6">
            <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">Meta Title</label>
                <input
                    {...register("seoSettings.metaTitle")}
                    className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] transition-colors"
                    placeholder="e.g. LuxeStays - Premium Apartment Booking"
                />
                <p className="text-xs text-[var(--secondary)] mt-1">The main title of your website appearing in search results.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">Meta Description</label>
                <textarea
                    {...register("seoSettings.metaDescription")}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] transition-colors"
                    placeholder="e.g. Book the finest apartments in Lagos..."
                />
                <p className="text-xs text-[var(--secondary)] mt-1">A brief summary of your site content (recommended 150-160 characters).</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">Keywords</label>
                <input
                    {...register("seoSettings.metaKeywords")}
                    className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] transition-colors"
                    placeholder="e.g. apartments, booking, luxury, lagos"
                />
                <p className="text-xs text-[var(--secondary)] mt-1">Comma separated list of keywords.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* OG Image Section */}
                <div>
                    <label className="block text-sm font-medium text-[var(--foreground)]">OG Image (Social Share)</label>
                    <div className="mt-2 flex items-center gap-4">
                        <div className="relative h-24 w-40 overflow-hidden rounded-md border border-[var(--secondary)]/20 bg-[var(--secondary)]/5 flex items-center justify-center">
                            {ogImage ? (
                                <Image
                                    src={ogImage}
                                    alt="OG Image"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <ImageIcon className="h-8 w-8 text-[var(--secondary)]/40" />
                            )}
                        </div>
                        <div className="flex-1">
                            <input
                                {...register("seoSettings.ogImage")}
                                className="block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 text-sm shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] mb-2"
                                placeholder="https://..."
                            />
                            <div className="relative">
                                <input
                                    type="file"
                                    id="og-image-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleUpload(e, "seoSettings.ogImage")}
                                    disabled={uploadingOgImage}
                                />
                                <label
                                    htmlFor="og-image-upload"
                                    className="inline-flex cursor-pointer items-center rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] px-3 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm hover:bg-[var(--secondary)]/10"
                                >
                                    {uploadingOgImage ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Upload className="mr-2 h-4 w-4" />
                                    )}
                                    Upload Image
                                </label>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-[var(--secondary)] mt-1">Image displayed when sharing on social media (1200x630px recommended).</p>
                </div>

                {/* Favicon Section */}
                <div>
                    <label className="block text-sm font-medium text-[var(--foreground)]">Favicon</label>
                    <div className="mt-2 flex items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-md border border-[var(--secondary)]/20 bg-[var(--secondary)]/5 flex items-center justify-center">
                            {favicon ? (
                                <Image
                                    src={favicon}
                                    alt="Favicon"
                                    fill
                                    className="object-contain p-2"
                                />
                            ) : (
                                <div className="text-[var(--secondary)]/40 text-xs text-center p-2">No Icon</div>
                            )}
                        </div>
                        <div className="flex-1">
                             <input
                                {...register("seoSettings.favicon")}
                                className="block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 text-sm shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] mb-2"
                                placeholder="https://..."
                            />
                            <div className="relative">
                                <input
                                    type="file"
                                    id="favicon-upload"
                                    className="hidden"
                                    accept="image/x-icon,image/png,image/svg+xml"
                                    onChange={(e) => handleUpload(e, "seoSettings.favicon")}
                                    disabled={uploadingFavicon}
                                />
                                <label
                                    htmlFor="favicon-upload"
                                    className="inline-flex cursor-pointer items-center rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] px-3 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm hover:bg-[var(--secondary)]/10"
                                >
                                    {uploadingFavicon ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Upload className="mr-2 h-4 w-4" />
                                    )}
                                    Upload Favicon
                                </label>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-[var(--secondary)] mt-1">Browser tab icon (.ico, .png, .svg recommended).</p>
                </div>
            </div>
            
             <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">Twitter Handle (Optional)</label>
                <input
                    {...register("seoSettings.twitterHandle")}
                    className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] transition-colors"
                    placeholder="@username"
                />
            </div>
        </div>
    </div>
  )
}
