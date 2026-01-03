import { ApartmentForm } from "@/components/admin/ApartmentForm"
import { getCategories } from "@/lib/db"

export default async function AddApartmentPage() {
  const categories = await getCategories()

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <h1 className="mb-8 text-3xl font-bold">Add New Apartment</h1>
      <ApartmentForm categories={categories} />
    </div>
  )
}
