import { getAnalyticsData } from '@/lib/db'
import { AnalyticsCharts } from './charts'
import { AnalyticsControls } from './controls'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams
  const range = (params.range as string) || '30days'
  const startParam = params.start as string
  const endParam = params.end as string

  let options: { days?: number; start?: Date; end?: Date } = { days: 30 }

  if (range === 'month') {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    options = { start: startOfMonth, end: now }
  } else if (range === 'lifetime') {
    options = { start: new Date('2024-01-01'), end: new Date() } // App launch date or reasonable past
  } else if (range === 'custom' && startParam && endParam) {
    options = { start: new Date(startParam), end: new Date(endParam) }
  }

  const data = await getAnalyticsData(options)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
      </div>

      <AnalyticsControls data={data} />
      <AnalyticsCharts data={data} />
    </div>
  )
}
