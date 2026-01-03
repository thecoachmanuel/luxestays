import { Control, useFieldArray, UseFormRegister } from "react-hook-form"
import { AppSettings } from "@/types"
import { Plus, Trash2 } from "lucide-react"

interface FooterEditorProps {
  control: Control<AppSettings>
  register: UseFormRegister<AppSettings>
}

export function FooterEditor({ control, register }: FooterEditorProps) {
  const { fields: columnFields, append: appendColumn, remove: removeColumn } = useFieldArray({
    control,
    name: "footerSettings.columns"
  })

  return (
    <div className="space-y-6 border border-[var(--secondary)]/20 p-4 sm:p-6 rounded-lg bg-[var(--background)] shadow-sm mt-8">
      <div className="border-b border-[var(--secondary)]/20 pb-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Footer Settings</h3>
        <p className="text-sm text-[var(--secondary)]/70">Customize your website footer content</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Copyright Text</label>
          <input
            {...register("footerSettings.copyrightText")}
            className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
            placeholder="© 2024 My App. All rights reserved."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Description</label>
          <textarea
            {...register("footerSettings.description")}
            rows={3}
            className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
            placeholder="Short description about your company..."
          />
        </div>
      </div>

      <div className="border-t border-[var(--secondary)]/20 pt-4">
        <h4 className="font-medium mb-4 text-[var(--foreground)]">Social Links</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-[var(--secondary)]/70">Facebook URL</label>
            <input
              {...register("footerSettings.socialLinks.facebook")}
              className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-2 py-1 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
              placeholder="https://facebook.com/..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--secondary)]/70">Twitter URL</label>
            <input
              {...register("footerSettings.socialLinks.twitter")}
              className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-2 py-1 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
              placeholder="https://twitter.com/..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--secondary)]/70">Instagram URL</label>
            <input
              {...register("footerSettings.socialLinks.instagram")}
              className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-2 py-1 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
              placeholder="https://instagram.com/..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--secondary)]/70">LinkedIn URL</label>
            <input
              {...register("footerSettings.socialLinks.linkedin")}
              className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-2 py-1 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
              placeholder="https://linkedin.com/..."
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--secondary)]/20 pt-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-[var(--foreground)]">Footer Columns</h4>
          <button
            type="button"
            onClick={() => appendColumn({ title: "New Column", links: [] })}
            className="flex items-center gap-1 text-sm text-[var(--brand)] hover:underline"
          >
            <Plus className="h-4 w-4" /> Add Column
          </button>
        </div>

        <div className="space-y-6">
          {columnFields.map((field, index) => (
            <div key={field.id} className="border border-[var(--secondary)]/20 rounded-lg p-4 bg-[var(--secondary)]/5 relative">
              <button
                type="button"
                onClick={() => removeColumn(index)}
                className="absolute top-2 right-2 text-[var(--secondary)]/40 hover:text-[var(--accent)]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-[var(--secondary)]/70 mb-1">Column Title</label>
                <input
                  {...register(`footerSettings.columns.${index}.title` as const)}
                  className="block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                  placeholder="e.g. Support"
                />
              </div>

              <LinksEditor nestIndex={index} control={control} register={register} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LinksEditor({ nestIndex, control, register }: { nestIndex: number, control: Control<AppSettings>, register: UseFormRegister<AppSettings> }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `footerSettings.columns.${nestIndex}.links`
  })

  return (
    <div className="space-y-3">
      {fields.map((field, k) => (
        <div key={field.id} className="flex gap-2 items-start">
          <div className="grid gap-2 flex-1 sm:grid-cols-2">
            <input
              {...register(`footerSettings.columns.${nestIndex}.links.${k}.label` as const)}
              className="block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-1.5 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
              placeholder="Label"
            />
            <input
              {...register(`footerSettings.columns.${nestIndex}.links.${k}.url` as const)}
              className="block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-1.5 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
              placeholder="URL"
            />
          </div>
          <button
            type="button"
            onClick={() => remove(k)}
            className="mt-1.5 text-[var(--secondary)]/40 hover:text-[var(--accent)]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ label: "", url: "" })}
        className="text-xs text-[var(--brand)] hover:underline flex items-center gap-1"
      >
        <Plus className="h-3 w-3" /> Add Link
      </button>
    </div>
  )
}
