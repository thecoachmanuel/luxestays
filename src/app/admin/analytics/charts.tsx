'use client'

import React, { useMemo } from 'react'

type DataPoint = {
  date: string
  revenue: number
  bookings: number
  users: number
  messages: number
}

export function AnalyticsCharts({ data }: { data: DataPoint[] }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Daily Revenue" description="Last 30 days revenue from confirmed bookings">
           <SimpleChart data={data} dataKey="revenue" type="bar" color="#10b981" formatValue={(v) => `$${v}`} />
        </ChartCard>
        <ChartCard title="Daily Bookings" description="Number of bookings per day">
           <SimpleChart data={data} dataKey="bookings" type="line" color="#3b82f6" />
        </ChartCard>
        <ChartCard title="New Users" description="New user registrations">
           <SimpleChart data={data} dataKey="users" type="line" color="#f59e0b" />
        </ChartCard>
        <ChartCard title="Messages" description="New contact messages">
           <SimpleChart data={data} dataKey="messages" type="bar" color="#8b5cf6" />
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, description, children }: { title: string, description: string, children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-[var(--background)] p-6 shadow-sm">
      <div className="flex flex-col space-y-1.5 mb-4">
        <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
        <p className="text-sm text-[var(--secondary)]">{description}</p>
      </div>
      {children}
    </div>
  )
}

type ChartProps = {
  data: any[]
  dataKey: string
  color?: string
  type?: 'line' | 'bar'
  height?: number
  formatValue?: (val: number) => string
}

function SimpleChart({ 
  data, 
  dataKey, 
  color = '#2563eb', 
  type = 'line',
  height = 250,
  formatValue = (v) => v.toString()
}: ChartProps) {
  const maxValue = useMemo(() => {
    return Math.max(...data.map(d => Number(d[dataKey] || 0))) || 1
  }, [data, dataKey])

  const points = data.map((d, i) => {
    const val = Number(d[dataKey] || 0)
    return { val, date: d.date }
  })

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
  }

  const getX = (i: number) => {
    if (points.length <= 1) return 50 // Center single point
    return (i / (points.length - 1)) * 100
  }

  return (
    <div className="w-full relative" style={{ height }}>
      {/* Y Axis Labels */}
      <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 py-2">
        <span>{formatValue(maxValue)}</span>
        <span>{formatValue(Math.round(maxValue / 2))}</span>
        <span>{formatValue(0)}</span>
      </div>

      {/* Chart Area */}
      <div className="absolute left-14 right-0 top-0 bottom-0">
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          className="w-full h-full overflow-visible"
        >
          {/* Grid lines */}
          <line x1="0" y1="0" x2="100" y2="0" stroke="#e5e7eb" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="100" x2="100" y2="100" stroke="#e5e7eb" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />

          {type === 'line' ? (
            <path
              d={`M${getX(0)},${100 - (points[0].val / maxValue) * 100} ${points.map((p, i) => `L${getX(i)},${100 - (p.val / maxValue) * 100}`).join(' ')}`}
              fill="none"
              stroke={color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            points.map((p, i) => {
               const bandWidth = 100 / points.length
               const barWidth = bandWidth * 0.6
               const xPos = (i * bandWidth) + (bandWidth - barWidth) / 2
               const barHeight = (p.val / maxValue) * 100
               return (
                 <rect
                   key={i}
                   x={xPos}
                   y={100 - barHeight}
                   width={barWidth}
                   height={barHeight}
                   fill={color}
                   rx="0.5"
                 />
               )
            })
          )}
        </svg>
        
        {/* Tooltip triggers / Hover overlay */}
        <div className="absolute inset-0 flex items-end">
           {data.map((d, i) => (
             <div key={i} className="flex-1 group relative h-full">
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                 <div className="font-bold">{d.date}</div>
                 <div>{formatValue(Number(d[dataKey]))}</div>
               </div>
               {/* Hover line */}
               <div className="absolute inset-y-0 left-1/2 w-px bg-gray-200 hidden group-hover:block"></div>
             </div>
           ))}
        </div>
      </div>
    </div>
  )
}
