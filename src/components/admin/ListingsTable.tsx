"use client"

import { Apartment } from "@/types"
import { Trash2, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

export function ListingsTable({ initialApartments }: { initialApartments: Apartment[] }) {
  const router = useRouter()
  const [apartments, setApartments] = useState<Apartment[]>(initialApartments)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setApartments(initialApartments)
  }, [initialApartments])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/apartments/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setApartments(prev => prev.filter(a => a.id !== id))
        router.refresh()
      } else {
        alert("Failed to delete")
      }
    } catch (error) {
      alert("Something went wrong")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-[var(--background)] rounded-lg border border-[var(--secondary)]/20 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-[var(--secondary)]/5 text-[var(--foreground)] uppercase">
            <tr>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--secondary)]/20">
            {apartments.length === 0 ? (
                <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-[var(--secondary)]/70">No listings found</td>
                </tr>
            ) : (
                apartments.map((apt) => (
                <tr key={apt.id} className="border-b-[var(--secondary)]/20 hover:bg-[var(--secondary)]/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-[var(--foreground)]">{apt.title}</td>
                    <td className="px-6 py-4 text-[var(--secondary)]">{apt.location}</td>
                    <td className="px-6 py-4 text-[var(--foreground)]">₦{apt.price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                        <span className="bg-[var(--secondary)]/10 text-[var(--foreground)] text-xs font-medium px-2.5 py-0.5 rounded">
                            {apt.category || "General"}
                        </span>
                    </td>
                    <td className="px-6 py-4 flex gap-3">
                        <Link 
                            href={`/admin/edit-apartment/${apt.id}`}
                            className="text-[var(--foreground)] hover:text-[var(--brand)] transition-colors"
                        >
                            <Edit className="h-4 w-4" />
                        </Link>
                        <button 
                            onClick={() => handleDelete(apt.id)}
                            disabled={deletingId === apt.id}
                            className="text-[var(--accent)] hover:text-[var(--accent)]/80 disabled:opacity-50 transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
  )
}
