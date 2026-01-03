"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, X, Upload } from "lucide-react"
import { Apartment, Category } from "@/types"
import Image from "next/image"

const apartmentSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.number().min(1000, "Price must be at least 1000"),
  location: z.string().min(5, "Location is required"),
  image: z.string().min(1, "Cover image is required"),
  images: z.array(z.string()),
  bedrooms: z.number().min(1),
  bathrooms: z.number().min(1),
  category: z.string().min(1, "Category is required"),
  videoUrl: z.string().optional(),
  amenities: z.string().min(1, "Amenities are required"),
})

type ApartmentFormValues = z.infer<typeof apartmentSchema>

interface ApartmentFormProps {
  initialData?: Apartment
  categories: Category[]
}

export function ApartmentForm({ initialData, categories }: ApartmentFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ApartmentFormValues>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: initialData ? {
        ...initialData,
        images: initialData.images || [],
        amenities: initialData.amenities.join(', ')
    } : {
        bedrooms: 1,
        bathrooms: 1,
        price: 0,
        images: []
    }
  })

  const galleryImages = watch("images") || []

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    setUploading(true)
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
      setValue("image", data.url, { shouldValidate: true })
    } catch (err) {
      alert("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    setUploadingGallery(true)
    const files = Array.from(e.target.files)
    const newImages: string[] = []

    try {
      // Upload files sequentially or in parallel
      await Promise.all(files.map(async (file) => {
          const formData = new FormData()
          formData.append("file", file)

          const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
          })

          if (res.ok) {
              const data = await res.json()
              newImages.push(data.url)
          }
      }))

      if (newImages.length > 0) {
          const currentImages = watch("images") || []
          setValue("images", [...currentImages, ...newImages], { shouldValidate: true })
      }
    } catch (err) {
      alert("Failed to upload some images")
    } finally {
      setUploadingGallery(false)
    }
  }

  const removeGalleryImage = (indexToRemove: number) => {
      const currentImages = watch("images") || []
      setValue("images", currentImages.filter((_, idx) => idx !== indexToRemove))
  }

  const onSubmit = async (data: ApartmentFormValues) => {
    setIsSubmitting(true)
    setError("")
    
    try {
      const url = initialData ? `/api/apartments/${initialData.id}` : "/api/apartments"
      const method = initialData ? "PUT" : "POST"

      const payload = {
        ...data,
        amenities: data.amenities.split(',').map(s => s.trim()).filter(Boolean)
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(initialData ? "Failed to update apartment" : "Failed to create apartment")
      }

      router.push("/admin/listings")
      router.refresh()
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-lg border border-[var(--secondary)]/20 bg-[var(--background)] p-6 shadow-sm">
      {error && (
          <div className="rounded-md bg-[var(--accent)]/10 p-4 text-sm text-[var(--accent)]">
              {error}
          </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Title</label>
        <input
          {...register("title")}
          className="w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
          placeholder="e.g. Luxury Oceanview Apartment"
        />
        {errors.title && <p className="mt-1 text-sm text-[var(--accent)]">{errors.title.message}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Description</label>
        <textarea
          {...register("description")}
          className="w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
          rows={4}
          placeholder="Describe the property..."
        />
        {errors.description && <p className="mt-1 text-sm text-[var(--accent)]">{errors.description.message}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Video URL</label>
        <input
          {...register("videoUrl")}
          className="w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
          placeholder="e.g. https://www.youtube.com/watch?v=..."
        />
        <p className="mt-1 text-xs text-[var(--secondary)]/70">
            Supports YouTube and Vimeo links (we'll handle the embedding automatically).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
          <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Price (per night)</label>
              <input
                  {...register("price", { valueAsNumber: true })}
                  type="number"
                  className="w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
              />
              {errors.price && <p className="mt-1 text-sm text-[var(--accent)]">{errors.price.message}</p>}
          </div>
           <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Location</label>
              <input
                  {...register("location")}
                  className="w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                  placeholder="e.g. Victoria Island, Lagos"
              />
              {errors.location && <p className="mt-1 text-sm text-[var(--accent)]">{errors.location.message}</p>}
          </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Cover Image</label>
        <div className="flex gap-4 items-center">
            <input
            {...register("image")}
            className="w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            placeholder="https://..."
            />
            <span className="text-sm text-[var(--secondary)]/70">OR</span>
            <label className="cursor-pointer bg-[var(--secondary)]/10 border border-[var(--secondary)]/20 rounded-md px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--secondary)]/20 transition-colors">
                {uploading ? "Uploading..." : "Upload Cover"}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            </label>
        </div>
        {watch("image") && (
             <div className="mt-4 relative h-40 w-full max-w-xs overflow-hidden rounded-lg border border-[var(--secondary)]/20 bg-[var(--secondary)]/5">
                <Image 
                    src={watch("image")} 
                    alt="Cover preview" 
                    fill 
                    className="object-cover" 
                />
             </div>
        )}
        {errors.image && <p className="mt-1 text-sm text-[var(--accent)]">{errors.image.message}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Gallery Images</label>
        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {galleryImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square overflow-hidden rounded-lg border border-[var(--secondary)]/20 bg-[var(--secondary)]/5 group">
                    <Image 
                        src={img} 
                        alt={`Gallery ${idx + 1}`} 
                        fill 
                        className="object-cover" 
                    />
                    <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="absolute top-2 right-2 rounded-full bg-[var(--background)]/80 p-1 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--background)]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--secondary)]/20 bg-[var(--secondary)]/5 hover:bg-[var(--secondary)]/10 transition-colors">
                {uploadingGallery ? (
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--secondary)]/50" />
                ) : (
                    <>
                        <Upload className="h-8 w-8 text-[var(--secondary)]/50 mb-2" />
                        <span className="text-xs text-[var(--secondary)]/70 font-medium">Add Images</span>
                    </>
                )}
                <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                    onChange={handleGalleryUpload} 
                    disabled={uploadingGallery} 
                />
            </label>
        </div>
        <p className="text-xs text-[var(--secondary)]/70">
            Upload multiple images for the apartment gallery.
        </p>
      </div>

       <div className="grid gap-4 sm:grid-cols-3">
          <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Category</label>
              <select {...register("category")} className="w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]">
                  <option value="">Select...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-[var(--accent)]">{errors.category.message}</p>}
          </div>
           <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Bedrooms</label>
              <input
                  {...register("bedrooms", { valueAsNumber: true })}
                  type="number"
                  className="w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
              />
              {errors.bedrooms && <p className="mt-1 text-sm text-[var(--accent)]">{errors.bedrooms.message}</p>}
          </div>
           <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Bathrooms</label>
              <input
                  {...register("bathrooms", { valueAsNumber: true })}
                  type="number"
                  className="w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
              />
              {errors.bathrooms && <p className="mt-1 text-sm text-[var(--accent)]">{errors.bathrooms.message}</p>}
          </div>
      </div>

      <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Amenities (comma separated)</label>
          <input
              {...register("amenities")}
              className="w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] p-2 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
              placeholder="WiFi, Pool, Gym, AC"
          />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-[var(--brand)] py-3 font-medium text-[var(--background)] hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? (
           <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {initialData ? "Updating..." : "Creating..."}
           </span>
        ) : (
          initialData ? "Update Apartment" : "Add Apartment"
        )}
      </button>
    </form>
  )
}
