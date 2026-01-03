import { NextResponse } from 'next/server';
import { getWhyChooseUs, updateWhyChooseUs } from '@/lib/db';
import { auth } from "@/auth";

export async function GET() {
  const items = await getWhyChooseUs();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Basic validation
    if (!Array.isArray(body)) {
        return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    
    await updateWhyChooseUs(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
