import { useState } from "react"
import { Control, UseFormRegister, UseFormSetValue, UseFormWatch, Controller } from "react-hook-form"
import { AppSettings } from "@/types"
import { Upload, Loader2, X, ChevronDown, ChevronRight } from "lucide-react"
import { RichTextEditor } from "./RichTextEditor"

interface CustomPageEditorProps {
  index: number
  register: UseFormRegister<AppSettings>
  control: Control<AppSettings>
  watch: UseFormWatch<AppSettings>
  setValue: UseFormSetValue<AppSettings>
  remove: (index: number) => void
}

export function CustomPageEditor({ index, register, control, watch, setValue, remove }: CustomPageEditorProps) {
  const [uploadingHero, setUploadingHero] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const pageTitle = watch(`customPages.${index}.title`) || "Untitled Page"

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    setUploadingHero(true)
    
    try {
      const url = await uploadImage(e.target.files[0])
      setValue(`customPages.${index}.data.heroImage`, url, { shouldValidate: true })
    } catch (err) {
      alert("Failed to upload image")
    } finally {
      setUploadingHero(false)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!res.ok) throw new Error("Upload failed")

    const data = await res.json()
    return data.url
  }

  return (
    <div className="border border-[var(--secondary)]/20 rounded-lg bg-[var(--background)] shadow-sm overflow-hidden">
      {/* Header / Toggle Bar */}
      <div 
        className="flex items-center justify-between p-4 bg-[var(--secondary)]/5 cursor-pointer hover:bg-[var(--secondary)]/10 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
            {isExpanded ? <ChevronDown className="h-5 w-5 text-[var(--secondary)]" /> : <ChevronRight className="h-5 w-5 text-[var(--secondary)]" />}
            <span className="font-medium text-[var(--foreground)]">{pageTitle}</span>
        </div>
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    remove(index)
                }}
                className="p-2 text-[var(--secondary)] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Remove Page"
            >
                <X className="h-5 w-5" />
            </button>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-6 border-t border-[var(--secondary)]/20">
            <div className="grid gap-6 mb-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)]">Page Title</label>
                        <input
                            {...register(`customPages.${index}.title`)}
                            className="mt-1 block w-full rounded-md border border-[var(--secondary)]/30 px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)]">URL Slug</label>
                        <input
                            {...register(`customPages.${index}.slug`)}
                            className="mt-1 block w-full rounded-md border border-[var(--secondary)]/30 px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                            placeholder="e.g. about-us"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                    {/* Hero Section */}
                    <div className="space-y-4 border border-[var(--secondary)]/20 p-4 rounded-lg bg-[var(--background)]">
                        <h4 className="font-medium text-[var(--foreground)] border-b border-[var(--secondary)]/10 pb-2">Hero Section</h4>
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)]">Page Subtitle</label>
                            <input
                                {...register(`customPages.${index}.data.subtitle`)}
                                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                                placeholder="Page subtitle..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)]">Hero Image</label>
                            <div className="mt-1 flex items-center gap-4">
                                <div className="flex-1">
                                    <input
                                        {...register(`customPages.${index}.data.heroImage`)}
                                        className="block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                                        placeholder="https://..."
                                    />
                                </div>
                                <label className="cursor-pointer bg-[var(--brand)] text-[var(--background)] px-4 py-2 rounded-md hover:opacity-90 transition-opacity flex items-center gap-2">
                                    {uploadingHero ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    <span>Upload</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={uploadingHero}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Page Content</label>
                        <Controller
                            name={`customPages.${index}.content`}
                            control={control}
                            render={({ field }) => (
                                <RichTextEditor
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    onImageUpload={uploadImage}
                                />
                            )}
                        />
                    </div>
            </div>
        </div>
      )}
    </div>
  )
}

