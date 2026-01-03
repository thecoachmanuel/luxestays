import { getCategories } from "@/lib/db"
import { CategoriesManager } from "@/components/admin/CategoriesManager"

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <h1 className="mb-8 text-3xl font-bold">Manage Categories</h1>
      <CategoriesManager initialCategories={categories} />
    </div>
  )
}
