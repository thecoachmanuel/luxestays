import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAnalyticsData } from '@/lib/db'

export async function GET(request: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')
  const data = await getAnalyticsData({ days })

  const csvHeader = 'Date,Revenue,Bookings,New Users,Messages\n'
  const csvRows = data.map(row => 
    `${row.date},${row.revenue},${row.bookings},${row.users},${row.messages}`
  ).join('\n')

  const csv = csvHeader + csvRows

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="analytics-${days}days.csv"`
    }
  })
}
