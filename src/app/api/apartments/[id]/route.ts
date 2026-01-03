import { NextResponse } from "next/server"
import { deleteApartment, getApartmentById, updateApartment } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const apartment = await getApartmentById(id)

    if (!apartment) {
      return NextResponse.json({ error: "Apartment not found" }, { status: 404 })
    }

    await deleteApartment(id)
    return NextResponse.json({ message: "Apartment deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete apartment" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const apartment = await getApartmentById(id)

    if (!apartment) {
      return NextResponse.json({ error: "Apartment not found" }, { status: 404 })
    }

    const updatedApartment = { ...apartment, ...body, id } // Ensure ID doesn't change
    await updateApartment(updatedApartment)
    
    return NextResponse.json(updatedApartment)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update apartment" }, { status: 500 })
  }
}
