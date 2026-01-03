import { useState } from "react"
import { Control, UseFormRegister, useFieldArray, UseFormSetValue } from "react-hook-form"
import { AppSettings } from "@/types"
import { Plus, Trash2, Upload, Loader2 } from "lucide-react"

interface AboutPageEditorProps {
  control: Control<AppSettings>
  register: UseFormRegister<AppSettings>
  setValue: UseFormSetValue<AppSettings>
  watch: any
}

export function AboutPageEditor({ control, register, setValue, watch }: AboutPageEditorProps) {
  const { fields: statsFields, append: appendStat, remove: removeStat } = useFieldArray({
    control,
    name: "aboutPage.stats"
  })

  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingStory, setUploadingStory] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "heroImage" | "storyImage") => {
    if (!e.target.files || e.target.files.length === 0) return

    const setUploading = field === "heroImage" ? setUploadingHero : setUploadingStory
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
      setValue(`aboutPage.${field}`, data.url, { shouldValidate: true })
    } catch (err) {
      alert("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const heroImage = watch("aboutPage.heroImage")
  const storyImage = watch("aboutPage.storyImage")


  return (
    <div className="space-y-6 border border-[var(--secondary)]/20 p-4 sm:p-6 rounded-lg bg-[var(--background)] shadow-sm mt-8">
      <div className="border-b border-[var(--secondary)]/20 pb-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">About Page Settings</h3>
        <p className="text-sm text-[var(--secondary)]/70">Customize the content of your About Us page</p>
      </div>

      {/* Hero Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-[var(--foreground)] border-b border-[var(--secondary)]/10 pb-2">Hero Section</h4>
        <div className="grid gap-4 md:grid-cols-2">
            <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">Page Title</label>
            <input
                {...register("aboutPage.title")}
                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                placeholder="About Us"
            />
            </div>
            <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">Subtitle</label>
            <input
                {...register("aboutPage.subtitle")}
                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                placeholder="Experience luxury living..."
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
                        onChange={(e) => handleImageUpload(e, "heroImage")}
                        disabled={uploadingHero}
                    />
                </label>
                {uploadingHero && <Loader2 className="h-4 w-4 animate-spin text-[var(--secondary)]" />}
            </div>
            {/* Fallback hidden input to keep the register working if needed, but setValue handles it */}
            <input type="hidden" {...register("aboutPage.heroImage")} />
            </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="space-y-4 pt-4 border-t border-[var(--secondary)]/20">
        <h4 className="font-medium text-[var(--foreground)] border-b border-[var(--secondary)]/10 pb-2">Our Story Section</h4>
        <div className="grid gap-4 md:grid-cols-2">
            <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">Section Title</label>
            <input
                {...register("aboutPage.storyTitle")}
                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                placeholder="Our Story"
            />
            </div>
            <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">Side Image</label>
            <div className="mt-2 flex flex-col gap-2">
                {storyImage && (
                    <div className="h-20 w-32 relative rounded-lg border border-[var(--secondary)]/20 overflow-hidden bg-[var(--secondary)]/5">
                        <img src={storyImage} alt="Story" className="h-full w-full object-cover" />
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-[var(--secondary)]/20 rounded-md hover:bg-[var(--secondary)]/10 transition-colors">
                        <Upload className="h-4 w-4 text-[var(--foreground)]" />
                        <span className="text-sm font-medium text-[var(--foreground)]">Upload Image</span>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, "storyImage")}
                            disabled={uploadingStory}
                        />
                    </label>
                    {uploadingStory && <Loader2 className="h-4 w-4 animate-spin text-[var(--secondary)]" />}
                </div>
            </div>
            <input type="hidden" {...register("aboutPage.storyImage")} />
            </div>
            <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--foreground)]">Content</label>
            <textarea
                {...register("aboutPage.storyContent")}
                rows={5}
                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                placeholder="Tell your story here..."
            />
            </div>
        </div>
      </div>

      {/* Mission, Vision, Objectives Section */}
      <div className="space-y-4 pt-4 border-t border-[var(--secondary)]/20">
        <h4 className="font-medium text-[var(--foreground)] border-b border-[var(--secondary)]/10 pb-2">Mission, Vision & Objectives</h4>
        <div className="grid gap-6">
            {/* Mission */}
            <div className="grid md:grid-cols-2 gap-4 border-b border-[var(--secondary)]/10 pb-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--foreground)]">Mission Title</label>
                    <input
                        {...register("aboutPage.missionTitle")}
                        className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                        placeholder="Our Mission"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--foreground)]">Mission Content</label>
                    <textarea
                        {...register("aboutPage.missionContent")}
                        rows={3}
                        className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                        placeholder="Our mission is..."
                    />
                </div>
            </div>

            {/* Vision */}
            <div className="grid md:grid-cols-2 gap-4 border-b border-[var(--secondary)]/10 pb-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--foreground)]">Vision Title</label>
                    <input
                        {...register("aboutPage.visionTitle")}
                        className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                        placeholder="Our Vision"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--foreground)]">Vision Content</label>
                    <textarea
                        {...register("aboutPage.visionContent")}
                        rows={3}
                        className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                        placeholder="Our vision is..."
                    />
                </div>
            </div>

            {/* Objectives */}
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--foreground)]">Objectives Title</label>
                    <input
                        {...register("aboutPage.objectivesTitle")}
                        className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                        placeholder="Our Objectives"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--foreground)]">Objectives Content</label>
                    <textarea
                        {...register("aboutPage.objectivesContent")}
                        rows={5}
                        className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                        placeholder="List your objectives..."
                    />
                    <p className="text-xs text-[var(--secondary)] mt-1">You can use new lines to separate items.</p>
                </div>
            </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="pt-4 border-t border-[var(--secondary)]/20">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-[var(--foreground)]">Statistics</h4>
          <button
            type="button"
            onClick={() => appendStat({ label: "New Stat", value: "0" })}
            className="flex items-center gap-1 text-sm text-[var(--brand)] hover:underline"
          >
            <Plus className="h-4 w-4" /> Add Stat
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsFields.map((field, index) => (
            <div key={field.id} className="border border-[var(--secondary)]/20 rounded-lg p-4 bg-[var(--secondary)]/5 relative group">
              <button
                type="button"
                onClick={() => removeStat(index)}
                className="absolute top-2 right-2 text-[var(--secondary)]/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--secondary)]/70">Label</label>
                  <input
                    {...register(`aboutPage.stats.${index}.label`)}
                    className="mt-1 block w-full rounded border border-[var(--secondary)]/20 bg-[var(--background)] px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--secondary)]/70">Value</label>
                  <input
                    {...register(`aboutPage.stats.${index}.value`)}
                    className="mt-1 block w-full rounded border border-[var(--secondary)]/20 bg-[var(--background)] px-2 py-1 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
