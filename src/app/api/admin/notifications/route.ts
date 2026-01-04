import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAdminNotificationCount } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const count = await getAdminNotificationCount()
  return NextResponse.json({ count })
}
