import { getApartments } from "@/lib/db"
import { ListingsTable } from "@/components/admin/ListingsTable"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function ListingsPage() {
  const apartments = await getApartments()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Listings</h1>
        <Link 
            href="/admin/add-apartment" 
            className="bg-[var(--brand)] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:opacity-90"
        >
            <Plus className="h-4 w-4" />
            Add New
        </Link>
      </div>
      
      <ListingsTable initialApartments={apartments} />
    </div>
  )
}
