
import { NextResponse } from 'next/server'
import { getSubscribers, getUsers } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(req: Request) {
  const session = await auth()
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'subscribers'

    let csvContent = ''
    let filename = ''

    if (type === 'users') {
        const users = await getUsers()
        const headers = ['ID', 'Name', 'Email', 'Role', 'Created At']
        csvContent = [
            headers.join(','),
            ...users.map(u => [
                u.id,
                `"${u.name || ''}"`,
                u.email,
                u.role,
                u.createdAt
            ].join(','))
        ].join('\n')
        filename = 'all_users.csv'
    } else {
        const subscribers = await getSubscribers()
        const headers = ['Email', 'Subscribed At']
        csvContent = [
            headers.join(','),
            ...subscribers.map(s => [
                s.email,
                s.createdAt
            ].join(','))
        ].join('\n')
        filename = 'newsletter_subscribers.csv'
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
