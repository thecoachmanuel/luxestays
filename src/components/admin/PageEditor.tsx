import { useState } from "react"
import { Control, UseFormRegister, UseFormSetValue } from "react-hook-form"
import { AppSettings } from "@/types"
import { Upload, Loader2 } from "lucide-react"

interface PageEditorProps {
  index: number
  control: Control<AppSettings>
  register: UseFormRegister<AppSettings>
  setValue: UseFormSetValue<AppSettings>
  watch: any
}

export function PageEditor({ index, register, setValue, watch }: PageEditorProps) {
  const [uploadingHero, setUploadingHero] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    setUploadingHero(true)
    
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
      setValue(`customPages.${index}.data.heroImage`, data.url, { shouldValidate: true })
    } catch (err) {
      alert("Failed to upload image")
    } finally {
      setUploadingHero(false)
    }
  }

  const heroImage = watch(`customPages.${index}.data.heroImage`)

  return (
    <div className="space-y-6 border border-[var(--secondary)]/20 p-4 sm:p-6 rounded-lg bg-[var(--background)] shadow-sm mt-4">
      <div className="border-b border-[var(--secondary)]/20 pb-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Page Content</h3>
        <p className="text-sm text-[var(--secondary)]/70">Customize the content of this page</p>
      </div>

      {/* Hero Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-[var(--foreground)] border-b border-[var(--secondary)]/10 pb-2">Hero Section</h4>
        <div className="grid gap-4 md:grid-cols-2">
            <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">Page Title</label>
            <input
                {...register(`customPages.${index}.title` as const)}
                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                placeholder="Page Title"
            />
            </div>
            <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">Slug (URL)</label>
            <input
                {...register(`customPages.${index}.slug` as const)}
                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                placeholder="page-slug"
            />
            </div>
            
            <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--foreground)]">Subtitle</label>
            <input
                {...register(`customPages.${index}.data.subtitle` as const)}
                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                placeholder="Page Subtitle"
            />
            </div>

            <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--foreground)]">Hero Image</label>
            <div className="mt-2 flex items-center gap-4">
                {heroImage && (
                    <div className="h-20 w-32 relative rounded-lg border border-[var(--secondary)]/20 overflow-hidden bg-[var(--secondary)]/5">
                        <img src={heroImage} alt="Hero" className="h-full w-full object-cover" />
                    </div>
                )}
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-[var(--secondary)]/20 rounded-md hover:bg-[var(--secondary)]/10 transition-colors">
                    <Upload className="h-4 w-4 text-[var(--foreground)]" />
                    <span className="text-sm font-medium text-[var(--foreground)]">Upload Hero Image</span>
                    <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingHero}
                    />
                </label>
                {uploadingHero && <Loader2 className="h-4 w-4 animate-spin text-[var(--secondary)]" />}
            </div>
            {/* Fallback hidden input to keep the register working if needed, but setValue handles it */}
            <input type="hidden" {...register(`customPages.${index}.data.heroImage` as const)} />
            </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-4 pt-4 border-t border-[var(--secondary)]/20">
        <h4 className="font-medium text-[var(--foreground)] border-b border-[var(--secondary)]/10 pb-2">Main Content</h4>
        <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Content (Markdown/HTML)</label>
            <textarea
                {...register(`customPages.${index}.content` as const)}
                rows={15}
                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] font-mono text-sm"
                placeholder="Write your page content here using Markdown or HTML..."
            />
        </div>
      </div>
    </div>
  )
}
