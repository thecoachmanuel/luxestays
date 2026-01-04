import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { markAllNotificationsAsRead } from '@/lib/db'

export async function POST() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await markAllNotificationsAsRead()
  return NextResponse.json({ success: true })
}
