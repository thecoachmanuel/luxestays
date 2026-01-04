'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Download, Calendar as CalendarIcon, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function AnalyticsControls({ data }: { data: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const currentRange = searchParams.get('range') || '30days'
  const currentStart = searchParams.get('start') || ''
  const currentEnd = searchParams.get('end') || ''

  const [range, setRange] = useState(currentRange)
  const [startDate, setStartDate] = useState(currentStart)
  const [endDate, setEndDate] = useState(currentEnd)

  const handleApply = () => {
    const params = new URLSearchParams()
    params.set('range', range)
    if (range === 'custom') {
      if (startDate) params.set('start', startDate)
      if (endDate) params.set('end', endDate)
    }
    
    startTransition(() => {
      router.push(`/admin/analytics?${params.toString()}`)
    })
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text('Analytics Report', 14, 22)
    doc.setFontSize(11)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)
    
    let rangeText = ''
    if (range === '30days') rangeText = 'Last 30 Days'
    else if (range === 'month') rangeText = 'This Month'
    else if (range === 'lifetime') rangeText = 'Lifetime'
    else if (range === 'custom') rangeText = `${startDate} to ${endDate}`
    
    doc.text(`Range: ${rangeText}`, 14, 38)

    // Summary
    const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0)
    const totalBookings = data.reduce((acc, curr) => acc + curr.bookings, 0)
    const totalUsers = data.reduce((acc, curr) => acc + curr.users, 0)
    
    doc.text(`Total Revenue: ₦${totalRevenue.toLocaleString()}`, 14, 48)
    doc.text(`Total Bookings: ${totalBookings}`, 14, 54)
    doc.text(`New Users: ${totalUsers}`, 14, 60)

    // Table
    autoTable(doc, {
      startY: 70,
      head: [['Date', 'Revenue', 'Bookings', 'New Users', 'Messages']],
      body: data.map(row => [
        row.date,
        `₦${row.revenue.toLocaleString()}`,
        row.bookings,
        row.users,
        row.messages
      ]),
    })

    doc.save(`analytics-report-${range}.pdf`)
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-[var(--background)] p-4 shadow-sm md:flex-row md:items-end">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Time Range</label>
        <select 
          value={range} 
          onChange={(e) => setRange(e.target.value)}
          className="rounded-md border p-2 text-sm"
        >
          <option value="30days">Last 30 Days</option>
          <option value="month">This Month</option>
          <option value="lifetime">Lifetime</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {range === 'custom' && (
        <>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border p-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border p-2 text-sm"
            />
          </div>
        </>
      )}

      <button 
        onClick={handleApply}
        disabled={isPending}
        className="flex items-center gap-2 rounded-md bg-[var(--secondary)] px-4 py-2 text-sm text-white hover:bg-[var(--secondary)]/90 disabled:opacity-50"
      >
        <CalendarIcon className="h-4 w-4" />
        Apply
      </button>

      <div className="flex-1"></div>

      <button 
        onClick={generatePDF}
        className="flex items-center gap-2 rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white hover:bg-[var(--brand)]/90"
      >
        <FileText className="h-4 w-4" />
        Download PDF Report
      </button>
    </div>
  )
}
