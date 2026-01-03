import { NextResponse } from "next/server"
import { deleteCategory, updateCategory } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const updatedCategory = {
      id,
      name: body.name,
      icon: body.icon
    }

    await updateCategory(updatedCategory)

    return NextResponse.json(updatedCategory)
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating category" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteCategory(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting category" },
      { status: 500 }
    )
  }
}
