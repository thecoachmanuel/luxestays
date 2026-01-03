import { NextResponse } from "next/server"
import { getSettings, updateSettings } from "@/lib/db"

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getSettings()
  return NextResponse.json(settings)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // In a real app, validate body
    await updateSettings(body)

    return NextResponse.json({ message: "Settings updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
