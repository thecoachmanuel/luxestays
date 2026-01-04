import { getAnalyticsData } from '@/lib/db'
import { AnalyticsCharts } from './charts'
import { Download } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AnalyticsPage() {
  const data = await getAnalyticsData(30)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex gap-2">
            <a 
                href="/api/admin/analytics/export?days=30" 
                target="_blank"
                className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-white hover:bg-[var(--brand)]/90 transition-colors"
            >
                <Download className="h-4 w-4" />
                Download Report
            </a>
        </div>
      </div>

      <AnalyticsCharts data={data} />
    </div>
  )
}
