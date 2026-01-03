import { ApartmentForm } from "@/components/admin/ApartmentForm"
import { getApartmentById, getCategories } from "@/lib/db"
import { notFound } from "next/navigation"

export default async function EditApartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const apartment = await getApartmentById(id)
  const categories = await getCategories()

  if (!apartment) {
    notFound()
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <h1 className="mb-8 text-3xl font-bold">Edit Apartment</h1>
      <ApartmentForm initialData={apartment} categories={categories} />
    </div>
  )
}
