import { NextResponse } from "next/server"
import { getCategories, addCategory } from "@/lib/db"
import { Category } from "@/types"

export async function GET() {
  const categories = await getCategories()
  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: body.name,
    }

    await addCategory(newCategory)

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating category" },
      { status: 500 }
    )
  }
}
