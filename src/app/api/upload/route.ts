
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 })
    }

    // Vercel limit check (4.5MB limit for serverless functions, keeping it safe at 4MB)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large (max 4MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'image/jpeg' // Default fallback
    const dataUrl = `data:${mimeType};base64,${base64}`

    // Return the Data URI directly. 
    // The frontend will save this string into the User profile or Apartment image field.
    // This bypasses the need for a file system write.
    return NextResponse.json({ url: dataUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
