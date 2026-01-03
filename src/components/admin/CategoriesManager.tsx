"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Loader2, Edit2, X, Check, Save } from "lucide-react"
import { Category } from "@/types"
import { IconPicker } from "./IconPicker"
import { ICON_MAP } from "../IconMap"

interface CategoriesManagerProps {
  initialCategories: Category[]
}

export function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryIcon, setNewCategoryIcon] = useState("Home")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editIcon, setEditIcon] = useState("")

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName, icon: newCategoryIcon }),
      })

      if (res.ok) {
        const newCategory = await res.json()
        setCategories([...categories, newCategory])
        setNewCategoryName("")
        setNewCategoryIcon("Home")
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to add category", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditIcon(category.icon || "Home")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditIcon("")
  }

  const saveEdit = async () => {
    if (!editName.trim() || !editingId) return

    try {
      const res = await fetch(`/api/categories/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, icon: editIcon }),
      })

      if (res.ok) {
        const updatedCategory = await res.json()
        setCategories(categories.map(c => c.id === editingId ? updatedCategory : c))
        setEditingId(null)
        router.refresh()
      } else {
        alert("Failed to update category")
      }
    } catch (error) {
      console.error("Failed to update category", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id))
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to delete category", error)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--secondary)]/20 bg-[var(--background)] p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Add New Category</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category Name (e.g. Penthouse)"
              className="flex-1 rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newCategoryName.trim()}
              className="flex items-center gap-2 rounded-md bg-[var(--brand)] px-4 py-2 text-[var(--background)] hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Select Icon</label>
            <IconPicker selectedIcon={newCategoryIcon} onChange={setNewCategoryIcon} />
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-[var(--secondary)]/20 bg-[var(--background)] shadow-sm">
        <div className="p-6 border-b border-[var(--secondary)]/20">
            <h2 className="text-lg font-semibold">Existing Categories</h2>
        </div>
        <div className="divide-y divide-[var(--secondary)]/20">
          {categories.length === 0 ? (
            <div className="p-6 text-center text-[var(--secondary)]/70">No categories found.</div>
          ) : (
            categories.map((category) => {
              const Icon = ICON_MAP[category.icon || "Home"] || ICON_MAP["Home"]
              const isEditing = editingId === category.id

              return (
                <div key={category.id} className="p-4 hover:bg-[var(--secondary)]/5">
                  {isEditing ? (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="flex-1 rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] px-3 py-2 text-sm"
                            />
                            <button onClick={saveEdit} className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded hover:bg-[var(--accent)]/20">
                                <Save className="h-4 w-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-2 bg-[var(--secondary)]/10 text-[var(--secondary)] rounded hover:bg-[var(--secondary)]/20">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <IconPicker selectedIcon={editIcon} onChange={setEditIcon} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--secondary)]/10 rounded-full">
                                <Icon className="h-5 w-5 text-[var(--secondary)]" />
                            </div>
                            <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => startEdit(category)}
                                className="p-2 text-[var(--brand)] hover:bg-[var(--brand)]/10 rounded"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(category.id)}
                                disabled={deletingId === category.id}
                                className="p-2 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded disabled:opacity-50"
                            >
                                {deletingId === category.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
