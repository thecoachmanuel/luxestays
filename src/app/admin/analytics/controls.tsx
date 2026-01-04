'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Download, Calendar as CalendarIcon, FileText, FileSpreadsheet } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export function AnalyticsControls({ data, appName }: { data: any[], appName: string }) {
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

  const getRangeText = () => {
    if (range === '30days') return 'Last 30 Days'
    if (range === 'month') return 'This Month'
    if (range === 'lifetime') return 'Lifetime'
    if (range === 'custom') return `${startDate} to ${endDate}`
    return ''
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    const rangeText = getRangeText()
    const dateStr = new Date().toLocaleString()
    
    // Brand Colors
    const primaryColor = '#000000' // Main Brand
    const accentColor = '#2563EB' // Accent
    const textColor = '#333333'
    const lightGray = '#f3f4f6'

    // Header Background
    doc.setFillColor(primaryColor)
    doc.rect(0, 0, 210, 40, 'F')

    // App Name
    doc.setTextColor('#FFFFFF')
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text(appName, 14, 20)

    // Report Title
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text('Analytics Report', 14, 30)

    // Meta Data (Right Aligned in Header)
    doc.setFontSize(10)
    doc.text(`Generated: ${dateStr}`, 196, 20, { align: 'right' })
    doc.text(`Period: ${rangeText}`, 196, 30, { align: 'right' })

    // Reset Text Color
    doc.setTextColor(textColor)

    // Summary Section
    const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0)
    const totalBookings = data.reduce((acc, curr) => acc + curr.bookings, 0)
    const totalUsers = data.reduce((acc, curr) => acc + curr.users, 0)
    const totalMessages = data.reduce((acc, curr) => acc + curr.messages, 0)

    let yPos = 55
    
    // Summary Cards Title
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Executive Summary', 14, yPos)
    
    yPos += 10

    // Draw Summary Boxes
    const boxWidth = 40
    const boxHeight = 25
    const gap = 6
    const startX = 14

    const summaries = [
        { label: 'Total Revenue', value: `N${totalRevenue.toLocaleString()}` },
        { label: 'Total Bookings', value: totalBookings.toString() },
        { label: 'New Users', value: totalUsers.toString() },
        { label: 'Messages', value: totalMessages.toString() }
    ]

    summaries.forEach((item, index) => {
        const x = startX + (index * (boxWidth + gap))
        
        // Box Background
        doc.setFillColor(lightGray)
        doc.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'F')
        
        // Label
        doc.setFontSize(8)
        doc.setTextColor('#666666')
        doc.text(item.label, x + 5, yPos + 8)
        
        // Value
        doc.setFontSize(12)
        doc.setTextColor(primaryColor)
        doc.setFont('helvetica', 'bold')
        doc.text(item.value, x + 5, yPos + 18)
    })

    yPos += 40

    // Detailed Data Table
    doc.setFontSize(14)
    doc.setTextColor(textColor)
    doc.text('Detailed Breakdown', 14, yPos)

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Date', 'Revenue', 'Bookings', 'New Users', 'Messages']],
      body: data.map(row => [
        row.date,
        `N${row.revenue.toLocaleString()}`,
        row.bookings,
        row.users,
        row.messages
      ]),
      headStyles: {
          fillColor: primaryColor,
          textColor: '#FFFFFF',
          fontStyle: 'bold'
      },
      alternateRowStyles: {
          fillColor: '#f9fafb'
      },
      styles: {
          fontSize: 10,
          cellPadding: 3
      }
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor('#999999')
        doc.text(`© ${new Date().getFullYear()} ${appName} - Confidential`, 105, 290, { align: 'center' })
    }

    doc.save(`${appName.toLowerCase().replace(/\s+/g, '-')}-analytics-${range}.pdf`)
  }

  const generateExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(row => ({
        Date: row.date,
        Revenue: row.revenue,
        Bookings: row.bookings,
        'New Users': row.users,
        Messages: row.messages
    })))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analytics Data")
    
    // Add Summary Sheet
    const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0)
    const totalBookings = data.reduce((acc, curr) => acc + curr.bookings, 0)
    const totalUsers = data.reduce((acc, curr) => acc + curr.users, 0)
    const totalMessages = data.reduce((acc, curr) => acc + curr.messages, 0)

    const summaryData = [
        ['Metric', 'Value'],
        ['Total Revenue', totalRevenue],
        ['Total Bookings', totalBookings],
        ['New Users', totalUsers],
        ['Total Messages', totalMessages],
        ['Period', getRangeText()],
        ['Generated On', new Date().toLocaleString()]
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary")

    XLSX.writeFile(workbook, `${appName.toLowerCase().replace(/\s+/g, '-')}-analytics-${range}.xlsx`)
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-[var(--background)] p-4 shadow-sm md:flex-row md:items-end flex-wrap">
      <div className="flex flex-col gap-2 min-w-[150px]">
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
        className="flex items-center gap-2 rounded-md bg-[var(--secondary)] px-4 py-2 text-sm text-white hover:bg-[var(--secondary)]/90 disabled:opacity-50 h-[38px]"
      >
        <CalendarIcon className="h-4 w-4" />
        Apply
      </button>

      <div className="flex-1"></div>

      <div className="flex gap-2">
        <button 
            onClick={generateExcel}
            className="flex items-center gap-2 rounded-md border border-green-600 text-green-600 bg-white px-4 py-2 text-sm hover:bg-green-50 h-[38px] transition-colors"
        >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
        </button>

        <button 
            onClick={generatePDF}
            className="flex items-center gap-2 rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white hover:bg-[var(--brand)]/90 h-[38px]"
        >
            <FileText className="h-4 w-4" />
            Download PDF
        </button>
      </div>
    </div>
  )
}
